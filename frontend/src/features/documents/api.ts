import { api, queryString } from '@/lib/api'
import type {
  DocumentsItem,
  CreateDocumentsPayload,
  UpdateDocumentsPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const documentsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    api<PaginatedResponse<DocumentsItem>>(`/documents${queryString(params || {})}`),

  create: (payload: CreateDocumentsPayload) =>
    api<DocumentsItem>('/documents', { method: 'POST', body: payload }),

  get: (id: number) =>
    api<DocumentsItem>(`/documents/${id}`),

  update: (id: number, payload: UpdateDocumentsPayload) =>
    api<DocumentsItem>(`/documents/${id}`, { method: 'PATCH', body: payload }),

  delete: (id: number) =>
    api<void>(`/documents/${id}`, { method: 'DELETE' }),

  download: (id: number) =>
    api<Blob>(`/documents/${id}/download`, { method: 'GET' }),
}
