import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AppSuperAdmin from './App-super-admin.tsx'
import { Providers } from '@/app/providers'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Providers>
      <AppSuperAdmin />
    </Providers>
  </StrictMode>,
)