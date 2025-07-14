import axios from 'axios'
import { PaymentData, PaymentResponse } from '@/types/student'

const INTASEND_API_URL = 'https://sandbox.intasend.com/api/v1'
const INTASEND_LIVE_API_URL = 'https://payment.intasend.com/api/v1'

export class IntasendService {
  private apiKey: string
  private publishableKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.INTASEND_API_KEY || ''
    this.publishableKey = process.env.INTASEND_PUBLISHABLE_KEY || ''
    
    // Use live URL for production
    this.baseUrl = this.apiKey.includes('live') ? INTASEND_LIVE_API_URL : INTASEND_API_URL
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-IntaSend-Public-Key-Id': this.publishableKey,
      'Authorization': `Bearer ${this.apiKey}`,
    }
  }

  async initiateMpesaPayment(paymentData: PaymentData): Promise<PaymentResponse> {
    try {
      const requestData = {
        currency: paymentData.currency,
        amount: paymentData.amount,
        phone_number: this.formatPhoneNumber(paymentData.phoneNumber),
        email: paymentData.email,
        api_ref: `exam_${paymentData.examNumber}_${Date.now()}`,
        narrative: `Exam results access fee for ${paymentData.examNumber}`,
        service_name: 'Student Portal',
        redirect_url: `${process.env.NEXTAUTH_URL}/payment-success`,
        fail_redirect_url: `${process.env.NEXTAUTH_URL}/payment-failed`,
        webhook_url: `${process.env.NEXTAUTH_URL}/api/webhooks/intasend`, // Add webhook URL
      }

      const response = await axios.post(
        `${this.baseUrl}/payment/mpesa-stk-push/`,
        requestData,
        { headers: this.getHeaders() }
      )

      if (response.data && response.data.invoice) {
        return {
          success: true,
          paymentId: response.data.invoice.invoice_id,
          transactionId: response.data.invoice.id,
          message: 'Payment initiated successfully',
          apiRef: requestData.api_ref,
        }
      } else {
        return {
          success: false,
          message: 'Failed to initiate payment',
        }
      }
    } catch (error: any) {
      console.error('Error initiating M-Pesa payment:', error)
      
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          error.message || 
                          'Payment initiation failed'
      
      return {
        success: false,
        message: errorMessage,
      }
    }
  }

  async checkPaymentStatus(invoiceId: string): Promise<any> {
    try {
      // Use the correct endpoint for checking payment status
      const response = await axios.get(
        `${this.baseUrl}/payment/collection/`,
        { 
          headers: this.getHeaders(),
          params: {
            invoice_id: invoiceId,
          }
        }
      )

      // Check if we have data and look for our specific invoice
      if (response.data && response.data.results) {
        const payment = response.data.results.find((p: any) => p.invoice_id === invoiceId)
        
        if (payment) {
          return {
            success: true,
            status: this.mapPaymentStatus(payment.state),
            data: payment,
          }
        } else {
          // If not found in results, try alternative approach
          return await this.checkPaymentStatusAlternative(invoiceId)
        }
      }

      return {
        success: false,
        message: 'Payment not found',
        status: 'pending'
      }

    } catch (error: any) {
      console.error('Error checking payment status:', error)
      
      // Try alternative method if primary fails
      return await this.checkPaymentStatusAlternative(invoiceId)
    }
  }

  private async checkPaymentStatusAlternative(invoiceId: string): Promise<any> {
    try {
      // Alternative endpoint to check payment status
      const response = await axios.get(
        `${this.baseUrl}/payment/collection/${invoiceId}/`,
        { headers: this.getHeaders() }
      )

      if (response.data) {
        return {
          success: true,
          status: this.mapPaymentStatus(response.data.state),
          data: response.data,
        }
      }

      return {
        success: false,
        message: 'Payment status check failed',
        status: 'unknown'
      }

    } catch (error: any) {
      console.error('Alternative payment status check failed:', error)
      
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Status check failed',
        status: 'unknown'
      }
    }
  }

  private mapPaymentStatus(state: string): string {
    const statusMap: { [key: string]: string } = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'COMPLETE': 'completed',
      'COMPLETED': 'completed',
      'FAILED': 'failed',
      'CANCELLED': 'failed',
      'TIMEOUT': 'failed',
    }

    return statusMap[state?.toUpperCase()] || 'unknown'
  }

  async getPaymentDetails(invoiceId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment/invoices/${invoiceId}/`,
        { headers: this.getHeaders() }
      )

      return {
        success: true,
        data: response.data,
      }
    } catch (error: any) {
      console.error('Error getting payment details:', error)
      return {
        success: false,
        message: error.response?.data?.detail || error.message || 'Failed to get payment details',
      }
    }
  }

  private formatPhoneNumber(phone: string): string {
    // Remove any non-digit characters
    let cleaned = phone.replace(/\D/g, '')
    
    // Handle different formats and convert to international format
    if (cleaned.startsWith('0')) {
      cleaned = '254' + cleaned.slice(1)
    } else if (cleaned.startsWith('254')) {
      // Already in correct format
    } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
      cleaned = '254' + cleaned
    }
    
    return cleaned
  }

  async validateCredentials(): Promise<boolean> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/payment/invoices/`,
        { headers: this.getHeaders() }
      )
      
      return response.status === 200
    } catch (error) {
      console.error('Error validating Intasend credentials:', error)
      return false
    }
  }
}

export const intasendService = new IntasendService() 