'use client'

import { useState } from 'react'
import { Search, Loader2, CheckCircle, AlertCircle, ArrowLeft, RefreshCw, DollarSign, CreditCard } from 'lucide-react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

export default function VerifyPaymentPage() {
  const router = useRouter()
  const [examNumber, setExamNumber] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!examNumber.trim()) {
      toast.error('Please enter your exam number')
      return
    }

    setIsVerifying(true)
    setVerificationResult(null)
    
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examNumber: examNumber.trim(),
          forceRefresh: true,
        }),
      })
      
      const result = await response.json()
      setVerificationResult(result)
      
      if (result.success && result.isValid) {
        toast.success('Payment verified successfully! 🎉')
        
        // Redirect to main page where they can access results
        setTimeout(() => {
          router.push('/')
        }, 2000)
      } else {
        toast.error(result.message || 'No valid payment found for this exam number')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Error during verification. Please try again.')
      setVerificationResult({
        success: false,
        message: 'Network error occurred. Please try again.'
      })
    } finally {
      setIsVerifying(false)
    }
  }

  const handleBackToHome = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <button
              onClick={handleBackToHome}
              className="btn-secondary mb-6 inline-flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </button>
            
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">Verify Your Payment</h1>
            <p className="text-lg text-gray-600">
              Check if your payment has been processed and access your exam results
            </p>
          </div>

          {/* Verification Form */}
          <div className="card-elevated">
            <div className="card-body">
              <form onSubmit={handleVerification} className="space-y-6">
                <div className="form-group">
                  <label className="form-label flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    Exam Number
                  </label>
                  <input
                    type="text"
                    value={examNumber}
                    onChange={(e) => setExamNumber(e.target.value)}
                    placeholder="Enter your exam number (e.g., 2024001)"
                    className="input-field text-center text-lg font-semibold"
                    disabled={isVerifying}
                    required
                  />
                  <p className="form-help">
                    Enter the exam number you made payment for
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isVerifying || !examNumber.trim()}
                  className="btn-primary w-full py-3"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Verifying Payment...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-5 w-5" />
                      Verify Payment Status
                    </>
                  )}
                </button>
              </form>

              {/* Verification Result */}
              {verificationResult && (
                <div className="mt-6">
                  {verificationResult.success && verificationResult.isValid ? (
                    <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <CheckCircle className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-green-900 mb-2">Payment Verified Successfully! 🎉</h3>
                          <p className="text-green-800 text-sm mb-4">{verificationResult.message}</p>
                          
                          {verificationResult.paymentRecord && (
                            <div className="bg-white/50 rounded-lg p-4 space-y-2">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-green-700">Payment ID:</span>
                                <span className="text-sm font-mono text-green-900">{verificationResult.paymentRecord.paymentId}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-green-700">Amount:</span>
                                <span className="text-sm font-semibold text-green-900">
                                  {verificationResult.paymentRecord.currency} {verificationResult.paymentRecord.amount}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-green-700">Status:</span>
                                <span className="text-sm font-semibold text-green-900 capitalize">
                                  {verificationResult.paymentRecord.status}
                                </span>
                              </div>
                            </div>
                          )}
                          
                          <p className="text-green-700 text-xs mt-4">
                            Redirecting you to access your exam results...
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl border border-red-200">
                      <div className="flex items-start space-x-4">
                        <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-red-900 mb-2">Payment Not Found</h3>
                          <p className="text-red-800 text-sm mb-4">{verificationResult.message}</p>
                          
                          <div className="space-y-2 text-sm text-red-700">
                            <p>• Double-check your exam number</p>
                            <p>• Ensure you've completed the M-Pesa payment</p>
                            <p>• Wait a few minutes and try again if you just made the payment</p>
                            <p>• Contact support if you believe this is an error</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              How Payment Verification Works
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <p>Enter the exam number you made payment for</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <p>We'll check our records and contact the payment provider</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <p>If payment is found, you'll be redirected to access your results</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">4</span>
                </div>
                <p>If not found, you can make a new payment or contact support</p>
              </div>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Payment Details</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p>• <strong>Amount:</strong> KES 15 per exam result</p>
                  <p>• <strong>Payment Method:</strong> M-Pesa only</p>
                  <p>• <strong>Processing Time:</strong> Usually instant, up to 5 minutes</p>
                  <p>• <strong>Receipt:</strong> Sent via SMS from M-Pesa</p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Support */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Need help with payment verification?{' '}
              <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
                Contact Support
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
} 