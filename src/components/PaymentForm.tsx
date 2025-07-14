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
  const [showManualVerification, setShowManualVerification] = useState(false)
  const [isPolling, setIsPolling] = useState(false)
  const [paymentInitiated, setPaymentInitiated] = useState(false)
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null)
  const [isManualVerifying, setIsManualVerifying] = useState(false)

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
        
        // Show manual verification option immediately after payment initiation
        setTimeout(() => {
          setShowManualVerification(true)
        }, 10000) // Show after 10 seconds instead of 30
        
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

  const handleManualConfirmation = async (confirmed: boolean) => {
    setIsPolling(false)
    setShowManualVerification(false)
    
    if (confirmed) {
      setIsLoading(true)
      toast.success('Payment confirmed! Processing your results...')
      setPaymentProgress('Fetching your exam results...')
      
      const paymentInfo = currentPaymentId && email 
        ? { paymentId: currentPaymentId, userEmail: email }
        : undefined
      
      try {
        await onPaymentSuccess(paymentInfo)
      } catch (error) {
        console.error('Error during manual confirmation:', error)
        toast.error('Error loading results. Please try again.')
        setPaymentProgress('')
        setIsLoading(false)
      }
    } else {
      setPaymentProgress('')
      setPaymentInitiated(false)
      toast.error('Payment cancelled. Please try again if you completed the payment.')
    }
  }

  const handleForceVerification = async () => {
    if (!currentPaymentId) {
      toast.error('No payment ID available for verification')
      return
    }

    setIsManualVerifying(true)
    setPaymentProgress('Verifying payment with provider...')
    
    try {
      const response = await fetch('/api/manual-verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: currentPaymentId,
          examNumber,
        }),
      })
      
      const result = await response.json()
      
      if (result.success) {
        if (result.status === 'completed' && result.verified) {
          setPaymentProgress('Payment verified! Loading your results...')
          toast.success('Payment found and verified! 🎉')
          
          const paymentInfo = email 
            ? { paymentId: currentPaymentId, userEmail: email }
            : undefined
          
          setTimeout(async () => {
            setPaymentProgress('Fetching your exam results...')
            await onPaymentSuccess(paymentInfo)
          }, 1000)
        } else if (result.status === 'failed') {
          setPaymentProgress('')
          setPaymentInitiated(false)
          toast.error(`Payment verification failed: ${result.message}`)
        } else if (result.status === 'pending') {
          toast('Payment is still being processed. Please wait a moment.')
          setPaymentProgress('Payment still pending after verification...')
          // Restart polling
          if (currentPaymentId) {
            pollPaymentStatus(currentPaymentId, '')
          }
        } else {
          toast.error(`Payment status: ${result.status}`)
          setPaymentProgress(`Status: ${result.status}`)
        }
      } else {
        toast.error(result.message || 'Verification failed. Please try again.')
        setPaymentProgress('Verification failed')
      }
    } catch (error) {
      console.error('Force verification error:', error)
      toast.error('Error during verification. Please try again.')
      setPaymentProgress('Verification error')
    } finally {
      setIsManualVerifying(false)
    }
  }

  // New standalone verification function that works independently
  const handleStandaloneVerification = async () => {
    if (!examNumber) {
      toast.error('No exam number available for verification')
      return
    }

    setIsManualVerifying(true)
    setPaymentProgress('Checking for any completed payments...')
    
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examNumber,
          forceRefresh: true,
        }),
      })
      
      const result = await response.json()
      
      if (result.success && result.isValid) {
        setPaymentProgress('Payment found! Loading your results...')
        toast.success('Payment verified successfully! 🎉')
        
        const paymentInfo = result.paymentRecord?.paymentId && email 
          ? { paymentId: result.paymentRecord.paymentId, userEmail: email }
          : undefined
        
        setTimeout(async () => {
          setPaymentProgress('Fetching your exam results...')
          await onPaymentSuccess(paymentInfo)
        }, 1000)
      } else {
        toast.error(result.message || 'No valid payment found for this exam number')
        setPaymentProgress('')
      }
    } catch (error) {
      console.error('Standalone verification error:', error)
      toast.error('Error during verification. Please try again.')
      setPaymentProgress('')
    } finally {
      setIsManualVerifying(false)
    }
  }

  const pollPaymentStatus = async (paymentId: string, transactionId: string) => {
    setIsPolling(true)
    let attempts = 0
    const maxAttempts = 36 // 3 minutes of polling (5-second intervals)
    let forceCheckUsed = false
    
    const poll = async (): Promise<void> => {
      if (!isPolling || attempts >= maxAttempts) {
        setIsPolling(false)
        if (attempts >= maxAttempts) {
          setShowManualVerification(true)
          setPaymentProgress('Taking longer than expected. You can verify manually below.')
        }
        return
      }
      
      attempts++
      
      // After 1 minute (12 attempts), start force checking with IntaSend
      const shouldForceCheck = attempts > 12 && !forceCheckUsed
      if (shouldForceCheck) {
        forceCheckUsed = true
        setPaymentProgress('Verifying with payment provider...')
      }
      
      try {
        const response = await fetch('/api/payment-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentId,
            examNumber,
            forceCheck: shouldForceCheck,
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
            
            // Redirect to results immediately
            setTimeout(async () => {
              setPaymentProgress('Fetching your exam results...')
              await onPaymentSuccess(paymentInfo)
            }, 1000)
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
            // Update progress message based on attempts
            if (attempts <= 6) {
              setPaymentProgress('Waiting for M-Pesa confirmation...')
            } else if (attempts <= 12) {
              setPaymentProgress('Payment is being processed...')
            } else if (attempts <= 24) {
              setPaymentProgress('Verifying payment status...')
            } else {
              setPaymentProgress('Final verification in progress...')
            }
          }
          
          // Show helpful messages to user
          if (result.checkedWithProvider && result.status === 'pending') {
            setPaymentProgress('Double-checked with payment provider. Still processing...')
          }
        }
        
        // Continue polling if payment not yet completed
        const nextPollDelay = attempts > 24 ? 8000 : 5000 // Slow down polling after 2 minutes
        setTimeout(poll, nextPollDelay)
        
      } catch (error) {
        console.error('Payment status check error:', error)
        // Update user about the error but continue polling
        setPaymentProgress('Connection issue, retrying...')
        setTimeout(poll, 7000) // Wait a bit longer on error
      }
    }
    
    // Start polling after initial delay
    setTimeout(poll, 3000) // Start checking after 3 seconds
  }

  const formatPhoneNumber = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    
    if (cleaned.startsWith('254')) {
      return `+${cleaned}`
    } else if (cleaned.startsWith('0')) {
      return `+254${cleaned.slice(1)}`
    } else if (cleaned.length === 9) {
      return `+254${cleaned}`
    }
    
    return `+254${cleaned}`
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-section-title mb-3">Secure Payment</h2>
        <p className="text-body mb-4">Complete payment to access your exam results</p>
        
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-4 border border-emerald-200">
          <div className="flex items-center justify-center space-x-4">
            <div className="text-center">
              <p className="text-sm text-emerald-700 font-medium">Exam Number</p>
              <p className="text-lg font-bold text-emerald-900">{examNumber}</p>
            </div>
            <div className="w-px h-12 bg-emerald-300"></div>
            <div className="text-center">
              <p className="text-sm text-emerald-700 font-medium">Amount</p>
              <p className="text-lg font-bold text-emerald-900">KES 15</p>
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
              placeholder="07XXXXXXXX or +254XXXXXXXXX"
              className="input-field text-center"
              disabled={isLoading}
              required
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
              Receive payment receipt and results via email
            </p>
          </div>

          <button
            type="submit"
            disabled={isLoading || !phoneNumber.trim()}
            className="btn-primary w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="h-5 w-5" />
                Pay KES 15 via M-Pesa
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onBack}
            className="btn-secondary w-full"
            disabled={isLoading}
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

          {/* Always visible manual verification section after payment is initiated */}
          <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 mb-6">
            <div className="flex items-start space-x-4 mb-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Search className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Payment Verification</h3>
                <p className="text-blue-800 text-sm leading-relaxed mb-3">
                  If you've completed the M-Pesa payment, you can manually verify it here. This will check directly with the payment provider.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {currentPaymentId ? (
                <button
                  onClick={handleForceVerification}
                  disabled={isManualVerifying || isLoading}
                  className="btn-primary w-full"
                >
                  {isManualVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Verifying Payment...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Verify My Payment Now
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleStandaloneVerification}
                  disabled={isManualVerifying || isLoading}
                  className="btn-primary w-full"
                >
                  {isManualVerifying ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Checking Payments...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4" />
                      Check for Any Completed Payments
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Enhanced manual verification section (shown after polling timeout) */}
          {showManualVerification && (
            <div className="p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900 mb-2">Payment Taking Longer Than Expected</h3>
                  <p className="text-orange-800 text-sm leading-relaxed">
                    If you've completed the M-Pesa payment, you can verify it manually or confirm that you made the payment.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => handleManualConfirmation(true)}
                  disabled={isLoading || isManualVerifying}
                  className="btn-success flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Yes, I completed payment
                </button>
                <button
                  onClick={() => handleManualConfirmation(false)}
                  disabled={isLoading || isManualVerifying}
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
            <p>If verification takes too long, use the manual verification button above</p>
          </div>
        </div>
      </div>
    </div>
  )
} 