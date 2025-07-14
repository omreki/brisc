'use client'

import { useState } from 'react'
import LoginForm from '@/components/LoginForm'
import RegisterForm from '@/components/RegisterForm'
import { useAuth } from '@/contexts/AuthContext'

interface AuthPageProps {
  onAuthSuccess: () => void
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true)
  const { login, register } = useAuth()

  const handleLoginSuccess = (user: any) => {
    // The AuthContext already handles the state update
    // Just trigger the auth success callback
    onAuthSuccess()
  }

  const handleRegisterSuccess = () => {
    setIsLogin(true) // Switch to login after successful registration
  }

  const switchToRegister = () => {
    setIsLogin(false)
  }

  const switchToLogin = () => {
    setIsLogin(true)
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Student Portal
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Secure access to your exam results and academic information
          </p>
        </div>

        {/* Auth Form Container */}
        <div className={`${isLogin ? 'max-w-md' : 'max-w-6xl'} mx-auto`}>
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden">
            <div className="p-8">
              {isLogin ? (
                <LoginForm
                  onLoginSuccess={handleLoginSuccess}
                  onSwitchToRegister={switchToRegister}
                />
              ) : (
                <RegisterForm
                  onRegisterSuccess={handleRegisterSuccess}
                  onSwitchToLogin={switchToLogin}
                />
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  )
} 