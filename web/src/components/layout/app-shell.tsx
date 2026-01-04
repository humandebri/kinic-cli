// Where: Shared shell layout for Kinic pages.
// What: Renders sidebar, header controls, and footer around page content.
// Why: Keeps navigation and identity controls consistent across pages.
'use client'

import type { ReactNode } from 'react'
import { GithubIcon, RefreshCwIcon, TwitterIcon, UserIcon } from 'lucide-react'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger
} from '@/components/ui/sidebar'

import ProfileDropdown from '@/components/shadcn-studio/blocks/dropdown-profile'
import { primarySection, pageSections } from '@/data/dashboard-nav'
import type { IdentityState } from '@/hooks/use-identity'

type AppShellProps = {
  pageTitle: string
  pageSubtitle?: string
  identityState: IdentityState
  balanceText?: string | null
  onBalanceRefresh?: () => void
  isBalanceRefreshing?: boolean
  children: ReactNode
}

const shortenPrincipal = (principalText: string | null): string => {
  if (!principalText) return 'Not connected'
  if (principalText.length <= 10) return principalText
  return `${principalText.slice(0, 6)}...${principalText.slice(-4)}`
}

const AppShell = ({
  pageTitle,
  pageSubtitle,
  identityState,
  balanceText,
  onBalanceRefresh,
  isBalanceRefreshing = false,
  children
}: AppShellProps) => {
  return (
    <div className='flex min-h-dvh w-full'>
      <SidebarProvider>
        <Sidebar>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {primarySection.items.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton asChild>
                        <a href={item.href}>
                          {item.icon}
                          <span>{item.label}</span>
                        </a>
                      </SidebarMenuButton>
                      {item.badge ? (
                        <SidebarMenuBadge className='bg-primary/10 rounded-full'>
                          {item.badge}
                        </SidebarMenuBadge>
                      ) : null}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {pageSections.map((section) => (
              <SidebarGroup key={section.label ?? 'section'}>
                {section.label ? <SidebarGroupLabel>{section.label}</SidebarGroupLabel> : null}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => (
                      <SidebarMenuItem key={item.label}>
                        <SidebarMenuButton asChild>
                          <a href={item.href}>
                            {item.icon}
                            <span>{item.label}</span>
                          </a>
                        </SidebarMenuButton>
                        {item.badge ? (
                          <SidebarMenuBadge className='bg-primary/10 rounded-full'>
                            {item.badge}
                          </SidebarMenuBadge>
                        ) : null}
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
        </Sidebar>
        <div className='flex flex-1 flex-col'>
          <header className='bg-card sticky top-0 z-50 border-b'>
            <div className='mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 sm:px-6'>
              <div className='flex items-center gap-4'>
                <SidebarTrigger className='[&_svg]:!size-5' />
                <Separator orientation='vertical' className='hidden !h-4 sm:block' />
                <Breadcrumb className='hidden sm:block'>
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink href='/'>Home</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                      {pageSubtitle ? (
                        <BreadcrumbLink href='#'>{pageTitle}</BreadcrumbLink>
                      ) : (
                        <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                      )}
                    </BreadcrumbItem>
                    {pageSubtitle ? (
                      <>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{pageSubtitle}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    ) : null}
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className='flex items-center gap-1.5'>
                {balanceText ? (
                  <div className='flex items-center gap-1.5 rounded-full border border-zinc-200/70 bg-white/80 px-3  text-sm text-zinc-700 shadow-sm backdrop-blur'>
                    <span className='font-medium'>{balanceText}</span>
                    {onBalanceRefresh ? (
                      <Button
                        variant='ghost'
                        size='icon'
                        className='size-7 rounded-full text-zinc-500'
                        onClick={onBalanceRefresh}
                        disabled={isBalanceRefreshing}
                      >
                        <RefreshCwIcon className={isBalanceRefreshing ? 'animate-spin' : ''} />
                        <span className='sr-only'>Reload balance</span>
                      </Button>
                    ) : null}
                  </div>
                ) : null}
                {identityState.isAuthenticated ? null : (
                  <Button size='sm' onClick={identityState.login} disabled={!identityState.isReady}>
                    Connect Identity
                  </Button>
                )}
                <ProfileDropdown
                  name={identityState.isAuthenticated ? 'Connected' : 'Guest'}
                  subtitle={shortenPrincipal(identityState.principalText)}
                  statusLabel={identityState.isAuthenticated ? 'online' : 'offline'}
                  onDisconnect={identityState.logout}
                  trigger={
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-7 rounded-full border border-zinc-200/70 bg-white/80 text-zinc-700 shadow-sm backdrop-blur'
                    >
                      <UserIcon />
                    </Button>
                  }
                />
              </div>
            </div>
          </header>
          <main className='mx-auto size-full max-w-7xl flex-1 px-4 py-6 sm:px-6'>{children}</main>
          <footer>
            <div className='text-muted-foreground mx-auto flex size-full max-w-7xl items-center justify-between gap-3 px-4 py-3 max-sm:flex-col sm:gap-6 sm:px-6'>
              <p className='text-sm text-balance max-sm:text-center'>
                {`(c)${new Date().getFullYear()}`}{' '}
                <a href='#' className='text-primary'>
                  Kinic
                </a>
                , Personal memory workspace
              </p>
              <div className='flex items-center gap-5'>
                <a href='#' aria-label='Twitter'>
                  <TwitterIcon className='size-4' />
                </a>
                <a href='#' aria-label='GitHub'>
                  <GithubIcon className='size-4' />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </SidebarProvider>
    </div>
  )
}

export default AppShell
