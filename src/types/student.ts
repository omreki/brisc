export interface StudentResult {
  examNumber: string
  name: string
  oldTestamentSurvey: string
  newTestamentSurvey: string
  prophets: string
  paulsMissionaryJourney: string
  hebrewLanguage: string
  bookOfHebrew: string
  greekLanguage: string
  bibleStudyMethod: string
  bookOfRomans: string
  theBookOfJudges: string
  abrahamsJourney: string
  kingsOfIsrael: string
  kingsOfJudah: string
  epistles: string
  churchHistory: string
  theology: string
  tabernacle: string
  theBookOfEzekiel: string
  theJourneyOfIsraelites: string
  churchAdministration: string
  practicum: string
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

export interface ExamLookupResponse {
  success: boolean
  data?: StudentResult
  message: string
}

export interface GoogleSheetsRow {
  [key: string]: string
} 