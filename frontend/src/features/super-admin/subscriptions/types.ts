export interface SubscriptionsItem {
  id: number
  name: string
  description: string | null
  price: string
  billing_cycle: 'monthly' | 'yearly'
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface CreateSubscriptionsPayload {
  name: string
  description?: string
  price: string
  billing_cycle: 'monthly' | 'yearly'
  features?: string[]
  is_active?: boolean
}

export interface UpdateSubscriptionsPayload {
  name?: string
  description?: string | null
  price?: string
  billing_cycle?: 'monthly' | 'yearly'
  features?: string[]
  is_active?: boolean
}
