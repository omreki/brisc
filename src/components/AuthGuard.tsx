'use client'

import { ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Shield, Zap, Lock, CheckCircle } from 'lucide-react'

interface AuthGuardProps {
  children: ReactNode
  fallback?: ReactNode
}

export default function AuthGuard({ children, fallback }: AuthGuardProps): JSX.Element {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center px-4 slide-up">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Shield className="h-10 w-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center animate-pulse">
                <Zap className="h-4 w-4 text-white" />
              </div>
            </div>
          </div>
          
          <div className="loading-spinner mx-auto mb-6 w-8 h-8 border-blue-600"></div>
          
          <h2 className="text-subsection-title mb-4">Securing Your Session</h2>
          <p className="text-body max-w-md mx-auto mb-8">
            Please wait while we verify your authentication and prepare your secure access to the student portal
          </p>

          {/* Security Features */}
          <div className="max-w-sm mx-auto space-y-4">
            <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Lock className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Encrypted Connection</p>
                <p className="text-xs text-gray-600">Your data is protected</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-white/30">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold text-gray-900">Secure Verification</p>
                <p className="text-xs text-gray-600">Validating your access</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <div className="flex justify-center space-x-1">
              <div className="loading-dot"></div>
              <div className="loading-dot" style={{ animationDelay: '0.2s' }}></div>
              <div className="loading-dot" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <div>{fallback || null}</div>
  }

  return <>{children}</>
} 