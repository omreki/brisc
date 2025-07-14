'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Lock, Shield, CheckCircle, AlertCircle, ArrowLeft, Key } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function ResetPasswordPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isValid, setIsValid] = useState(false)
  const [isExpired, setIsExpired] = useState(false)
  const [isValidating, setIsValidating] = useState(true)
  const [resetSuccess, setResetSuccess] = useState(false)

  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setIsValid(false)
      setIsValidating(false)
      return
    }

    // Validate the reset token
    const validateToken = async () => {
      try {
        const response = await fetch('/api/auth/reset-password', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        })

        const data = await response.json()

        if (data.success) {
          setIsValid(true)
        } else if (data.expired) {
          setIsExpired(true)
        } else {
          setIsValid(false)
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setIsValid(false)
      } finally {
        setIsValidating(false)
      }
    }

    validateToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ password }),
      })

      const data = await response.json()

      if (data.success) {
        setResetSuccess(true)
        toast.success('Password reset successfully!')
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/')
        }, 3000)
      } else {
        toast.error(data.message || 'Failed to reset password')
      }
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Validating token state
  if (isValidating) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="container-modern section-spacing">
          <div className="text-center slide-up">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <Key className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <div className="loading-spinner mx-auto mb-6 w-8 h-8 border-blue-600"></div>
            
            <h1 className="text-section-title mb-4">Validating Reset Link</h1>
            <p className="text-body max-w-md mx-auto">
              Please wait while we verify your password reset link
            </p>
          </div>
        </div>
      </main>
    )
  }

  // Success state
  if (resetSuccess) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container-modern section-spacing">
          <div className="text-center fade-in">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <CheckCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-hero mb-6">Password Reset Successful!</h1>
            <p className="text-body max-w-md mx-auto mb-8">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>

            <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-emerald-900 mb-2">What's Next?</h3>
              <p className="text-emerald-800 text-sm">
                You'll be automatically redirected to the sign-in page in a few seconds, or you can click the button below.
              </p>
            </div>

            <Link href="/" className="btn-primary">
              <ArrowLeft className="h-4 w-4" />
              Go to Sign In
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // Invalid or expired token
  if (!isValid || isExpired) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container-modern section-spacing">
          <div className="text-center fade-in">
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl flex items-center justify-center shadow-2xl">
                <AlertCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            
            <h1 className="text-section-title mb-4">
              {isExpired ? 'Reset Link Expired' : 'Invalid Reset Link'}
            </h1>
            <p className="text-body max-w-md mx-auto mb-8">
              {isExpired 
                ? 'This password reset link has expired. Please request a new one to reset your password.'
                : 'This password reset link is invalid or has already been used. Please request a new one.'
              }
            </p>

            <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200 mb-8 max-w-md mx-auto">
              <h3 className="font-semibold text-orange-900 mb-3">Need a new reset link?</h3>
              <div className="text-sm text-orange-800 space-y-2">
                <p>• Go back to the sign-in page</p>
                <p>• Click "Forgot Password"</p>
                <p>• Enter your email address</p>
                <p>• Check your email for a new reset link</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Link href="/" className="btn-primary flex-1">
                <ArrowLeft className="h-4 w-4" />
                Back to Sign In
              </Link>
              <Link href="/test-email" className="btn-outline flex-1">
                System Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Valid token - show reset form
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container-modern section-spacing">
        <div className="text-center mb-12 fade-in">
          <div className="flex justify-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Lock className="h-10 w-10 text-white" />
            </div>
          </div>
          <h1 className="text-hero mb-6">Reset Your Password</h1>
          <p className="text-body max-w-2xl mx-auto">
            Create a new, strong password for your account. Make sure it's something you can remember but others can't guess.
          </p>
        </div>

        <div className="max-w-md mx-auto">
          <div className="card-elevated fade-in">
            <div className="card-body">
              <form onSubmit={handleSubmit} className="element-spacing">
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={8}
                      className="input-field pr-12"
                      placeholder="Enter your new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="form-help">
                    Minimum 8 characters with a mix of letters, numbers, and symbols
                  </p>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="input-field pr-12"
                      placeholder="Confirm your new password"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Passwords do not match
                    </p>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Passwords match
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || password !== confirmPassword || password.length < 8}
                  className="btn-success w-full"
                >
                  {loading ? (
                    <>
                      <div className="loading-spinner" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Security Notice */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Shield className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-blue-900">Security Tips</h3>
            </div>
            <div className="text-sm text-blue-800 space-y-2">
              <p>• Use a unique password that you don't use elsewhere</p>
              <p>• Include a mix of uppercase, lowercase, numbers, and symbols</p>
              <p>• Avoid using personal information like birthdays or names</p>
              <p>• Consider using a password manager for better security</p>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="text-blue-600 hover:text-blue-700 font-medium transition-colors text-sm"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
} 