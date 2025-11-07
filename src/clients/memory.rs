use anyhow::{Context, Result};
use candid::Decode;
use ic_agent::{Agent, export::Principal};

pub struct MemoryClient {
    agent: Agent,
    memory_id: Principal,
}

impl MemoryClient {
    pub fn new(agent: Agent, memory_id: Principal) -> Self {
        Self { agent, memory_id }
    }

    pub async fn insert(&self, embedding: Vec<f32>, text: &str) -> Result<()> {
        let payload = encode_insert_args(embedding, text)?;
        let response = self
            .agent
            .update(&self.memory_id, "insert")
            .with_arg(payload)
            .call_and_wait()
            .await
            .context("Failed to call deploy_instance")?;

        Decode!(&response, u32).context("Failed to decode deploy_instance response")?;
        Ok(())
    }

    pub fn canister_id(&self) -> &Principal {
        &self.memory_id
    }
}

fn encode_insert_args(embedding: Vec<f32>, text: &str) -> Result<Vec<u8>> {
    Ok(candid::encode_args((embedding, text.to_string()))?)
}
