# Internet Identity CLI Login Overview

Where
- Component: rust/commands/ii_login.rs
- Data store: ~/.config/kinic/identity.json (or --identity-path)

What
- The CLI opens a browser page that talks to Internet Identity.
- A local axum callback server receives delegations and stores them for future CLI calls.

Why
- Allows CLI-only login without relying on a keychain-backed dfx identity.

Flow (high level)
1) CLI generates a session key pair and a random state token, then starts a local HTTP listener on 127.0.0.1:8620.
   - The session key pair is used to request a short-lived delegation from Internet Identity.
   - The state token is embedded in the page and must match the callback payload.
   - The local listener is the callback endpoint for the browser to POST the signed delegation.
   - Binding to 127.0.0.1 ensures the callback is only reachable from the same machine.
2) CLI serves an HTML page that opens the Internet Identity authorize URL.
3) Internet Identity returns signed delegations to the local callback endpoint.
4) CLI verifies the delegation public key matches the session key.
5) CLI persists the delegation bundle with expiration and metadata to ~/.config/kinic/identity.json (or --identity-path).
   - Stored fields include: identity provider URL, user public key, session key (pkcs8), delegations, expiration, created timestamp.
   - Delegations may include target canisters; those targets are preserved in the saved delegation list.

Server lifetime
- The callback server accepts a single successful callback, then exits.
- If no valid callback arrives before the timeout, the login flow fails.

Key data exchanged
- Session public key (SPKI) from CLI to browser page.
- Delegations + user public key from browser to CLI callback.

Security notes
- The callback is bound to localhost only.
- Callback payloads are rejected if the state token does not match.
- Delegations are verified against the session key before saving.
- Expiration is computed and stored to prevent stale reuse.
- On reuse, the CLI validates the stored file, checks expiration, and normalizes/verifies the delegation chain.
- Callback requests must be JSON and are capped at 256 KB. If a Content-Length header is present, it is validated against the same limit.

Related files
- rust/commands/ii_login.rs
- rust/identity_store.rs
