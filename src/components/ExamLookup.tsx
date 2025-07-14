'use client'

import { useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { StudentResult, ExamLookupResponse } from '@/types/student'
import toast from 'react-hot-toast'

interface ExamLookupProps {
  onExamFound: (data: StudentResult, examNumber: string) => void
}

export default function ExamLookup({ onExamFound }: ExamLookupProps) {
  const [examNumber, setExamNumber] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!examNumber.trim()) {
      toast.error('Please enter your exam number')
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch('/api/lookup-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ examNumber: examNumber.trim() }),
      })

      const data: ExamLookupResponse = await response.json()

      if (data.success && data.data) {
        toast.success('Exam results found!')
        onExamFound(data.data, examNumber.trim())
      } else {
        toast.error(data.message || 'Exam number not found')
      }
    } catch (error) {
      console.error('Error looking up exam:', error)
      toast.error('An error occurred while looking up your exam number')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Access Your Results
        </h2>
        <p className="text-gray-600">
          Enter your exam number to retrieve your results
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="examNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Exam Number
          </label>
          <div className="relative">
            <input
              type="text"
              id="examNumber"
              value={examNumber}
              onChange={(e) => setExamNumber(e.target.value)}
              className="input-field pl-10"
              placeholder="Enter your exam number"
              required
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full flex items-center justify-center space-x-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="loading-spinner" size={20} />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Search size={20} />
              <span>Search Results</span>
            </>
          )}
        </button>
      </form>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Important Notes:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Results access fee: KSh 150</li>
          <li>• Payment via M-Pesa STK push</li>
          <li>• Results can be downloaded as PDF</li>
          <li>• Contact support if you encounter issues</li>
        </ul>
      </div>
    </div>
  )
} 