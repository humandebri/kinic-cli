// Where: Memories page entry.
// What: Wraps the memories panel in the shared app shell.
// Why: Adds the first list_instance-based screen after dashboard.
'use client'

import AppShell from '@/components/layout/app-shell'
import MemoriesPanel from '@/components/memories/memories-panel'
import { useIdentity } from '@/hooks/use-identity'

const MemoriesPage = () => {
  const identityState = useIdentity()

  return (
    <AppShell pageTitle='Memories' pageSubtitle='Workspace' identityState={identityState}>
      <MemoriesPanel identityState={identityState} />
    </AppShell>
  )
}

export default MemoriesPage
