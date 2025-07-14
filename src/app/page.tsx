'use client'

import { useState, useEffect } from 'react'
import { Search, FileText, CreditCard, Download, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
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
  const [paymentData, setPaymentData] = useState<{paymentId: string; userEmail: string} | null>(null)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)

  // Auto-redirect to dashboard when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('dashboard')
    }
  }, [isAuthenticated])

  const handleAuthSuccess = () => {
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
    setStep('results') // Skip payment step since payment has been verified
  }

  const handlePaymentRequired = (examNum: string, message: string) => {
    const dummyStudentData: StudentResult = {
      examNumber: examNum,
      name: `Student ${examNum}`,
      oldTestamentSurvey: '',
      newTestamentSurvey: '',
      prophets: '',
      paulsMissionaryJourney: '',
      hebrewLanguage: '',
      bookOfHebrew: '',
      greekLanguage: '',
      bibleStudyMethod: '',
      bookOfRomans: '',
      theBookOfJudges: '',
      abrahamsJourney: '',
      kingsOfIsrael: '',
      kingsOfJudah: '',
      epistles: '',
      churchHistory: '',
      theology: '',
      tabernacle: '',
      theBookOfEzekiel: '',
      theJourneyOfIsraelites: '',
      churchAdministration: '',
      practicum: '',
      ref: ''
    }
    
    setStudentData(dummyStudentData)
    setExamNumber(examNum)
    setStep('payment')
  }

  const handlePaymentSuccess = async (paymentInfo?: {paymentId: string; userEmail: string}) => {
    setIsProcessingPayment(true)
    
    if (paymentInfo) {
      setPaymentData(paymentInfo)
    }
    
    // Fetch actual student results after successful payment
    try {
      const response = await fetch('/api/lookup-exam', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ examNumber }),
      })

      const data = await response.json()

      if (data.success && data.data) {
        // Update with actual student results data
        setStudentData(data.data)
        setStep('results')
      } else {
        // Fallback: show results even if lookup fails (payment was successful)
        console.warn('Failed to fetch updated student data after payment:', data.message)
        setStep('results')
      }
    } catch (error) {
      console.error('Error fetching student data after payment:', error)
      // Fallback: show results even if lookup fails (payment was successful)
      setStep('results')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  const handleStartOver = () => {
    setStep('lookup')
    setStudentData(null)
    setExamNumber('')
    setPaymentData(null)
    setIsProcessingPayment(false)
  }

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center slide-up">
          <div className="loading-spinner mx-auto mb-8 w-16 h-16"></div>
          <h2 className="text-subsection-title mb-4">Loading...</h2>
          <p className="text-body">Please wait while we prepare your session</p>
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
      <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="container-modern section-spacing">
          {/* Header */}
          <div className="text-center mb-12 fade-in">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-6 mb-8">
              <button
                onClick={handleNavigateToDashboard}
                className="btn-ghost order-2 sm:order-1"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
              <button
                onClick={handleLogout}
                className="btn-danger order-1 sm:order-2"
              >
                Logout
              </button>
            </div>
            <h1 className="text-hero mb-6">
              Exam Portal
            </h1>
            <p className="text-body max-w-2xl mx-auto">
              Access your exam results securely and efficiently through our streamlined portal
            </p>
          </div>

          {/* Progress Steps */}
          <div className="progress-modern mb-12">
            <div className="progress-step">
              <div className={`progress-step-icon ${
                step === 'lookup' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : step === 'payment' || step === 'results' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'payment' || step === 'results' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <Search className="h-6 w-6" />
                )}
              </div>
              <span className={`progress-step-text ${
                step === 'lookup' 
                  ? 'text-blue-600' 
                  : step === 'payment' || step === 'results' 
                    ? 'text-emerald-600' 
                    : 'text-gray-400'
              }`}>
                Search
              </span>
            </div>
            
            <div className={`progress-connector ${
              step === 'payment' || step === 'results' ? 'bg-emerald-500' : 'bg-gray-200'
            }`}></div>
            
            <div className="progress-step">
              <div className={`progress-step-icon ${
                step === 'payment' 
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white' 
                  : step === 'results' 
                    ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {step === 'results' ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <CreditCard className="h-6 w-6" />
                )}
              </div>
              <span className={`progress-step-text ${
                step === 'payment' 
                  ? 'text-blue-600' 
                  : step === 'results' 
                    ? 'text-emerald-600' 
                    : 'text-gray-400'
              }`}>
                Payment
              </span>
            </div>
            
            <div className={`progress-connector ${
              step === 'results' ? 'bg-emerald-500' : 'bg-gray-200'
            }`}></div>
            
            <div className="progress-step">
              <div className={`progress-step-icon ${
                step === 'results' 
                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
                  : 'bg-gray-200 text-gray-500'
              }`}>
                <FileText className="h-6 w-6" />
              </div>
              <span className={`progress-step-text ${
                step === 'results' ? 'text-emerald-600' : 'text-gray-400'
              }`}>
                Results
              </span>
            </div>
          </div>

          {/* Main Content */}
          <div className="card-elevated slide-up">
            <div className="card-body">
              {isProcessingPayment && (
                <div className="text-center py-12">
                  <div className="loading-spinner mx-auto mb-6 w-12 h-12"></div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Processing Payment</h3>
                  <p className="text-gray-600">Fetching your exam results...</p>
                </div>
              )}
              
              {!isProcessingPayment && step === 'lookup' && (
                <ExamLookup 
                  onExamFound={handleExamFound}
                  onPaymentRequired={handlePaymentRequired}
                />
              )}
              
              {!isProcessingPayment && step === 'payment' && studentData && (
                <PaymentForm
                  studentData={studentData}
                  examNumber={examNumber}
                  onPaymentSuccess={handlePaymentSuccess}
                  onBack={() => setStep('lookup')}
                />
              )}
              
              {!isProcessingPayment && step === 'results' && studentData && (
                <ResultsDisplay
                  studentData={studentData}
                  examNumber={examNumber}
                  onStartOver={handleStartOver}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </AuthGuard>
  )
} 