// Authentication Service Implementation using Supabase

import { supabase } from '../supabase/client'
import { AuthService } from './interfaces'
import { User } from '../types'

export class SupabaseAuthService implements AuthService {
  async signUp(email: string, password: string, userData: Partial<User>): Promise<User> {
    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: userData.name || '',
            location: userData.location || null
          }
        }
      })

      if (authError) {
        throw new Error(`Authentication failed: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('User creation failed')
      }

      // Create user profile in our users table
      const { data: profileData, error: profileError } = await supabase
        .rpc('create_user_profile', {
          user_id: authData.user.id,
          user_email: email,
          user_name: userData.name || ''
        })

      if (profileError) {
        console.error('Profile creation error:', profileError)
        // Don't throw here as the auth user was created successfully
      }

      // Get the complete user profile
      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('Failed to retrieve user profile after creation')
      }

      return user
    } catch (error) {
      console.error('Sign up error:', error)
      throw error
    }
  }

  async signIn(email: string, password: string): Promise<User> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        throw new Error(`Sign in failed: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('Sign in failed: No user returned')
      }

      const user = await this.getCurrentUser()
      if (!user) {
        throw new Error('Failed to retrieve user profile after sign in')
      }

      return user
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw new Error(`Sign out failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Get current auth user
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth user retrieval error:', authError)
        return null
      }

      if (!authUser) {
        return null
      }

      // Get user profile from our users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .select(`
          *,
          clans (
            id,
            name
          )
        `)
        .eq('id', authUser.id)
        .single()

      if (profileError) {
        console.error('Profile retrieval error:', profileError)
        
        // If profile doesn't exist, create it
        if (profileError.code === 'PGRST116') {
          const { error: createError } = await supabase
            .rpc('create_user_profile', {
              user_id: authUser.id,
              user_email: authUser.email || '',
              user_name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User'
            })

          if (createError) {
            console.error('Profile creation error:', createError)
            return null
          }

          // Try to get the profile again
          const { data: newProfileData, error: newProfileError } = await supabase
            .from('users')
            .select(`
              *,
              clans (
                id,
                name
              )
            `)
            .eq('id', authUser.id)
            .single()

          if (newProfileError) {
            console.error('New profile retrieval error:', newProfileError)
            return null
          }

          return this.mapDatabaseUserToUser(newProfileData)
        }

        return null
      }

      return this.mapDatabaseUserToUser(profileData)
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  async updateProfile(userId: string, updates: Partial<User>): Promise<User> {
    try {
      // Update user profile in our users table
      const { data: profileData, error: profileError } = await supabase
        .from('users')
        .update({
          name: updates.name,
          location: updates.location ? `POINT(${updates.location.longitude} ${updates.location.latitude})` : undefined,
          clan_id: updates.clan_id,
          avatar_url: updates.avatar_url,
          phone: updates.phone,
          language: updates.language,
          timezone: updates.timezone
        })
        .eq('id', userId)
        .select(`
          *,
          clans (
            id,
            name
          )
        `)
        .single()

      if (profileError) {
        throw new Error(`Profile update failed: ${profileError.message}`)
      }

      return this.mapDatabaseUserToUser(profileData)
    } catch (error) {
      console.error('Update profile error:', error)
      throw error
    }
  }

  async sendOTP(phoneNumber: string): Promise<void> {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: phoneNumber
      })

      if (error) {
        throw new Error(`OTP send failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      throw error
    }
  }

  async verifyOTP(phoneNumber: string, otp: string): Promise<User> {
    try {
      const { data: authData, error: authError } = await supabase.auth.verifyOtp({
        phone: phoneNumber,
        token: otp,
        type: 'sms'
      })

      if (authError) {
        throw new Error(`OTP verification failed: ${authError.message}`)
      }

      if (!authData.user) {
        throw new Error('OTP verification failed: No user returned')
      }

      // Check if user profile exists, create if not
      let user = await this.getCurrentUser()
      
      if (!user) {
        // Create profile for phone-authenticated user
        const { error: createError } = await supabase
          .rpc('create_user_profile', {
            user_id: authData.user.id,
            user_email: authData.user.email || '',
            user_name: authData.user.phone || 'Phone User'
          })

        if (createError) {
          console.error('Profile creation error:', createError)
        }

        user = await this.getCurrentUser()
      }

      if (!user) {
        throw new Error('Failed to retrieve user profile after OTP verification')
      }

      return user
    } catch (error) {
      console.error('Verify OTP error:', error)
      throw error
    }
  }

  // Helper method to map database user to our User type
  private mapDatabaseUserToUser(dbUser: any): User {
    return {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      location: dbUser.location ? {
        latitude: dbUser.location.coordinates[1],
        longitude: dbUser.location.coordinates[0]
      } : undefined,
      xp: dbUser.xp,
      level: dbUser.level,
      clan_id: dbUser.clan_id,
      avatar_url: dbUser.avatar_url,
      phone: dbUser.phone,
      language: dbUser.language,
      timezone: dbUser.timezone,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    }
  }

  // Additional helper methods for authentication state management

  /**
   * Subscribe to authentication state changes
   */
  onAuthStateChange(callback: (user: User | null) => void): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          const user = await this.getCurrentUser()
          callback(user)
        } else if (event === 'SIGNED_OUT') {
          callback(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }

  /**
   * Get current session
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Get session error:', error)
      return null
    }
    return session
  }

  /**
   * Refresh current session
   */
  async refreshSession() {
    const { data: { session }, error } = await supabase.auth.refreshSession()
    if (error) {
      console.error('Refresh session error:', error)
      return null
    }
    return session
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw new Error(`Password reset failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      throw error
    }
  }

  /**
   * Update password
   */
  async updatePassword(newPassword: string): Promise<void> {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new Error(`Password update failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Update password error:', error)
      throw error
    }
  }
}