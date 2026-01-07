// Where: Local callback HTTP server for CLI login.
// What: Parses HTTP requests, handles CORS, and validates callback payloads.
// Why: Keeps the login HTTP surface small and auditable.
use anyhow::{Context, Result, anyhow};
use serde_json::json;
use tokio::{
    io::{AsyncReadExt, AsyncWriteExt},
    net::{TcpListener, TcpStream},
};

use crate::identity_store::derive_principal_from_user_key;

use super::crypto::{decrypt_payload, take_private_key};
use super::payload::{CallbackData, CallbackRequest, BrowserPayload};

pub struct CallbackState {
    expected_nonce: String,
    expected_session_public_key: Vec<u8>,
    expected_derivation_origin: String,
    box_private_key: Option<ring::agreement::EphemeralPrivateKey>,
}

impl CallbackState {
    pub fn new(
        expected_nonce: String,
        expected_session_public_key: Vec<u8>,
        expected_derivation_origin: String,
        box_private_key: ring::agreement::EphemeralPrivateKey,
    ) -> Self {
        Self {
            expected_nonce,
            expected_session_public_key,
            expected_derivation_origin,
            box_private_key: Some(box_private_key),
        }
    }
}

pub async fn accept_callback(
    listener: TcpListener,
    state: &mut CallbackState,
    expected_origin: &str,
) -> Result<CallbackData> {
    loop {
        let (mut stream, _) = listener.accept().await?;
        if let Some(callback) = handle_connection(&mut stream, state, expected_origin).await? {
            return Ok(callback);
        }
    }
}

async fn handle_connection(
    stream: &mut TcpStream,
    state: &mut CallbackState,
    expected_origin: &str,
) -> Result<Option<CallbackData>> {
    let request = read_request(stream).await?;
    let path = request.path.split('?').next().unwrap_or("/");

    match (request.method.as_str(), path) {
        ("OPTIONS", "/callback") => {
            let response = build_cors_response(
                "HTTP/1.1 204 No Content",
                expected_origin,
                None,
            );
            stream.write_all(response.as_bytes()).await?;
            Ok(None)
        }
        ("POST", "/callback") => {
            if let Some(origin) = request.header("origin") {
                if origin != expected_origin {
                    let response = build_cors_response(
                        "HTTP/1.1 403 Forbidden",
                        expected_origin,
                        Some("Invalid origin"),
                    );
                    stream.write_all(response.as_bytes()).await?;
                    return Ok(None);
                }
            }

            if state.box_private_key.is_none() {
                let response = build_cors_response(
                    "HTTP/1.1 409 Conflict",
                    expected_origin,
                    Some("Callback already used"),
                );
                stream.write_all(response.as_bytes()).await?;
                return Ok(None);
            }

            let callback: CallbackRequest = serde_json::from_slice(&request.body)
                .context("Failed to parse callback")?;

            if callback.nonce != state.expected_nonce {
                let response = build_cors_response(
                    "HTTP/1.1 400 Bad Request",
                    expected_origin,
                    Some("Invalid nonce"),
                );
                stream.write_all(response.as_bytes()).await?;
                return Ok(None);
            }

            let private_key = take_private_key(&mut state.box_private_key)?;
            let payload = decrypt_payload(private_key, &callback)
                .context("Failed to decrypt payload")?;

            validate_payload(state, expected_origin, payload, stream).await?
        }
        _ => {
            let response = build_cors_response(
                "HTTP/1.1 404 Not Found",
                expected_origin,
                Some("Not found"),
            );
            stream.write_all(response.as_bytes()).await?;
            Ok(None)
        }
    }
}

async fn validate_payload(
    state: &CallbackState,
    expected_origin: &str,
    payload: BrowserPayload,
    stream: &mut TcpStream,
) -> Result<Option<CallbackData>> {
    if payload.session_public_key != state.expected_session_public_key {
        let response = build_cors_response(
            "HTTP/1.1 400 Bad Request",
            expected_origin,
            Some("Session key mismatch"),
        );
        stream.write_all(response.as_bytes()).await?;
        return Ok(None);
    }

    if payload.derivation_origin != state.expected_derivation_origin {
        let response = build_cors_response(
            "HTTP/1.1 400 Bad Request",
            expected_origin,
            Some("Derivation origin mismatch"),
        );
        stream.write_all(response.as_bytes()).await?;
        return Ok(None);
    }

    let principal = derive_principal_from_user_key(&payload.user_public_key)
        .context("invalid key")?;
    let body = json!({
        "status": "ok",
        "principal": principal.to_text(),
    })
    .to_string();
    let response = build_cors_response("HTTP/1.1 200 OK", expected_origin, Some(&body));
    stream.write_all(response.as_bytes()).await?;
    Ok(Some(CallbackData { payload, principal }))
}

fn build_cors_response(status: &str, origin: &str, body: Option<&str>) -> String {
    let body = body.unwrap_or("");
    let content_type = if body.starts_with('{') {
        "application/json"
    } else {
        "text/plain"
    };
    format!(
        "{status}\r\nContent-Type: {content_type}\r\nContent-Length: {length}\r\nAccess-Control-Allow-Origin: {origin}\r\nAccess-Control-Allow-Methods: POST, OPTIONS\r\nAccess-Control-Allow-Headers: content-type\r\n\r\n{body}",
        status = status,
        content_type = content_type,
        length = body.as_bytes().len(),
        origin = origin,
        body = body
    )
}

struct HttpRequest {
    method: String,
    path: String,
    headers: Vec<(String, String)>,
    body: Vec<u8>,
}

impl HttpRequest {
    fn header(&self, name: &str) -> Option<&str> {
        self.headers
            .iter()
            .find(|(key, _)| key.eq_ignore_ascii_case(name))
            .map(|(_, value)| value.as_str())
    }
}

async fn read_request(stream: &mut TcpStream) -> Result<HttpRequest> {
    let mut buffer = Vec::new();
    let header_end = loop {
        let mut chunk = [0u8; 1024];
        let read = stream.read(&mut chunk).await?;
        if read == 0 {
            break None;
        }
        buffer.extend_from_slice(&chunk[..read]);
        if let Some(pos) = find_header_end(&buffer) {
            break Some(pos);
        }
        if buffer.len() > 64 * 1024 {
            return Err(anyhow!("Request header too large"));
        }
    };

    let header_end = header_end.ok_or_else(|| anyhow!("Invalid request"))?;
    let header_bytes = &buffer[..header_end];
    let mut body = buffer[(header_end + 4)..].to_vec();
    let header_text = String::from_utf8_lossy(header_bytes);
    let mut lines = header_text.lines();
    let request_line = lines
        .next()
        .ok_or_else(|| anyhow!("Missing request line"))?;
    let mut parts = request_line.split_whitespace();
    let method = parts
        .next()
        .ok_or_else(|| anyhow!("Missing method"))?
        .to_string();
    let path = parts
        .next()
        .ok_or_else(|| anyhow!("Missing path"))?
        .to_string();

    let mut headers = Vec::new();
    for line in lines {
        if let Some((name, value)) = line.split_once(':') {
            headers.push((name.trim().to_string(), value.trim().to_string()));
        }
    }

    let content_length = headers
        .iter()
        .find_map(|(name, value)| {
            if name.eq_ignore_ascii_case("content-length") {
                value.parse::<usize>().ok()
            } else {
                None
            }
        })
        .unwrap_or(0);

    if body.len() < content_length {
        let mut remaining = vec![0u8; content_length - body.len()];
        stream.read_exact(&mut remaining).await?;
        body.extend_from_slice(&remaining);
    }

    Ok(HttpRequest {
        method,
        path,
        headers,
        body,
    })
}

fn find_header_end(buffer: &[u8]) -> Option<usize> {
    buffer.windows(4).position(|window| window == b"\r\n\r\n")
}
