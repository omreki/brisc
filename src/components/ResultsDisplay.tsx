'use client'

import { StudentResult } from '@/types/student'
import { Download, FileText, User, Hash, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'react-hot-toast'

interface ResultsDisplayProps {
  studentData: StudentResult
  examNumber: string
}

export default function ResultsDisplay({ studentData, examNumber }: ResultsDisplayProps) {
  const handleDownloadPDF = async () => {
    try {
      // Dynamic import to ensure PDF generation only happens client-side
      const { generatePDF } = await import('@/utils/pdfGenerator')
      await generatePDF(studentData, examNumber)
      toast.success('PDF generated successfully!')
    } catch (error) {
      console.error('Error generating PDF:', error)
      toast.error('Failed to generate PDF. Please try again.')
    }
  }

  const getGradeLetter = (grade: string): string => {
    const numericGrade = parseFloat(grade)
    if (isNaN(numericGrade)) return grade
    
    if (numericGrade >= 80) return 'A'
    if (numericGrade >= 70) return 'B'
    if (numericGrade >= 60) return 'C'
    if (numericGrade >= 50) return 'D'
    return 'F'
  }

  const getGradeColor = (grade: string): string => {
    const letter = getGradeLetter(grade)
    switch (letter) {
      case 'A': return 'text-green-600'
      case 'B': return 'text-blue-600'
      case 'C': return 'text-yellow-600'
      case 'D': return 'text-orange-600'
      case 'F': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const subjects = [
    { name: 'Old Testament Survey', grade: studentData.oldTestamentSurvey },
    { name: 'New Testament Survey', grade: studentData.newTestamentSurvey },
    { name: 'Prophets', grade: studentData.prophets },
    { name: 'Pauls Missionary Journey', grade: studentData.paulsMissionaryJourney },
    { name: 'Hebrew Language', grade: studentData.hebrewLanguage },
    { name: 'Book of Hebrew', grade: studentData.bookOfHebrew },
    { name: 'Greek Language', grade: studentData.greekLanguage },
    { name: 'Bible Study Method', grade: studentData.bibleStudyMethod },
    { name: 'Book of Romans', grade: studentData.bookOfRomans },
    { name: 'The Book of Judges', grade: studentData.theBookOfJudges },
    { name: 'Abrahams Journey', grade: studentData.abrahamsJourney },
    { name: 'Kings of Israel', grade: studentData.kingsOfIsrael },
    { name: 'Kings of Judah', grade: studentData.kingsOfJudah },
    { name: 'Epistles', grade: studentData.epistles },
    { name: 'Church History', grade: studentData.churchHistory },
    { name: 'Theology', grade: studentData.theology },
    { name: 'Tabernacle', grade: studentData.tabernacle },
    { name: 'The Book of Ezekiel', grade: studentData.theBookOfEzekiel },
    { name: 'The Journey of Israelites', grade: studentData.theJourneyOfIsraelites },
    { name: 'Church Administration', grade: studentData.churchAdministration },
    { name: 'Practicum', grade: studentData.practicum },
    { name: 'REF', grade: studentData.ref },
  ]

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="border-b border-gray-200 pb-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <FileText className="text-blue-600" />
              Student Examination Results
            </h1>
            <p className="text-gray-600 mt-2">Detailed academic performance report</p>
          </div>
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Download PDF
          </button>
        </div>
      </div>

      {/* Student Information */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <User className="text-blue-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Student Name</p>
            <p className="font-semibold text-gray-900">{studentData.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Hash className="text-blue-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Exam Number</p>
            <p className="font-semibold text-gray-900">{examNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
          <Calendar className="text-blue-600" size={24} />
          <div>
            <p className="text-sm text-gray-600">Generated</p>
            <p className="font-semibold text-gray-900">{format(new Date(), 'MMM dd, yyyy')}</p>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-blue-600 text-white">
              <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Subject</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Grade</th>
              <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Letter Grade</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                <td className="border border-gray-300 px-4 py-3 font-medium">{subject.name}</td>
                <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                  {subject.grade}
                </td>
                <td className={`border border-gray-300 px-4 py-3 text-center font-bold ${getGradeColor(subject.grade)}`}>
                  {getGradeLetter(subject.grade)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grade Scale */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2">Grade Scale:</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <span className="text-green-600 font-medium">A: 80-100</span>
          <span className="text-blue-600 font-medium">B: 70-79</span>
          <span className="text-yellow-600 font-medium">C: 60-69</span>
          <span className="text-orange-600 font-medium">D: 50-59</span>
          <span className="text-red-600 font-medium">F: Below 50</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <p className="text-sm text-gray-500 text-center">
          This document is computer generated and does not require a signature.
        </p>
      </div>
    </div>
  )
} 