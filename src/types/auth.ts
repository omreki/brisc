export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  examNumber: string
  title: string
  gender: string
  country: string
  phoneNumber: string
  seniorDeputyArchBishop: string
  region: string
  alter: string
  department: string
  createdAt: string
  updatedAt: string
}

export interface UserRegistration {
  email: string
  password: string
  firstName: string
  lastName: string
  examNumber: string
  title: string
  gender: string
  country: string
  phoneNumber: string
  seniorDeputyArchBishop: string
  region: string
  alter: string
  department: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  message?: string
  user?: User
  token?: string
}

export interface JWTPayload {
  userId: string
  email: string
  exp: number
}

export interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthResponse>
  register: (userData: UserRegistration) => Promise<AuthResponse>
  logout: () => void
  loading: boolean
} 