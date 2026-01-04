'use client'

// Where: Main dashboard shell for the Kinic web UI.
// What: Renders dashboard content inside the shared app shell.
// Why: Keeps the dashboard layout consistent across pages.
import { RefreshCwIcon } from 'lucide-react'

import TotalEarningCard from '@/components/shadcn-studio/blocks/widget-total-earning'
import TransactionDatatable from '@/components/shadcn-studio/blocks/datatable-transaction'
import AppShell from '@/components/layout/app-shell'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

import { transactionData } from '@/data/dashboard-transactions'
import { useIdentity } from '@/hooks/use-identity'
import { useLedgerBalance } from '@/hooks/use-ledger-balance'
import { useMemories } from '@/hooks/use-memories'

const DashboardShell = () => {
  const identityState = useIdentity()
  const balance = useLedgerBalance(identityState.identity)
  const memories = useMemories(identityState.identity, identityState.isReady)

  const balanceValue =
    balance.balanceKinic !== null ? Number(balance.balanceKinic.toFixed(4)) : undefined
  const balanceDetail = balance.isLoading
    ? 'Loading balance...'
    : balance.error
      ? 'Balance unavailable'
      : undefined

  return (
    <AppShell pageTitle='Dashboard' pageSubtitle='Personal' identityState={identityState}>
      <div className='grid grid-cols-2 gap-6 lg:grid-cols-3'>
        <div className='grid gap-6 max-xl:col-span-full lg:max-xl:grid-cols-2'>
          <TotalEarningCard
            title='Token balance'
            earning={balanceValue}
            unitLabel='KINIC'
            onRefresh={balance.refresh}
            isRefreshing={balance.isLoading}
            className='justify-between gap-5 sm:min-w-0 [&>[data-slot=card-content]]:space-y-7'
          />
        </div>

        <Card className='col-span-full'>
          <CardHeader className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <span className='text-lg font-semibold'>Memories</span>
              <Button
                variant='ghost'
                size='icon'
                className='text-muted-foreground size-8 rounded-full'
                onClick={memories.refresh}
                disabled={!identityState.isAuthenticated || memories.isLoading}
              >
                <RefreshCwIcon className={memories.isLoading ? 'animate-spin' : ''} />
                <span className='sr-only'>Reload memories</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent className='space-y-3'>
            {!identityState.isAuthenticated ? (
              <span className='text-muted-foreground text-sm'>Connect identity to load memories.</span>
            ) : null}
            {identityState.isAuthenticated && memories.error ? (
              <span className='text-rose-500 text-sm'>{memories.error}</span>
            ) : null}
            {identityState.isAuthenticated && !memories.error && memories.memories.length === 0 ? (
              <span className='text-muted-foreground text-sm'>No memories yet.</span>
            ) : null}
            {identityState.isAuthenticated && memories.memories.length ? (
              <div className='space-y-2'>
                {memories.memories.slice(0, 5).map((memory, index) => (
                  <div
                    key={`${memory.state}-${memory.principalText ?? 'none'}-${index}`}
                    className='flex items-center justify-between gap-3 rounded-2xl border border-zinc-200/70 bg-white/70 px-3 py-2 text-sm'
                  >
                    <span className='font-medium'>
                      {memory.principalText ? memory.principalText : '--'}
                    </span>
                    <Badge className='rounded-full border border-zinc-200/70 bg-zinc-50 text-zinc-700'>
                      {memory.state}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className='col-span-full w-full py-0'>
          <TransactionDatatable data={transactionData} />
        </Card>
      </div>
    </AppShell>
  )
}

export default DashboardShell
