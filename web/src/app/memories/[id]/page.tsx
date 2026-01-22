// Where: Memory detail page entry.
// What: Shows the selected memory ID and exposes admin actions.
// Why: Allows running add_new_user and update_instance from the UI.
'use client'

import { useCallback, useEffect, useMemo } from 'react'
import { Principal } from '@dfinity/principal'
import { useParams } from 'next/navigation'

import AppShell from '@/components/layout/app-shell'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useIdentityState } from '@/components/providers/identity-provider'
import { useSelectedMemory } from '@/hooks/use-selected-memory'
import {
  isRoleOption,
  roleLabelMap,
  roleOptionFromValue,
  roleValueMap,
  type RoleOption
} from '@/lib/access-control'
import { LAUNCHER_CANISTER_ID } from '@/lib/ic-config'
import { createMemoryActor, fetchMemoryUsers } from '@/lib/memory'
import { useAccessManagerStore } from '@/stores/access-manager'
import { useMemoryDetailStore } from '@/stores/memory-detail'
import {
  fetchSharedMemories,
  registerSharedMemory,
  updateMemoryInstanceWithOption
} from '@/lib/launcher'

const resolveUserLabel = (principalText: string, roleValue: number) => {
  if (principalText === LAUNCHER_CANISTER_ID) return 'launcher canister'
  return roleLabelMap[roleValue] ?? 'unknown'
}

const MemoryDetailPage = () => {
  const identityState = useIdentityState()
  const { selectedMemoryId } = useSelectedMemory()
  const params = useParams()
  const routeId = params?.id
  const routeMemoryId = Array.isArray(routeId) ? routeId[0] : routeId
  const memoryId = (routeMemoryId ?? selectedMemoryId ?? '').trim()
  const updateStatus = useMemoryDetailStore((state) => state.updateStatus)
  const setUpdateStatus = useMemoryDetailStore((state) => state.setUpdateStatus)
  const isUpdatingWithOption = useMemoryDetailStore((state) => state.isUpdatingWithOption)
  const setIsUpdatingWithOption = useMemoryDetailStore((state) => state.setIsUpdatingWithOption)
  const sharedMemories = useMemoryDetailStore((state) => state.sharedMemories)
  const setSharedMemories = useMemoryDetailStore((state) => state.setSharedMemories)
  const sharedError = useMemoryDetailStore((state) => state.sharedError)
  const setSharedError = useMemoryDetailStore((state) => state.setSharedError)
  const sharedUsers = useMemoryDetailStore((state) => state.sharedUsers)
  const setSharedUsers = useMemoryDetailStore((state) => state.setSharedUsers)
  const sharedUsersError = useMemoryDetailStore((state) => state.sharedUsersError)
  const setSharedUsersError = useMemoryDetailStore((state) => state.setSharedUsersError)
  const accessModalOpen = useAccessManagerStore((state) => state.accessModalOpen)
  const setAccessModalOpen = useAccessManagerStore((state) => state.setAccessModalOpen)
  const accessPrincipal = useAccessManagerStore((state) => state.accessPrincipal)
  const setAccessPrincipal = useAccessManagerStore((state) => state.setAccessPrincipal)
  const accessRole = useAccessManagerStore((state) => state.accessRole)
  const setAccessRole = useAccessManagerStore((state) => state.setAccessRole)
  const accessStatus = useAccessManagerStore((state) => state.accessStatus)
  const setAccessStatus = useAccessManagerStore((state) => state.setAccessStatus)
  const accessBusyUser = useAccessManagerStore((state) => state.accessBusyUser)
  const setAccessBusyUser = useAccessManagerStore((state) => state.setAccessBusyUser)
  const isAccessSaving = useAccessManagerStore((state) => state.isAccessSaving)
  const setIsAccessSaving = useAccessManagerStore((state) => state.setIsAccessSaving)
  const roleSelections = useAccessManagerStore((state) => state.roleSelections)
  const setRoleSelections = useAccessManagerStore((state) => state.setRoleSelections)
  const updateRoleSelection = useAccessManagerStore((state) => state.updateRoleSelection)
  const confirmOpen = useMemoryDetailStore((state) => state.confirmOpen)
  const setConfirmOpen = useMemoryDetailStore((state) => state.setConfirmOpen)
  const confirmAction = useMemoryDetailStore((state) => state.confirmAction)
  const setConfirmAction = useMemoryDetailStore((state) => state.setConfirmAction)
  const confirmPrincipal = useMemoryDetailStore((state) => state.confirmPrincipal)
  const setConfirmPrincipal = useMemoryDetailStore((state) => state.setConfirmPrincipal)
  const confirmKeyword = useMemoryDetailStore((state) => state.confirmKeyword)
  const setConfirmKeyword = useMemoryDetailStore((state) => state.setConfirmKeyword)
  const confirmInput = useMemoryDetailStore((state) => state.confirmInput)
  const setConfirmInput = useMemoryDetailStore((state) => state.setConfirmInput)
  const confirmHandler = useMemoryDetailStore((state) => state.confirmHandler)
  const setConfirmHandler = useMemoryDetailStore((state) => state.setConfirmHandler)
  const isRegisteringShared = useMemoryDetailStore((state) => state.isRegisteringShared)
  const setIsRegisteringShared = useMemoryDetailStore((state) => state.setIsRegisteringShared)
  const sharedStatus = useMemoryDetailStore((state) => state.sharedStatus)
  const setSharedStatus = useMemoryDetailStore((state) => state.setSharedStatus)

  const canSubmit = identityState.isAuthenticated && memoryId.length > 0

  const isSharedMemory = useMemo(() => {
    return memoryId.length > 0 && sharedMemories.includes(memoryId)
  }, [memoryId, sharedMemories])

  const loadLauncherMeta = useCallback(async () => {
    if (!memoryId) return
    setSharedError(null)

    fetchSharedMemories(identityState.identity ?? undefined)
      .then((value) => {
        setSharedMemories(value.map((principal) => principal.toText()))
      })
      .catch(() => {
        setSharedMemories([])
        setSharedError('Failed to load shared memories.')
      })

    if (!identityState.identity) {
      setSharedUsers([])
      setSharedUsersError('Login required to view shared users.')
    } else {
      const principalText = identityState.identity.getPrincipal().toText()
      fetchMemoryUsers(identityState.identity, memoryId)
        .then((users) => {
          setSharedUsers(users)
          const nextSelections: Record<string, RoleOption> = {}
          users.forEach(([userText, roleValue]) => {
            nextSelections[userText] = roleOptionFromValue(roleValue)
          })
          setRoleSelections(nextSelections)
          setSharedUsersError(null)
        })
        .catch((error) => {
          const message =
            error instanceof Error && error.message
              ? error.message.replace(/\s+/g, ' ').trim()
              : 'Failed to load shared users.'
          setSharedUsers([])
          setSharedUsersError(message)
        })
    }
  }, [identityState.identity, memoryId])

  useEffect(() => {
    if (!memoryId) {
      return
    }
    loadLauncherMeta()
  }, [loadLauncherMeta, memoryId, routeMemoryId, selectedMemoryId])


  const handleUpdateInstanceWithOption = async () => {
    if (!identityState.identity || !memoryId) return

    setIsUpdatingWithOption(true)
    setUpdateStatus(null)

    try {
      await updateMemoryInstanceWithOption(identityState.identity, memoryId, false)
      setUpdateStatus('Update triggered.')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update instance'
      setUpdateStatus(message)
    } finally {
      setIsUpdatingWithOption(false)
    }
  }

  const handleRegisterShared = async () => {
    if (!identityState.identity || !memoryId) return

    setIsRegisteringShared(true)
    setSharedStatus(null)

    try {
      const principal = Principal.fromText(memoryId)
      await registerSharedMemory(identityState.identity, principal)
      setSharedStatus('Shared memory registered.')
      loadLauncherMeta()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register shared memory'
      setSharedStatus(message)
    } finally {
      setIsRegisteringShared(false)
    }
  }

  const refreshUsers = async () => {
    if (!identityState.identity || !memoryId) return
    try {
      const users = await fetchMemoryUsers(identityState.identity, memoryId)
      setSharedUsers(users)
      const nextSelections: Record<string, RoleOption> = {}
      users.forEach(([userText, roleValue]) => {
        nextSelections[userText] = roleOptionFromValue(roleValue)
      })
      setRoleSelections(nextSelections)
      setSharedUsersError(null)
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message.replace(/\s+/g, ' ').trim()
          : 'Failed to load shared users.'
      setSharedUsers([])
      setSharedUsersError(message)
    }
  }

  const handleAddAccessUser = async () => {
    if (!identityState.identity || !memoryId) return
    if (!accessPrincipal.trim()) return

    setIsAccessSaving(true)
    setAccessStatus(null)

    try {
      const actor = await createMemoryActor(identityState.identity, memoryId)
      const principal = Principal.fromText(accessPrincipal.trim())
      await actor.add_new_user(principal, roleValueMap[accessRole])
      setAccessStatus('User role saved.')
      setAccessPrincipal('')
      await refreshUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update access.'
      setAccessStatus(message)
    } finally {
      setIsAccessSaving(false)
    }
  }

  const openConfirmModal = (
    action: 'update' | 'remove',
    principalText: string,
    handler: () => Promise<void>
  ) => {
    const selfPrincipal = identityState.identity?.getPrincipal().toText() ?? null
    const isSelf = selfPrincipal === principalText
    const keyword = isSelf ? (action === 'remove' ? 'delete' : 'change') : null

    setConfirmAction(action)
    setConfirmPrincipal(principalText)
    setConfirmKeyword(keyword)
    setConfirmInput('')
    setConfirmHandler(() => handler)
    setConfirmOpen(true)
  }

  const closeConfirmModal = () => {
    setConfirmOpen(false)
    setConfirmAction(null)
    setConfirmPrincipal(null)
    setConfirmKeyword(null)
    setConfirmInput('')
    setConfirmHandler(null)
  }

  const handleRoleSelectionChange = (principalText: string, value: string) => {
    if (!isRoleOption(value)) return
    updateRoleSelection(principalText, value)
  }

  const performUpdateAccessRole = async (principalText: string) => {
    if (!identityState.identity || !memoryId) return
    if (principalText === LAUNCHER_CANISTER_ID) return

    const selectedRole = roleSelections[principalText] ?? 'reader'
    setAccessBusyUser(principalText)
    setAccessStatus(null)

    try {
      const actor = await createMemoryActor(identityState.identity, memoryId)
      const principal = Principal.fromText(principalText)
      await actor.add_new_user(principal, roleValueMap[selectedRole])
      setAccessStatus('User role updated.')
      await refreshUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update access.'
      setAccessStatus(message)
    } finally {
      setAccessBusyUser(null)
    }
  }

  const performRemoveAccessUser = async (principalText: string) => {
    if (!identityState.identity || !memoryId) return
    if (principalText === LAUNCHER_CANISTER_ID) return

    setAccessBusyUser(principalText)
    setAccessStatus(null)

    try {
      const actor = await createMemoryActor(identityState.identity, memoryId)
      const principal = Principal.fromText(principalText)
      await actor.remove_user(principal)
      setAccessStatus('User removed.')
      await refreshUsers()
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove user.'
      setAccessStatus(message)
    } finally {
      setAccessBusyUser(null)
    }
  }

  const handleUpdateAccessRole = (principalText: string) => {
    openConfirmModal('update', principalText, () => performUpdateAccessRole(principalText))
  }

  const handleRemoveAccessUser = (principalText: string) => {
    openConfirmModal('remove', principalText, () => performRemoveAccessUser(principalText))
  }

  return (
    <AppShell pageTitle='Memories' pageSubtitle='Detail' identityState={identityState}>
      <div className='grid gap-6'>

        <Card>
          <CardHeader className='flex flex-col items-start gap-2'>
            <span className='text-lg font-semibold'>Access management</span>
            <span className='text-muted-foreground text-sm'>Review user roles and edit in a modal.</span>
          </CardHeader>
          <CardContent className='flex flex-col items-start gap-3'>
            {sharedUsersError ? <span className='text-xs text-rose-500'>{sharedUsersError}</span> : null}
            <div className='text-xs text-zinc-600'>
              {sharedUsers.length ? `${sharedUsers.length} user(s) with access` : 'No users recorded.'}
            </div>
            {sharedUsers.length ? (
              <div className='w-full space-y-2'>
                {sharedUsers.map(([principalText, roleValue]) => (
                  <div
                    key={principalText}
                    className='flex items-center justify-between rounded-2xl border border-zinc-200/70 bg-white/70 px-3 py-2 text-xs'
                  >
                    <span className='font-mono text-xs text-zinc-800'>{principalText}</span>
                    <span className='rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-600'>
                      {resolveUserLabel(principalText, roleValue)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <span className='text-xs text-zinc-500'>No users recorded.</span>
            )}
            <Button
              size='sm'
              className='rounded-full'
              onClick={async () => {
                setAccessModalOpen(true)
                await refreshUsers()
              }}
              disabled={!canSubmit}
            >
              Open access manager
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-col items-start gap-2'>
            <span className='text-lg font-semibold'>Maintenance</span>
            <span className='text-muted-foreground text-sm'>Run update_instance_with_option (update).</span>
          </CardHeader>
          <CardContent className='flex flex-col items-start gap-3'>
            <Button
              variant='outline'
              className='rounded-full'
              onClick={handleUpdateInstanceWithOption}
              disabled={!canSubmit || isUpdatingWithOption}
            >
              {isUpdatingWithOption ? 'Updating...' : 'Trigger update (option)'}
            </Button>
            {updateStatus ? <span className='text-sm text-muted-foreground'>{updateStatus}</span> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-col items-start gap-2'>
            <span className='text-lg font-semibold'>Shared memory</span>
            <span className='text-muted-foreground text-sm'>Register or list shared memories.</span>
          </CardHeader>
          <CardContent className='flex flex-col items-start gap-3'>
            <div className='text-xs text-zinc-600'>
              {sharedMemories.length
                ? `${sharedMemories.length} shared memory item(s)`
                : 'No shared memories registered.'}
            </div>
            {sharedError ? <span className='text-xs text-rose-500'>{sharedError}</span> : null}
            {memoryId ? (
              <div className='text-xs text-zinc-600'>
                Current memory: {isSharedMemory ? 'registered' : 'not registered'}
              </div>
            ) : null}
            <Button
              className='rounded-full'
              onClick={handleRegisterShared}
              disabled
            >
              Register current memory (disabled)
            </Button>
            {sharedStatus ? <span className='text-sm text-muted-foreground'>{sharedStatus}</span> : null}
          </CardContent>
        </Card>
      </div>
      {accessModalOpen ? (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
          onClick={() => setAccessModalOpen(false)}
          role='presentation'
        >
          <div
            className='w-[36rem] max-w-full rounded-2xl bg-white p-6 shadow-xl'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-zinc-900'>Access management</h2>
              <Button variant='ghost' size='sm' onClick={() => setAccessModalOpen(false)}>
                Close
              </Button>
            </div>
            <div className='mt-4 space-y-4'>
              {sharedUsersError ? (
                <div className='rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-600'>
                  {sharedUsersError}
                </div>
              ) : null}
              {accessStatus ? (
                <div className='rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700'>
                  {accessStatus}
                </div>
              ) : null}
              <div className='space-y-2'>
                <label className='text-sm text-zinc-600'>Add or update user</label>
                <div className='flex flex-wrap items-center gap-2'>
                  <Input
                    value={accessPrincipal}
                    onChange={(event) => setAccessPrincipal(event.target.value)}
                    placeholder='Principal'
                  />
                  <select
                    className='h-9 rounded-md border border-input bg-background px-3 text-sm'
                    value={accessRole}
                    onChange={(event) => {
                      const nextRole = event.target.value
                      if (isRoleOption(nextRole)) {
                        setAccessRole(nextRole)
                      }
                    }}
                  >
                    <option value='admin'>admin</option>
                    <option value='writer'>writer</option>
                    <option value='reader'>reader</option>
                  </select>
                  <Button
                    size='sm'
                    className='rounded-full'
                    onClick={handleAddAccessUser}
                    disabled={!canSubmit || isAccessSaving || accessPrincipal.trim().length === 0}
                  >
                    {isAccessSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
              <div className='space-y-2'>
                <label className='text-sm text-zinc-600'>Existing users</label>
                {sharedUsers.length ? (
                  <div className='space-y-2'>
                    {sharedUsers.map(([principalText, roleValue]) => {
                      const selectedRole = roleSelections[principalText] ?? roleOptionFromValue(roleValue)
                      const isLauncher = principalText === LAUNCHER_CANISTER_ID
                      return (
                        <div
                          key={principalText}
                          className='flex flex-col gap-2 rounded-2xl border border-zinc-200/70 bg-white/70 px-3 py-2 text-xs'
                        >
                          <div className='flex items-center justify-between gap-2'>
                            <span className='font-mono text-xs text-zinc-800'>{principalText}</span>
                            <span className='rounded-full bg-zinc-100 px-2 py-0.5 font-semibold text-zinc-600'>
                              {resolveUserLabel(principalText, roleValue)}
                            </span>
                          </div>
                          <div className='flex flex-wrap items-center gap-2'>
                            <select
                              className='h-8 rounded-md border border-input bg-background px-2 text-xs'
                              value={selectedRole}
                              onChange={(event) =>
                                handleRoleSelectionChange(principalText, event.target.value)
                              }
                              disabled={!canSubmit || isLauncher}
                            >
                              <option value='admin'>admin</option>
                              <option value='writer'>writer</option>
                              <option value='reader'>reader</option>
                            </select>
                            <Button
                              size='sm'
                              className='rounded-full'
                              onClick={() => handleUpdateAccessRole(principalText)}
                              disabled={!canSubmit || isLauncher || accessBusyUser === principalText}
                            >
                              {accessBusyUser === principalText ? 'Updating...' : 'Update role'}
                            </Button>
                            <Button
                              size='sm'
                              variant='ghost'
                              className='rounded-full text-rose-600'
                              onClick={() => handleRemoveAccessUser(principalText)}
                              disabled={!canSubmit || isLauncher || accessBusyUser === principalText}
                            >
                              {accessBusyUser === principalText ? 'Removing...' : 'Remove'}
                            </Button>
                          </div>
                          {isLauncher ? (
                            <span className='text-[10px] text-zinc-500'>
                              Launcher canister role is managed by the system.
                            </span>
                          ) : null}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <span className='text-xs text-zinc-500'>No users recorded.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
      {confirmOpen && confirmAction && confirmPrincipal ? (
        <div
          className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4'
          onClick={closeConfirmModal}
          role='presentation'
        >
          <div
            className='w-[28rem] max-w-full rounded-2xl bg-white p-6 shadow-xl'
            onClick={(event) => event.stopPropagation()}
          >
            <div className='flex items-center justify-between'>
              <h2 className='text-lg font-semibold text-zinc-900'>Confirm {confirmAction}</h2>
              <Button variant='ghost' size='sm' onClick={closeConfirmModal}>
                Close
              </Button>
            </div>
            <div className='mt-4 space-y-3 text-sm text-zinc-600'>
              <p>
                You are about to {confirmAction} access for:
              </p>
              <div className='rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-800'>
                {confirmPrincipal}
              </div>
              {confirmKeyword ? (
                <div className='space-y-2'>
                  <p>
                    This is your own principal. Type <span className='font-semibold'>{confirmKeyword}</span>{' '}
                    to proceed.
                  </p>
                  <Input
                    value={confirmInput}
                    onChange={(event) => setConfirmInput(event.target.value)}
                    placeholder={confirmKeyword}
                  />
                </div>
              ) : null}
            </div>
            <div className='mt-4 flex items-center justify-end gap-2'>
              <Button variant='outline' onClick={closeConfirmModal}>
                No
              </Button>
              <Button
                onClick={async () => {
                  if (!confirmHandler) return
                  await confirmHandler()
                  closeConfirmModal()
                }}
                disabled={Boolean(confirmKeyword) && confirmInput.trim() !== confirmKeyword}
              >
                Yes
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  )
}

export default MemoryDetailPage
