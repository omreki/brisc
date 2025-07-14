import nodemailer from 'nodemailer'
import { StudentResult } from '@/types/student'

export class EmailService {
  private transporter: nodemailer.Transporter
  private fromEmail: string = 'topnotchlimted21@gmail.com'
  private fromName: string = 'Student Portal'

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || 'topnotchlimted21@gmail.com',
        pass: process.env.SMTP_PASS,
      },
      // Additional options for better deliverability
      tls: {
        rejectUnauthorized: false
      }
    })
  }

  private getFromAddress(): string {
    return `"${this.fromName}" <${this.fromEmail}>`
  }

  async sendResultsPDF(
    userEmail: string,
    studentName: string,
    examNumber: string,
    pdfBuffer: Buffer
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const mailOptions = {
        from: this.getFromAddress(),
        to: userEmail,
        subject: `Your Exam Results - ${examNumber}`,
        // Add additional headers for better deliverability
        headers: {
          'X-Mailer': 'Student Portal',
          'X-Priority': '1',
          'Importance': 'high'
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Student Portal</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Your Exam Results</p>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Dear ${studentName},</h2>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                Your exam results for <strong>${examNumber}</strong> are now available. 
                Please find your detailed results attached as a PDF document.
              </p>
              
              <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">Important Notes:</h3>
                <ul style="color: #075985; margin: 10px 0; padding-left: 20px;">
                  <li>This PDF contains your complete academic performance report</li>
                  <li>Keep this document for your records</li>
                  <li>Contact support if you have any questions about your results</li>
                </ul>
              </div>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                You can also access your results anytime by logging into your account on the Student Portal.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.NEXTAUTH_URL || 'https://yourapp.com'}" 
                   style="background-color: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                  Visit Student Portal
                </a>
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                This is an automated email from Student Portal. Please do not reply to this email.
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} Student Portal. All rights reserved.
              </p>
            </div>
          </div>
        `,
        attachments: [
          {
            filename: `${studentName}_${examNumber}_Results.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf',
          },
        ],
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      console.log('Email sent successfully:', info.messageId)
      console.log('Email sent to:', userEmail)
      console.log('Email sent from:', this.getFromAddress())
      
      return {
        success: true,
        message: 'Email sent successfully',
      }
    } catch (error: any) {
      console.error('Error sending email:', error)
      console.error('Email details:', { userEmail, studentName, examNumber })
      
      return {
        success: false,
        message: error.message || 'Failed to send email',
      }
    }
  }

  async sendPaymentReceiptEmail(
    userEmail: string,
    studentName: string,
    examNumber: string,
    amount: number,
    paymentId: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const mailOptions = {
        from: this.getFromAddress(),
        to: userEmail,
        subject: `Payment Receipt - ${examNumber}`,
        headers: {
          'X-Mailer': 'Student Portal',
          'X-Priority': '1',
          'Importance': 'high'
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Payment Receipt</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Student Portal</p>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Payment Confirmation</h2>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                Dear ${studentName},
              </p>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
                Thank you for your payment. Your transaction has been processed successfully.
              </p>
              
              <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bbf7d0;">
                <h3 style="color: #047857; margin-top: 0;">Payment Details:</h3>
                <table style="width: 100%; color: #065f46;">
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold;">Student Name:</td>
                    <td style="padding: 5px 0;">${studentName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold;">Exam Number:</td>
                    <td style="padding: 5px 0;">${examNumber}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold;">Amount Paid:</td>
                    <td style="padding: 5px 0;">KSh ${amount}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold;">Payment ID:</td>
                    <td style="padding: 5px 0;">${paymentId}</td>
                  </tr>
                  <tr>
                    <td style="padding: 5px 0; font-weight: bold;">Date:</td>
                    <td style="padding: 5px 0;">${new Date().toLocaleDateString()}</td>
                  </tr>
                </table>
              </div>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                Your results are now available for download. You will receive a separate email with your results PDF shortly.
              </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                Keep this receipt for your records. If you have any questions, please contact our support team.
              </p>
            </div>
          </div>
        `,
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      console.log('Payment receipt email sent successfully:', info.messageId)
      console.log('Email sent to:', userEmail)
      console.log('Email sent from:', this.getFromAddress())
      
      return {
        success: true,
        message: 'Payment receipt email sent successfully',
      }
    } catch (error: any) {
      console.error('Error sending payment receipt email:', error)
      console.error('Email details:', { userEmail, studentName, examNumber, amount, paymentId })
      
      return {
        success: false,
        message: error.message || 'Failed to send payment receipt email',
      }
    }
  }

  async sendResultsEmail(
    userEmail: string,
    studentName: string,
    examNumber: string,
    studentResult: StudentResult
  ): Promise<{ success: boolean; message?: string }> {
    try {
      // Get all subject fields and their values
      const subjects = [
        { name: 'Old Testament Survey', value: studentResult.oldTestamentSurvey },
        { name: 'New Testament Survey', value: studentResult.newTestamentSurvey },
        { name: 'Prophets', value: studentResult.prophets },
        { name: "Paul's Missionary Journey", value: studentResult.paulsMissionaryJourney },
        { name: 'Hebrew Language', value: studentResult.hebrewLanguage },
        { name: 'Book of Hebrew', value: studentResult.bookOfHebrew },
        { name: 'Greek Language', value: studentResult.greekLanguage },
        { name: 'Bible Study Method', value: studentResult.bibleStudyMethod },
        { name: 'Book of Romans', value: studentResult.bookOfRomans },
        { name: 'The Book of Judges', value: studentResult.theBookOfJudges },
        { name: "Abraham's Journey", value: studentResult.abrahamsJourney },
        { name: 'Kings of Israel', value: studentResult.kingsOfIsrael },
        { name: 'Kings of Judah', value: studentResult.kingsOfJudah },
        { name: 'Epistles', value: studentResult.epistles },
        { name: 'Church History', value: studentResult.churchHistory },
        { name: 'Theology', value: studentResult.theology },
        { name: 'Tabernacle', value: studentResult.tabernacle },
        { name: 'The Book of Ezekiel', value: studentResult.theBookOfEzekiel },
        { name: 'The Journey of Israelites', value: studentResult.theJourneyOfIsraelites },
        { name: 'Church Administration', value: studentResult.churchAdministration },
        { name: 'Practicum', value: studentResult.practicum }
      ].filter(subject => subject.value && subject.value.trim() !== '')

      const subjectsHtml = subjects.map(subject => `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #374151;">${subject.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #e2e8f0; text-align: center; color: #1f2937;">${subject.value}</td>
        </tr>
      `).join('')

      const mailOptions = {
        from: this.getFromAddress(),
        to: userEmail,
        subject: `Your Exam Results - ${examNumber}`,
        headers: {
          'X-Mailer': 'Student Portal',
          'X-Priority': '1',
          'Importance': 'high'
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Exam Results</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Student Portal</p>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Your Academic Results</h2>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                Dear ${studentName},
              </p>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
                Congratulations! Your exam results are ready. Please find your detailed results below.
              </p>
              
              <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #bfdbfe;">
                <h3 style="color: #1e40af; margin-top: 0;">Student Information:</h3>
                <p style="color: #1e3a8a; margin: 5px 0;"><strong>Student Name:</strong> ${studentName}</p>
                <p style="color: #1e3a8a; margin: 5px 0;"><strong>Exam Number:</strong> ${examNumber}</p>
                <p style="color: #1e3a8a; margin: 5px 0;"><strong>Results Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              
              <div style="background-color: #ffffff; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
                <h3 style="color: #374151; margin-top: 0;">Subject Results:</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <thead>
                    <tr style="background-color: #f9fafb;">
                      <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #374151;">Subject</th>
                      <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e5e7eb; color: #374151;">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${subjectsHtml}
                  </tbody>
                </table>
              </div>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                You can also access your results anytime by logging into the student portal.
              </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                This is an automated email from the Student Portal. Keep this email for your records.
              </p>
            </div>
          </div>
        `,
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      console.log('Results email sent successfully:', info.messageId)
      console.log('Email sent to:', userEmail)
      console.log('Email sent from:', this.getFromAddress())
      
      return {
        success: true,
        message: 'Results email sent successfully',
      }
    } catch (error) {
      console.error('Error sending results email:', error)
      return {
        success: false,
        message: `Failed to send results email: ${error instanceof Error ? error.message : 'Unknown error'}`,
      }
    }
  }

  async sendPasswordResetEmail(
    userEmail: string,
    userName: string,
    resetToken: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const resetLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`

      const mailOptions = {
        from: this.getFromAddress(),
        to: userEmail,
        subject: 'Password Reset Request - Student Portal',
        headers: {
          'X-Mailer': 'Student Portal',
          'X-Priority': '1',
          'Importance': 'high'
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Password Reset</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Student Portal</p>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Password Reset Request</h2>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                Dear ${userName},
              </p>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password for your Student Portal account. If you didn't make this request, you can safely ignore this email.
              </p>
              
              <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #f59e0b;">
                <h3 style="color: #92400e; margin-top: 0;">Security Notice:</h3>
                <ul style="color: #92400e; margin: 10px 0; padding-left: 20px;">
                  <li>This link will expire in 15 minutes for security reasons</li>
                  <li>You can only use this link once</li>
                  <li>If you didn't request this reset, please contact support</li>
                </ul>
              </div>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 30px;">
                To reset your password, click the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${resetLink}" 
                   style="background-color: #dc2626; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                  Reset My Password
                </a>
              </div>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">
                If the button doesn't work, you can copy and paste this link into your browser:
              </p>
              
              <div style="background-color: #e5e7eb; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px; color: #374151;">
                ${resetLink}
              </div>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                This password reset link will expire in 15 minutes. If you need help, please contact our support team.
              </p>
              <p style="color: #64748b; font-size: 12px; margin: 10px 0 0 0;">
                © ${new Date().getFullYear()} Student Portal. All rights reserved.
              </p>
            </div>
          </div>
        `,
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      console.log('Password reset email sent successfully:', info.messageId)
      console.log('Email sent to:', userEmail)
      console.log('Email sent from:', this.getFromAddress())
      
      return {
        success: true,
        message: 'Password reset email sent successfully',
      }
    } catch (error: any) {
      console.error('Error sending password reset email:', error)
      console.error('Email details:', { userEmail, userName, resetToken: resetToken.substring(0, 10) + '...' })
      
      return {
        success: false,
        message: error.message || 'Failed to send password reset email',
      }
    }
  }

  async testConnection(): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Testing email connection...')
      console.log('Using email:', this.fromEmail)
      console.log('SMTP User:', process.env.SMTP_USER || 'topnotchlimted21@gmail.com')
      
      await this.transporter.verify()
      return {
        success: true,
        message: 'Email service connection successful',
      }
    } catch (error: any) {
      console.error('Email service connection failed:', error)
      return {
        success: false,
        message: error.message || 'Email service connection failed',
      }
    }
  }

  // Test email sending functionality
  async sendTestEmail(userEmail: string): Promise<{ success: boolean; message?: string }> {
    try {
      const mailOptions = {
        from: this.getFromAddress(),
        to: userEmail,
        subject: 'Test Email - Student Portal',
        headers: {
          'X-Mailer': 'Student Portal',
          'X-Priority': '1',
          'Importance': 'high'
        },
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0; font-size: 24px;">Test Email</h1>
              <p style="margin: 10px 0 0 0; font-size: 16px;">Student Portal</p>
            </div>
            
            <div style="padding: 30px; background-color: #f8fafc;">
              <h2 style="color: #1e293b; margin-bottom: 20px;">Email Test Successful!</h2>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                This is a test email to verify that the email service is working correctly.
              </p>
              
              <div style="background-color: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #0369a1; margin-top: 0;">Email Details:</h3>
                <ul style="color: #075985; margin: 10px 0; padding-left: 20px;">
                  <li>Sent from: ${this.getFromAddress()}</li>
                  <li>Sent to: ${userEmail}</li>
                  <li>Time: ${new Date().toLocaleString()}</li>
                </ul>
              </div>
              
              <p style="color: #475569; line-height: 1.6; margin-bottom: 15px;">
                If you received this email, the email service is configured correctly.
              </p>
            </div>
            
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 14px; margin: 0;">
                This is a test email from Student Portal.
              </p>
            </div>
          </div>
        `,
      }

      const info = await this.transporter.sendMail(mailOptions)
      
      console.log('Test email sent successfully:', info.messageId)
      console.log('Email sent to:', userEmail)
      console.log('Email sent from:', this.getFromAddress())
      
      return {
        success: true,
        message: 'Test email sent successfully',
      }
    } catch (error: any) {
      console.error('Error sending test email:', error)
      console.error('Email details:', { userEmail })
      
      return {
        success: false,
        message: error.message || 'Failed to send test email',
      }
    }
  }
}

export const emailService = new EmailService() 