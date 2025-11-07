mod commands;

use anyhow::Result;
use clap::{Parser, Subcommand};
use ic_agent::identity;
use tracing::{info, level_filters::LevelFilter};
use tracing_subscriber::fmt;

use crate::commands::create_memory;

#[derive(Parser, Debug)]
#[command(name = "kinic-cli", version, about)]
pub struct Cli {
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,

    #[arg(long)]
    ic: bool,

    #[arg(long, default_value = "default")]
    identity: String,

    #[command(subcommand)]
    command: Command,
}

#[derive(Subcommand, Debug)]
enum Command {
    Greet {
        #[arg(default_value = "World")]
        name: String,
    },
    Create {
        #[arg(long)]
        name: String,

        #[arg(long)]
        description: String,
    },
    // Search {},
    // Insert {},
}

pub async fn run() -> Result<()> {
    let cli = Cli::parse();

    let max = match cli.verbose {
        0 => LevelFilter::INFO,
        1 => LevelFilter::DEBUG,
        _ => LevelFilter::TRACE,
    };

    fmt().with_max_level(max).without_time().try_init().ok();

    let identity = cli.identity;
    let ic = cli.ic;

    match cli.command {
        Command::Greet { name } => {
            info!("greeting started");
            println!("Hello, {name}!");
        }
        Command::Create { name, description } => {
            info!("create");
            println!("option, ic={}", cli.ic);
            create_memory(ic, identity, name, description).await?;
        }
    }
    Ok(())
}
