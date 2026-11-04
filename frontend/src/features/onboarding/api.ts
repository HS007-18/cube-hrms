import { api, queryString } from '@/lib/api'
import type {
  Onboarding,
  OnboardingDetail,
  OnboardingTask,
  CreateOnboardingPayload,
  UpdateOnboardingPayload,
  CreateOnboardingTaskPayload,
  UpdateOnboardingTaskPayload,
} from './types'

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  limit: number
  offset: number
}

export const onboardingApi = {
  list: (params?: { status?: string; limit?: number; offset?: number }) =>
    api<PaginatedResponse<Onboarding>>(`/onboarding${queryString(params || {})}`),

  create: (payload: CreateOnboardingPayload) =>
    api<OnboardingDetail>('/onboarding', { method: 'POST', body: payload }),

  get: (onboardingId: number) => api<OnboardingDetail>(`/onboarding/${onboardingId}`),

  update: (onboardingId: number, payload: UpdateOnboardingPayload) =>
    api<Onboarding>(`/onboarding/${onboardingId}`, { method: 'PATCH', body: payload }),

  addTask: (onboardingId: number, payload: CreateOnboardingTaskPayload) =>
    api<OnboardingTask>(`/onboarding/${onboardingId}/tasks`, { method: 'POST', body: payload }),

  updateTask: (taskId: number, payload: UpdateOnboardingTaskPayload) =>
    api<OnboardingTask>(`/onboarding/tasks/${taskId}`, { method: 'PATCH', body: payload }),
}