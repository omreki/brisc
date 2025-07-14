'use client'

import { useState } from 'react'
import { Download, FileText, RefreshCw, User, Calendar } from 'lucide-react'
import { StudentResult } from '@/types/student'
import { generatePDF } from '@/utils/pdfGenerator'
import { format } from 'date-fns'

interface ResultsDisplayProps {
  studentData: StudentResult
  examNumber: string
  onStartOver: () => void
}

export default function ResultsDisplay({ 
  studentData, 
  examNumber, 
  onStartOver 
}: ResultsDisplayProps) {
  const [isDownloading, setIsDownloading] = useState(false)

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      await generatePDF(studentData, examNumber)
    } catch (error) {
      console.error('Error generating PDF:', error)
    } finally {
      setIsDownloading(false)
    }
  }

  const examSubjects = [
    { label: 'Old Testament Survey', key: 'oldTestamentSurvey' },
    { label: 'New Testament Survey', key: 'newTestamentSurvey' },
    { label: 'Prophets', key: 'prophets' },
    { label: 'Pauls Missionary Journey', key: 'paulsMissionaryJourney' },
    { label: 'Hebrew Language', key: 'hebrewLanguage' },
    { label: 'Book of Hebrew', key: 'bookOfHebrew' },
    { label: 'Greek Language', key: 'greekLanguage' },
    { label: 'Bible Study Method', key: 'bibleStudyMethod' },
    { label: 'Book of Romans', key: 'bookOfRomans' },
    { label: 'The Book of Judges', key: 'theBookOfJudges' },
    { label: 'Abrahams Journey', key: 'abrahamsJourney' },
    { label: 'Kings of Israel', key: 'kingsOfIsrael' },
    { label: 'Kings of Judah', key: 'kingsOfJudah' },
    { label: 'Epistles', key: 'epistles' },
    { label: 'Church History', key: 'churchHistory' },
    { label: 'Theology', key: 'theology' },
    { label: 'Tabernacle', key: 'tabernacle' },
    { label: 'The Book of Ezekiel', key: 'theBookOfEzekiel' },
    { label: 'The Journey of Israelites', key: 'theJourneyOfIsraelites' },
    { label: 'Church Administration', key: 'churchAdministration' },
    { label: 'Practicum', key: 'practicum' },
    { label: 'REF', key: 'ref' },
  ]

  const getGradeColor = (grade: string) => {
    const numericGrade = parseFloat(grade)
    if (isNaN(numericGrade)) return 'text-gray-600'
    
    if (numericGrade >= 80) return 'text-green-600'
    if (numericGrade >= 70) return 'text-blue-600'
    if (numericGrade >= 60) return 'text-yellow-600'
    if (numericGrade >= 50) return 'text-orange-600'
    return 'text-red-600'
  }

  const getGradeLetter = (grade: string) => {
    const numericGrade = parseFloat(grade)
    if (isNaN(numericGrade)) return grade
    
    if (numericGrade >= 80) return 'A'
    if (numericGrade >= 70) return 'B'
    if (numericGrade >= 60) return 'C'
    if (numericGrade >= 50) return 'D'
    return 'F'
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Exam Results
        </h2>
        <p className="text-gray-600">
          Your examination results are displayed below
        </p>
      </div>

      {/* Student Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <User size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{studentData.name}</h3>
              <p className="text-blue-100">Exam Number: {examNumber}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 text-blue-100">
              <Calendar size={16} />
              <span>Generated: {format(new Date(), 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {examSubjects.map((subject) => {
          const grade = studentData[subject.key as keyof StudentResult] as string
          return (
            <div key={subject.key} className="bg-white rounded-lg shadow-sm border p-4">
              <h4 className="font-medium text-gray-800 mb-2 text-sm">
                {subject.label}
              </h4>
              <div className="flex items-center justify-between">
                <span className={`text-2xl font-bold ${getGradeColor(grade)}`}>
                  {grade}
                </span>
                <span className={`text-sm font-medium px-2 py-1 rounded ${getGradeColor(grade)} bg-opacity-10`}>
                  {getGradeLetter(grade)}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          onClick={handleDownloadPDF}
          disabled={isDownloading}
          className="btn-primary flex items-center justify-center space-x-2"
        >
          {isDownloading ? (
            <>
              <div className="loading-spinner" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download size={20} />
              <span>Download PDF</span>
            </>
          )}
        </button>
        
        <button
          onClick={onStartOver}
          className="btn-secondary flex items-center justify-center space-x-2"
        >
          <RefreshCw size={20} />
          <span>Search Another</span>
        </button>
      </div>

      {/* Footer Info */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2 text-gray-600 mb-2">
          <FileText size={16} />
          <span className="font-medium">Grade Scale:</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
          <div className="text-green-600">A: 80-100</div>
          <div className="text-blue-600">B: 70-79</div>
          <div className="text-yellow-600">C: 60-69</div>
          <div className="text-orange-600">D: 50-59</div>
          <div className="text-red-600">F: Below 50</div>
        </div>
      </div>
    </div>
  )
} 