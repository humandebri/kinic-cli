// Where: Memory canister actor helpers for UI actions.
// What: Provides typed actor creation for update calls.
// Why: Centralizes IC wiring for memory admin actions.
import { Actor, HttpAgent } from '@dfinity/agent'
import { IDL } from '@dfinity/candid'
import type { Identity } from '@dfinity/agent'
import type { Principal } from '@dfinity/principal'

import { IC_HOST, isMainnetHost } from '@/lib/ic-config'

export type MemoryActor = {
  add_new_user: (principal: Principal, role: number) => Promise<void>
  update_instance: (instance_pid_str: string) => Promise<void>
}

const memoryIdlFactory: IDL.InterfaceFactory = ({ IDL }) => {
  return IDL.Service({
    add_new_user: IDL.Func([IDL.Principal, IDL.Nat8], [], []),
    update_instance: IDL.Func([IDL.Text], [], [])
  })
}

export const createMemoryActor = async (identity: Identity, canisterId: string): Promise<MemoryActor> => {
  const agent = new HttpAgent({
    host: IC_HOST,
    identity
  })

  if (!isMainnetHost(IC_HOST)) {
    await agent.fetchRootKey()
  }

  return Actor.createActor<MemoryActor>(memoryIdlFactory, {
    agent,
    canisterId
  })
}
