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

const CUSTOM_CANISTERS_KEY = 'kinic.custom-canisters'

const statusTone: Record<MemoryState, string> = {
  Running: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  SettingUp: 'border-amber-200 bg-amber-50 text-amber-700',
  Installation: 'border-amber-200 bg-amber-50 text-amber-700',
  Creation: 'border-amber-200 bg-amber-50 text-amber-700',
  Pending: 'border-amber-200 bg-amber-50 text-amber-700',
  Empty: 'border-rose-200 bg-rose-50 text-rose-700',
  Custom: 'border-slate-200 bg-slate-50 text-slate-700'
}

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
        <Skeleton className='h-4 w-40' />
      </TableCell>
    </TableRow>
  ))
}

const renderMemoryRow = (
  memory: MemoryInstance,
  index: number,
  onSelect: (id: string) => void,
  isAuthorized: boolean
) => {
  const detailText = memory.detail ?? '--'
  const principalText = memory.principalText ?? '--'

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
        <div className='flex flex-wrap items-center gap-2'>
          <Badge className={`rounded-full border ${statusTone[memory.state]}`}>{memory.state}</Badge>
          {!isAuthorized ? (
            <Badge className='rounded-full border border-amber-200 bg-amber-50 text-amber-700'>
              NOT AUTHORIZED
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell className='text-muted-foreground'>{detailText}</TableCell>
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
                <TableHead>Status</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && memories.length === 0 ? renderSkeletonRows() : null}
              {error ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-rose-500'>
                    {error}
                  </TableCell>
                </TableRow>
              ) : null}
              {showEmpty ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-muted-foreground'>
                    No memories yet.
                  </TableCell>
                </TableRow>
              ) : null}
              {!isLoading && !error && mergedMemories.length
                ? mergedMemories.map((memory, index) =>
                    renderMemoryRow(memory, index, setSelectedMemoryId, ownedSet.has(memory.principalText ?? ''))
                  )
                : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <div className='rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600'>
        Memory names and descriptions are not exposed by the canister API yet, so only IDs and states are shown.
      </div>
    </div>
  )
}

export default MemoriesPanel
