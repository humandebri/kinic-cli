// Where: Ledger actor helpers for balance queries.
// What: Creates a typed actor for icrc1_balance_of.
// Why: Keeps IC actor wiring isolated from UI components.
import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import type { Identity } from '@dfinity/agent'
import type { Principal } from '@dfinity/principal'

import { IC_HOST, LEDGER_CANISTER_ID, isMainnetHost } from '@/lib/ic-config'

type Account = {
  owner: Principal
  subaccount: [] | [Uint8Array]
}

type BalanceActor = {
  icrc1_balance_of: (account: Account) => Promise<bigint>
}

const ledgerIdlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  const Account = IDL.Record({
    owner: IDL.Principal,
    subaccount: IDL.Opt(IDL.Vec(IDL.Nat8))
  })
  return IDL.Service({
    icrc1_balance_of: IDL.Func([Account], [IDL.Nat], ['query'])
  })
}

export const createLedgerActor = async (identity?: Identity): Promise<BalanceActor> => {
  const agent = new HttpAgent({
    host: IC_HOST,
    identity
  })

  if (!isMainnetHost(IC_HOST)) {
    await agent.fetchRootKey()
  }

  return Actor.createActor<BalanceActor>(ledgerIdlFactory, {
    agent,
    canisterId: LEDGER_CANISTER_ID
  })
}
