'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, AuthContextType, UserRegistration, AuthResponse } from '@/types/auth'
import { toast } from 'react-hot-toast'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.user) {
          setUser(data.user)
          setIsAuthenticated(true)
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      })

      const data: AuthResponse = await response.json()

      if (data.success && data.user) {
        setUser(data.user)
        setIsAuthenticated(true)
        toast.success(`Welcome back, ${data.user.firstName}! 🎉`, {
          duration: 3000,
          style: {
            background: '#10B981',
            color: '#fff',
          },
        })
      } else {
        toast.error(data.message || 'Login failed')
      }

      return data
    } catch (error) {
      const errorMessage = 'An error occurred during login'
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const register = async (userData: UserRegistration): Promise<AuthResponse> => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      })

      const data: AuthResponse = await response.json()

      if (data.success) {
        toast.success(`Account created successfully! Welcome to Student Portal, ${userData.firstName}! 🎊`, {
          duration: 4000,
          style: {
            background: '#059669',
            color: '#fff',
          },
        })
      } else {
        toast.error(data.message || 'Registration failed')
      }

      return data
    } catch (error) {
      const errorMessage = 'An error occurred during registration'
      toast.error(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        setUser(null)
        setIsAuthenticated(false)
        toast.success('Logged out successfully. See you soon! 👋')
      } else {
        toast.error('Logout failed')
      }
    } catch (error) {
      toast.error('An error occurred during logout')
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    register,
    logout,
    loading,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 