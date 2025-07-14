'use client'

import { useState } from 'react'
import { Search, Loader2, CreditCard, AlertCircle, FileText, BookOpen, CheckCircle, RefreshCw } from 'lucide-react'
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
      console.error('Error looking up exam:', error)
      toast.error('An error occurred while searching for your exam')
    } finally {
      setIsLoading(false)
    }
  }

  const handleStandaloneVerification = async () => {
    if (!verificationExamNumber.trim()) {
      toast.error('Please enter your exam number to verify payment')
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
          forceRefresh: true,
        }),
      })
      
      const result = await response.json()
      
      if (result.success && result.isValid) {
        toast.success('Payment verified! Redirecting to your results...')
        
        // Try to fetch the actual results
        try {
          const lookupResponse = await fetch('/api/lookup-exam', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ examNumber: verificationExamNumber.trim() }),
          })

          const lookupData: ExamLookupResponse = await lookupResponse.json()

          if (lookupData.success && lookupData.data) {
            onExamFound(lookupData.data, verificationExamNumber.trim())
          } else {
            toast.error('Payment verified but failed to fetch results. Please try again.')
          }
        } catch (error) {
          console.error('Error fetching results after verification:', error)
          toast.error('Payment verified but failed to fetch results. Please try again.')
        }
      } else {
        toast.error(result.message || 'No valid payment found for this exam number')
      }
    } catch (error) {
      console.error('Verification error:', error)
      toast.error('Error during verification. Please try again.')
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Search className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="text-section-title mb-3">Find Your Exam Results</h2>
        <p className="text-body">Enter your exam number to search for your results</p>
      </div>

      <form onSubmit={handleSubmit} className="element-spacing mb-8">
        <div className="form-group">
          <label className="form-label flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Exam Number
          </label>
          <input
            type="text"
            value={examNumber}
            onChange={(e) => setExamNumber(e.target.value)}
            placeholder="Enter your exam number (e.g., 2024001)"
            className="input-field text-center text-lg font-semibold"
            disabled={isLoading}
            required
          />
          <p className="form-help">
            Your exam number should be in the format provided during registration
          </p>
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

      {/* Standalone Payment Verification Section */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200 mb-8">
        <div className="flex items-start space-x-4 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <CheckCircle className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">Already Made Payment?</h3>
            <p className="text-blue-800 text-sm leading-relaxed">
              If you've already made a payment for your exam results, you can verify it here to access your results immediately.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={verificationExamNumber}
            onChange={(e) => setVerificationExamNumber(e.target.value)}
            placeholder="Enter exam number"
            className="input-field flex-1"
            disabled={isVerifyingPayment}
          />
          <button
            onClick={handleStandaloneVerification}
            disabled={isVerifyingPayment || !verificationExamNumber.trim()}
            className="btn-primary"
          >
            {isVerifyingPayment ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Verify Payment
              </>
            )}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
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
            <p>If you've already paid, use the "Verify Payment" section above to access results</p>
          </div>
        </div>
      </div>

      {/* Need Help Section */}
      <div className="mt-6 text-center">
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