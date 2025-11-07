use anyhow::{Context, Result};
use ic_agent::export::Principal;
use tracing::info;

use crate::{cli::InsertArgs, clients::memory::MemoryClient};

use super::CommandContext;

pub async fn handle(args: InsertArgs, ctx: &CommandContext) -> Result<()> {
    let agent = ctx.agent_factory.build().await?;
    let memory = Principal::from_text(&args.memory_id)
        .context("Failed to parse canister id for insert command")?;
    let client = MemoryClient::new(agent, memory);

    info!(
        canister_id = %client.canister_id(),
        text = %args.text,
        "insert command invoked"
    );

    let embedding = Vec::new();
    client.insert(embedding, &args.text).await?;

    Ok(())
}

// export const fetchLateChunking = async (params: LateChunkParams) => {
//     const { title, content, url } = params;
//     const constructedContent = `---\ntitle:${title}\nurl:${url}\n---\n\n${content}`;
//     const response = await fetch(`${EMBEDDING_API_ENDPOINT}/late-chunking`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ markdown: constructedContent }),
//     });
//     const data = (await response.json()) as LateChunkingResponse;
//     return data.chunks;
// };

// export type LateChunkingResponse = {
//     chunks: {
//         embedding: number[];
//         sentence: string;
//     }[];
// };
