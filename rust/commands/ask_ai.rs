use std::cmp::Ordering;

use anyhow::{Context, Result};
use ic_agent::export::Principal;
use tracing::info;

use crate::{
    cli::AskAiArgs,
    clients::memory::MemoryClient,
    embedding::fetch_embedding,
};

use super::CommandContext;

pub async fn handle(args: AskAiArgs, ctx: &CommandContext) -> Result<()> {
    let client = build_memory_client(&args.memory_id, ctx).await?;
    let embedding = fetch_embedding(&args.query).await?;
    let mut results = client.search(embedding).await?;

    results.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(Ordering::Equal));

    info!(
        canister_id = %client.canister_id(),
        query = %args.query,
        result_count = results.len(),
        "ask-ai search completed"
    );

    println!("ask-ai (LLM placeholder) for \"{}\":", args.query);
    if results.is_empty() {
        println!("- No context found to answer the query.");
    } else {
        println!("- Retrieved {} context entries for LLM consumption.", results.len());
        for (score, text) in results.iter().take(5) {
            println!("  - [{score:.4}] {text}");
        }
        println!("\nLLM response: <not implemented>");
    }

    Ok(())
}

async fn build_memory_client(id: &str, ctx: &CommandContext) -> Result<MemoryClient> {
    let agent = ctx.agent_factory.build().await?;
    let memory =
        Principal::from_text(id).context("Failed to parse canister id for ask-ai command")?;
    Ok(MemoryClient::new(agent, memory))
}
