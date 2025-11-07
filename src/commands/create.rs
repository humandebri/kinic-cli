use anyhow::Result;
use ic_agent::export::Principal;
use tracing::info;

use crate::{cli::CreateArgs, clients::launcher::LauncherClient};

use super::CommandContext;

const LAUNCHER_CANISTER: &str = "xfug4-5qaaa-aaaak-afowa-cai";
const LEDGER_CANISTER: &str = "73mez-iiaaa-aaaaq-aaasq-cai";

pub async fn handle(args: CreateArgs, ctx: &CommandContext) -> Result<()> {
    let agent = ctx.agent_factory.build().await?;
    let launcher = Principal::from_text(LAUNCHER_CANISTER)?;
    let ledger = Principal::from_text(LEDGER_CANISTER)?;
    let client = LauncherClient::new(agent, launcher, ledger);

    let price = client.fetch_deployment_price().await?;
    info!(%price, "fetched deployment price");

    client.approve_launcher(&price).await?;
    info!("launcher approved to transfer tokens");

    let id = client.deploy_memory(&args.name, &args.description).await?;
    info!(%id, "memory deployed");
    println!("Memory canister id: {id}");
    Ok(())
}
