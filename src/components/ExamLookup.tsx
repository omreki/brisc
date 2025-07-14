'use client'

import { useState } from 'react'
import { Search, Loader2, CreditCard, AlertCircle, FileText, BookOpen } from 'lucide-react'
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

      <form onSubmit={handleSubmit} className="element-spacing">
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

      {/* Instructions */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
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