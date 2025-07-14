'use client'

import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

interface ClientProvidersProps {
  children: React.ReactNode
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <AuthProvider>
      {children}
      <Toaster position="top-right" />
    </AuthProvider>
  )
} 