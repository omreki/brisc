import jsPDF from 'jspdf'
import 'jspdf-autotable'
import { StudentResult } from '@/types/student'
import { format } from 'date-fns'

export async function generatePDF(studentData: StudentResult, examNumber: string) {
  const doc = new jsPDF()
  
  // Header
  doc.setFontSize(20)
  doc.setTextColor(40, 116, 166)
  doc.text('STUDENT EXAMINATION RESULTS', 20, 20)
  
  // Student Information
  doc.setFontSize(12)
  doc.setTextColor(0, 0, 0)
  doc.text(`Student Name: ${studentData.name}`, 20, 40)
  doc.text(`Exam Number: ${examNumber}`, 20, 50)
  doc.text(`Generated: ${format(new Date(), 'MMMM dd, yyyy')}`, 20, 60)
  
  // Line separator
  doc.line(20, 70, 190, 70)
  
  // Exam subjects data
  const examSubjects = [
    ['Subject', 'Grade', 'Letter Grade'],
    ['Old Testament Survey', studentData.oldTestamentSurvey, getGradeLetter(studentData.oldTestamentSurvey)],
    ['New Testament Survey', studentData.newTestamentSurvey, getGradeLetter(studentData.newTestamentSurvey)],
    ['Prophets', studentData.prophets, getGradeLetter(studentData.prophets)],
    ['Pauls Missionary Journey', studentData.paulsMissionaryJourney, getGradeLetter(studentData.paulsMissionaryJourney)],
    ['Hebrew Language', studentData.hebrewLanguage, getGradeLetter(studentData.hebrewLanguage)],
    ['Book of Hebrew', studentData.bookOfHebrew, getGradeLetter(studentData.bookOfHebrew)],
    ['Greek Language', studentData.greekLanguage, getGradeLetter(studentData.greekLanguage)],
    ['Bible Study Method', studentData.bibleStudyMethod, getGradeLetter(studentData.bibleStudyMethod)],
    ['Book of Romans', studentData.bookOfRomans, getGradeLetter(studentData.bookOfRomans)],
    ['The Book of Judges', studentData.theBookOfJudges, getGradeLetter(studentData.theBookOfJudges)],
    ['Abrahams Journey', studentData.abrahamsJourney, getGradeLetter(studentData.abrahamsJourney)],
    ['Kings of Israel', studentData.kingsOfIsrael, getGradeLetter(studentData.kingsOfIsrael)],
    ['Kings of Judah', studentData.kingsOfJudah, getGradeLetter(studentData.kingsOfJudah)],
    ['Epistles', studentData.epistles, getGradeLetter(studentData.epistles)],
    ['Church History', studentData.churchHistory, getGradeLetter(studentData.churchHistory)],
    ['Theology', studentData.theology, getGradeLetter(studentData.theology)],
    ['Tabernacle', studentData.tabernacle, getGradeLetter(studentData.tabernacle)],
    ['The Book of Ezekiel', studentData.theBookOfEzekiel, getGradeLetter(studentData.theBookOfEzekiel)],
    ['The Journey of Israelites', studentData.theJourneyOfIsraelites, getGradeLetter(studentData.theJourneyOfIsraelites)],
    ['Church Administration', studentData.churchAdministration, getGradeLetter(studentData.churchAdministration)],
    ['Practicum', studentData.practicum, getGradeLetter(studentData.practicum)],
    ['REF', studentData.ref, getGradeLetter(studentData.ref)],
  ]
  
  // Add table
  ;(doc as any).autoTable({
    startY: 80,
    head: [examSubjects[0]],
    body: examSubjects.slice(1),
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [40, 116, 166],
      textColor: 255,
      fontSize: 11,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    columnStyles: {
      0: { cellWidth: 100 },
      1: { cellWidth: 30, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
    },
  })
  
  // Grade scale
  const finalY = (doc as any).lastAutoTable.finalY || 200
  doc.setFontSize(10)
  doc.text('Grade Scale:', 20, finalY + 20)
  doc.text('A: 80-100 | B: 70-79 | C: 60-69 | D: 50-59 | F: Below 50', 20, finalY + 30)
  
  // Footer
  doc.setFontSize(8)
  doc.setTextColor(128, 128, 128)
  doc.text('This document is computer generated and does not require a signature.', 20, finalY + 50)
  
  // Save the PDF
  doc.save(`${studentData.name}_${examNumber}_Results.pdf`)
}

function getGradeLetter(grade: string): string {
  const numericGrade = parseFloat(grade)
  if (isNaN(numericGrade)) return grade
  
  if (numericGrade >= 80) return 'A'
  if (numericGrade >= 70) return 'B'
  if (numericGrade >= 60) return 'C'
  if (numericGrade >= 50) return 'D'
  return 'F'
} 