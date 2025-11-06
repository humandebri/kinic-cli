mod commands;

use anyhow::Result;
use clap::{Parser, Subcommand};
use tracing::{info, level_filters::LevelFilter};
use tracing_subscriber::fmt;

use crate::commands::create_memory;

#[derive(Parser, Debug)]
#[command(name = "kinic-cli", version, about)]
pub struct Cli {
    #[arg(short, long, action = clap::ArgAction::Count)]
    verbose: u8,

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
        ic: bool,
    },
    // Search {},
    // Insert {},
}

pub fn run() -> Result<()> {
    let cli = Cli::parse();

    let max = match cli.verbose {
        0 => LevelFilter::INFO,
        1 => LevelFilter::DEBUG,
        _ => LevelFilter::TRACE,
    };

    fmt().with_max_level(max).without_time().try_init().ok();

    match cli.command {
        Command::Greet { name } => {
            info!("greeting started");
            println!("Hello, {name}!");
        }
        Command::Create { ic } => {
            info!("create");
            println!("option, ic={ic}");
            create_memory(ic);
        }
    }
    Ok(())
}
