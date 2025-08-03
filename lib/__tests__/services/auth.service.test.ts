// Test suite for Authentication Service

import { SupabaseAuthService } from '../../services/auth.service'
import { supabase } from '../../supabase/client'

// Mock Supabase client
jest.mock('../../supabase/client', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(),
      signInWithPassword: jest.fn(),
      signOut: jest.fn(),
      getUser: jest.fn(),
      signInWithOtp: jest.fn(),
      verifyOtp: jest.fn(),
      onAuthStateChange: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      resetPasswordForEmail: jest.fn(),
      updateUser: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      }))
    })),
    rpc: jest.fn()
  }
}))

describe('SupabaseAuthService', () => {
  let authService: SupabaseAuthService
  const mockSupabase = supabase as any

  beforeEach(() => {
    authService = new SupabaseAuthService()
    jest.clearAllMocks()
  })

  describe('signUp', () => {
    it('should successfully sign up a new user', async () => {
      const mockAuthData = {
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
      const mockUserData = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        xp: 0,
        level: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.signUp.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      mockSupabase.rpc.mockResolvedValue({
        data: 'test-user-id',
        error: null
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          })
        })
      })

      const result = await authService.signUp('test@example.com', 'password123', {
        name: 'Test User'
      })

      expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        options: {
          data: {
            name: 'Test User',
            location: null
          }
        }
      })

      expect(result).toEqual(expect.objectContaining({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }))
    })

    it('should handle sign up errors', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: null,
        error: { message: 'Email already registered' }
      })

      await expect(authService.signUp('test@example.com', 'password123', {
        name: 'Test User'
      })).rejects.toThrow('Authentication failed: Email already registered')
    })

    it('should handle missing user in response', async () => {
      mockSupabase.auth.signUp.mockResolvedValue({
        data: { user: null },
        error: null
      })

      await expect(authService.signUp('test@example.com', 'password123', {
        name: 'Test User'
      })).rejects.toThrow('User creation failed')
    })
  })

  describe('signIn', () => {
    it('should successfully sign in a user', async () => {
      const mockAuthData = {
        user: { id: 'test-user-id', email: 'test@example.com' }
      }
      const mockUserData = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        xp: 100,
        level: 2,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          })
        })
      })

      const result = await authService.signIn('test@example.com', 'password123')

      expect(mockSupabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })

      expect(result).toEqual(expect.objectContaining({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User'
      }))
    })

    it('should handle sign in errors', async () => {
      mockSupabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid credentials' }
      })

      await expect(authService.signIn('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Sign in failed: Invalid credentials')
    })
  })

  describe('signOut', () => {
    it('should successfully sign out', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: null
      })

      await expect(authService.signOut()).resolves.not.toThrow()
      expect(mockSupabase.auth.signOut).toHaveBeenCalled()
    })

    it('should handle sign out errors', async () => {
      mockSupabase.auth.signOut.mockResolvedValue({
        error: { message: 'Sign out failed' }
      })

      await expect(authService.signOut())
        .rejects.toThrow('Sign out failed: Sign out failed')
    })
  })

  describe('getCurrentUser', () => {
    it('should return current user when authenticated', async () => {
      const mockAuthUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockUserData = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        xp: 150,
        level: 3,
        location: { coordinates: [-74.0060, 40.7128] },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          })
        })
      })

      const result = await authService.getCurrentUser()

      expect(result).toEqual(expect.objectContaining({
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        location: {
          latitude: 40.7128,
          longitude: -74.0060
        }
      }))
    })

    it('should return null when not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null
      })

      const result = await authService.getCurrentUser()
      expect(result).toBeNull()
    })

    it('should handle profile creation when profile does not exist', async () => {
      const mockAuthUser = { id: 'test-user-id', email: 'test@example.com' }
      const mockUserData = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        xp: 0,
        level: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthUser },
        error: null
      })

      // First call returns profile not found error
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116' }
            })
          })
        })
      })

      // Mock profile creation
      mockSupabase.rpc.mockResolvedValue({
        data: 'test-user-id',
        error: null
      })

      // Second call returns the created profile
      mockSupabase.from.mockReturnValueOnce({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          })
        })
      })

      const result = await authService.getCurrentUser()

      expect(mockSupabase.rpc).toHaveBeenCalledWith('create_user_profile', {
        user_id: 'test-user-id',
        user_email: 'test@example.com',
        user_name: 'test'
      })

      expect(result).toEqual(expect.objectContaining({
        id: 'test-user-id',
        email: 'test@example.com'
      }))
    })
  })

  describe('updateProfile', () => {
    it('should successfully update user profile', async () => {
      const mockUpdatedData = {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Updated Name',
        xp: 200,
        level: 4,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-02T00:00:00Z'
      }

      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: mockUpdatedData,
                error: null
              })
            })
          })
        })
      })

      const result = await authService.updateProfile('test-user-id', {
        name: 'Updated Name'
      })

      expect(result).toEqual(expect.objectContaining({
        id: 'test-user-id',
        name: 'Updated Name'
      }))
    })

    it('should handle profile update errors', async () => {
      mockSupabase.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            select: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' }
              })
            })
          })
        })
      })

      await expect(authService.updateProfile('test-user-id', {
        name: 'Updated Name'
      })).rejects.toThrow('Profile update failed: Update failed')
    })
  })

  describe('OTP authentication', () => {
    it('should send OTP successfully', async () => {
      mockSupabase.auth.signInWithOtp.mockResolvedValue({
        error: null
      })

      await expect(authService.sendOTP('+1234567890')).resolves.not.toThrow()
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        phone: '+1234567890'
      })
    })

    it('should verify OTP successfully', async () => {
      const mockAuthData = {
        user: { id: 'test-user-id', phone: '+1234567890' }
      }
      const mockUserData = {
        id: 'test-user-id',
        email: '',
        name: 'Phone User',
        xp: 0,
        level: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      }

      mockSupabase.auth.verifyOtp.mockResolvedValue({
        data: mockAuthData,
        error: null
      })

      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: mockAuthData.user },
        error: null
      })

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUserData,
              error: null
            })
          })
        })
      })

      const result = await authService.verifyOTP('+1234567890', '123456')

      expect(mockSupabase.auth.verifyOtp).toHaveBeenCalledWith({
        phone: '+1234567890',
        token: '123456',
        type: 'sms'
      })

      expect(result).toEqual(expect.objectContaining({
        id: 'test-user-id',
        name: 'Phone User'
      }))
    })
  })

  describe('helper methods', () => {
    it('should handle auth state changes', () => {
      const mockCallback = jest.fn()
      const mockUnsubscribe = jest.fn()

      mockSupabase.auth.onAuthStateChange.mockReturnValue({
        data: { subscription: { unsubscribe: mockUnsubscribe } }
      })

      const unsubscribe = authService.onAuthStateChange(mockCallback)

      expect(mockSupabase.auth.onAuthStateChange).toHaveBeenCalled()
      expect(typeof unsubscribe).toBe('function')

      unsubscribe()
      expect(mockUnsubscribe).toHaveBeenCalled()
    })

    it('should get current session', async () => {
      const mockSession = { access_token: 'token', user: { id: 'test-user-id' } }

      mockSupabase.auth.getSession.mockResolvedValue({
        data: { session: mockSession },
        error: null
      })

      const result = await authService.getSession()
      expect(result).toEqual(mockSession)
    })

    it('should reset password', async () => {
      mockSupabase.auth.resetPasswordForEmail.mockResolvedValue({
        error: null
      })

      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://localhost:3000' },
        writable: true
      })

      await expect(authService.resetPassword('test@example.com')).resolves.not.toThrow()
      expect(mockSupabase.auth.resetPasswordForEmail).toHaveBeenCalledWith(
        'test@example.com',
        { redirectTo: 'http://localhost:3000/reset-password' }
      )
    })
  })
})