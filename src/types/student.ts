export interface StudentResult {
  examNumber: string
  admissionNumber: string
  name: string
  dateOfBirth: string
  // Full subject names
  oldTestamentSurvey: string
  newTestamentSurvey: string
  prophets: string
  paulsMissionaryJourney: string
  churchHistory: string
  bookOfHebrew: string
  greekLanguage: string
  bibleStudyMethod: string
  bookOfRomans: string
  theBookOfJudges: string
  abrahamsJourney: string
  kingsOfIsrael: string
  kingsOfJudah: string
  epistles: string
  hebrewLanguage: string
  theology: string
  tabernacle: string
  theBookOfEzekiel: string
  theJourneyOfIsraelites: string
  churchAdministration: string
  practicum: string
  overallGradePoint: string
  overallGrade: string
  // Abbreviated subject names
  oldT: string
  newT: string
  pro: string
  pauls: string
  hebrewL: string
  hebrew: string
  greekL: string
  bibleStu: string
  bookOfRo: string
  theBookOfJu: string
  abrahams: string
  kingsOfIsr: string
  kingsOfJu: string
  epis: string
  churchHis: string
  theol: string
  tabe: string
  theBookOfEze: string
  theJourneyOfIsra: string
  churchAdmi: string
  prac: string
  over: string
  ref: string
}

export interface PaymentData {
  examNumber: string
  amount: number
  currency: string
  phoneNumber: string
  email?: string
}

export interface PaymentResponse {
  success: boolean
  message?: string
  paymentId?: string
  transactionId?: string
  apiRef?: string
}

export interface PaymentRecord {
  id: string
  userId?: string
  examNumber: string
  paymentId: string
  transactionId?: string
  apiRef?: string
  amount: number
  currency: string
  phoneNumber: string
  email?: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  paymentMethod: string
  createdAt: string
  updatedAt: string
  completedAt?: string
  failureReason?: string
  webhookData?: any
}

export interface PaymentVerificationResult {
  isValid: boolean
  hasValidPayment: boolean
  paymentRecord?: PaymentRecord
  studentResult?: StudentResult
  message: string
}

export interface UserResultRecord {
  id: string
  userId: string
  examNumber: string
  studentName: string
  paymentId: string
  resultData: StudentResult
  downloadCount: number
  createdAt: string
  updatedAt: string
}

export interface ExamLookupResponse {
  success: boolean
  data?: StudentResult
  message: string
  paymentRequired?: boolean
  paymentRecord?: PaymentRecord
}

export interface GoogleSheetsRow {
  [key: string]: string
} 