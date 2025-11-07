use std::{
    io::Cursor,
    time::{SystemTime, UNIX_EPOCH},
};

use anyhow::{Context, Result};
use candid::{CandidType, Decode, Deserialize, Nat};
use ic_agent::{
    Agent,
    export::{Principal, reqwest::Url},
    identity::{self, BasicIdentity, Secp256k1Identity},
};
use icrc_ledger_types::{
    icrc1::{account::Account, transfer::TransferError},
    icrc2::approve::{ApproveArgs, ApproveError},
};
use thiserror::Error;

pub const KEYRING_SERVICE_NAME: &str = "internet_computer_identities";
pub const KEYRING_IDENTITY_PREFIX: &str = "internet_computer_identity_";

pub fn load_pem_from_keyring(suffix: &str) -> anyhow::Result<Vec<u8>> {
    let account = format!("{KEYRING_IDENTITY_PREFIX}{suffix}");
    let entry = keyring::Entry::new(KEYRING_SERVICE_NAME, &account)?;
    let encoded_pem = entry.get_password().map_err(|e| {
        let msg = format!("{e:?}");
        if msg.contains("-67671") || msg.contains("errSecInteractionNotAllowed") {
            anyhow::anyhow!(
                "x86のdfxを使うと、Always Allow Listへの上書きがされてしまうOSのバグがあるようなので、arm64向けのdfxを使う必要があります。"
            )
        } else {
            anyhow::anyhow!("Keychain 読み出しに失敗: {msg}")
        }
    })?;
    Ok(hex::decode(encoded_pem)?)
}

pub async fn create_agent(use_mainnet: bool, name: &str) -> Result<Agent> {
    let pem_bytes = load_pem_from_keyring(name)?;
    let pem_text = String::from_utf8(pem_bytes)?;
    let pem = pem::parse(pem_text.as_bytes())?;

    let builder = match pem.tag() {
        "PRIVATE KEY" => {
            let identity = BasicIdentity::from_pem(Cursor::new(pem_text))?;
            Agent::builder().with_identity(identity)
        }
        "EC PRIVATE KEY" => {
            let identity = Secp256k1Identity::from_pem(Cursor::new(pem_text))?;
            Agent::builder().with_identity(identity)
        }
        _ => {
            todo!()
        }
    };

    let url = if use_mainnet {
        "https://ic0.app"
    } else {
        "http://127.0.0.1:4943"
    };
    let url = Url::parse(url).unwrap();
    let agent = builder.with_url(url).build()?;
    if !use_mainnet {
        agent.fetch_root_key().await?;
    }
    Ok(agent)
}

pub async fn create_memory(
    ic: bool,
    identity: String,
    name: String,
    description: String,
) -> Result<()> {
    let agent = create_agent(ic, &identity).await?;

    let launcher_id = Principal::from_text("xfug4-5qaaa-aaaak-afowa-cai")?;
    let ledger_id = Principal::from_text("73mez-iiaaa-aaaaq-aaasq-cai")?;

    // Get deployment price
    let response = agent
        .query(&launcher_id, "get_price")
        .call()
        .await
        .context("Failed to query icrc1_total_supply method.")?;
    println!("called canister");
    let price = Decode!(&response, Nat).context("Failed to decode total supply as nat.")?;
    println!("price: {price}");

    // Approve the launcher to transfer tokens from the user account
    // let principal = agent.get_principal().map_err(anyhow::Error::msg)?;
    let now = SystemTime::now().duration_since(UNIX_EPOCH)?.as_nanos() as u64;
    let ten = 10 * 60 * 1_000_000_000;
    let arg = ApproveArgs {
        from_subaccount: None,
        spender: Account {
            owner: launcher_id,
            subaccount: None,
        },
        amount: price,
        expected_allowance: None,
        expires_at: Some(now + ten),
        fee: Some(Nat::from(100_000u64)),
        memo: None,
        created_at_time: Some(now),
    };
    let arg = candid::encode_one(arg)?;
    let response = agent
        .update(&ledger_id, "icrc2_approve")
        .with_arg(arg)
        .await
        .context("Failed to query approve method.")?;
    println!("called approve");
    Decode!(&response, std::result::Result<Nat,ApproveError>)
        .context("Failed to decode response of approve")?
        .map_err(anyhow::Error::msg)?;

    // Deploy a memory
    let arg = format!("{{name: {name}, description: {description}}}");
    let arg = candid::encode_args((arg, 1024u64))?;
    let response = agent
        .update(&launcher_id, "deploy_instance")
        .with_arg(arg)
        .await
        .context("Failed to query approve method.")?;
    println!("called deploy");
    let res = Decode!(&response, std::result::Result<String, DeployInstanceError>)
        .context("Failed to decode response of approve")?;
    let id = res?;
    println!("id: {id:?}");
    Ok(())
}

#[derive(CandidType, Deserialize, Debug, Error)]
enum DeployInstanceError {
    #[error("index out of range")]
    IndexOutOfLange,

    #[error("failed while setting up canister: {0}")]
    SettingUpCanister(String),

    #[error("refund required")]
    Refund,

    #[error("no instances available")]
    NoInstances,

    #[error("failed to create canister")]
    CreateCanister,

    #[error("failed to install canister")]
    InstallCanister,

    #[error("balance check failed: {0}")]
    CheckBalance(TransferError),

    #[error("already running")]
    AlreadyRunning,
}
