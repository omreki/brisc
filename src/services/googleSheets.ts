import { google } from 'googleapis'
import { StudentResult, GoogleSheetsRow, UserResultRecord, PaymentRecord, PaymentVerificationResult } from '@/types/student'
import { User } from '@/types/auth'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

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
      // Check environment variables first
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID
      const clientEmail = process.env.GOOGLE_SHEETS_CLIENT_EMAIL
      const privateKey = process.env.GOOGLE_SHEETS_PRIVATE_KEY

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      if (!clientEmail) {
        throw new Error('Google Sheets client email not configured')
      }

      if (!privateKey) {
        throw new Error('Google Sheets private key not configured')
      }

      console.log('Attempting to authenticate with Google Sheets...')
      const authClient = await this.auth.getClient()
      console.log('Google Sheets authentication successful')

      console.log('Fetching user data from spreadsheet...')
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Users!A:P',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        console.log('No users found in spreadsheet')
        return null
      }

      console.log(`Found ${rows.length} rows in Users sheet`)

      // Find user by email
      const userRow = rows.find(row => row[1] === email)
      
      if (!userRow) {
        console.log(`User with email ${email} not found`)
        return null
      }

      console.log(`User found: ${email}`)

      // Verify password
      const hashedPassword = userRow[2]
      if (!hashedPassword) {
        console.log('No password hash found for user')
        return null
      }

      const isPasswordValid = await bcrypt.compare(password, hashedPassword)
      console.log(`Password validation result: ${isPasswordValid}`)
      
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
    } catch (error: any) {
      console.error('validateUserPassword error:', error)
      console.error('Error details:', error.message)
      
      // Re-throw with more context
      if (error.message?.includes('not configured')) {
        throw new Error(`Google Sheets configuration error: ${error.message}`)
      } else if (error.message?.includes('insufficient_scope')) {
        throw new Error('Google Sheets API: Insufficient permissions')
      } else if (error.message?.includes('Invalid credentials')) {
        throw new Error('Google Sheets API: Invalid credentials')
      } else {
        throw new Error(`Google Sheets API error: ${error.message}`)
      }
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

  // User Results Management Functions

  async saveUserResult(
    userId: string,
    examNumber: string,
    studentName: string,
    paymentId: string,
    resultData: StudentResult
  ): Promise<UserResultRecord | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      // Generate result record ID
      const resultId = `result_${Date.now()}`
      const timestamp = new Date().toISOString()

      // Prepare result data - Store in UserResults sheet
      const resultRow = [
        resultId,                             // A: ID
        userId,                               // B: UserID
        examNumber,                           // C: ExamNumber
        studentName,                          // D: StudentName
        paymentId,                            // E: PaymentID
        JSON.stringify(resultData),           // F: ResultData (JSON)
        '1',                                  // G: DownloadCount
        timestamp,                            // H: CreatedAt
        timestamp                             // I: UpdatedAt
      ]

      // Add result to UserResults sheet
      await sheets.spreadsheets.values.append({
        auth: authClient,
        spreadsheetId,
        range: 'UserResults!A:I',
        valueInputOption: 'RAW',
        requestBody: {
          values: [resultRow]
        }
      })

      return {
        id: resultId,
        userId,
        examNumber,
        studentName,
        paymentId,
        resultData,
        downloadCount: 1,
        createdAt: timestamp,
        updatedAt: timestamp,
      }
    } catch (error) {
      console.error('Error saving user result:', error)
      return null
    }
  }

  async getUserResults(userId: string): Promise<UserResultRecord[]> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'UserResults!A:I',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return []
      }

      // Filter results by userId and map to UserResultRecord
      const userResults: UserResultRecord[] = []
      
      for (const row of rows) {
        if (row[1] === userId) { // UserID is in column B
          try {
            const resultData = JSON.parse(row[5]) as StudentResult
            userResults.push({
              id: row[0] || '',
              userId: row[1] || '',
              examNumber: row[2] || '',
              studentName: row[3] || '',
              paymentId: row[4] || '',
              resultData,
              downloadCount: parseInt(row[6]) || 0,
              createdAt: row[7] || '',
              updatedAt: row[8] || '',
            })
          } catch (error) {
            console.error('Error parsing result data:', error)
            // Skip malformed records
          }
        }
      }

      // Sort by creation date (newest first)
      return userResults.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } catch (error) {
      console.error('Error fetching user results:', error)
      return []
    }
  }

  async getUserResultByExamNumber(userId: string, examNumber: string): Promise<UserResultRecord | null> {
    try {
      const userResults = await this.getUserResults(userId)
      return userResults.find(result => result.examNumber === examNumber) || null
    } catch (error) {
      console.error('Error fetching user result by exam number:', error)
      return null
    }
  }

  async incrementDownloadCount(resultId: string): Promise<boolean> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'UserResults!A:I',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return false
      }

      // Find the row with the matching result ID
      const rowIndex = rows.findIndex(row => row[0] === resultId)
      
      if (rowIndex === -1) {
        return false
      }

      // Increment download count
      const currentCount = parseInt(rows[rowIndex][6]) || 0
      const newCount = currentCount + 1
      const timestamp = new Date().toISOString()

      // Update the row
      await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId,
        range: `UserResults!G${rowIndex + 1}:I${rowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [[newCount.toString(), rows[rowIndex][7], timestamp]]
        }
      })

      return true
    } catch (error) {
      console.error('Error incrementing download count:', error)
      return false
    }
  }

  // Password Reset Token Management Functions

  async generatePasswordResetToken(userId: string): Promise<string | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      // Generate secure token
      const resetToken = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes from now
      const timestamp = new Date().toISOString()

      // Clean up expired tokens for this user first
      await this.cleanupExpiredTokens(userId)

      // Store token in PasswordResetTokens sheet
      const tokenRow = [
        `token_${Date.now()}`,           // A: ID
        userId,                          // B: UserID
        resetToken,                      // C: Token
        expiresAt.toISOString(),         // D: ExpiresAt
        'false',                         // E: Used
        timestamp,                       // F: CreatedAt
      ]

      await sheets.spreadsheets.values.append({
        auth: authClient,
        spreadsheetId,
        range: 'PasswordResetTokens!A:F',
        valueInputOption: 'RAW',
        requestBody: {
          values: [tokenRow]
        }
      })

      return resetToken
    } catch (error) {
      console.error('Error generating password reset token:', error)
      return null
    }
  }

  async validatePasswordResetToken(token: string): Promise<{ isValid: boolean; userId?: string }> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'PasswordResetTokens!A:F',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return { isValid: false }
      }

      // Find token and check if it's valid
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row[2] === token) { // Token is in column C
          const expiresAt = new Date(row[3])
          const used = row[4] === 'true'
          const now = new Date()

          if (used) {
            return { isValid: false } // Token already used
          }

          if (now > expiresAt) {
            return { isValid: false } // Token expired
          }

          // Token is valid
          return { isValid: true, userId: row[1] }
        }
      }

      return { isValid: false } // Token not found
    } catch (error) {
      console.error('Error validating password reset token:', error)
      return { isValid: false }
    }
  }

  async markTokenAsUsed(token: string): Promise<boolean> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'PasswordResetTokens!A:F',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return false
      }

      // Find token and mark as used
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row[2] === token) { // Token is in column C
          // Update the Used column (E) to true
          await sheets.spreadsheets.values.update({
            auth: authClient,
            spreadsheetId,
            range: `PasswordResetTokens!E${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [['true']]
            }
          })
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error marking token as used:', error)
      return false
    }
  }

  async updateUserPassword(userId: string, newPassword: string): Promise<boolean> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 10)

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Users!A:P',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return false
      }

      // Find user and update password
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row[0] === userId) { // UserID is in column A
          const timestamp = new Date().toISOString()
          
          // Update password hash (column C) and updatedAt (column P)
          await sheets.spreadsheets.values.update({
            auth: authClient,
            spreadsheetId,
            range: `Users!C${i + 1}:C${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[hashedPassword]]
            }
          })

          // Update updatedAt timestamp
          await sheets.spreadsheets.values.update({
            auth: authClient,
            spreadsheetId,
            range: `Users!P${i + 1}:P${i + 1}`,
            valueInputOption: 'RAW',
            requestBody: {
              values: [[timestamp]]
            }
          })

          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error updating user password:', error)
      return false
    }
  }

  private async cleanupExpiredTokens(userId: string): Promise<void> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        return
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'PasswordResetTokens!A:F',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return
      }

      const now = new Date()
      const rowsToDelete: number[] = []

      // Find expired tokens for this user
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        if (row[1] === userId) { // UserID is in column B
          const expiresAt = new Date(row[3])
          if (now > expiresAt) {
            rowsToDelete.push(i + 1) // +1 because sheets are 1-indexed
          }
        }
      }

      // Delete expired tokens (in reverse order to maintain indices)
      for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        const rowIndex = rowsToDelete[i]
        await sheets.spreadsheets.batchUpdate({
          auth: authClient,
          spreadsheetId,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0, // Assumes PasswordResetTokens is the first sheet, you may need to adjust
                  dimension: 'ROWS',
                  startIndex: rowIndex - 1,
                  endIndex: rowIndex
                }
              }
            }]
          }
        })
      }
    } catch (error) {
      console.error('Error cleaning up expired tokens:', error)
      // Don't throw error, this is a cleanup operation
    }
  }

  // Payment Management Functions

  async recordPayment(paymentRecord: Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<PaymentRecord | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      // Generate payment record ID
      const paymentId = `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = new Date().toISOString()

      // Prepare payment record data for Payments sheet
      const paymentRow = [
        paymentId,                           // A: ID
        paymentRecord.userId || '',          // B: UserId
        paymentRecord.examNumber,            // C: ExamNumber
        paymentRecord.paymentId,             // D: PaymentId (IntaSend invoice ID)
        paymentRecord.transactionId || '',   // E: TransactionId
        paymentRecord.apiRef || '',          // F: ApiRef
        paymentRecord.amount.toString(),     // G: Amount
        paymentRecord.currency,              // H: Currency
        paymentRecord.phoneNumber,           // I: PhoneNumber
        paymentRecord.email || '',           // J: Email
        paymentRecord.status,                // K: Status
        paymentRecord.paymentMethod,         // L: PaymentMethod
        timestamp,                           // M: CreatedAt
        timestamp,                           // N: UpdatedAt
        paymentRecord.completedAt || '',     // O: CompletedAt
        paymentRecord.failureReason || '',   // P: FailureReason
        JSON.stringify(paymentRecord.webhookData || {}) // Q: WebhookData
      ]

      // Add payment record to Payments sheet
      await sheets.spreadsheets.values.append({
        auth: authClient,
        spreadsheetId,
        range: 'Payments!A:Q',
        valueInputOption: 'RAW',
        requestBody: {
          values: [paymentRow]
        }
      })

      const newPaymentRecord: PaymentRecord = {
        id: paymentId,
        userId: paymentRecord.userId,
        examNumber: paymentRecord.examNumber,
        paymentId: paymentRecord.paymentId,
        transactionId: paymentRecord.transactionId,
        apiRef: paymentRecord.apiRef,
        amount: paymentRecord.amount,
        currency: paymentRecord.currency,
        phoneNumber: paymentRecord.phoneNumber,
        email: paymentRecord.email,
        status: paymentRecord.status,
        paymentMethod: paymentRecord.paymentMethod,
        createdAt: timestamp,
        updatedAt: timestamp,
        completedAt: paymentRecord.completedAt,
        failureReason: paymentRecord.failureReason,
        webhookData: paymentRecord.webhookData
      }

      console.log(`Payment recorded successfully: ${paymentId}`)
      return newPaymentRecord

    } catch (error) {
      console.error('Error recording payment:', error)
      throw error
    }
  }

  async updatePaymentStatus(
    paymentId: string, 
    status: PaymentRecord['status'], 
    completedAt?: string,
    failureReason?: string,
    webhookData?: any
  ): Promise<PaymentRecord | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      // Get all payment records
      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Payments!A:Q',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        console.log('No payment records found')
        return null
      }

      // Find payment by paymentId (IntaSend invoice ID)
      const paymentRowIndex = rows.findIndex(row => row[3] === paymentId) // PaymentId is in column D (index 3)
      
      if (paymentRowIndex === -1) {
        console.log(`Payment with ID ${paymentId} not found`)
        return null
      }

      const paymentRow = rows[paymentRowIndex]
      const timestamp = new Date().toISOString()

      // Update the payment record
      const updatedRow = [
        paymentRow[0],                       // A: ID
        paymentRow[1],                       // B: UserId
        paymentRow[2],                       // C: ExamNumber
        paymentRow[3],                       // D: PaymentId
        paymentRow[4],                       // E: TransactionId
        paymentRow[5],                       // F: ApiRef
        paymentRow[6],                       // G: Amount
        paymentRow[7],                       // H: Currency
        paymentRow[8],                       // I: PhoneNumber
        paymentRow[9],                       // J: Email
        status,                              // K: Status
        paymentRow[11],                      // L: PaymentMethod
        paymentRow[12],                      // M: CreatedAt
        timestamp,                           // N: UpdatedAt
        completedAt || paymentRow[14],       // O: CompletedAt
        failureReason || paymentRow[15],     // P: FailureReason
        JSON.stringify(webhookData || JSON.parse(paymentRow[16] || '{}')) // Q: WebhookData
      ]

      // Update the specific row
      await sheets.spreadsheets.values.update({
        auth: authClient,
        spreadsheetId,
        range: `Payments!A${paymentRowIndex + 1}:Q${paymentRowIndex + 1}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updatedRow]
        }
      })

      const updatedPaymentRecord: PaymentRecord = {
        id: updatedRow[0],
        userId: updatedRow[1],
        examNumber: updatedRow[2],
        paymentId: updatedRow[3],
        transactionId: updatedRow[4],
        apiRef: updatedRow[5],
        amount: parseFloat(updatedRow[6]),
        currency: updatedRow[7],
        phoneNumber: updatedRow[8],
        email: updatedRow[9],
        status: updatedRow[10] as PaymentRecord['status'],
        paymentMethod: updatedRow[11],
        createdAt: updatedRow[12],
        updatedAt: updatedRow[13],
        completedAt: updatedRow[14],
        failureReason: updatedRow[15],
        webhookData: JSON.parse(updatedRow[16] || '{}')
      }

      console.log(`Payment status updated: ${paymentId} -> ${status}`)
      return updatedPaymentRecord

    } catch (error) {
      console.error('Error updating payment status:', error)
      throw error
    }
  }

  async getPaymentByPaymentId(paymentId: string): Promise<PaymentRecord | null> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Payments!A:Q',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return null
      }

      // Find payment by paymentId (IntaSend invoice ID)
      const paymentRow = rows.find(row => row[3] === paymentId) // PaymentId is in column D (index 3)
      
      if (!paymentRow) {
        return null
      }

      return {
        id: paymentRow[0] || '',
        userId: paymentRow[1] || '',
        examNumber: paymentRow[2] || '',
        paymentId: paymentRow[3] || '',
        transactionId: paymentRow[4] || '',
        apiRef: paymentRow[5] || '',
        amount: parseFloat(paymentRow[6] || '0'),
        currency: paymentRow[7] || '',
        phoneNumber: paymentRow[8] || '',
        email: paymentRow[9] || '',
        status: (paymentRow[10] || 'pending') as PaymentRecord['status'],
        paymentMethod: paymentRow[11] || '',
        createdAt: paymentRow[12] || '',
        updatedAt: paymentRow[13] || '',
        completedAt: paymentRow[14] || '',
        failureReason: paymentRow[15] || '',
        webhookData: JSON.parse(paymentRow[16] || '{}')
      }

    } catch (error) {
      console.error('Error fetching payment by payment ID:', error)
      throw error
    }
  }

  async getPaymentsByExamNumber(examNumber: string): Promise<PaymentRecord[]> {
    try {
      const authClient = await this.auth.getClient()
      const spreadsheetId = process.env.GOOGLE_SHEETS_SHEET_ID

      if (!spreadsheetId) {
        throw new Error('Google Sheets ID not configured')
      }

      const response = await sheets.spreadsheets.values.get({
        auth: authClient,
        spreadsheetId,
        range: 'Payments!A:Q',
      })

      const rows = response.data.values
      if (!rows || rows.length === 0) {
        return []
      }

      // Find all payments for this exam number
      const paymentRows = rows.filter(row => row[2] === examNumber) // ExamNumber is in column C (index 2)
      
      return paymentRows.map(row => ({
        id: row[0] || '',
        userId: row[1] || '',
        examNumber: row[2] || '',
        paymentId: row[3] || '',
        transactionId: row[4] || '',
        apiRef: row[5] || '',
        amount: parseFloat(row[6] || '0'),
        currency: row[7] || '',
        phoneNumber: row[8] || '',
        email: row[9] || '',
        status: (row[10] || 'pending') as PaymentRecord['status'],
        paymentMethod: row[11] || '',
        createdAt: row[12] || '',
        updatedAt: row[13] || '',
        completedAt: row[14] || '',
        failureReason: row[15] || '',
        webhookData: JSON.parse(row[16] || '{}')
      }))

    } catch (error) {
      console.error('Error fetching payments by exam number:', error)
      throw error
    }
  }

  async verifyPaymentForExamAccess(examNumber: string, userId?: string): Promise<PaymentVerificationResult> {
    try {
      // Get all payments for this exam number
      const payments = await this.getPaymentsByExamNumber(examNumber)
      
      if (payments.length === 0) {
        return {
          isValid: false,
          hasValidPayment: false,
          message: 'No payment records found for this exam number'
        }
      }

      // Look for a completed payment
      const completedPayment = payments.find(payment => payment.status === 'completed')
      
      if (!completedPayment) {
        // Check if there are any pending payments
        const pendingPayments = payments.filter(payment => payment.status === 'pending')
        
        if (pendingPayments.length > 0) {
          return {
            isValid: false,
            hasValidPayment: false,
            paymentRecord: pendingPayments[0],
            message: 'Payment is still being processed. Please wait a few minutes and try again.'
          }
        }

        // Only failed/cancelled payments
        const failedPayment = payments.find(payment => payment.status === 'failed' || payment.status === 'cancelled')
        return {
          isValid: false,
          hasValidPayment: false,
          paymentRecord: failedPayment,
          message: 'Payment was not successful. Please make a new payment to access results.'
        }
      }

      // If userId is provided, verify it matches the payment
      if (userId && completedPayment.userId && completedPayment.userId !== userId) {
        return {
          isValid: false,
          hasValidPayment: true,
          paymentRecord: completedPayment,
          message: 'Payment found but belongs to a different user account'
        }
      }

      return {
        isValid: true,
        hasValidPayment: true,
        paymentRecord: completedPayment,
        message: 'Payment verified successfully'
      }

    } catch (error) {
      console.error('Error verifying payment for exam access:', error)
      return {
        isValid: false,
        hasValidPayment: false,
        message: 'Error verifying payment. Please try again.'
      }
    }
  }
}

export const googleSheetsService = new GoogleSheetsService() 