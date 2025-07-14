'use client'

import { useState } from 'react'
import { CreditCard, Loader2, ArrowLeft, Phone, CheckCircle, AlertCircle, Shield, Zap, DollarSign, Search, RefreshCw } from 'lucide-react'
import { StudentResult, PaymentData, PaymentResponse } from '@/types/student'
import toast from 'react-hot-toast'

interface PaymentFormProps {
  studentData: StudentResult
  examNumber: string
  onPaymentSuccess: (paymentInfo?: {paymentId: string; userEmail: string}) => void
  onBack: () => void
}

export default function PaymentForm({ 
  studentData, 
  examNumber, 
  onPaymentSuccess, 
  onBack 
}: PaymentFormProps) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentProgress, setPaymentProgress] = useState('')
  const [showProviderVerification, setShowProviderVerification] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [isProviderVerifying, setIsProviderVerifying] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!phoneNumber.trim()) {
      toast.error('Please enter your phone number')
      return
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^(?:\+254|254|0)?[17]\d{8}$/
    if (!phoneRegex.test(phoneNumber.trim())) {
      toast.error('Please enter a valid Kenyan phone number')
      return
    }

    setIsLoading(true)
    setPaymentProgress('Initiating payment...')
    setShowProviderVerification(false)
    setPaymentInitiated(false)
    
    try {
      const paymentData: PaymentData = {
        examNumber,
        amount: 15,
        currency: 'KES',
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
      }

      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const result: PaymentResponse = await response.json()
      
      if (result.success && result.paymentId) {
        setCurrentPaymentId(result.paymentId)
        setPaymentInitiated(true)
        setPaymentProgress('Payment initiated! Please check your phone for M-Pesa prompt...')
        
        toast.success('Payment request sent to your phone!')
        
        // Start polling for payment status
        await pollPaymentStatus(result.paymentId, result.transactionId || '')
      } else {
        toast.error(result.message || 'Failed to initiate payment')
        setPaymentProgress('')
        setIsLoading(false)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Network error. Please check your connection and try again.')
      setPaymentProgress('')
      setIsLoading(false)
    }
  }

  const handleProviderVerification = async () => {
    if (!examNumber) {
      toast.error('No exam number available for verification')
      return
    }

    setIsProviderVerifying(true)
    setPaymentProgress('Checking payment records...')
    
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examNumber,
          checkPaymentsSheetOnly: true, // Use simple payments sheet check
        }),
      })
      
      const result = await response.json()
      
      if (result.success && result.isValid && result.hasValidPayment) {
        setPaymentProgress('Valid payment found! Loading your results...')
        toast.success('Payment verified successfully! 🎉')
        
        const paymentInfo = result.paymentRecord?.paymentId && email 
          ? { paymentId: result.paymentRecord.paymentId, userEmail: email }
          : undefined
        
        setTimeout(async () => {
          setPaymentProgress('Fetching your exam results...')
          await onPaymentSuccess(paymentInfo)
        }, 1000)
      } else {
        // Show clear verification result
        const message = result.message || 'No valid payment found for this exam number'
        toast.error(`Verification failed: ${message}`)
        setPaymentProgress(`Verification Result: ${message}`)
        
        // Show verification status for a few seconds, then hide
        setTimeout(() => {
          setPaymentProgress('')
        }, 5000)
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      toast.error('Error checking payment records. Please try again.')
      setPaymentProgress('Verification failed - please try again')
      
      setTimeout(() => {
        setPaymentProgress('')
      }, 3000)
    } finally {
      setIsProviderVerifying(false)
    }
  }

  const pollPaymentStatus = async (paymentId: string, transactionId: string) => {
    setIsPolling(true)
    let attempts = 0
    const maxAttempts = 24 // 2 minutes of polling (5-second intervals)
    
    const poll = async (): Promise<void> => {
      if (!isPolling || attempts >= maxAttempts) {
        setIsPolling(false)
        if (attempts >= maxAttempts) {
          setShowProviderVerification(true)
          setPaymentProgress('Auto-verification timed out. Please verify manually with provider.')
        }
        return
      }
      
      attempts++
      
      try {
        const response = await fetch('/api/payment-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId,
            examNumber,
            forceCheck: attempts > 8, // Force check after 40 seconds
          }),
        })
        
        const result = await response.json()
        
        if (result.success) {
          if (result.status === 'completed' && result.verified) {
            setIsPolling(false)
            setPaymentProgress('Payment verified! Loading your results...')
            toast.success('Payment successful! 🎉')
            
            const paymentInfo = email 
              ? { paymentId, userEmail: email }
              : undefined
            
            setTimeout(async () => {
              setPaymentProgress('Fetching your exam results...')
              await onPaymentSuccess(paymentInfo)
            }, 1000)
            return
          } else if (result.status === 'failed') {
            setIsPolling(false)
            setPaymentProgress('Payment failed. Please try again.')
            toast.error('Payment was not successful. Please try again.')
            setIsLoading(false)
            return
          } else if (result.status === 'cancelled') {
            setIsPolling(false)
            setPaymentProgress('Payment was cancelled.')
            toast.error('Payment was cancelled.')
            setIsLoading(false)
            return
          }
          
          // Update progress for pending status
          if (attempts <= 8) {
            setPaymentProgress('Waiting for M-Pesa confirmation...')
          } else {
            setPaymentProgress('Still processing... Please complete M-Pesa payment on your phone.')
          }
        }
        
        // Continue polling
        setTimeout(poll, 5000)
      } catch (error) {
        console.error('Polling error:', error)
        setTimeout(poll, 5000)
      }
    }
    
    // Start polling
    setTimeout(poll, 5000)
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Payment Required</h2>
          <p className="text-gray-600">
            Pay <span className="font-semibold text-green-600">KES 15</span> to access your exam results
          </p>
        </div>

        {/* Student Info */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3">Exam Details</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Student Name:</span>
              <span className="font-medium text-blue-900">{studentData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Exam Number:</span>
              <span className="font-medium text-blue-900">{examNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Payment Amount:</span>
              <span className="font-medium text-green-600">KES 15</span>
            </div>
          </div>
        </div>

      {!paymentInitiated ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline h-4 w-4 mr-1" />
              M-Pesa Phone Number *
            </label>
            <input
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 0712345678"
              className="input-field"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Enter your M-Pesa registered phone number
            </p>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address (Optional)
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="input-field"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500 mt-1">
              Receive payment receipt and results via email
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phoneNumber.trim()}
            className="btn-success w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <DollarSign className="h-5 w-5" />
                Pay KES 15 via M-Pesa
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            disabled={isLoading}
            className="btn-secondary w-full"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Search
          </button>
        </form>
      ) : (
        <div className="element-spacing">
          {/* Payment Progress */}
          <div className="text-center mb-6">
            <div className="loading-spinner mx-auto mb-4"></div>
            <h3 className="font-semibold text-gray-900 mb-2">
              {paymentProgress || 'Processing payment...'}
            </h3>
            <p className="text-sm text-gray-600">
              Please wait while we verify your payment
            </p>
          </div>

          {/* Payment Verification Section - Always visible after payment initiation */}
          <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200 mb-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Check for Valid Payment</h3>
                <p className="text-green-800 text-sm leading-relaxed mb-3">
                  If you've completed the M-Pesa payment, click below to check our payment records for your exam number.
                </p>
              </div>
            </div>
            <button
              onClick={handleProviderVerification}
              disabled={isProviderVerifying || isLoading}
              className="btn-success w-full"
            >
              {isProviderVerifying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Checking Payment Records...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4" />
                  Check for Valid Payment
                </>
              )}
            </button>
          </div>

          {/* Show manual verification message after polling timeout */}
          {showProviderVerification && (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl border border-blue-200">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-2">Manual Verification Available</h3>
                  <p className="text-blue-800 text-sm leading-relaxed">
                    Automatic verification timed out. Please use the "Verify Payment with Provider" button above to check your payment status directly with IntaSend.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border border-gray-200">
        <div className="flex items-start space-x-3">
          <Shield className="h-5 w-5 text-gray-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Secure Payment</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Your payment is processed securely through IntaSend</li>
              <li>• We never store your M-Pesa PIN or sensitive payment information</li>
              <li>• All transactions are encrypted and monitored for security</li>
              <li>• You'll receive a payment confirmation via SMS from M-Pesa</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl border border-green-200">
        <h4 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Payment Instructions
        </h4>
        <div className="space-y-3 text-sm text-green-800">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-green-600">1</span>
            </div>
            <p>You'll receive an M-Pesa payment prompt on your phone</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-green-600">2</span>
            </div>
            <p>Enter your M-Pesa PIN to complete the payment</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-green-600">3</span>
            </div>
            <p>Your exam results will be available immediately after payment confirmation</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-green-600">4</span>
            </div>
            <p>Use "Verify Payment with Provider" button for direct payment verification</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
} 