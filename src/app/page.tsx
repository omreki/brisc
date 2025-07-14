'use client'

import { useState, useEffect } from 'react'
import { Search, FileText, CreditCard, Download } from 'lucide-react'
import ExamLookup from '@/components/ExamLookup'
import PaymentForm from '@/components/PaymentForm'
import ResultsDisplay from '@/components/ResultsDisplay'
import AuthPage from '@/components/AuthPage'
import Dashboard from '@/components/Dashboard'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/contexts/AuthContext'
import { StudentResult } from '@/types/student'

export default function Home() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const [currentView, setCurrentView] = useState<'dashboard' | 'exam-portal'>('dashboard')
  const [step, setStep] = useState<'lookup' | 'payment' | 'results'>('lookup')
  const [studentData, setStudentData] = useState<StudentResult | null>(null)
  const [examNumber, setExamNumber] = useState('')

  // Auto-redirect to dashboard when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard')
    }
  }, [isAuthenticated])

  const handleAuthSuccess = () => {
    // Authentication success is handled by the AuthContext
    // This just ensures we're on the dashboard view
    setCurrentView('dashboard')
  }

  const handleLogout = () => {
    logout()
    setCurrentView('dashboard')
    setStep('lookup')
    setStudentData(null)
    setExamNumber('')
  }

  const handleNavigateToExamPortal = () => {
    setCurrentView('exam-portal')
  }

  const handleNavigateToDashboard = () => {
    setCurrentView('dashboard')
  }

  const handleExamFound = (data: StudentResult, examNum: string) => {
    setStudentData(data)
    setExamNumber(examNum)
    setStep('payment')
  }

  const handlePaymentSuccess = () => {
    setStep('results')
  }

  const handleStartOver = () => {
    setStep('lookup')
    setStudentData(null)
    setExamNumber('')
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we prepare your session</p>
        </div>
      </div>
    )
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage onAuthSuccess={handleAuthSuccess} />
  }

  // Show dashboard if authenticated
  if (currentView === 'dashboard') {
    return (
      <AuthGuard>
        <Dashboard
          user={user!}
          onLogout={handleLogout}
          onNavigateToExamPortal={handleNavigateToExamPortal}
        />
      </AuthGuard>
    )
  }

  // Show exam portal if authenticated
  return (
    <AuthGuard>
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={handleNavigateToDashboard}
                className="flex items-center text-blue-600 hover:text-blue-500 font-medium transition-colors"
              >
                ← Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center text-red-600 hover:text-red-500 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
            <h1 className="text-4xl font-bold text-gray-800 mb-2">
              Exam Portal
            </h1>
            <p className="text-gray-600">
              Access your exam results securely
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${step === 'lookup' ? 'text-primary-600' : step === 'payment' || step === 'results' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'lookup' ? 'bg-primary-600 text-white' : step === 'payment' || step === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  <Search size={16} />
                </div>
                <span className="font-medium">Lookup</span>
              </div>
              
              <div className={`w-8 h-px ${step === 'payment' || step === 'results' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center space-x-2 ${step === 'payment' ? 'text-primary-600' : step === 'results' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'payment' ? 'bg-primary-600 text-white' : step === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  <CreditCard size={16} />
                </div>
                <span className="font-medium">Payment</span>
              </div>
              
              <div className={`w-8 h-px ${step === 'results' ? 'bg-green-600' : 'bg-gray-200'}`}></div>
              
              <div className={`flex items-center space-x-2 ${step === 'results' ? 'text-green-600' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === 'results' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
                  <FileText size={16} />
                </div>
                <span className="font-medium">Results</span>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            {step === 'lookup' && (
              <ExamLookup onExamFound={handleExamFound} />
            )}
            
            {step === 'payment' && studentData && (
              <PaymentForm
                studentData={studentData}
                examNumber={examNumber}
                onPaymentSuccess={handlePaymentSuccess}
                onBack={() => setStep('lookup')}
              />
            )}
            
            {step === 'results' && studentData && (
              <ResultsDisplay
                studentData={studentData}
                examNumber={examNumber}
                onStartOver={handleStartOver}
              />
            )}
          </div>
        </div>
      </main>
    </AuthGuard>
  )
} 