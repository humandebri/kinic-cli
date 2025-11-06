use anyhow::Result;
use ic_agent::{Agent, export::reqwest::Url};

pub async fn create_agent(use_mainnet: bool) -> Result<Agent> {
    let url = if use_mainnet {
        "https://ic0.app"
    } else {
        "http://127.0.0.1:4943"
    };
    let url = Url::parse(url).unwrap();
    let agent = Agent::builder().with_url(url).build()?;
    if !use_mainnet {
        agent.fetch_root_key().await?;
    }
    Ok(agent)
}

pub fn create_memory(ic: bool) -> Result<()> {
    // check approval
    Ok(())
}
