// Where: Memories list panel for the Kinic UI.
// What: Displays launcher list_instance output with status and IDs.
// Why: Provides the first real data view after dashboard wiring.
'use client'

import { RefreshCw } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import type { IdentityState } from '@/hooks/use-identity'
import { type MemoryInstance, type MemoryState, useMemories } from '@/hooks/use-memories'
import { useSelectedMemory } from '@/hooks/use-selected-memory'
import { roleLabelMap } from '@/lib/access-control'
import { fetchMemoryCycles, fetchMemoryUsers, fetchMemoryVersion } from '@/lib/memory'

const CUSTOM_CANISTERS_KEY = 'kinic.custom-canisters'

const renderSkeletonRows = () => {
  return Array.from({ length: 3 }).map((_, index) => (
    <TableRow key={`skeleton-${index}`}>
      <TableCell>
        <Skeleton className='h-4 w-48' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-4 w-20' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-4 w-20' />
      </TableCell>
      <TableCell>
        <Skeleton className='h-4 w-20' />
      </TableCell>
    </TableRow>
  ))
}

const renderMemoryRow = (
  memory: MemoryInstance,
  index: number,
  onSelect: (id: string) => void,
  meta: { cycles: bigint | null; version: string | null; isLoading: boolean; error: string | null } | null,
  formatCycles: (value: bigint | null) => string,
  permission: {
    label: string | null
    isLoading: boolean
    error: string | null
    principal: string | null
  } | null,
  isAuthenticated: boolean
) => {
  const principalText = memory.principalText ?? '--'
  const permissionLabel = permission?.label ?? (isAuthenticated ? 'unknown' : 'not connected')

  return (
    <TableRow key={`${memory.state}-${principalText}-${index}`}>
      <TableCell className='font-medium'>
        {principalText !== '--' ? (
          <div className='flex flex-col gap-1'>
            <Link
              href={`/memories/${principalText}`}
              className='font-mono text-sm text-blue-600 hover:text-blue-700'
              onClick={() => onSelect(principalText)}
            >
              {principalText}
            </Link>
          </div>
        ) : (
          principalText
        )}
      </TableCell>
      <TableCell>
        {permission?.isLoading ? (
          <span className='text-xs text-zinc-500'>...</span>
        ) : (
          <Badge className='rounded-full border border-slate-200 bg-slate-50 text-slate-700'>
            {permissionLabel}
          </Badge>
        )}
      </TableCell>
      <TableCell className='font-mono text-xs text-zinc-700'>
        {meta?.isLoading ? '...' : formatCycles(meta?.cycles ?? null)}
      </TableCell>
      <TableCell className='font-mono text-xs text-zinc-700'>
        {meta?.isLoading ? '...' : meta?.version ?? '--'}
      </TableCell>
    </TableRow>
  )
}

const MemoriesPanel = ({ identityState }: { identityState: IdentityState }) => {
  const { isLoading, memories, error, lastUpdated, refresh } = useMemories(
    identityState.identity,
    identityState.isReady
  )
  const { setSelectedMemoryId } = useSelectedMemory()
  const [customCanisters, setCustomCanisters] = useState<string[]>([])
  const [memoryMeta, setMemoryMeta] = useState<
    Record<string, { cycles: bigint | null; version: string | null; isLoading: boolean; error: string | null }>
  >({})
  const [memoryPermissions, setMemoryPermissions] = useState<
    Record<string, { label: string | null; isLoading: boolean; error: string | null; principal: string | null }>
  >({})

  useEffect(() => {
    const stored = localStorage.getItem(CUSTOM_CANISTERS_KEY)
    if (!stored) return
    try {
      const parsed = JSON.parse(stored)
      if (Array.isArray(parsed)) {
        setCustomCanisters(parsed.filter((item): item is string => typeof item === 'string'))
      }
    } catch {
      // Ignore invalid stored data.
    }
  }, [])

  const lastUpdatedLabel = lastUpdated ? lastUpdated.toLocaleTimeString() : 'Not updated yet'
  const showAuthNotice = identityState.isReady && !identityState.isAuthenticated
  const showEmpty = !isLoading && !error && memories.length === 0 && customCanisters.length === 0 && !showAuthNotice
  const ownedSet = new Set(
    memories
      .map((memory) => memory.principalText)
      .filter((value): value is string => Boolean(value))
  )
  const mergedMemories: MemoryInstance[] = [
    ...memories,
    ...customCanisters
      .filter((id) => !ownedSet.has(id))
      .map((id) => ({ state: 'Custom' as MemoryState, principalText: id, detail: 'Saved manually' }))
  ]

  const formatCycles = (value: bigint | null) => {
    if (value === null) return '--'
    const trillion = 1_000_000_000_000n
    const units = Number(value) / Number(trillion)
    return `${units.toFixed(2)}T`
  }

  const loadMemoryMeta = async (memoryId: string) => {
    setMemoryMeta((prev) => ({
      ...prev,
      [memoryId]: { cycles: null, version: null, isLoading: true, error: null }
    }))
    try {
      const [cycles, version] = await Promise.all([
        fetchMemoryCycles(identityState.identity ?? undefined, memoryId),
        fetchMemoryVersion(identityState.identity ?? undefined, memoryId)
      ])
      setMemoryMeta((prev) => ({
        ...prev,
        [memoryId]: { cycles, version, isLoading: false, error: null }
      }))
    } catch (metaError) {
      const message =
        metaError instanceof Error ? metaError.message : 'Failed to load memory metadata.'
      setMemoryMeta((prev) => ({
        ...prev,
        [memoryId]: { cycles: null, version: null, isLoading: false, error: message }
      }))
    }
  }

  const loadMemoryPermission = async (memoryId: string) => {
    const principalText = identityState.principalText
    setMemoryPermissions((prev) => ({
      ...prev,
      [memoryId]: { label: null, isLoading: true, error: null, principal: principalText ?? null }
    }))

    if (!identityState.isAuthenticated || !principalText) {
      setMemoryPermissions((prev) => ({
        ...prev,
        [memoryId]: { label: 'not connected', isLoading: false, error: null, principal: principalText ?? null }
      }))
      return
    }

    try {
      const users = await fetchMemoryUsers(identityState.identity ?? undefined, memoryId)
      const matched = users.find(([userText]) => userText === principalText)
      const label = matched ? roleLabelMap[matched[1]] ?? 'unknown' : 'no access'
      setMemoryPermissions((prev) => ({
        ...prev,
        [memoryId]: { label, isLoading: false, error: null, principal: principalText }
      }))
    } catch (permissionError) {
      const message = permissionError instanceof Error ? permissionError.message : 'Failed to load permission.'
      const isInvalidUser =
        message.includes('Invalid user') || message.includes('IC0406') || message.includes('invalid user')
      setMemoryPermissions((prev) => ({
        ...prev,
        [memoryId]: {
          label: isInvalidUser ? 'no access' : 'unknown',
          isLoading: false,
          error: message,
          principal: principalText
        }
      }))
    }
  }

  useEffect(() => {
    const targets = mergedMemories
      .map((memory) => memory.principalText)
      .filter((value): value is string => Boolean(value))
    targets.forEach((memoryId) => {
      if (!memoryMeta[memoryId]) {
        loadMemoryMeta(memoryId)
      }
      const permissionEntry = memoryPermissions[memoryId]
      if (!permissionEntry || permissionEntry.principal !== identityState.principalText) {
        loadMemoryPermission(memoryId)
      }
    })
  }, [mergedMemories, identityState.identity, identityState.principalText, memoryMeta, memoryPermissions])

  return (
    <div className='flex flex-col gap-6'>
      <Card className='border-dashed'>
        <CardHeader className='flex flex-col gap-4'>
          <div className='flex flex-wrap items-center justify-between gap-4'>
            <div className='flex flex-col gap-1'>
              <CardTitle className='text-2xl'>Memory instances</CardTitle>
              <CardDescription>Fetch Memory IDs from Launcher list_instance.</CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Button
                variant='secondary'
                size='sm'
                className='gap-2 rounded-full'
                onClick={refresh}
                disabled={!identityState.isAuthenticated || isLoading}
              >
                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
          <div className='text-muted-foreground text-xs'>Last updated: {lastUpdatedLabel}</div>
        </CardHeader>
        <CardContent className='space-y-4'>
          <Separator />
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Memory ID</TableHead>
                <TableHead>Permission</TableHead>
                <TableHead>Cycles</TableHead>
                <TableHead>Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && memories.length === 0 ? renderSkeletonRows() : null}
              {error ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-rose-500'>
                    {error}
                  </TableCell>
                </TableRow>
              ) : null}
              {showEmpty ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-muted-foreground'>
                    No memories yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && !error && mergedMemories.length
                ? mergedMemories.map((memory, index) =>
                    renderMemoryRow(
                      memory,
                      index,
                      setSelectedMemoryId,
                      memory.principalText ? memoryMeta[memory.principalText] ?? null : null,
                      formatCycles,
                      memory.principalText ? memoryPermissions[memory.principalText] ?? null : null,
                      identityState.isAuthenticated
                    )
                  )
                : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600'>
        Memory names and descriptions are not exposed by the canister API yet, so IDs, state, cycles, and version are shown.
      </div>
    </div>
  )
}

export default MemoriesPanel
