// Where: Memory creation page entry.
// What: Approves the launcher and deploys a new memory canister.
// Why: Mirrors `cargo run -- --identity --ic create` in the UI.
'use client'

import { useEffect, useState } from 'react'
import { Principal } from '@dfinity/principal'

import AppShell from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useIdentity } from '@/hooks/use-identity'
import { useSelectedMemory } from '@/hooks/use-selected-memory'
import { APPROVAL_TTL_NS, LAUNCHER_CANISTER_ID } from '@/lib/ic-config'
import { approveLauncherSpend } from '@/lib/ledger'
import { createLauncherActor, deployMemoryInstance } from '@/lib/launcher'

const formatPrice = (value: bigint | null) => {
  if (value === null) return '--'
  return value.toString()
}

const AddMemoryPage = () => {
  const identityState = useIdentity()
  const { setSelectedMemoryId } = useSelectedMemory()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState<bigint | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [isLoadingPrice, setIsLoadingPrice] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  const canCreate = Boolean(identityState.isAuthenticated && name.trim() && description.trim())

  useEffect(() => {
    let isMounted = true

    const loadPrice = async () => {
      if (!identityState.isReady) return

      setIsLoadingPrice(true)
      setStatus(null)

      try {
        const actor = await createLauncherActor(identityState.identity ?? undefined)
        const fetchedPrice = await actor.get_price()

        if (!isMounted) return
        setPrice(fetchedPrice)
      } catch (error) {
        if (!isMounted) return
        const message = error instanceof Error ? error.message : 'Failed to load price'
        setStatus(message)
      } finally {
        if (isMounted) setIsLoadingPrice(false)
      }
    }

    loadPrice()

    return () => {
      isMounted = false
    }
  }, [identityState.identity, identityState.isReady])

  const handleCreate = async () => {
    if (!identityState.identity || price === null) return

    setIsCreating(true)
    setStatus(null)

    try {
      const now = BigInt(Date.now()) * 1_000_000n
      const expiresAt = now + APPROVAL_TTL_NS
      const launcher = Principal.fromText(LAUNCHER_CANISTER_ID)

      await approveLauncherSpend(identityState.identity, launcher, price, expiresAt)
      const memoryId = await deployMemoryInstance(identityState.identity, name.trim(), description.trim())

      setSelectedMemoryId(memoryId)
      setStatus(`Memory created: ${memoryId}`)
      setName('')
      setDescription('')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create memory'
      setStatus(message)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <AppShell pageTitle='Add Memory' identityState={identityState}>
      <div className='grid gap-6'>
        <Card>
          <CardHeader className='flex flex-col items-start gap-2'>
            <span className='text-lg font-semibold'>Add Memory</span>
            <span className='text-muted-foreground text-sm'>
              Approves the launcher and deploys a new memory canister.
            </span>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex flex-col gap-2'>
              <label className='text-sm text-zinc-600'>Price</label>
              <div className='rounded-2xl border border-zinc-200/70 bg-white/70 px-3 py-2 text-sm'>
                <div className='flex items-center gap-2'>
                  <span className='font-mono text-sm text-zinc-900'>
                    {isLoadingPrice ? 'Loading…' : formatPrice(price)}
                  </span>
                  <span className='text-muted-foreground text-xs'>base units</span>
                </div>
              </div>
            </div>
            <div className='flex flex-col gap-2'>
              <label className='text-sm text-zinc-600'>Name</label>
              <Input value={name} onChange={(event) => setName(event.target.value)} placeholder='Memory name' />
            </div>
            <div className='flex flex-col gap-2'>
              <label className='text-sm text-zinc-600'>Description</label>
              <Input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder='Short description'
              />
            </div>
            <div className='flex items-center gap-3'>
              <Button className='rounded-full' onClick={handleCreate} disabled={!canCreate || isCreating || price === null}>
                {isCreating ? 'Creating…' : 'Create'}
              </Button>
              {status ? <span className='text-muted-foreground text-sm'>{status}</span> : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}

export default AddMemoryPage
