'use client'

import { useState, useEffect } from 'react'
import { User, LogOut, Settings, FileText, CreditCard, Home, Phone, Mail, MapPin, Download, History, Menu, X, Bell, Search, BarChart3, Users, Calendar, Award, Zap, ExternalLink, Shield, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { User as UserType } from '@/types/auth'
import { UserResultRecord } from '@/types/student'

interface DashboardProps {
  user: UserType
  onLogout: () => void
  onNavigateToExamPortal: () => void
}

export default function Dashboard({ user, onLogout, onNavigateToExamPortal }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'profile' | 'results' | 'settings'>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
  const [userResults, setUserResults] = useState<UserResultRecord[]>([])
  const [resultsLoading, setResultsLoading] = useState(false)

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
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Profile updated successfully')
        setEditMode(false)
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      toast.error('An error occurred while updating profile')
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

  const fetchUserResults = async () => {
    setResultsLoading(true)
    try {
      const response = await fetch('/api/auth/me')
      const data = await response.json()
      
      if (data.success && data.user && data.user.results) {
        setUserResults(data.user.results)
      }
    } catch (error) {
      console.error('Error fetching results:', error)
      toast.error('Failed to fetch results')
    } finally {
      setResultsLoading(false)
    }
  }

  const handleDownloadResult = async (resultData: UserResultRecord) => {
    try {
      const { generatePDF } = await import('@/utils/pdfGenerator')
      await generatePDF(resultData.resultData, resultData.examNumber)
      toast.success('PDF downloaded successfully!')
    } catch (error) {
      console.error('Error downloading PDF:', error)
      toast.error('Failed to download PDF. Please try again.')
    }
  }

  useEffect(() => {
    if (activeTab === 'results') {
      fetchUserResults()
    }
  }, [activeTab])

  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  const navigationItems = [
    { id: 'overview', label: 'Overview', icon: BarChart3, description: 'Dashboard overview' },
    { id: 'profile', label: 'Profile', icon: User, description: 'Personal information' },
    { id: 'results', label: 'My Results', icon: Award, description: 'Exam results history' },
    { id: 'settings', label: 'Settings', icon: Settings, description: 'Account settings' },
  ]

  const quickActions = [
    {
      title: 'Purchase Results',
      description: 'Search and purchase additional exam results',
      icon: FileText,
      color: 'from-blue-500 to-blue-600',
      onClick: onNavigateToExamPortal,
    },
    {
      title: 'My Results',
      description: 'View and download your exam results',
      icon: Award,
      color: 'from-emerald-500 to-emerald-600',
      onClick: () => setActiveTab('results'),
    },
    {
      title: 'Update Profile',
      description: 'Manage your personal information',
      icon: User,
      color: 'from-purple-500 to-purple-600',
      onClick: () => setActiveTab('profile'),
    },
    {
      title: 'Account Settings',
      description: 'Security and privacy settings',
      icon: Settings,
      color: 'from-orange-500 to-orange-600',
      onClick: () => setActiveTab('settings'),
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <header className="header-modern">
        <div className="header-content container-modern">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="btn-icon bg-white/80 text-gray-600 hover:text-gray-900 lg:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-3">
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="btn-icon bg-white/80 text-gray-600 hover:text-gray-900 hidden sm:flex">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center space-x-2">
              <button
                onClick={onNavigateToExamPortal}
                className="btn-outline bg-white/80 text-sm px-4 py-2 hidden sm:flex"
              >
                <FileText className="h-4 w-4" />
                <span>Exam Portal</span>
              </button>
              <button
                onClick={handleLogout}
                className="btn-danger text-sm px-4 py-2"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-16 md:pt-20">
        {/* Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay lg:hidden" 
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`sidebar-modern ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex flex-col h-full">
            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 lg:hidden">
              <h2 className="text-lg font-bold text-gray-900">Navigation</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="btn-icon bg-gray-100 text-gray-600 hover:text-gray-900"
                aria-label="Close sidebar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* User Info */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <User className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    {user.title} {user.firstName} {user.lastName}
                  </h2>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <div className="flex items-center mt-2">
                    <span className="status-badge status-success text-xs">
                      Exam #{user.examNumber}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-6">
              <div className="sidebar-nav">
                {navigationItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any)
                      setSidebarOpen(false)
                    }}
                    className={
                      activeTab === item.id
                        ? 'nav-link-active w-full text-left flex items-center gap-3'
                        : 'nav-link w-full text-left flex items-center gap-3'
                    }
                  >
                    <item.icon className="h-5 w-5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{item.label}</div>
                      <div className="text-xs opacity-75 truncate">{item.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </nav>

            {/* Quick Actions in Sidebar */}
            <div className="p-6 border-t border-gray-200">
              <h3 className="text-sm font-semibold text-gray-600 mb-4 uppercase tracking-wider">Quick Access</h3>
              <div className="space-y-2">
                <button
                  onClick={onNavigateToExamPortal}
                  className="w-full flex items-center gap-3 p-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                >
                  <FileText className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">Exam Portal</span>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="fade-in">
                {/* Welcome Section */}
                <div className="mb-8 lg:mb-12">
                  <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4 lg:mb-6">
                    Welcome back, {user.firstName}!
                  </h1>
                  <p className="text-lg text-gray-600 max-w-2xl">
                    Manage your exam results, update your profile, and access all your academic information from your personalized dashboard.
                  </p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 lg:mb-12">
                  <div className="pane">
                    <div className="pane-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-caption">Total Results</p>
                          <p className="text-2xl font-bold text-gray-900">{userResults.length}</p>
                        </div>
                        <div className="quick-action-icon bg-gradient-to-r from-blue-500 to-blue-600">
                          <Award className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pane">
                    <div className="pane-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-caption">Account Status</p>
                          <p className="text-2xl font-bold text-emerald-600">Active</p>
                        </div>
                        <div className="quick-action-icon bg-gradient-to-r from-emerald-500 to-emerald-600">
                          <Zap className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pane">
                    <div className="pane-body">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-caption">Last Login</p>
                          <p className="text-lg font-semibold text-gray-700">Today</p>
                        </div>
                        <div className="quick-action-icon bg-gradient-to-r from-purple-500 to-purple-600">
                          <Calendar className="h-8 w-8 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mb-12">
                  <h2 className="text-section-title mb-8">Quick Actions</h2>
                  <div className="grid-responsive-2">
                    {quickActions.map((action, index) => (
                      <div
                        key={index}
                        onClick={action.onClick}
                        className="quick-action"
                      >
                        <div className={`quick-action-icon bg-gradient-to-r ${action.color}`}>
                          <action.icon className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="quick-action-title">{action.title}</h3>
                        <p className="quick-action-description">{action.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="pane">
                  <div className="pane-header">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-3">
                      <History className="h-5 w-5" />
                      Recent Activity
                    </h3>
                  </div>
                  <div className="pane-body">
                    {userResults.length > 0 ? (
                      <div className="space-y-4">
                        {userResults.slice(0, 3).map((result, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                            <div className="flex items-center space-x-4">
                              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">Exam #{result.examNumber}</p>
                                <p className="text-sm text-gray-600">Downloaded on {new Date(result.createdAt).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadResult(result)}
                              className="btn-outline text-sm px-4 py-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">No results yet</h3>
                        <p className="text-gray-500 mb-6">Purchase your first exam result to get started</p>
                        <button
                          onClick={onNavigateToExamPortal}
                          className="btn-primary"
                        >
                          <FileText className="h-4 w-4" />
                          Go to Exam Portal
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="fade-in content-spacing">
                {/* Profile Header */}
                <div className="pane">
                  <div className="pane-header">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <h3 className="text-section-title flex items-center gap-3">
                        <User className="h-6 w-6" />
                        Profile Information
                      </h3>
                      <button
                        onClick={() => setEditMode(!editMode)}
                        className={editMode ? "btn-secondary" : "btn-outline"}
                      >
                        {editMode ? 'Cancel' : 'Edit Profile'}
                      </button>
                    </div>
                  </div>
                  
                  <div className="pane-body">
                    <form onSubmit={handleProfileUpdate} className="space-y-8">
                      {/* Personal Information Section */}
                      <div className="form-section">
                        <div className="form-section-title">
                          Personal Information
                        </div>
                        
                        <div className="grid-responsive-2">
                          <div className="form-group">
                            <label className="form-label">Title</label>
                            <select
                              name="title"
                              value={profileData.title}
                              onChange={handleChange}
                              disabled={!editMode}
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
                            <label className="form-label">Gender</label>
                            <select
                              name="gender"
                              value={profileData.gender}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="select-field"
                            >
                              <option value="">Select Gender</option>
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label className="form-label">First Name</label>
                            <input
                              type="text"
                              name="firstName"
                              value={profileData.firstName}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Last Name</label>
                            <input
                              type="text"
                              name="lastName"
                              value={profileData.lastName}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="form-section">
                        <div className="form-section-title">
                          Contact Information
                        </div>
                        
                        <div className="grid-responsive-2">
                          <div className="form-group">
                            <label className="form-label">Email Address</label>
                            <input
                              type="email"
                              name="email"
                              value={profileData.email}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Phone Number</label>
                            <input
                              type="tel"
                              name="phoneNumber"
                              value={profileData.phoneNumber}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Country</label>
                            <input
                              type="text"
                              name="country"
                              value={profileData.country}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Region</label>
                            <input
                              type="text"
                              name="region"
                              value={profileData.region}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Academic Information */}
                      <div className="form-section">
                        <div className="form-section-title">
                          Academic Information
                        </div>
                        
                        <div className="grid-responsive-2">
                          <div className="form-group">
                            <label className="form-label">Exam Number</label>
                            <input
                              type="text"
                              name="examNumber"
                              value={profileData.examNumber}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Department</label>
                            <input
                              type="text"
                              name="department"
                              value={profileData.department}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Senior Deputy ArchBishop</label>
                            <input
                              type="text"
                              name="seniorDeputyArchBishop"
                              value={profileData.seniorDeputyArchBishop}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label">Alter</label>
                            <input
                              type="text"
                              name="alter"
                              value={profileData.alter}
                              onChange={handleChange}
                              disabled={!editMode}
                              className="input-field"
                            />
                          </div>
                        </div>
                      </div>

                      {editMode && (
                        <div className="flex flex-col sm:flex-row gap-4 pt-6">
                          <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex-1"
                          >
                            {loading ? (
                              <>
                                <div className="loading-spinner" />
                                Updating...
                              </>
                            ) : (
                              'Update Profile'
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditMode(false)}
                            className="btn-secondary flex-1"
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* Results Tab */}
            {activeTab === 'results' && (
              <div className="fade-in content-spacing">
                <div className="pane">
                  <div className="pane-header">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                      <h3 className="text-section-title flex items-center gap-3">
                        <History className="h-6 w-6" />
                        My Results History
                      </h3>
                      <button
                        onClick={fetchUserResults}
                        disabled={resultsLoading}
                        className="btn-outline"
                      >
                        {resultsLoading ? (
                          <>
                            <div className="loading-spinner" />
                            Loading...
                          </>
                        ) : (
                          'Refresh'
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="pane-body">
                    {userResults.length > 0 ? (
                      <div className="space-y-6">
                        {userResults.map((result, index) => (
                          <div key={index} className="bg-gradient-to-r from-gray-50 to-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                              <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                  <FileText className="h-8 w-8 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-lg font-bold text-gray-900">Exam #{result.examNumber}</h4>
                                  <p className="text-gray-600">Purchased on {new Date(result.createdAt).toLocaleDateString()}</p>
                                  <p className="text-gray-600">Downloads: {result.downloadCount}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDownloadResult(result)}
                                className="btn-primary"
                              >
                                <Download className="h-4 w-4" />
                                Download PDF
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <Award className="h-24 w-24 text-gray-300 mx-auto mb-6" />
                        <h3 className="text-xl font-bold text-gray-600 mb-3">No results found</h3>
                        <p className="text-gray-500 mb-8 max-w-md mx-auto">You haven't purchased any exam results yet. Visit the exam portal to search and purchase your results.</p>
                        <button
                          onClick={onNavigateToExamPortal}
                          className="btn-primary"
                        >
                          <FileText className="h-4 w-4" />
                          Go to Exam Portal
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Access */}
                <div className="pane">
                  <div className="pane-header">
                    <h3 className="text-lg font-bold text-gray-900">Quick Access</h3>
                  </div>
                  <div className="pane-body">
                    <div className="grid-responsive-2">
                      <button
                        onClick={onNavigateToExamPortal}
                        className="quick-action"
                      >
                        <div className="quick-action-icon bg-gradient-to-r from-blue-500 to-blue-600">
                          <FileText className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="quick-action-title">Purchase New Results</h4>
                        <p className="quick-action-description">Search and purchase additional exam results</p>
                      </button>
                      
                      <button
                        onClick={fetchUserResults}
                        className="quick-action"
                      >
                        <div className="quick-action-icon bg-gradient-to-r from-emerald-500 to-emerald-600">
                          <History className="h-8 w-8 text-white" />
                        </div>
                        <h4 className="quick-action-title">Refresh Results</h4>
                        <p className="quick-action-description">Update your results history</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="fade-in">
                <div className="pane">
                  <div className="pane-header">
                    <h3 className="text-section-title flex items-center gap-3">
                      <Settings className="h-6 w-6" />
                      Account Settings
                    </h3>
                  </div>
                  <div className="pane-body content-spacing">
                    <div className="form-section">
                      <div className="form-section-title">
                        Account Security
                      </div>
                      <p className="text-body mb-6">
                        Keep your account secure with a strong password.
                      </p>
                      <button className="btn-outline">
                        Change Password
                      </button>
                    </div>

                    <div className="form-section">
                      <div className="form-section-title">
                        Data & Privacy
                      </div>
                      <p className="text-body mb-6">
                        Manage your personal data and privacy settings.
                      </p>
                      <button className="btn-outline">
                        Privacy Settings
                      </button>
                    </div>

                    <div className="p-8 bg-gradient-to-r from-red-50 to-red-100 rounded-2xl border border-red-200">
                      <div className="form-section-title text-red-900">
                        Danger Zone
                      </div>
                      <p className="text-red-700 mb-6">
                        Permanently delete your account and all associated data.
                      </p>
                      <button className="btn-danger">
                        Delete Account
                      </button>
                    </div>
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