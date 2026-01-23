// Where: Insert page state store.
// What: Centralizes file selection, preview, and insert progress state.
// Why: Reduces component state sprawl as the insert flow grows.
import { create } from 'zustand'

export type UploadKind = 'pdf' | 'markdown' | 'text'
export type InsertPhase = 'idle' | 'chunking' | 'inserting' | 'done' | 'error'

type Progress = { total: number; done: number } | null

type InsertState = {
  fileName: string | null
  uploadKind: UploadKind | null
  markdown: string
  sourceSegments: string[]
  pasteText: string
  isPasteMode: boolean
  tag: string
  isReading: boolean
  isSubmitting: boolean
  isCompleted: boolean
  isPreviewOpen: boolean
  previewDraft: string
  showTransferPanel: boolean
  insertPhase: InsertPhase
  status: string | null
  progress: Progress
  setFileName: (value: string | null) => void
  setUploadKind: (value: UploadKind | null) => void
  setMarkdown: (value: string) => void
  setSourceSegments: (value: string[]) => void
  setPasteText: (value: string) => void
  setIsPasteMode: (value: boolean) => void
  setTag: (value: string) => void
  setIsReading: (value: boolean) => void
  setIsSubmitting: (value: boolean) => void
  setIsCompleted: (value: boolean) => void
  setIsPreviewOpen: (value: boolean) => void
  setPreviewDraft: (value: string) => void
  setShowTransferPanel: (value: boolean) => void
  setInsertPhase: (value: InsertPhase) => void
  setStatus: (value: string | null) => void
  setProgress: (value: Progress) => void
}

export const useInsertStore = create<InsertState>()((set) => ({
  fileName: null,
  uploadKind: null,
  markdown: '',
  sourceSegments: [],
  pasteText: '',
  isPasteMode: false,
  tag: '',
  isReading: false,
  isSubmitting: false,
  isCompleted: false,
  isPreviewOpen: false,
  previewDraft: '',
  showTransferPanel: false,
  insertPhase: 'idle',
  status: null,
  progress: null,
  setFileName: (value) => set({ fileName: value }),
  setUploadKind: (value) => set({ uploadKind: value }),
  setMarkdown: (value) => set({ markdown: value }),
  setSourceSegments: (value) => set({ sourceSegments: value }),
  setPasteText: (value) => set({ pasteText: value }),
  setIsPasteMode: (value) => set({ isPasteMode: value }),
  setTag: (value) => set({ tag: value }),
  setIsReading: (value) => set({ isReading: value }),
  setIsSubmitting: (value) => set({ isSubmitting: value }),
  setIsCompleted: (value) => set({ isCompleted: value }),
  setIsPreviewOpen: (value) => set({ isPreviewOpen: value }),
  setPreviewDraft: (value) => set({ previewDraft: value }),
  setShowTransferPanel: (value) => set({ showTransferPanel: value }),
  setInsertPhase: (value) => set({ insertPhase: value }),
  setStatus: (value) => set({ status: value }),
  setProgress: (value) => set({ progress: value })
}))
