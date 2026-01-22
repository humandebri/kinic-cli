//! rust/commands/search_json.rs
//! Where: JSON search command for MCP and machine consumption.
//! What: Runs the same search as `search` but returns structured JSON.
//! Why: MCP needs structured output without changing existing human-readable output.

use std::cmp::Ordering;

use anyhow::{Context, Result};
use ic_agent::export::Principal;
use serde::Serialize;
use tracing::info;

use crate::{cli::SearchArgs, clients::memory::MemoryClient, embedding::fetch_embedding};

use super::CommandContext;

#[derive(Serialize)]
struct SearchJsonResult {
    score: f32,
    text: String,
}

#[derive(Serialize)]
struct SearchJsonOutput {
    memory_id: String,
    query: String,
    result_count: usize,
    results: Vec<SearchJsonResult>,
}

pub async fn handle(args: SearchArgs, ctx: &CommandContext) -> Result<()> {
    let client = build_memory_client(&args.memory_id, ctx).await?;
    let embedding = fetch_embedding(&args.query).await?;
    let mut results = client.search(embedding).await?;

    results.sort_by(|a, b| b.0.partial_cmp(&a.0).unwrap_or(Ordering::Equal));

    info!(
        canister_id = %client.canister_id(),
        query = %args.query,
        result_count = results.len(),
        "search completed"
    );

    let output = SearchJsonOutput {
        memory_id: args.memory_id.clone(),
        query: args.query.clone(),
        result_count: results.len(),
        results: results
            .into_iter()
            .map(|(score, text)| SearchJsonResult { score, text })
            .collect(),
    };

    println!(
        "{}",
        serde_json::to_string(&output).context("Failed to encode JSON output")?
    );
    Ok(())
}

async fn build_memory_client(id: &str, ctx: &CommandContext) -> Result<MemoryClient> {
    let agent = ctx.agent_factory.build().await?;
    let memory =
        Principal::from_text(id).context("Failed to parse canister id for search-json command")?;
    Ok(MemoryClient::new(agent, memory))
}
