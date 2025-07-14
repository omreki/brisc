'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from './LoginForm'
import RegisterForm from './RegisterForm'
import ForgotPasswordForm from './ForgotPasswordForm'

interface AuthPageProps {
  onAuthSuccess: () => void
}

export default function AuthPage({ onAuthSuccess }: AuthPageProps) {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'forgot-password'>('login')
  const { login, register } = useAuth()

  const handleLoginSuccess = (user: any) => {
    onAuthSuccess()
  }

  const handleRegisterSuccess = () => {
    setCurrentView('login')
  }

  const switchToRegister = () => {
    setCurrentView('register')
  }

  const switchToLogin = () => {
    setCurrentView('login')
  }

  const switchToForgotPassword = () => {
    setCurrentView('forgot-password')
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container-modern section-spacing">
        {/* Desktop Two-Column Layout */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-16 lg:items-center lg:min-h-[600px]">
          {/* Left Column - Title and Description */}
          <div className="slide-up">
            <h1 className="text-hero mb-6">
              Student Portal
            </h1>
            <p className="text-body max-w-lg">
              Secure access to your exam results and academic information. 
              Sign in to your account or create a new one to get started.
            </p>
            
            {/* Features List */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">Access exam results instantly</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">Download PDF certificates</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span className="text-gray-700">Secure data protection</span>
              </div>
            </div>
          </div>

          {/* Right Column - Auth Forms */}
          <div className="fade-in">
            {/* Navigation Pills */}
            <div className="flex justify-center mb-8">
              <div className="bg-white/80 backdrop-blur-lg p-2 rounded-2xl shadow-lg border border-white/30">
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentView('login')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      currentView === 'login'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => setCurrentView('register')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      currentView === 'register'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                        : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    Sign Up
                  </button>
                </div>
              </div>
            </div>

            {/* Auth Form Container */}
            <div className="card-elevated">
              <div className="card-body">
                {currentView === 'login' && (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={switchToRegister}
                    onForgotPassword={switchToForgotPassword}
                  />
                )}
                
                {currentView === 'register' && (
                  <RegisterForm
                    onRegisterSuccess={handleRegisterSuccess}
                    onSwitchToLogin={switchToLogin}
                  />
                )}
                
                {currentView === 'forgot-password' && (
                  <ForgotPasswordForm
                    onBackToLogin={switchToLogin}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout (unchanged from original) */}
        <div className="lg:hidden">
          {/* Header */}
          <div className="text-center mb-12 slide-up">
            <h1 className="text-hero mb-6">
              Student Portal
            </h1>
            <p className="text-body max-w-2xl mx-auto px-4">
              Secure access to your exam results and academic information
            </p>
          </div>

          {/* Navigation Pills */}
          <div className="flex justify-center mb-12 fade-in">
            <div className="bg-white/80 backdrop-blur-lg p-2 rounded-2xl shadow-lg border border-white/30">
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentView('login')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentView === 'login'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setCurrentView('register')}
                  className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                    currentView === 'register'
                      ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>

          {/* Auth Form Container */}
          <div className={`mx-auto fade-in ${currentView === 'register' ? 'max-w-6xl' : 'max-w-md'}`}>
            <div className="card-elevated">
              <div className="card-body">
                {currentView === 'login' && (
                  <LoginForm
                    onLoginSuccess={handleLoginSuccess}
                    onSwitchToRegister={switchToRegister}
                    onForgotPassword={switchToForgotPassword}
                  />
                )}
                
                {currentView === 'register' && (
                  <RegisterForm
                    onRegisterSuccess={handleRegisterSuccess}
                    onSwitchToLogin={switchToLogin}
                  />
                )}
                
                {currentView === 'forgot-password' && (
                  <ForgotPasswordForm
                    onBackToLogin={switchToLogin}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
} 