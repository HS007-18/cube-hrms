import { api, queryString } from '@/lib/api'
import type {
  Recruitment,
  RecruitmentDetail,
  Application,
  CreateRecruitmentPayload,
  UpdateRecruitmentPayload,
  CreateApplicationPayload,
  UpdateApplicationPayload,
  ApplicationStatus,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const recruitmentApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api<PaginatedResponse<Recruitment>>(`/recruitment${queryString(params || {})}`),

  create: (payload: CreateRecruitmentPayload) =>
    api<Recruitment>('/recruitment', { method: 'POST', body: payload }),

  get: (recruitmentId: number) => api<RecruitmentDetail>(`/recruitment/${recruitmentId}`),

  update: (recruitmentId: number, payload: UpdateRecruitmentPayload) =>
    api<Recruitment>(`/recruitment/${recruitmentId}`, { method: 'PATCH', body: payload }),

  apply: (recruitmentId: number, payload: CreateApplicationPayload) =>
    api<Application>(`/recruitment/${recruitmentId}/apply`, { method: 'POST', body: payload }),

  applications: (recruitmentId: number, params?: { status?: string; limit?: number; offset?: number }) =>
    api<PaginatedResponse<Application>>(`/recruitment/${recruitmentId}/applications${queryString(params || {})}`),

  updateApplication: (applicationId: number, payload: UpdateApplicationPayload) =>
    api<Application>(`/recruitment/applications/${applicationId}`, { method: 'PATCH', body: payload }),
}