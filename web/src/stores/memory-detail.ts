// Where: Memory detail page state store.
// What: Centralizes UI state for shared data, statuses, and confirmations.
// Why: Keeps page components lean as access management grows.
import { create } from 'zustand'

export type ConfirmAction = 'update' | 'remove' | null

type MemoryDetailState = {
  updateStatus: string | null
  isUpdatingWithOption: boolean
  sharedMemories: string[]
  sharedError: string | null
  sharedUsers: Array<[string, number]>
  sharedUsersError: string | null
  isRegisteringShared: boolean
  sharedStatus: string | null
  confirmOpen: boolean
  confirmAction: ConfirmAction
  confirmPrincipal: string | null
  confirmKeyword: string | null
  confirmInput: string
  confirmHandler: (() => Promise<void>) | null
  setUpdateStatus: (value: string | null) => void
  setIsUpdatingWithOption: (value: boolean) => void
  setSharedMemories: (value: string[]) => void
  setSharedError: (value: string | null) => void
  setSharedUsers: (value: Array<[string, number]>) => void
  setSharedUsersError: (value: string | null) => void
  setIsRegisteringShared: (value: boolean) => void
  setSharedStatus: (value: string | null) => void
  setConfirmOpen: (value: boolean) => void
  setConfirmAction: (value: ConfirmAction) => void
  setConfirmPrincipal: (value: string | null) => void
  setConfirmKeyword: (value: string | null) => void
  setConfirmInput: (value: string) => void
  setConfirmHandler: (value: (() => Promise<void>) | null) => void
}

export const useMemoryDetailStore = create<MemoryDetailState>()((set) => ({
  updateStatus: null,
  isUpdatingWithOption: false,
  sharedMemories: [],
  sharedError: null,
  sharedUsers: [],
  sharedUsersError: null,
  isRegisteringShared: false,
  sharedStatus: null,
  confirmOpen: false,
  confirmAction: null,
  confirmPrincipal: null,
  confirmKeyword: null,
  confirmInput: '',
  confirmHandler: null,
  setUpdateStatus: (value) => set({ updateStatus: value }),
  setIsUpdatingWithOption: (value) => set({ isUpdatingWithOption: value }),
  setSharedMemories: (value) => set({ sharedMemories: value }),
  setSharedError: (value) => set({ sharedError: value }),
  setSharedUsers: (value) => set({ sharedUsers: value }),
  setSharedUsersError: (value) => set({ sharedUsersError: value }),
  setIsRegisteringShared: (value) => set({ isRegisteringShared: value }),
  setSharedStatus: (value) => set({ sharedStatus: value }),
  setConfirmOpen: (value) => set({ confirmOpen: value }),
  setConfirmAction: (value) => set({ confirmAction: value }),
  setConfirmPrincipal: (value) => set({ confirmPrincipal: value }),
  setConfirmKeyword: (value) => set({ confirmKeyword: value }),
  setConfirmInput: (value) => set({ confirmInput: value }),
  setConfirmHandler: (value) => set({ confirmHandler: value })
}))
