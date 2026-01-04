// Where: Dashboard right column widget.
// What: Card showing total earnings with platform breakdown.
// Why: Matches the reference dashboard layout and hierarchy.
'use client'

import { ChevronDownIcon, ChevronUpIcon, RefreshCwIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

type Props = {
  title: string
  earning?: number
  trend?: 'up' | 'down'
  percentage?: number
  comparisonText?: string
  unitLabel?: string
  onRefresh?: () => void
  isRefreshing?: boolean
  className?: string
}

const TotalEarningCard = ({
  title,
  earning,
  trend,
  percentage,
  comparisonText,
  unitLabel = '$',
  onRefresh,
  isRefreshing = false,
  className
}: Props) => {
  const hasBalanceValue = typeof earning === 'number'
  const hasTrend = typeof percentage === 'number' && trend

  return (
    <Card className={className}>
      <CardHeader className='flex items-center justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-lg font-semibold'>{title}</span>
          {onRefresh ? (
            <Button
              variant='ghost'
              size='icon'
              className='text-muted-foreground size-8 rounded-full'
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCwIcon className={isRefreshing ? 'animate-spin' : ''} />
              <span className='sr-only'>Reload balance</span>
            </Button>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <span className='text-xl font-semibold'>
              {hasBalanceValue ? `${earning} ${unitLabel}` : '--'}
            </span>
            {hasTrend ? (
              <span className='flex items-center gap-1'>
                {trend === 'up' ? <ChevronUpIcon className='size-4' /> : <ChevronDownIcon className='size-4' />}
                <span className='text-sm'>{percentage}%</span>
              </span>
            ) : null}
          </div>
          {comparisonText ? <span className='text-muted-foreground text-sm'>{comparisonText}</span> : null}
        </div>
      </CardContent>
    </Card>
  )
}

export default TotalEarningCard
