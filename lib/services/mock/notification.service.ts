import { Notification, NotificationPreferences, PushToken } from '../../types'
import { BaseNotificationService } from '../notification.service'
import { generateId } from '../../utils'

interface ScheduledNotification {
  id: string
  userId: string
  notification: Omit<Notification, 'id' | 'created_at' | 'read'>
  scheduledFor: Date
  sent: boolean
}

export class MockNotificationService extends BaseNotificationService {
  private notifications: Notification[] = []
  private preferences: NotificationPreferences[] = []
  private pushTokens: PushToken[] = []
  private scheduledNotifications: ScheduledNotification[] = []
  private subscriptions: Map<string, Set<(notification: Notification) => void>> = new Map()
  private userSubscriptions: Map<string, Set<(update: any) => void>> = new Map()

  constructor() {
    super()
    this.initializeMockData()
    this.startScheduledNotificationProcessor()
  }

  private initializeMockData() {
    // Create some sample notifications for demo
    const sampleNotifications: Notification[] = [
      {
        id: generateId(),
        user_id: 'user-1',
        type: 'crop_milestone',
        title: 'Crop Milestone Reached! 🌱',
        message: 'Your tomatoes have reached the flowering stage',
        data: { cropName: 'Tomatoes', milestone: 'flowering' },
        read: false,
        priority: 'medium',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        user_id: 'user-1',
        type: 'weather_alert',
        title: 'Weather Alert: Rain ⚠️',
        message: 'Heavy rain expected in your area. Protect your crops!',
        data: { alertType: 'rain' },
        read: false,
        priority: 'high',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: generateId(),
        user_id: 'user-1',
        type: 'xp_reward',
        title: 'XP Earned! ⭐',
        message: 'You earned 25 XP for harvesting crops',
        data: { xpAmount: 25, reason: 'harvesting crops' },
        read: true,
        priority: 'low',
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      }
    ]

    this.notifications = sampleNotifications

    // Create default preferences for demo user
    const defaultPreferences: NotificationPreferences = {
      id: generateId(),
      user_id: 'user-1',
      push_notifications: true,
      email_notifications: false,
      crop_updates: true,
      weather_alerts: true,
      xp_notifications: true,
      clan_notifications: true,
      market_alerts: true,
      game_notifications: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '07:00',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.preferences = [defaultPreferences]
  }

  async sendNotification(userId: string, notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100))

    // Check if user should receive this notification
    const shouldSend = await this.shouldSendNotification(userId, notification.type)
    if (!shouldSend) {
      console.log(`🔕 Notification blocked by user preferences: ${notification.title}`)
      throw new Error('Notification blocked by user preferences')
    }

    const newNotification: Notification = {
      id: generateId(),
      user_id: userId,
      created_at: new Date().toISOString(),
      read: false,
      ...notification
    }

    this.notifications.push(newNotification)

    // Trigger real-time subscription callbacks
    const callbacks = this.subscriptions.get(userId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(newNotification)
        } catch (error) {
          console.error('Error in notification callback:', error)
        }
      })
    }

    // Send push notification if enabled
    const preferences = await this.getNotificationPreferences(userId)
    if (preferences.push_notifications) {
      await this.sendPushNotification(userId, notification.title, notification.message, notification.data)
    }

    console.log(`📱 Mock Notification sent to ${userId}:`, notification.title)
    return newNotification
  }

  async getNotifications(userId: string, limit: number = 20, offset: number = 0): Promise<Notification[]> {
    await new Promise(resolve => setTimeout(resolve, 50))

    return this.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(offset, offset + limit)
  }

  async markAsRead(notificationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))

    const notification = this.notifications.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      console.log(`✅ Notification marked as read: ${notificationId}`)
    } else {
      throw new Error('Notification not found')
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const userNotifications = this.notifications.filter(n => n.user_id === userId && !n.read)
    userNotifications.forEach(n => n.read = true)
    
    console.log(`✅ ${userNotifications.length} notifications marked as read for user ${userId}`)
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))

    const index = this.notifications.findIndex(n => n.id === notificationId)
    if (index > -1) {
      this.notifications.splice(index, 1)
      console.log(`🗑️ Notification deleted: ${notificationId}`)
    } else {
      throw new Error('Notification not found')
    }
  }

  async registerPushToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100))

    // Deactivate existing tokens for this user and platform
    this.pushTokens
      .filter(t => t.user_id === userId && t.platform === platform)
      .forEach(t => t.active = false)

    const pushToken: PushToken = {
      id: generateId(),
      user_id: userId,
      token,
      platform,
      active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    this.pushTokens.push(pushToken)
    console.log(`📱 Push token registered for ${userId} on ${platform}`)
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 150))

    const activeTokens = this.pushTokens.filter(t => t.user_id === userId && t.active)
    
    if (activeTokens.length === 0) {
      console.log(`📱 No active push tokens for user ${userId}`)
      return
    }

    // Simulate push notification delivery
    const success = Math.random() > 0.05 // 95% success rate
    
    if (success) {
      console.log(`📱 Push notification sent to ${activeTokens.length} devices for ${userId}:`, { title, body, data })
    } else {
      console.log(`❌ Push notification failed for ${userId}`)
      throw new Error('Push notification delivery failed')
    }
  }

  async scheduleNotification(
    userId: string, 
    notification: Omit<Notification, 'id' | 'created_at' | 'read'>,
    scheduledFor: Date
  ): Promise<string> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const scheduledNotification: ScheduledNotification = {
      id: generateId(),
      userId,
      notification,
      scheduledFor,
      sent: false
    }

    this.scheduledNotifications.push(scheduledNotification)
    console.log(`⏰ Notification scheduled for ${userId} at ${scheduledFor.toISOString()}`)
    
    return scheduledNotification.id
  }

  async cancelScheduledNotification(scheduleId: string): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 50))

    const index = this.scheduledNotifications.findIndex(n => n.id === scheduleId)
    if (index > -1) {
      this.scheduledNotifications.splice(index, 1)
      console.log(`❌ Scheduled notification cancelled: ${scheduleId}`)
    } else {
      throw new Error('Scheduled notification not found')
    }
  }

  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    await new Promise(resolve => setTimeout(resolve, 50))

    let preferences = this.preferences.find(p => p.user_id === userId)
    
    if (!preferences) {
      // Create default preferences
      preferences = {
        id: generateId(),
        user_id: userId,
        push_notifications: true,
        email_notifications: false,
        crop_updates: true,
        weather_alerts: true,
        xp_notifications: true,
        clan_notifications: true,
        market_alerts: true,
        game_notifications: true,
        quiet_hours_start: '22:00',
        quiet_hours_end: '07:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      this.preferences.push(preferences)
    }

    return preferences
  }

  async updateNotificationPreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    await new Promise(resolve => setTimeout(resolve, 100))

    let preferences = this.preferences.find(p => p.user_id === userId)
    
    if (!preferences) {
      preferences = await this.getNotificationPreferences(userId)
    }

    Object.assign(preferences, updates, { updated_at: new Date().toISOString() })
    
    console.log(`⚙️ Notification preferences updated for ${userId}`)
    return preferences
  }

  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void {
    if (!this.subscriptions.has(userId)) {
      this.subscriptions.set(userId, new Set())
    }
    
    this.subscriptions.get(userId)!.add(callback)
    console.log(`🔔 User ${userId} subscribed to real-time notifications`)

    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(userId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscriptions.delete(userId)
        }
      }
      console.log(`🔕 User ${userId} unsubscribed from real-time notifications`)
    }
  }

  subscribeToUserUpdates(userId: string, callback: (update: any) => void): () => void {
    if (!this.userSubscriptions.has(userId)) {
      this.userSubscriptions.set(userId, new Set())
    }
    
    this.userSubscriptions.get(userId)!.add(callback)
    console.log(`🔔 User ${userId} subscribed to real-time updates`)

    // Return unsubscribe function
    return () => {
      const callbacks = this.userSubscriptions.get(userId)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.userSubscriptions.delete(userId)
        }
      }
      console.log(`🔕 User ${userId} unsubscribed from real-time updates`)
    }
  }

  async sendBulkNotifications(notifications: Array<{ userId: string; notification: Omit<Notification, 'id' | 'created_at' | 'read'> }>): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const results = await Promise.allSettled(
      notifications.map(({ userId, notification }) => 
        this.sendNotification(userId, notification)
      )
    )

    const successful = results.filter(r => r.status === 'fulfilled').length
    const failed = results.filter(r => r.status === 'rejected').length

    console.log(`📬 Bulk notifications sent: ${successful} successful, ${failed} failed`)
  }

  async getUnreadCount(userId: string): Promise<number> {
    await new Promise(resolve => setTimeout(resolve, 30))

    return this.notifications.filter(n => n.user_id === userId && !n.read).length
  }

  // Process scheduled notifications
  private startScheduledNotificationProcessor(): void {
    setInterval(() => {
      const now = new Date()
      const dueNotifications = this.scheduledNotifications.filter(
        n => !n.sent && n.scheduledFor <= now
      )

      dueNotifications.forEach(async (scheduledNotification) => {
        try {
          await this.sendNotification(scheduledNotification.userId, scheduledNotification.notification)
          scheduledNotification.sent = true
          console.log(`⏰ Scheduled notification sent: ${scheduledNotification.notification.title}`)
        } catch (error) {
          console.error('Error sending scheduled notification:', error)
        }
      })
    }, 10000) // Check every 10 seconds
  }

  // Utility methods for testing and debugging
  getAllNotifications(): Notification[] {
    return [...this.notifications]
  }

  getAllPreferences(): NotificationPreferences[] {
    return [...this.preferences]
  }

  getAllPushTokens(): PushToken[] {
    return [...this.pushTokens]
  }

  getScheduledNotifications(): ScheduledNotification[] {
    return [...this.scheduledNotifications]
  }

  clearAllData(): void {
    this.notifications = []
    this.preferences = []
    this.pushTokens = []
    this.scheduledNotifications = []
    this.subscriptions.clear()
    this.userSubscriptions.clear()
    console.log('🧹 All mock notification data cleared')
  }

  // Simulate real-time user updates (for testing)
  simulateUserUpdate(userId: string, update: any): void {
    const callbacks = this.userSubscriptions.get(userId)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(update)
        } catch (error) {
          console.error('Error in user update callback:', error)
        }
      })
    }
  }
}