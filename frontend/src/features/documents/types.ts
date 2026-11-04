export interface DocumentsItem {
  id: number
  name: string
  description: string | null
  file_url: string | null
  file_type: string | null
  file_size: number | null
  category: string | null
  uploaded_by: number | null
  created_at: string
  updated_at: string
}

export interface CreateDocumentsPayload {
  name: string
  description?: string
  file_url?: string
  file_type?: string
  file_size?: number
  category?: string
}

export interface UpdateDocumentsPayload {
  name?: string
  description?: string | null
  file_url?: string | null
  file_type?: string | null
  file_size?: number | null
  category?: string | null
}
