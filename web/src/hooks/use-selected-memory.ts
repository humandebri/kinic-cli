// Where: Client hook for memory selection persistence.
// What: Stores selected memory ID in localStorage.
// Why: Keeps header dropdown selection across pages.
'use client'

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'kinic:selected-memory-id'

export const useSelectedMemory = () => {
  const [selectedMemoryId, setSelectedMemoryIdState] = useState<string | null>(null)

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored) {
      setSelectedMemoryIdState(stored)
    }
  }, [])

  const setSelectedMemoryId = useCallback((value: string | null) => {
    if (!value) {
      window.localStorage.removeItem(STORAGE_KEY)
      setSelectedMemoryIdState(null)
      return
    }

    window.localStorage.setItem(STORAGE_KEY, value)
    setSelectedMemoryIdState(value)
  }, [])

  return { selectedMemoryId, setSelectedMemoryId }
}
