use std::{fs, io::Cursor, path::PathBuf};

use anyhow::Result;
use ic_agent::{
    Agent,
    export::reqwest::Url,
    identity::{BasicIdentity, DelegatedIdentity, Secp256k1Identity},
};

use crate::identity_store;

const DFX_IDENTITY_DIR: &str = ".config/dfx/identity";

#[derive(Clone)]
pub enum AuthMode {
    DfxIdentity(String),
    InternetIdentity(std::path::PathBuf),
}

#[derive(Clone)]
pub struct AgentFactory {
    use_mainnet: bool,
    auth_mode: AuthMode,
}

impl AgentFactory {
    pub fn new(use_mainnet: bool, auth_mode: AuthMode) -> Self {
        Self {
            use_mainnet,
            auth_mode,
        }
    }

    pub async fn build(&self) -> Result<Agent> {
        let builder = match &self.auth_mode {
            AuthMode::DfxIdentity(identity_name) => {
                let pem_bytes = load_pem_from_dfx_identity(identity_name)?;
                let pem_text = String::from_utf8(pem_bytes.clone())?;
                let pem = pem::parse(pem_text.as_bytes())?;
                match pem.tag() {
                    "PRIVATE KEY" => {
                        let identity = BasicIdentity::from_pem(Cursor::new(pem_text.clone()))?;
                        Agent::builder().with_identity(identity)
                    }
                    "EC PRIVATE KEY" => {
                        let identity = Secp256k1Identity::from_pem(Cursor::new(pem_text.clone()))?;
                        Agent::builder().with_identity(identity)
                    }
                    _ => anyhow::bail!("Unsupported PEM tag: {}", pem.tag()),
                }
            }
            AuthMode::InternetIdentity(path) => {
                let identity = load_internet_identity(path)?;
                Agent::builder().with_identity(identity)
            }
        };

        let url = if self.use_mainnet {
            "https://ic0.app"
        } else {
            "http://127.0.0.1:4943"
        };
        let url = Url::parse(url)?;
        let agent = builder.with_url(url).build()?;

        if !self.use_mainnet {
            agent.fetch_root_key().await?;
        }
        Ok(agent)
    }
}

fn load_internet_identity(path: &std::path::Path) -> Result<DelegatedIdentity> {
    identity_store::load_delegated_identity(path)
}

fn load_pem_from_dfx_identity(identity_name: &str) -> anyhow::Result<Vec<u8>> {
    let home = std::env::var("HOME")
        .or_else(|_| std::env::var("USERPROFILE"))
        .map_err(|_| anyhow::anyhow!("HOME is not set"))?;
    let path = PathBuf::from(home)
        .join(DFX_IDENTITY_DIR)
        .join(identity_name)
        .join("identity.pem");
    fs::read(&path)
        .map_err(|err| anyhow::anyhow!("Failed to read dfx identity PEM at {}: {err}", path.display()))
}
