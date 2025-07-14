import { google } from 'googleapis'
import { StudentResult, GoogleSheetsRow } from '@/types/student'
import { User } from '@/types/auth'
import bcrypt from 'bcrypt'

const sheets = google.sheets('v4')

export class GoogleSheetsService {
  private auth: any

  constructor() {
    this.auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SHEETS_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_SHEETS_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    })
  }

  // User Management Functions

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Users!A:P', // Updated range for more columns
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return null
      }

      // Find user by email (email is in column B)
      const userRow = rows.find(row => row[1] === email)
      
      if (!userRow) {
        return null
      }

      return {
        id: userRow[0] || '',
        email: userRow[1] || '',
        firstName: userRow[3] || '',
        lastName: userRow[4] || '',
        examNumber: userRow[5] || '',
        title: userRow[6] || '',
        gender: userRow[7] || '',
        country: userRow[8] || '',
        phoneNumber: userRow[9] || '',
        seniorDeputyArchBishop: userRow[10] || '',
        region: userRow[11] || '',
        alter: userRow[12] || '',
        department: userRow[13] || '',
        createdAt: userRow[14] || '',
        updatedAt: userRow[15] || '',
      }
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  }

  async createUser(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    examNumber: string,
    title: string,
    gender: string,
    country: string,
    phoneNumber: string,
    seniorDeputyArchBishop: string,
    region: string,
    alter: string,
    department: string
  ): Promise<User> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email)
      if (existingUser) {
        throw new Error('User already exists')
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10)

      // Generate user ID
      const userId = `user_${Date.now()}`
      const timestamp = new Date().toISOString()

      // Prepare user data - Updated column structure
      const userRow = [
        userId,                    // A: ID
        email,                     // B: Email
        hashedPassword,            // C: PasswordHash
        firstName,                 // D: FirstName
        lastName,                  // E: LastName
        examNumber,                // F: ExamNumber
        title,                     // G: Title
        gender,                    // H: Gender
        country,                   // I: Country
        phoneNumber,               // J: PhoneNumber
        seniorDeputyArchBishop,    // K: SeniorDeputyArchBishop
        region,                    // L: Region
        alter,                     // M: Alter
        department,                // N: Department
        timestamp,                 // O: CreatedAt
        timestamp                  // P: UpdatedAt
      ]

      // Add user to Users sheet
      await sheets.spreadsheets.values.append({
        auth: authClient,
        spreadsheetId,
        range: 'Users!A:P',
        valueInputOption: 'RAW',
        requestBody: {
          values: [userRow]
        }
      })

      return {
        id: userId,
        email,
        firstName,
        lastName,
        examNumber,
        title,
        gender,
        country,
        phoneNumber,
        seniorDeputyArchBishop,
        region,
        alter,
        department,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  }

  async validateUserPassword(email: string, password: string): Promise<User | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Users!A:P',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return null
      }

      // Find user by email
      const userRow = rows.find(row => row[1] === email)
      
      if (!userRow) {
        return null
      }

      // Verify password
      const hashedPassword = userRow[2]
      const isPasswordValid = await bcrypt.compare(password, hashedPassword)
      
      if (!isPasswordValid) {
        return null
      }

      return {
        id: userRow[0] || '',
        email: userRow[1] || '',
        firstName: userRow[3] || '',
        lastName: userRow[4] || '',
        examNumber: userRow[5] || '',
        title: userRow[6] || '',
        gender: userRow[7] || '',
        country: userRow[8] || '',
        phoneNumber: userRow[9] || '',
        seniorDeputyArchBishop: userRow[10] || '',
        region: userRow[11] || '',
        alter: userRow[12] || '',
        department: userRow[13] || '',
        createdAt: userRow[14] || '',
        updatedAt: userRow[15] || '',
      }
    } catch (error) {
      console.error('Error validating user password:', error)
      throw error
    }
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Users!A:P',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return null
      }

      // Find user row index
      const userRowIndex = rows.findIndex(row => row[0] === userId)
      
      if (userRowIndex === -1) {
        return null
      }

      const userRow = rows[userRowIndex]
      const timestamp = new Date().toISOString()

      // Update user data
      const updatedRow = [
        userRow[0],                                    // A: ID
        updates.email || userRow[1],                   // B: Email
        userRow[2],                                    // C: PasswordHash (not updated here)
        updates.firstName || userRow[3],               // D: FirstName
        updates.lastName || userRow[4],                // E: LastName
        updates.examNumber || userRow[5],              // F: ExamNumber
        updates.title || userRow[6],                   // G: Title
        updates.gender || userRow[7],                  // H: Gender
        updates.country || userRow[8],                 // I: Country
        updates.phoneNumber || userRow[9],             // J: PhoneNumber
        updates.seniorDeputyArchBishop || userRow[10], // K: SeniorDeputyArchBishop
        updates.region || userRow[11],                 // L: Region
        updates.alter || userRow[12],                  // M: Alter
        updates.department || userRow[13],             // N: Department
        userRow[14],                                   // O: CreatedAt
        timestamp                                      // P: UpdatedAt
      ]

      // Update the specific row
      await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId,
        range: `Users!A${userRowIndex + 1}:P${userRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updatedRow]
        }
      })

      return {
        id: updatedRow[0],
        email: updatedRow[1],
        firstName: updatedRow[3],
        lastName: updatedRow[4],
        examNumber: updatedRow[5],
        title: updatedRow[6],
        gender: updatedRow[7],
        country: updatedRow[8],
        phoneNumber: updatedRow[9],
        seniorDeputyArchBishop: updatedRow[10],
        region: updatedRow[11],
        alter: updatedRow[12],
        department: updatedRow[13],
        createdAt: updatedRow[14],
        updatedAt: updatedRow[15],
      }
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  }

  // Existing student result functions...

  async getStudentResult(examNumber: string): Promise<StudentResult | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      // Get the data from the sheet
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Sheet1!A:X', // Adjust range as needed
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return null
      }

      // First row should contain headers
      const headers = rows[0]
      
      // Find the row with the matching exam number
      const dataRow = rows.find(row => row[0] === examNumber)
      
      if (!dataRow) {
        return null
      }

      // Map the row data to our StudentResult interface
      const result: StudentResult = {
        examNumber: dataRow[0] || '',
        name: dataRow[1] || '',
        oldTestamentSurvey: dataRow[2] || '',
        newTestamentSurvey: dataRow[3] || '',
        prophets: dataRow[4] || '',
        paulsMissionaryJourney: dataRow[5] || '',
        hebrewLanguage: dataRow[6] || '',
        bookOfHebrew: dataRow[7] || '',
        greekLanguage: dataRow[8] || '',
        bibleStudyMethod: dataRow[9] || '',
        bookOfRomans: dataRow[10] || '',
        theBookOfJudges: dataRow[11] || '',
        abrahamsJourney: dataRow[12] || '',
        kingsOfIsrael: dataRow[13] || '',
        kingsOfJudah: dataRow[14] || '',
        epistles: dataRow[15] || '',
        churchHistory: dataRow[16] || '',
        theology: dataRow[17] || '',
        tabernacle: dataRow[18] || '',
        theBookOfEzekiel: dataRow[19] || '',
        theJourneyOfIsraelites: dataRow[20] || '',
        churchAdministration: dataRow[21] || '',
        practicum: dataRow[22] || '',
        ref: dataRow[23] || '',
      }

      return result
    } catch (error) {
      console.error('Error fetching student result:', error)
      throw error
    }
  }

  async validateConnection(): Promise<boolean> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        return false
      }

      const response = await sheets.spreadsheets.get({
        auth: authClient,
        spreadsheetId,
      })

      return !!response.data
    } catch (error) {
      console.error('Error validating Google Sheets connection:', error)
      return false
    }
  }
}

export const googleSheetsService = new GoogleSheetsService() 