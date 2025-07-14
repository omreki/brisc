'use client'

import { useState } from 'react'
import { CreditCard, Loader2, ArrowLeft, Phone, CheckCircle, AlertCircle, Shield, Zap, DollarSign } from 'lucide-react'
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
  const [showManualVerification, setShowManualVerification] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)

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
    setShowManualVerification(false)
    setPaymentInitiated(false)
    
    try {
      const formattedPhone = formatPhoneNumber(phoneNumber.trim())
      
      const paymentData: PaymentData = {
        examNumber,
        amount: 15,
        currency: 'KES',
        phoneNumber: formattedPhone,
        email: email.trim() || undefined,
      }

      setPaymentProgress('Connecting to payment gateway...')
      
      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const result: PaymentResponse = await response.json()

      if (result.success && result.paymentId) {
        setPaymentProgress('Payment request sent to your phone...')
        setPaymentInitiated(true)
        setCurrentPaymentId(result.paymentId)
        
        toast.success('Payment request sent! Check your phone for M-Pesa prompt')
        
        // Start polling for payment status
        if (result.transactionId) {
          pollPaymentStatus(result.paymentId, result.transactionId)
        }
        
        // Show manual verification after some time
        setTimeout(() => {
          if (isPolling) {
            setShowManualVerification(true)
          }
        }, 30000) // 30 seconds
        
      } else {
        throw new Error(result.message || 'Payment initiation failed')
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error instanceof Error ? error.message : 'Payment failed. Please try again.')
      setPaymentProgress('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualConfirmation = (confirmed: boolean) => {
    setIsPolling(false)
    setShowManualVerification(false)
    
    if (confirmed) {
      toast.success('Payment confirmed! Processing your results...')
      const paymentInfo = currentPaymentId && email 
        ? { paymentId: currentPaymentId, userEmail: email }
        : undefined
      onPaymentSuccess(paymentInfo)
    } else {
      setPaymentProgress('')
      setPaymentInitiated(false)
      toast.error('Payment cancelled. Please try again if you completed the payment.')
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
          setShowManualVerification(true)
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
          }),
        })
        
        const result = await response.json()
        
        if (result.success) {
          // Update payment progress based on status
          if (result.status === 'completed' && result.verified) {
            setIsPolling(false)
            setPaymentProgress('Payment verified! Loading your results...')
            toast.success('Payment successful! 🎉')
            
            const paymentInfo = email 
              ? { paymentId, userEmail: email }
              : undefined
            
            setTimeout(() => {
              onPaymentSuccess(paymentInfo)
            }, 1500)
            return
          } else if (result.status === 'failed') {
            setIsPolling(false)
            setPaymentProgress('')
            setPaymentInitiated(false)
            toast.error(`Payment failed: ${result.message}`)
            return
          } else if (result.status === 'cancelled') {
            setIsPolling(false)
            setPaymentProgress('')
            setPaymentInitiated(false)
            toast.error('Payment was cancelled')
            return
          } else if (result.status === 'pending') {
            // Update progress message for pending payments
            setPaymentProgress('Payment is being processed...')
          }
        }
        
        // Continue polling if payment not yet completed
        setTimeout(poll, 5000) // Poll every 5 seconds
        
      } catch (error) {
        console.error('Payment status check error:', error)
        setTimeout(poll, 5000) // Continue polling even on error
      }
    }
    
    // Start polling after initial delay
    setTimeout(poll, 5000)
  }

  const formatPhoneNumber = (value: string) => {
    // Remove any spaces, dashes, or other characters
    let cleaned = value.replace(/\D/g, '')
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.substring(1)}`
    } else if (cleaned.length === 9) {
      return `+254${cleaned}`
    }
    
    return `+254${cleaned}`
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-section-title mb-3">Secure Payment</h2>
        <p className="text-body">Complete your payment to access exam results</p>
      </div>

      {/* Payment Summary */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-blue-900">Payment Summary</h3>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-600">Secure</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Exam Number:</span>
            <span className="font-semibold text-blue-900">#{examNumber}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-blue-800">Student Name:</span>
            <span className="font-semibold text-blue-900">{studentData.name}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-blue-200">
            <span className="text-blue-800">Amount:</span>
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-emerald-600" />
              <span className="text-2xl font-bold text-emerald-600">KES 15</span>
            </div>
          </div>
        </div>
      </div>

      {!paymentInitiated ? (
        <form onSubmit={handleSubmit} className="element-spacing">
          <div className="form-group">
            <label className="form-label flex items-center gap-2">
              <Phone className="h-4 w-4" />
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="0712345678 or +254712345678"
              className="input-field text-center text-lg font-semibold"
              required
              disabled={isLoading}
            />
            <p className="form-help">
              Enter the phone number registered with M-Pesa
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">
              Email Address (Optional)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              className="input-field"
              disabled={isLoading}
            />
            <p className="form-help">
              We'll send a receipt and results notification to this email
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              type="button"
              onClick={onBack}
              disabled={isLoading}
              className="btn-secondary flex-1"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading || !phoneNumber.trim()}
              className="btn-primary flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" />
                  Pay KES 15
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        <div className="element-spacing">
          {/* Payment Progress */}
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
                {isPolling ? (
                  <Loader2 className="h-6 w-6 text-emerald-600 animate-spin" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-emerald-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-emerald-900">{paymentProgress}</h3>
                <p className="text-emerald-700 text-sm">
                  {isPolling ? 'Waiting for payment confirmation...' : 'Payment processing initiated'}
                </p>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Next Steps
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">1</span>
                </div>
                <p>Check your phone for the M-Pesa payment prompt</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">2</span>
                </div>
                <p>Enter your M-Pesa PIN to complete the payment</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-semibold text-blue-600">3</span>
                </div>
                <p>Wait for automatic verification or use manual confirmation below</p>
              </div>
            </div>
          </div>

          {/* Manual Verification */}
          {showManualVerification && (
            <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Manual Verification</h3>
                  <p className="text-orange-800 text-sm leading-relaxed">
                    If you've completed the M-Pesa payment but it's taking longer to verify automatically, 
                    you can confirm manually below.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleManualConfirmation(true)}
                  className="btn-success flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Yes, I completed payment
                </button>
                <button
                  onClick={() => handleManualConfirmation(false)}
                  className="btn-secondary flex-1"
                >
                  <ArrowLeft className="h-4 w-4" />
                  No, go back
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-gray-600" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 text-sm">Secure Payment</h4>
            <p className="text-gray-700 text-xs">All payments are processed securely through M-Pesa</p>
          </div>
        </div>
      </div>
    </div>
  )
} 