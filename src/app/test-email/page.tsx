'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function TestEmailPage() {
  const [email, setEmail] = useState('')
  const [type, setType] = useState('test')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [connectionStatus, setConnectionStatus] = useState<any>(null)
  
  // Payment system testing state
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentResult, setPaymentResult] = useState<any>(null)
  const [testExamNumber, setTestExamNumber] = useState('TEST123')
  const [testPaymentId, setTestPaymentId] = useState('')

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/test-email')
      const data = await response.json()
      setConnectionStatus(data)
    } catch (error) {
      setConnectionStatus({ error: 'Failed to test connection' })
    } finally {
      setLoading(false)
    }
  }

  const sendTestEmail = async () => {
    if (!email) {
      alert('Please enter an email address')
      return
    }

    setLoading(true)
    setResult(null)
    
    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, type }),
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to send test email' })
    } finally {
      setLoading(false)
    }
  }

  const testPaymentSystem = async (action: string) => {
    setPaymentLoading(true)
    setPaymentResult(null)
    
    try {
      const body: any = { action }
      if (testExamNumber) body.examNumber = testExamNumber
      if (testPaymentId) body.paymentId = testPaymentId

      const response = await fetch('/api/test-payment-system', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      setPaymentResult(data)
    } catch (error) {
      setPaymentResult({ error: 'Failed to test payment system' })
    } finally {
      setPaymentLoading(false)
    }
  }

  const testGoogleSheetsConnection = async () => {
    setPaymentLoading(true)
    try {
      const response = await fetch('/api/test-payment-system')
      const data = await response.json()
      setPaymentResult(data)
    } catch (error) {
      setPaymentResult({ error: 'Failed to test Google Sheets connection' })
    } finally {
      setPaymentLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header with Navigation */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">System Dashboard</h1>
              <span className="hidden sm:inline-block text-sm text-gray-500">Testing & Configuration</span>
            </div>
            <nav className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Main App
              </Link>
              <Link href="/reset-password" className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                Password Reset
              </Link>
              <div className="w-px h-6 bg-gray-300 mx-2"></div>
              <span className="px-4 py-2 text-blue-600 bg-blue-50 rounded-lg font-medium">
                Test Dashboard
              </span>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            Main App
          </Link>
          <Link href="/reset-password" className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors">
            Password Reset
          </Link>
          <span className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-md font-medium">
            Test Dashboard
          </span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <p className="text-2xl font-semibold text-gray-900">Active</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Email Service</p>
                <p className="text-2xl font-semibold text-gray-900">Ready</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Payment System</p>
                <p className="text-2xl font-semibold text-gray-900">Online</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Payment System Testing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Payment System Testing</h2>
                  <p className="text-sm text-gray-500">Test payment processing and Google Sheets integration</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Exam Number
                  </label>
                  <input
                    type="text"
                    value={testExamNumber}
                    onChange={(e) => setTestExamNumber(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                    placeholder="e.g., TEST123"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Test Payment ID <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={testPaymentId}
                    onChange={(e) => setTestPaymentId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
                    placeholder="Auto-generated if empty"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3 mb-6">
                <button
                  onClick={testGoogleSheetsConnection}
                  disabled={paymentLoading}
                  className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  {paymentLoading ? 'Testing...' : 'Test Connection'}
                </button>
                
                <button
                  onClick={() => testPaymentSystem('test-record-payment')}
                  disabled={paymentLoading}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Record Payment
                </button>
                
                <button
                  onClick={() => testPaymentSystem('test-verify-payment')}
                  disabled={paymentLoading}
                  className="px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Verify Payment
                </button>
                
                <button
                  onClick={() => testPaymentSystem('test-get-payments')}
                  disabled={paymentLoading}
                  className="px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
                >
                  Get Payments
                </button>
                
                <button
                  onClick={() => testPaymentSystem('test-update-payment')}
                  disabled={paymentLoading || !testPaymentId}
                  className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:col-span-2 lg:col-span-1 xl:col-span-2"
                >
                  Update Payment Status
                </button>
              </div>
              
              {paymentResult && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Payment System Result:</h3>
                  <div className={`p-4 rounded-lg ${paymentResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(paymentResult, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Email Service Testing */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Email Service Testing</h2>
                  <p className="text-sm text-gray-500">Test email delivery and SMTP configuration</p>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              <button
                onClick={testConnection}
                disabled={loading}
                className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium mb-6"
              >
                {loading ? 'Testing Connection...' : 'Test Email Connection'}
              </button>
              
              {connectionStatus && (
                <div className="mb-6 p-4 rounded-lg bg-gray-50 border border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Connection Status:</h3>
                  <pre className="text-xs text-gray-700 overflow-x-auto font-mono">
                    {JSON.stringify(connectionStatus, null, 2)}
                  </pre>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                    placeholder="Enter email address to test"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
                  >
                    <option value="test">Test Email</option>
                    <option value="password-reset">Password Reset Email</option>
                  </select>
                </div>

                <button
                  onClick={sendTestEmail}
                  disabled={loading || !email}
                  className="w-full px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Sending Email...' : 'Send Test Email'}
                </button>
              </div>

              {result && (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Email Result:</h3>
                  <div className={`p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap font-mono">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Configuration Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Payment Configuration</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Google Sheets</span>
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Configured</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Payment Gateway</span>
                  <span className="text-sm text-gray-900">IntaSend</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Webhook URL</span>
                  <span className="text-sm text-gray-900 font-mono">/api/webhooks/intasend</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Payment Amount</span>
                  <span className="text-sm text-gray-900 font-semibold">KES 150</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Required Sheet</span>
                  <span className="text-sm text-gray-900">"Payments" (Columns A-Q)</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Email Configuration</h3>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">From Email</span>
                  <span className="text-sm text-gray-900 font-mono">topnotchlimted21@gmail.com</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Service</span>
                  <span className="text-sm text-gray-900">Gmail SMTP</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Port</span>
                  <span className="text-sm text-gray-900">587</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Security</span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">TLS</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testing Instructions */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 overflow-hidden mt-8">
          <div className="px-6 py-4 bg-blue-100 border-b border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900">Testing Instructions</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">Payment System Testing</h4>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">1</span>
                    Test the Google Sheets connection first
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">2</span>
                    Record a test payment to verify sheet writing
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">3</span>
                    Verify payment shows as "not valid" (pending)
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">4</span>
                    Update payment to "completed" status
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">5</span>
                    Verify payment now shows as valid
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">6</span>
                    Check your Google Sheets for recorded data
                  </li>
                </ol>
              </div>
              
              <div>
                <h4 className="font-semibold text-blue-900 mb-3">Email System Testing</h4>
                <ol className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">1</span>
                    Test the email service connection
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">2</span>
                    Send a test email to verify functionality
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">3</span>
                    Check your inbox (and spam folder)
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center w-5 h-5 bg-blue-200 text-blue-800 rounded-full text-xs font-medium mr-2 mt-0.5">4</span>
                    Try different email types to test templates
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 