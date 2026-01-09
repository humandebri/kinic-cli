// Where: Client hook for canister status (cycles).
// What: Loads cycles balance via the management canister.
// Why: Enables memory detail to show cycles.
'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Identity } from '@dfinity/agent'
import { Principal } from '@dfinity/principal'

import { createManagementActor } from '@/lib/management'

type CanisterStatusState = {
  isLoading: boolean
  cycles: bigint | null
  error: string | null
}

const formatStatusError = (message: string) => {
  if (message.includes('canister_not_found')) {
    return 'Cycles balance requires controller access. If you are not a controller, IC returns canister_not_found.'
  }
  return message
}

export const useCanisterStatus = (identity: Identity | null, canisterId: string) => {
  const [state, setState] = useState<CanisterStatusState>({
    isLoading: false,
    cycles: null,
    error: null
  })
  const [refreshIndex, setRefreshIndex] = useState(0)

  const canRefresh = Boolean(identity && canisterId)

  const refresh = useCallback(() => {
    setRefreshIndex((prev) => prev + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    const loadStatus = async () => {
      if (!identity || !canisterId) {
        setState({ isLoading: false, cycles: null, error: null })
        return
      }

      setState((prev) => ({ ...prev, isLoading: true, error: null }))

      try {
        const actor = await createManagementActor(identity)
        const status = await actor.canister_status({ canister_id: Principal.fromText(canisterId) })

        if (!isMounted) return

        setState({
          isLoading: false,
          cycles: status.cycles,
          error: null
        })
      } catch (error) {
        if (!isMounted) return

        const rawMessage = error instanceof Error ? error.message : 'Failed to load cycles'
        const message = formatStatusError(rawMessage)
        setState({
          isLoading: false,
          cycles: null,
          error: message
        })
      }
    }

    loadStatus()

    return () => {
      isMounted = false
    }
  }, [canisterId, identity, refreshIndex])

  return { ...state, refresh, canRefresh }
}
