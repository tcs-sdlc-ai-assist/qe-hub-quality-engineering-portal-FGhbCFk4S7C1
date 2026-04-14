import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { MOCK_USERS } from '../data/mockUsers.js'
import { PERMISSIONS } from '../constants/roles.js'
import { getItem, setItem, removeItem } from '../utils/storage.js'

const AuthContext = createContext(null)

const SESSION_KEY = 'auth_session'

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const session = getItem(SESSION_KEY, null)
    if (session && session.userId) {
      const user = MOCK_USERS.find((u) => u.id === session.userId)
      if (user) {
        setCurrentUser(user)
        setIsAuthenticated(true)
      } else {
        removeItem(SESSION_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback((email) => {
    if (!email || typeof email !== 'string') {
      console.error('[AuthContext] Invalid email provided for login')
      return { success: false, error: 'Invalid email address' }
    }

    const normalizedEmail = email.trim().toLowerCase()
    const user = MOCK_USERS.find(
      (u) => u.email.toLowerCase() === normalizedEmail
    )

    if (!user) {
      console.error('[AuthContext] No user found with email:', normalizedEmail)
      return { success: false, error: 'User not found' }
    }

    setCurrentUser(user)
    setIsAuthenticated(true)
    setItem(SESSION_KEY, { userId: user.id, loginTime: new Date().toISOString() })

    return { success: true, user }
  }, [])

  const logout = useCallback(() => {
    setCurrentUser(null)
    setIsAuthenticated(false)
    removeItem(SESSION_KEY)
  }, [])

  const hasPermission = useCallback(
    (action) => {
      if (!currentUser || !currentUser.role) {
        return false
      }

      const rolePermissions = PERMISSIONS[currentUser.role]
      if (!rolePermissions) {
        return false
      }

      return rolePermissions[action] === true
    },
    [currentUser]
  )

  const value = {
    currentUser,
    role: currentUser ? currentUser.role : null,
    isAuthenticated,
    isLoading,
    login,
    logout,
    hasPermission,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext