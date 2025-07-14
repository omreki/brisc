'use client'

import { useState } from 'react'
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowRight } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormProps {
  onLoginSuccess: (user: any) => void
  onSwitchToRegister: () => void
  onForgotPassword: () => void
}

export default function LoginForm({ onLoginSuccess, onSwitchToRegister, onForgotPassword }: LoginFormProps) {
  const { login } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await login(formData.email, formData.password)
      
      if (result.success && result.user) {
        onLoginSuccess(result.user)
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-section-title mb-3">Welcome Back</h2>
        <p className="text-body">Sign in to access your student portal</p>
      </div>

      <form onSubmit={handleSubmit} className="element-spacing">
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="input-field"
            placeholder="Enter your email address"
          />
        </div>

        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input-field pr-12"
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
            />
            <span className="text-sm text-gray-600">Remember me</span>
          </label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mb-6"
        >
          {loading ? (
            <>
              <div className="loading-spinner" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Sign In
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="text-center">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Create Account
            </button>
          </p>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
            <Lock className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-semibold text-blue-900 text-sm">Secure Access</h4>
            <p className="text-blue-700 text-xs">Your data is protected with industry-standard encryption</p>
          </div>
        </div>
      </div>
    </div>
  )
} 