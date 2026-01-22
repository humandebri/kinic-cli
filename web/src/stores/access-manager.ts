// Where: Access management modal store for memory detail page.
// What: Centralizes modal state, role selections, and status messaging.
// Why: Simplifies component state as access controls grow.
import { create } from 'zustand'

import type { RoleOption } from '@/lib/access-control'

type AccessManagerState = {
  accessModalOpen: boolean
  accessPrincipal: string
  accessRole: RoleOption
  accessStatus: string | null
  accessBusyUser: string | null
  isAccessSaving: boolean
  roleSelections: Record<string, RoleOption>
  setAccessModalOpen: (value: boolean) => void
  setAccessPrincipal: (value: string) => void
  setAccessRole: (value: RoleOption) => void
  setAccessStatus: (value: string | null) => void
  setAccessBusyUser: (value: string | null) => void
  setIsAccessSaving: (value: boolean) => void
  setRoleSelections: (value: Record<string, RoleOption>) => void
  updateRoleSelection: (principal: string, role: RoleOption) => void
}

export const useAccessManagerStore = create<AccessManagerState>()((set) => ({
  accessModalOpen: false,
  accessPrincipal: '',
  accessRole: 'writer',
  accessStatus: null,
  accessBusyUser: null,
  isAccessSaving: false,
  roleSelections: {},
  setAccessModalOpen: (value) => set({ accessModalOpen: value }),
  setAccessPrincipal: (value) => set({ accessPrincipal: value }),
  setAccessRole: (value) => set({ accessRole: value }),
  setAccessStatus: (value) => set({ accessStatus: value }),
  setAccessBusyUser: (value) => set({ accessBusyUser: value }),
  setIsAccessSaving: (value) => set({ isAccessSaving: value }),
  setRoleSelections: (value) => set({ roleSelections: value }),
  updateRoleSelection: (principal, role) =>
    set((state) => ({
      roleSelections: {
        ...state.roleSelections,
        [principal]: role
      }
    }))
}))
