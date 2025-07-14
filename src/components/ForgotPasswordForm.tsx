'use client'

import { useState } from 'react'
import { Mail, ArrowLeft, Send, CheckCircle, AlertCircle, Shield, Clock } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ForgotPasswordFormProps {
  onBackToLogin: () => void
}

export default function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        setEmailSent(true)
        toast.success('Password reset instructions sent to your email!')
      } else {
        toast.error(data.message || 'Failed to send reset email')
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Reset instructions sent again!')
      } else {
        toast.error(data.message || 'Failed to resend email')
      }
    } catch (error) {
      toast.error('Failed to resend email')
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="fade-in">
        <div className="text-center mb-8">
          <h2 className="text-section-title mb-3">Check Your Email</h2>
          <p className="text-body">We've sent password reset instructions to your email</p>
        </div>

        {/* Success Message */}
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200 mb-8">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">Email Sent Successfully</h3>
              <p className="text-emerald-800 text-sm leading-relaxed mb-4">
                We've sent password reset instructions to <strong>{email}</strong>. 
                Click the link in the email to reset your password.
              </p>
              <div className="flex items-center gap-2 text-sm text-emerald-700">
                <Clock className="h-4 w-4" />
                <span>The reset link will expire in 1 hour</span>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 mb-8">
          <h3 className="font-semibold text-blue-900 mb-4">Next Steps</h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">1</span>
              </div>
              <p>Check your email inbox for a message from our system</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">2</span>
              </div>
              <p>Click the "Reset Password" link in the email</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-semibold text-blue-600">3</span>
              </div>
              <p>Create a new password and sign in to your account</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onBackToLogin}
            className="btn-primary flex-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </button>
          
          <button
            onClick={handleResendEmail}
            disabled={loading}
            className="btn-outline flex-1"
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                Resending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Resend Email
              </>
            )}
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            Didn't receive the email?
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Check your spam or junk folder</p>
            <p>• Make sure you entered the correct email address</p>
            <p>• Contact support if you continue having issues</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-section-title mb-3">Reset Your Password</h2>
        <p className="text-body">Enter your email address and we'll send you instructions to reset your password</p>
      </div>

      <form onSubmit={handleSubmit} className="element-spacing">
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field"
            placeholder="Enter your registered email address"
            disabled={loading}
          />
          <p className="form-help">
            We'll send password reset instructions to this email address
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <button
            type="button"
            onClick={onBackToLogin}
            className="btn-secondary flex-1"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </button>
          
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="btn-primary flex-1"
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Reset Instructions
              </>
            )}
          </button>
        </div>
      </form>

      {/* Security Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Security Notice</h4>
            <p className="text-gray-700 text-xs">
              For your security, reset links expire after 1 hour and can only be used once
            </p>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-3">Need Help?</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• Make sure you're using the email address you registered with</p>
          <p>• Check that your email address is spelled correctly</p>
          <p>• If you don't remember your email, contact support for assistance</p>
        </div>
        <div className="mt-4">
          <button className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors">
            Contact Support →
          </button>
        </div>
      </div>
    </div>
  )
} 