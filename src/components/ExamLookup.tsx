'use client'

import { useState } from 'react'
import { Search, Loader2, CreditCard, AlertCircle, FileText, BookOpen, CheckCircle, Shield } from 'lucide-react'
import { StudentResult, ExamLookupResponse } from '@/types/student'
import toast from 'react-hot-toast'

interface ExamLookupProps {
  onExamFound: (data: StudentResult, examNumber: string) => void
  onPaymentRequired: (examNumber: string, message: string) => void
}

export default function ExamLookup({ onExamFound, onPaymentRequired }: ExamLookupProps) {
  const [examNumber, setExamNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [paymentMessage, setPaymentMessage] = useState<string | null>(null)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [verificationExamNumber, setVerificationExamNumber] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!examNumber.trim()) {
      toast.error('Please enter your exam number')
      return
    }

    setIsLoading(true)
    setPaymentMessage(null)
    
    try {
      const response = await fetch('/api/lookup-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ examNumber: examNumber.trim() }),
      })

      const data: ExamLookupResponse = await response.json()

      if (response.status === 402) {
        // Payment required
        setPaymentMessage(data.message || 'Payment required to access results')
        onPaymentRequired(examNumber.trim(), data.message || 'Payment required to access results')
        toast.error('Payment required to access your results')
      } else if (data.success && data.data) {
        toast.success('Exam results found!')
        onExamFound(data.data, examNumber.trim())
      } else {
        toast.error(data.message || 'Exam number not found')
      }
    } catch (error) {
      console.error('Lookup error:', error)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProviderVerification = async () => {
    if (!verificationExamNumber.trim()) {
      toast.error('Please enter your exam number for verification')
      return
    }

    setIsVerifyingPayment(true)
    
    try {
      const response = await fetch('/api/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          examNumber: verificationExamNumber.trim(),
          forceRefresh: true, // Direct provider check
        }),
      })
      
      const result = await response.json()
      
      if (result.success && result.isValid) {
        toast.success('Payment verified with provider! 🎉')
        
        // Get exam results after successful payment verification
        const examResponse = await fetch('/api/lookup-exam', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ examNumber: verificationExamNumber.trim() }),
        })

        const examData: ExamLookupResponse = await examResponse.json()
        
        if (examData.success && examData.data) {
          onExamFound(examData.data, verificationExamNumber.trim())
        } else {
          toast.error('Payment verified but error loading results. Please try again.')
        }
      } else {
        const message = result.message || 'Payment not found or not completed with provider'
        toast.error(`Verification failed: ${message}`)
      }
    } catch (error) {
      console.error('Provider verification error:', error)
      toast.error('Error during verification. Please try again.')
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Exam Results Portal</h1>
        <p className="text-gray-600">
          Enter your exam number to view your results
        </p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="mb-6">
          <label htmlFor="examNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Exam Number
          </label>
          <input
            type="text"
            id="examNumber"
            value={examNumber}
            onChange={(e) => setExamNumber(e.target.value)}
            placeholder="Enter your exam number"
            className="input-field"
            disabled={isLoading}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !examNumber.trim()}
          className="btn-success w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              Search for Results
            </>
          )}
        </button>

        {paymentMessage && (
          <div className="mt-6 p-6 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl border border-orange-200">
            <div className="flex items-start space-x-4">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <CreditCard className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Payment Required</h3>
                <p className="text-orange-800 text-sm leading-relaxed">{paymentMessage}</p>
                <p className="text-orange-700 text-xs mt-2">
                  You'll be redirected to the payment page in the next step.
                </p>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Payment Verification with Provider Section */}
      <div className="bg-white rounded-3xl shadow-2xl p-8">
        <div className="flex items-start space-x-4 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-green-900 mb-2">Already Made Payment?</h3>
            <p className="text-green-800 text-sm leading-relaxed">
              If you've already paid for your exam results, verify your payment directly with our payment provider (IntaSend) to access your results immediately.
            </p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="verificationExamNumber" className="block text-sm font-medium text-gray-700 mb-2">
              Exam Number for Verification
            </label>
            <input
              type="text"
              id="verificationExamNumber"
              value={verificationExamNumber}
              onChange={(e) => setVerificationExamNumber(e.target.value)}
              placeholder="Enter exam number"
              className="input-field"
              disabled={isVerifyingPayment}
            />
          </div>
          
          <button
            onClick={handleProviderVerification}
            disabled={isVerifyingPayment || !verificationExamNumber.trim()}
            className="btn-success w-full"
          >
            {isVerifyingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying with Provider...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                Verify Payment with Provider
              </>
            )}
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
          <p className="text-green-800 text-sm">
            <strong>What this does:</strong> This button checks directly with IntaSend (our payment provider) to verify if your payment was successfully completed. This gives you the most accurate and up-to-date payment status.
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-white rounded-3xl shadow-xl p-8">
        <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          How it works
        </h3>
        <div className="space-y-3 text-sm text-blue-800">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-600">1</span>
            </div>
            <p>Enter your exam number exactly as provided during registration</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-600">2</span>
            </div>
            <p>If payment is required, you'll be guided through a secure payment process</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-600">3</span>
            </div>
            <p>Once verified, you can view and download your exam results instantly</p>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-600">4</span>
            </div>
            <p>If you've already paid, use the "Verify Payment with Provider" section above</p>
          </div>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          Having trouble finding your exam number?{' '}
          <button className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
            Contact Support
          </button>
        </p>
      </div>
    </div>
  )
} 