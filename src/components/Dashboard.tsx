'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, Settings, FileText, CreditCard, Home, Phone, Mail, MapPin } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { User as UserType } from '@/types/auth'

interface DashboardProps {
  user: UserType
  onLogout: () => void
  onNavigateToExamPortal: () => void
}

export default function Dashboard({ user, onLogout, onNavigateToExamPortal }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile')
  const [profileData, setProfileData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    examNumber: user.examNumber,
    title: user.title,
    gender: user.gender,
    country: user.country,
    phoneNumber: user.phoneNumber,
    seniorDeputyArchBishop: user.seniorDeputyArchBishop,
    region: user.region,
    alter: user.alter,
    department: user.department,
  })
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Logged out successfully')
        onLogout()
      } else {
        toast.error('Logout failed')
      }
    } catch (error) {
      toast.error('An error occurred during logout')
    }
  }

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        toast.success('Profile updated successfully!')
        setEditMode(false)
        // Update the user data in the parent component if needed
        // You might want to trigger a re-fetch of user data here
        window.location.reload() // Simple refresh to show updated data
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Update error:', error)
      toast.error('An error occurred while updating your profile')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value,
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={onNavigateToExamPortal}
                className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                <FileText className="h-4 w-4 mr-2" />
                Exam Portal
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center px-4 py-2 text-sm font-medium text-red-600 hover:text-red-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-6 border-b">
                <div className="flex items-center">
                  <div className="bg-blue-100 rounded-full p-3">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      {user.title} {user.firstName} {user.lastName}
                    </h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <p className="text-xs text-gray-400">Exam #: {user.examNumber}</p>
                  </div>
                </div>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  <li>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'profile'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <User className="h-4 w-4 mr-3" />
                      Profile
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => setActiveTab('settings')}
                      className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        activeTab === 'settings'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="space-y-6">
                {/* Profile Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">Profile Information</h3>
                    <button
                      onClick={() => setEditMode(!editMode)}
                      className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {editMode ? 'Cancel' : 'Edit Profile'}
                    </button>
                  </div>

                  {editMode ? (
                    <form onSubmit={handleProfileUpdate} className="space-y-8">
                      {/* Personal Information */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                            <select
                              name="title"
                              value={profileData.title}
                              onChange={handleChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Title</option>
                              <option value="Mr">Mr</option>
                              <option value="Mrs">Mrs</option>
                              <option value="Miss">Miss</option>
                              <option value="Dr">Dr</option>
                              <option value="Prof">Prof</option>
                              <option value="Rev">Rev</option>
                              <option value="Pastor">Pastor</option>
                              <option value="Bishop">Bishop</option>
                              <option value="Archbishop">Archbishop</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                            <select
                              name="gender"
                              value={profileData.gender}
                              onChange={handleChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={profileData.firstName}
                              onChange={handleChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={profileData.lastName}
                              onChange={handleChange}
                              required
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                            <input
                              type="email"
                              name="email"
                              value={profileData.email}
                              onChange={handleChange}
                              required
                              disabled
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100"
                            />
                            <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={profileData.phoneNumber}
                              onChange={handleChange}
                              required
                              placeholder="+1 (555) 123-4567"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                            <input
                              type="text"
                              name="country"
                              value={profileData.country}
                              onChange={handleChange}
                              required
                              placeholder="e.g., United States, Kenya, United Kingdom"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Region</label>
                            <input
                              type="text"
                              name="region"
                              value={profileData.region}
                              onChange={handleChange}
                              placeholder="e.g., California, Nairobi, London"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Academic Information */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Academic Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Number</label>
                            <input
                              type="text"
                              name="examNumber"
                              value={profileData.examNumber}
                              onChange={handleChange}
                              required
                              placeholder="e.g., EX2024001, ST-001"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                            <input
                              type="text"
                              name="department"
                              value={profileData.department}
                              onChange={handleChange}
                              required
                              placeholder="e.g., Theology, Biblical Studies, Ministry"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Senior Deputy ArchBishop</label>
                            <input
                              type="text"
                              name="seniorDeputyArchBishop"
                              value={profileData.seniorDeputyArchBishop}
                              onChange={handleChange}
                              placeholder="Optional - Senior Deputy ArchBishop name"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Alter</label>
                            <input
                              type="text"
                              name="alter"
                              value={profileData.alter}
                              onChange={handleChange}
                              placeholder="Optional - Alter information"
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end space-x-4">
                        <button
                          type="button"
                          onClick={() => {
                            setEditMode(false)
                            setProfileData({
                              firstName: user.firstName,
                              lastName: user.lastName,
                              email: user.email,
                              examNumber: user.examNumber,
                              title: user.title,
                              gender: user.gender,
                              country: user.country,
                              phoneNumber: user.phoneNumber,
                              seniorDeputyArchBishop: user.seniorDeputyArchBishop,
                              region: user.region,
                              alter: user.alter,
                              department: user.department,
                            })
                          }}
                          disabled={loading}
                          className="px-6 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      {/* Personal Information Display */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <User className="h-5 w-5 mr-2" />
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                            <p className="text-sm text-gray-900">{user.title} {user.firstName} {user.lastName}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                            <p className="text-sm text-gray-900">{user.gender}</p>
                          </div>
                        </div>
                      </div>

                      {/* Contact Information Display */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <Mail className="h-5 w-5 mr-2" />
                          Contact Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <p className="text-sm text-gray-900">{user.email}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                            <p className="text-sm text-gray-900">{user.phoneNumber}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                            <p className="text-sm text-gray-900">{user.country}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                            <p className="text-sm text-gray-900">{user.region}</p>
                          </div>
                        </div>
                      </div>

                      {/* Academic Information Display */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <FileText className="h-5 w-5 mr-2" />
                          Academic Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Exam Number</label>
                            <p className="text-sm text-gray-900">{user.examNumber}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                            <p className="text-sm text-gray-900">{user.department}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Senior Deputy ArchBishop</label>
                            <p className="text-sm text-gray-900">{user.seniorDeputyArchBishop}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alter</label>
                            <p className="text-sm text-gray-900">{user.alter}</p>
                          </div>
                        </div>
                      </div>

                      {/* Account Information Display */}
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <Settings className="h-5 w-5 mr-2" />
                          Account Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Account Created</label>
                            <p className="text-sm text-gray-900">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                            <p className="text-sm text-gray-900">
                              {new Date(user.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-6">Account Settings</h3>
                <div className="space-y-6">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Account Security</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Keep your account secure with a strong password.
                    </p>
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Data & Privacy</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Manage your personal data and privacy settings.
                    </p>
                    <button className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-500">
                      Privacy Settings
                    </button>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Danger Zone</h4>
                    <p className="text-sm text-red-600 mb-4">
                      Permanently delete your account and all associated data.
                    </p>
                    <button className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-500">
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
} 