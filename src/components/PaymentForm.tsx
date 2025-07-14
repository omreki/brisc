'use client'

import { useState } from 'react'
import { CreditCard, Loader2, ArrowLeft, Phone, CheckCircle, AlertCircle } from 'lucide-react'
import { StudentResult, PaymentData, PaymentResponse } from '@/types/student'
import toast from 'react-hot-toast'

interface PaymentFormProps {
  studentData: StudentResult
  examNumber: string
  onPaymentSuccess: () => void
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
      const paymentData: PaymentData = {
        examNumber,
        amount: 150,
        currency: 'KES',
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined
      }

      const response = await fetch('/api/process-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      })

      const data: PaymentResponse = await response.json()

      if (data.success) {
        toast.success('Payment initiated! Check your phone for M-Pesa prompt.')
        setPaymentProgress('Payment initiated. Check your phone for M-Pesa prompt...')
        setPaymentInitiated(true)
        
        // Start polling and show manual verification after 10 seconds
        setIsPolling(true)
        setTimeout(() => {
          if (isPolling) {
            setShowManualVerification(true)
            setPaymentProgress('Waiting for payment confirmation...')
          }
        }, 10000)
        
        // Improved polling with exponential backoff
        await pollPaymentStatus(data.paymentId!, data.transactionId!)
        
      } else {
        toast.error(data.message || 'Payment failed. Please try again.')
        setPaymentProgress('')
      }
    } catch (error) {
      console.error('Error processing payment:', error)
      toast.error('An error occurred while processing payment')
      setPaymentProgress('')
    } finally {
      setIsLoading(false)
    }
  }

  const handleManualConfirmation = (confirmed: boolean) => {
    setIsPolling(false)
    setShowManualVerification(false)
    setPaymentInitiated(false)
    
    if (confirmed) {
      toast.success('Payment confirmed manually. Loading results...')
      setPaymentProgress('Payment confirmed! Loading results...')
      onPaymentSuccess()
    } else {
      toast.error('Payment cancelled. Please try again.')
      setPaymentProgress('')
    }
  }

  const pollPaymentStatus = async (paymentId: string, transactionId: string) => {
    let pollAttempts = 0
    const maxAttempts = 30
    let backoffDelay = 2000 // Start with 2 seconds
    
    const poll = async (): Promise<void> => {
      if (!isPolling) return // Stop polling if manual verification was used
      
      try {
        pollAttempts++
        
        const statusResponse = await fetch('/api/payment-status', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            paymentId,
            transactionId 
          }),
        })

        const statusData = await statusResponse.json()

        if (statusData.success) {
          // Check if we got data from webhook (faster) or API
          const dataSource = statusData.source || 'api'
          
          if (statusData.status === 'completed') {
            setIsPolling(false)
            setShowManualVerification(false)
            setPaymentInitiated(false)
            toast.success(`Payment confirmed! (via ${dataSource})`)
            setPaymentProgress('Payment confirmed! Loading results...')
            onPaymentSuccess()
            return
          } else if (statusData.status === 'failed') {
            setIsPolling(false)
            setShowManualVerification(false)
            setPaymentInitiated(false)
            toast.error('Payment failed. Please try again.')
            setPaymentProgress('')
            return
          }
        }
        
        // Continue polling if not completed or failed
        if (pollAttempts >= maxAttempts) {
          setIsPolling(false)
          setShowManualVerification(true)
          setPaymentInitiated(false)
          setPaymentProgress('Payment verification timeout. Please confirm manually.')
          return
        }
        
        // Update progress for user (only if manual verification isn't shown)
        if (!showManualVerification) {
          if (pollAttempts <= 5) {
            setPaymentProgress(`Waiting for M-Pesa payment... (${pollAttempts}/5)`)
          } else if (pollAttempts <= 15) {
            setPaymentProgress(`Verifying payment... (${pollAttempts}/15)`)
          } else {
            setPaymentProgress(`Still checking... (${pollAttempts}/${maxAttempts})`)
          }
        }
        
        // Show toast updates less frequently
        if (pollAttempts % 10 === 0) {
          toast.loading(`Still verifying payment... (${pollAttempts}/${maxAttempts})`, {
            duration: 3000
          })
        }
        
        // Schedule next poll with exponential backoff
        setTimeout(poll, backoffDelay)
        
        // Increase backoff delay, but cap at 10 seconds
        backoffDelay = Math.min(backoffDelay * 1.2, 10000)
        
      } catch (error) {
        console.error('Error checking payment status:', error)
        
        if (pollAttempts >= maxAttempts) {
          setIsPolling(false)
          setShowManualVerification(true)
          setPaymentProgress('Payment verification failed. Please confirm manually.')
        } else {
          // Continue polling on error with longer delay
          setTimeout(poll, backoffDelay * 2)
        }
      }
    }

    // Start polling after 3 seconds (give time for payment to process)
    setTimeout(poll, 3000)
  }

  const formatPhoneNumber = (value: string) => {
    // Remove any non-digit characters
    let cleaned = value.replace(/\D/g, '')
    
    // Handle different formats
    if (cleaned.startsWith('254')) {
      cleaned = cleaned.slice(3)
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1)
    }
    
    // Format as 07XXXXXXXX
    if (cleaned.length > 0) {
      cleaned = '0' + cleaned
    }
    
    return cleaned
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Required
        </h2>
        <p className="text-gray-600">
          Complete payment to access your results
        </p>
      </div>

      {/* Student Info */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="font-medium text-gray-800 mb-2">Student Information</h3>
        <div className="space-y-1 text-sm">
          <p><span className="font-medium">Name:</span> {studentData.name}</p>
          <p><span className="font-medium">Exam Number:</span> {examNumber}</p>
          <p><span className="font-medium">Amount:</span> KSh 150</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number (M-Pesa)
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phoneNumber"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
              className="input-field pl-10"
              placeholder="07XXXXXXXX"
              required
            />
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            M-Pesa prompt will be sent to this number
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
            className="input-field"
            placeholder="your@email.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Receipt will be sent to this email
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary flex items-center space-x-2"
          >
            <ArrowLeft size={20} />
            <span>Back</span>
          </button>
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary flex-1 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="loading-spinner" size={20} />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <CreditCard size={20} />
                <span>Pay KSh 150</span>
              </>
            )}
          </button>
        </div>

        {/* Payment Progress */}
        {paymentProgress && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <Loader2 className="loading-spinner text-blue-600" size={16} />
              <span className="text-sm text-blue-800">{paymentProgress}</span>
            </div>
          </div>
        )}

        {/* Immediate Manual Verification - Available right after payment initiation */}
        {paymentInitiated && isPolling && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="text-green-600" size={20} />
              <h3 className="font-medium text-green-800">Quick Payment Confirmation</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Have you completed the M-Pesa payment? You can confirm manually instead of waiting for automatic verification:
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleManualConfirmation(true)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle size={16} />
                <span>Yes, I completed payment</span>
              </button>
              <button
                type="button"
                onClick={() => handleManualConfirmation(false)}
                className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
              >
                Cancel & try again
              </button>
            </div>
          </div>
        )}

        {/* Manual Verification Section */}
        {showManualVerification && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-3">
              <AlertCircle className="text-yellow-600" size={20} />
              <h3 className="font-medium text-yellow-800">Manual Verification</h3>
            </div>
            <p className="text-sm text-yellow-700 mb-4">
              Automatic verification is taking longer than expected. If you've completed the M-Pesa payment successfully, you can confirm manually:
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => handleManualConfirmation(true)}
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
              >
                <CheckCircle size={16} />
                <span>Yes, I paid successfully</span>
              </button>
              <button
                type="button"
                onClick={() => handleManualConfirmation(false)}
                className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
              >
                No, payment failed
              </button>
            </div>
          </div>
        )}
      </form>

      <div className="mt-6 p-4 bg-green-50 rounded-lg">
        <h3 className="font-medium text-green-800 mb-2">Payment Instructions:</h3>
        <ol className="text-sm text-green-700 space-y-1">
          <li>1. Click "Pay KSh 150" button</li>
          <li>2. Check your phone for M-Pesa prompt</li>
          <li>3. Enter your M-Pesa PIN</li>
          <li>4. You can confirm payment immediately after completing it</li>
          <li>5. Or wait for automatic verification (up to 3 minutes)</li>
          <li>6. Your results will be displayed after confirmation</li>
        </ol>
      </div>
    </div>
  )
} 