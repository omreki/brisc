'use client'

import { useState, useEffect } from 'react'
import { Download, RotateCcw, Award, User, Hash, CheckCircle, Star, Trophy, BookOpen, Calendar, AlertCircle } from 'lucide-react'
import { StudentResult } from '@/types/student'
import { toast } from 'react-hot-toast'

interface ResultsDisplayProps {
  studentData: StudentResult
  examNumber: string
  onStartOver: () => void
  paymentVerified?: boolean
}

export default function ResultsDisplay({ studentData, examNumber, onStartOver, paymentVerified = false }: ResultsDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false)
  const [paymentVerificationResult, setPaymentVerificationResult] = useState<any>(null)

  // Check payment verification on component mount if not already verified
  useEffect(() => {
    if (!paymentVerified) {
      verifyPaymentStatus()
    }
  }, [examNumber, paymentVerified])

  const verifyPaymentStatus = async () => {
    setIsVerifyingPayment(true)
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
      setPaymentVerificationResult(result)
      
      if (!result.success || !result.isValid) {
        toast.error('Payment verification failed. Download not available.')
      }
    } catch (error) {
      console.error('Payment verification error:', error)
      setPaymentVerificationResult({
        success: false,
        message: 'Unable to verify payment status'
      })
    } finally {
      setIsVerifyingPayment(false)
    }
  }

  const handleDownload = async () => {
    // Check payment verification before allowing download
    const isPaymentValid = paymentVerified || (paymentVerificationResult?.success && paymentVerificationResult?.isValid)
    
    if (!isPaymentValid) {
      toast.error('Download not available. Payment verification required.')
      return
    }

    setIsDownloading(true)
    try {
      // Dynamic import to ensure PDF generation only happens client-side
      const { generatePDF } = await import('@/utils/pdfGenerator')
      await generatePDF(studentData, examNumber)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleManualPaymentVerification = async () => {
    await verifyPaymentStatus()
  }

  // Get all subject fields and their values
  const subjects = [
    { name: 'Old Testament Survey', value: studentData.oldTestamentSurvey },
    { name: 'New Testament Survey', value: studentData.newTestamentSurvey },
    { name: 'Prophets', value: studentData.prophets },
    { name: "Paul's Missionary Journey", value: studentData.paulsMissionaryJourney },
    { name: 'Church History', value: studentData.churchHistory },
    { name: 'Book of Hebrew', value: studentData.bookOfHebrew },
    { name: 'Greek Language', value: studentData.greekLanguage },
    { name: 'Bible Study Method', value: studentData.bibleStudyMethod },
    { name: 'Book of Romans', value: studentData.bookOfRomans },
    { name: 'The Book of Judges', value: studentData.theBookOfJudges },
    { name: "Abraham's Journey", value: studentData.abrahamsJourney },
    { name: 'Kings of Israel', value: studentData.kingsOfIsrael },
    { name: 'Kings of Judah', value: studentData.kingsOfJudah },
    { name: 'Epistles', value: studentData.epistles },
    { name: 'Hebrew Language', value: studentData.hebrewLanguage },
    { name: 'Theology', value: studentData.theology },
    { name: 'Tabernacle', value: studentData.tabernacle },
    { name: 'The Book of Ezekiel', value: studentData.theBookOfEzekiel },
    { name: 'The Journey of Israelites', value: studentData.theJourneyOfIsraelites },
    { name: 'Church Administration', value: studentData.churchAdministration },
    { name: 'Practicum', value: studentData.practicum },
  ].filter(subject => subject.value && subject.value.trim() !== '') // Only show subjects with values

  // Calculate grade statistics
  const grades = subjects.map(subject => subject.value)
  const totalSubjects = grades.length
  const averageGrade = totalSubjects > 0 
    ? grades.reduce((sum, grade) => {
        // Convert grades to numerical values for average calculation
        const gradeMap: { [key: string]: number } = {
          'A+': 95, 'A': 90, 'A-': 87,
          'B+': 83, 'B': 80, 'B-': 77,
          'C+': 73, 'C': 70, 'C-': 67,
          'D+': 63, 'D': 60, 'D-': 57,
          'F': 50
        }
        return sum + (gradeMap[grade] || 0)
      }, 0) / totalSubjects
    : 0

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A+':
      case 'A':
        return 'text-emerald-600 bg-emerald-50 border-emerald-200'
      case 'A-':
      case 'B+':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'B':
      case 'B-':
        return 'text-indigo-600 bg-indigo-50 border-indigo-200'
      case 'C+':
      case 'C':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'C-':
      case 'D+':
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'D':
      case 'D-':
      case 'F':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getOverallPerformance = () => {
    if (averageGrade >= 90) return { level: 'Excellent', color: 'emerald', icon: Trophy }
    if (averageGrade >= 80) return { level: 'Good', color: 'blue', icon: Star }
    if (averageGrade >= 70) return { level: 'Satisfactory', color: 'indigo', icon: CheckCircle }
    if (averageGrade >= 60) return { level: 'Needs Improvement', color: 'orange', icon: BookOpen }
    return { level: 'Poor', color: 'red', icon: BookOpen }
  }

  const performance = getOverallPerformance()
  
  // Determine if payment is verified
  const isPaymentValid = paymentVerified || (paymentVerificationResult?.success && paymentVerificationResult?.isValid)

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-section-title mb-3">Exam Results</h2>
        <p className="text-body">Your exam results are ready for review</p>
      </div>

      {/* Payment Verification Status */}
      {!paymentVerified && (
        <div className="mb-8">
          {isVerifyingPayment ? (
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <div className="flex items-center space-x-4">
                <div className="loading-spinner"></div>
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Verifying Payment Status</h3>
                  <p className="text-blue-800 text-sm">Please wait while we verify your payment...</p>
                </div>
              </div>
            </div>
          ) : paymentVerificationResult ? (
            <div className={`p-6 rounded-2xl border ${
              isPaymentValid 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
            }`}>
              <div className="flex items-start space-x-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isPaymentValid ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  {isPaymentValid ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className={`font-semibold mb-2 ${
                    isPaymentValid ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {isPaymentValid ? 'Payment Verified' : 'Payment Not Verified'}
                  </h3>
                  <p className={`text-sm mb-3 ${
                    isPaymentValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {paymentVerificationResult.message}
                  </p>
                  {!isPaymentValid && (
                    <button
                      onClick={handleManualPaymentVerification}
                      disabled={isVerifyingPayment}
                      className="btn-primary text-sm"
                    >
                      Retry Verification
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Student Information */}
      <div className="grid-responsive-2 mb-8">
        <div className="pane">
          <div className="pane-header">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Student Information
            </h3>
          </div>
          <div className="pane-body">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Name:</span>
                <span className="font-semibold text-gray-900">{studentData.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Exam Number:</span>
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-gray-500" />
                  <span className="font-semibold text-gray-900">{examNumber}</span>
                </div>
              </div>
              {studentData.ref && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Reference:</span>
                  <span className="font-medium text-gray-700">{studentData.ref}</span>
                </div>
              )}
              {studentData.admissionNumber && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Admission Number:</span>
                  <span className="font-medium text-gray-700">{studentData.admissionNumber}</span>
                </div>
              )}
              {studentData.dateOfBirth && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Date of Birth:</span>
                  <span className="font-medium text-gray-700">{studentData.dateOfBirth}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="pane">
          <div className="pane-header">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <performance.icon className="h-5 w-5" />
              Performance Summary
            </h3>
          </div>
          <div className="pane-body">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Subjects:</span>
                <span className="font-semibold text-gray-900">{totalSubjects}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Average Score:</span>
                <span className="font-semibold text-gray-900">{averageGrade.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Overall Performance:</span>
                <span className={`status-badge status-${performance.color === 'emerald' ? 'success' : performance.color === 'red' ? 'error' : performance.color === 'orange' ? 'warning' : 'info'}`}>
                  {performance.level}
                </span>
              </div>
              {studentData.overallGradePoint && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Overall Grade Point:</span>
                  <span className="font-semibold text-gray-900">{studentData.overallGradePoint}</span>
                </div>
              )}
              {studentData.overallGrade && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Overall Grade:</span>
                  <span className="font-semibold text-gray-900">{studentData.overallGrade}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="pane mb-8">
        <div className="pane-header">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Subject Results
          </h3>
        </div>
        <div className="pane-body">
          {subjects.length > 0 ? (
            <div className="grid-responsive-3">
              {subjects.map((subject, index) => (
                <div
                  key={index}
                  className="p-4 bg-gradient-to-br from-white to-gray-50 rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm leading-tight">
                      {subject.name}
                    </h4>
                    <div className={`px-3 py-1 rounded-lg text-sm font-bold border ${getGradeColor(subject.value)}`}>
                      {subject.value}
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        subject.value.includes('A') ? 'bg-emerald-500' :
                        subject.value.includes('B') ? 'bg-blue-500' :
                        subject.value.includes('C') ? 'bg-yellow-500' :
                        subject.value.includes('D') ? 'bg-orange-500' :
                        'bg-red-500'
                      }`}
                      style={{
                        width: `${
                          subject.value.includes('A') ? 90 :
                          subject.value.includes('B') ? 75 :
                          subject.value.includes('C') ? 60 :
                          subject.value.includes('D') ? 45 :
                          30
                        }%`
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Results Available</h3>
              <p className="text-gray-500">No subject results found for this exam number.</p>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        {isPaymentValid ? (
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="btn-success flex-1"
          >
            {isDownloading ? (
              <>
                <div className="loading-spinner" />
                Generating PDF...
              </>
            ) : (
              <>
                <Download className="h-5 w-5" />
                Download PDF Results
              </>
            )}
          </button>
        ) : (
          <div className="flex-1 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
            <div className="flex items-center justify-center space-x-3">
              <AlertCircle className="h-5 w-5 text-gray-500" />
              <span className="text-gray-600 font-medium">
                Payment verification required to download results
              </span>
            </div>
          </div>
        )}
        
        <button
          onClick={onStartOver}
          className="btn-outline flex-1"
        >
          <RotateCcw className="h-5 w-5" />
          Search Another Exam
        </button>
      </div>

      {/* Success Message */}
      {isPaymentValid && (
        <div className="p-6 bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-2xl border border-emerald-200">
          <div className="flex items-start space-x-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-semibold text-emerald-900 mb-2">Results Successfully Retrieved</h3>
              <p className="text-emerald-800 text-sm leading-relaxed mb-3">
                Your exam results have been successfully retrieved and are displayed above. 
                You can download a PDF copy for your records.
              </p>
              <div className="flex items-center gap-4 text-sm text-emerald-700">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Retrieved Today</span>
                </div>
                <div className="flex items-center gap-1">
                  <Award className="h-4 w-4" />
                  <span>{totalSubjects} Subjects</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-4">Important Information</h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>• These results are official and have been verified</p>
          <p>• {isPaymentValid ? 'Keep a copy of your PDF results for future reference' : 'Complete payment verification to download PDF results'}</p>
          <p>• Contact your institution for any questions about specific grades</p>
          <p>• Results are confidential and should not be shared without authorization</p>
        </div>
      </div>
    </div>
  )
} 