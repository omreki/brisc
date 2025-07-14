'use client'

import { useState } from 'react'
import { Eye, EyeOff, UserPlus, User, Mail, Phone, Globe, Building, Shield, CheckCircle, AlertCircle, BookOpen, Users } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { AuthResponse } from '@/types/auth'

interface RegisterFormProps {
  onRegisterSuccess: () => void
  onSwitchToLogin: () => void
}

export default function RegisterForm({ onRegisterSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    examNumber: '',
    title: '',
    gender: '',
    country: '',
    phoneNumber: '',
    seniorDeputyArchBishop: '',
    region: '',
    alter: '',
    department: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          examNumber: formData.examNumber,
          title: formData.title,
          gender: formData.gender,
          country: formData.country,
          phoneNumber: formData.phoneNumber,
          seniorDeputyArchBishop: formData.seniorDeputyArchBishop,
          region: formData.region,
          alter: formData.alter,
          department: formData.department,
        }),
      })

      const data: AuthResponse = await response.json()

      if (data.success) {
        toast.success('Registration successful! Please login.')
        // Reset form
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          password: '',
          confirmPassword: '',
          examNumber: '',
          title: '',
          gender: '',
          country: '',
          phoneNumber: '',
          seniorDeputyArchBishop: '',
          region: '',
          alter: '',
          department: '',
        })
        onRegisterSuccess()
      } else {
        toast.error(data.message || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      toast.error('An error occurred during registration')
    } finally {
      setLoading(false)
    }
  }

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.firstName && formData.lastName && formData.email && formData.password && formData.confirmPassword)
      case 2:
        return !!(formData.examNumber && formData.title && formData.gender && formData.country && formData.phoneNumber)
      case 3:
        return !!(formData.seniorDeputyArchBishop && formData.region && formData.department)
      default:
        return false
    }
  }

  const nextStep = () => {
    if (currentStep < 3 && isStepValid(currentStep)) {
      setCurrentStep(currentStep + 1)
    } else if (!isStepValid(currentStep)) {
      toast.error('Please fill in all required fields before continuing')
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  return (
    <div className="fade-in">
      <div className="text-center mb-8">
        <h2 className="text-section-title mb-3">Create Your Account</h2>
        <p className="text-body">Join our student portal to access your exam results</p>
      </div>

      {/* Progress Steps */}
      <div className="progress-modern mb-8">
        <div className="progress-step">
          <div className={`progress-step-icon ${
            currentStep >= 1 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            <User className="h-6 w-6" />
          </div>
          <span className={`progress-step-text ${
            currentStep >= 1 ? 'text-emerald-600' : 'text-gray-400'
          }`}>
            Personal Info
          </span>
        </div>
        
        <div className={`progress-connector ${
          currentStep >= 2 ? 'bg-emerald-500' : 'bg-gray-200'
        }`}></div>
        
        <div className="progress-step">
          <div className={`progress-step-icon ${
            currentStep >= 2 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            <BookOpen className="h-6 w-6" />
          </div>
          <span className={`progress-step-text ${
            currentStep >= 2 ? 'text-emerald-600' : 'text-gray-400'
          }`}>
            Academic Info
          </span>
        </div>
        
        <div className={`progress-connector ${
          currentStep >= 3 ? 'bg-emerald-500' : 'bg-gray-200'
        }`}></div>
        
        <div className="progress-step">
          <div className={`progress-step-icon ${
            currentStep >= 3 
              ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white' 
              : 'bg-gray-200 text-gray-500'
          }`}>
            <Users className="h-6 w-6" />
          </div>
          <span className={`progress-step-text ${
            currentStep >= 3 ? 'text-emerald-600' : 'text-gray-400'
          }`}>
            Organization
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="element-spacing">
        {/* Step 1: Personal Information */}
        {currentStep === 1 && (
          <div className="space-y-8 slide-up">
            <div className="form-section">
              <div className="form-section-title">
                Personal Information
              </div>
              
              <div className="grid-responsive-2">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <select
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    className="select-field"
                  >
                    <option value="">Select Title</option>
                    <option value="Mr">Mr</option>
                    <option value="Mrs">Mrs</option>
                    <option value="Ms">Ms</option>
                    <option value="Dr">Dr</option>
                    <option value="Rev">Rev</option>
                    <option value="Pastor">Pastor</option>
                    <option value="Overseer">Overseer</option>
                    <option value="Bishop">Bishop</option>
                    <option value="Deputy ArchBishop">Deputy ArchBishop</option>
                    <option value="Senior Deputy ArchBishop">Senior Deputy ArchBishop</option>
                    <option value="Archbishop">Archbishop</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Gender *</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    required
                    className="select-field"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Enter your first name"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Enter your last name"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                Account Credentials
              </div>
              
              <div className="grid-responsive-2">
                <div className="form-group md:col-span-2">
                  <label className="form-label flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="your.email@example.com"
                  />
                  <p className="form-help">This will be your login email address</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Password *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="input-field pr-12"
                      placeholder="Create a strong password"
                      minLength={8}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  <p className="form-help">Minimum 8 characters required</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm Password *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="input-field pr-12"
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="text-red-600 text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      Passwords do not match
                    </p>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <p className="text-emerald-600 text-sm mt-1 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" />
                      Passwords match
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Academic Information */}
        {currentStep === 2 && (
          <div className="space-y-8 slide-up">
            <div className="form-section">
              <div className="form-section-title">
                Academic Information
              </div>
              
              <div className="grid-responsive-2">
                <div className="form-group">
                  <label className="form-label">Exam Number *</label>
                  <input
                    type="text"
                    name="examNumber"
                    value={formData.examNumber}
                    onChange={handleChange}
                    required
                    className="input-field text-center font-semibold"
                    placeholder="e.g., 2024001"
                  />
                  <p className="form-help">Your unique exam identification number</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g., Theology, Biblical Studies"
                  />
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-section-title">
                Contact Information
              </div>
              
              <div className="grid-responsive-2">
                <div className="form-group">
                  <label className="form-label">Phone Number *</label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="+254712345678"
                  />
                  <p className="form-help">Include country code for international numbers</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g., Kenya, Tanzania, Uganda"
                  />
                </div>

                <div className="form-group md:col-span-2">
                  <label className="form-label">Region *</label>
                  <input
                    type="text"
                    name="region"
                    value={formData.region}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="e.g., Central, Eastern, Western"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Organization Information */}
        {currentStep === 3 && (
          <div className="space-y-8 slide-up">
            <div className="form-section">
              <div className="form-section-title">
                Organization Information
              </div>
              
              <div className="grid-responsive-2">
                <div className="form-group md:col-span-2">
                  <label className="form-label">Senior Deputy ArchBishop *</label>
                  <input
                    type="text"
                    name="seniorDeputyArchBishop"
                    value={formData.seniorDeputyArchBishop}
                    onChange={handleChange}
                    required
                    className="input-field"
                    placeholder="Enter the name of your Senior Deputy ArchBishop"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Alter</label>
                  <input
                    type="text"
                    name="alter"
                    value={formData.alter}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Optional alter information"
                  />
                  <p className="form-help">This field is optional</p>
                </div>
              </div>
            </div>

            {/* Final Review */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Ready to Register
              </h3>
              <p className="text-blue-800 text-sm leading-relaxed mb-4">
                Please review your information and click "Create Account" to complete your registration. 
                You'll be able to log in immediately after successful registration.
              </p>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4 text-blue-600" />
                <span className="text-blue-700">Your information is secure and encrypted</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          {currentStep > 1 && (
            <button
              type="button"
              onClick={prevStep}
              className="btn-secondary flex-1"
            >
              Previous Step
            </button>
          )}
          
          {currentStep < 3 ? (
            <button
              type="button"
              onClick={nextStep}
              disabled={!isStepValid(currentStep)}
              className="btn-primary flex-1"
            >
              Next Step
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading || !isStepValid(currentStep)}
              className="btn-success flex-1"
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Account
                </>
              )}
            </button>
          )}
        </div>

        <div className="text-center pt-6">
          <p className="text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              Sign In Here
            </button>
          </p>
        </div>
      </form>

      {/* Terms and Privacy */}
      <div className="mt-8 p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
        <p className="text-sm text-gray-700 leading-relaxed">
          By creating an account, you agree to our{' '}
          <button className="text-blue-600 hover:text-blue-700 font-medium">Terms of Service</button>
          {' '}and{' '}
          <button className="text-blue-600 hover:text-blue-700 font-medium">Privacy Policy</button>.
          Your personal information is protected and will only be used for exam result access and communication.
        </p>
      </div>
    </div>
  )
} 