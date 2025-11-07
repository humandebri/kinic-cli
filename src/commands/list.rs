use anyhow::Result;
use tracing::info;

use crate::cli::ListArgs;

use super::CommandContext;

pub async fn handle(_args: ListArgs, _ctx: &CommandContext) -> Result<()> {
    info!("list command invoked (not implemented yet)");
    Ok(())
}
