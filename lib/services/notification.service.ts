import { Notification, NotificationPreferences, NotificationType } from '../types'

export interface NotificationService {
  // Core notification operations
  sendNotification(userId: string, notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification>
  getNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>
  markAsRead(notificationId: string): Promise<void>
  markAllAsRead(userId: string): Promise<void>
  deleteNotification(notificationId: string): Promise<void>
  
  // Push notification operations
  registerPushToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void>
  sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void>
  
  // Scheduled notifications
  scheduleNotification(
    userId: string, 
    notification: Omit<Notification, 'id' | 'created_at' | 'read'>,
    scheduledFor: Date
  ): Promise<string>
  cancelScheduledNotification(scheduleId: string): Promise<void>
  
  // Preferences
  getNotificationPreferences(userId: string): Promise<NotificationPreferences>
  updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>
  
  // Real-time subscriptions
  subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void
  subscribeToUserUpdates(userId: string, callback: (update: any) => void): () => void
  
  // Bulk operations
  sendBulkNotifications(notifications: Array<{ userId: string; notification: Omit<Notification, 'id' | 'created_at' | 'read'> }>): Promise<void>
  getUnreadCount(userId: string): Promise<number>
}

export abstract class BaseNotificationService implements NotificationService {
  abstract sendNotification(userId: string, notification: Omit<Notification, 'id' | 'created_at' | 'read'>): Promise<Notification>
  abstract getNotifications(userId: string, limit?: number, offset?: number): Promise<Notification[]>
  abstract markAsRead(notificationId: string): Promise<void>
  abstract markAllAsRead(userId: string): Promise<void>
  abstract deleteNotification(notificationId: string): Promise<void>
  abstract registerPushToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void>
  abstract sendPushNotification(userId: string, title: string, body: string, data?: Record<string, any>): Promise<void>
  abstract scheduleNotification(userId: string, notification: Omit<Notification, 'id' | 'created_at' | 'read'>, scheduledFor: Date): Promise<string>
  abstract cancelScheduledNotification(scheduleId: string): Promise<void>
  abstract getNotificationPreferences(userId: string): Promise<NotificationPreferences>
  abstract updateNotificationPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>
  abstract subscribeToNotifications(userId: string, callback: (notification: Notification) => void): () => void
  abstract subscribeToUserUpdates(userId: string, callback: (update: any) => void): () => void
  abstract sendBulkNotifications(notifications: Array<{ userId: string; notification: Omit<Notification, 'id' | 'created_at' | 'read'> }>): Promise<void>
  abstract getUnreadCount(userId: string): Promise<number>

  // Helper methods for common notification types
  async sendCropMilestoneNotification(userId: string, cropName: string, milestone: string): Promise<Notification> {
    return this.sendNotification(userId, {
      type: 'crop_milestone',
      title: 'Crop Milestone Reached! 🌱',
      message: `Your ${cropName} has reached ${milestone}`,
      data: { cropName, milestone },
      priority: 'medium'
    })
  }

  async sendWeatherAlertNotification(userId: string, alertType: string, message: string): Promise<Notification> {
    return this.sendNotification(userId, {
      type: 'weather_alert',
      title: `Weather Alert: ${alertType} ⚠️`,
      message,
      data: { alertType },
      priority: 'high'
    })
  }

  async sendXPRewardNotification(userId: string, xpAmount: number, reason: string): Promise<Notification> {
    return this.sendNotification(userId, {
      type: 'xp_reward',
      title: 'XP Earned! ⭐',
      message: `You earned ${xpAmount} XP for ${reason}`,
      data: { xpAmount, reason },
      priority: 'low'
    })
  }

  async sendClanInviteNotification(userId: string, clanName: string, inviterName: string): Promise<Notification> {
    return this.sendNotification(userId, {
      type: 'clan_invite',
      title: 'Clan Invitation 🏆',
      message: `${inviterName} invited you to join ${clanName}`,
      data: { clanName, inviterName },
      priority: 'medium'
    })
  }

  async sendMarketPriceAlertNotification(userId: string, cropType: string, price: number): Promise<Notification> {
    return this.sendNotification(userId, {
      type: 'market_alert',
      title: 'Price Alert! 💰',
      message: `${cropType} price reached $${price.toFixed(2)}`,
      data: { cropType, price },
      priority: 'medium'
    })
  }

  async sendPestBattleNotification(userId: string, pestName: string, won: boolean, xpEarned: number): Promise<Notification> {
    return this.sendNotification(userId, {
      type: 'pest_battle',
      title: won ? 'Battle Victory! ⚔️' : 'Battle Defeat 💀',
      message: won 
        ? `You defeated ${pestName} and earned ${xpEarned} XP!`
        : `${pestName} damaged your crops. Try again!`,
      data: { pestName, won, xpEarned },
      priority: 'medium'
    })
  }

  // Utility method to check if user should receive notification based on preferences
  protected async shouldSendNotification(userId: string, type: NotificationType): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(userId)
      
      switch (type) {
        case 'crop_milestone':
          return preferences.crop_updates
        case 'weather_alert':
          return preferences.weather_alerts
        case 'xp_reward':
          return preferences.xp_notifications
        case 'clan_invite':
        case 'clan_update':
          return preferences.clan_notifications
        case 'market_alert':
          return preferences.market_alerts
        case 'pest_battle':
          return preferences.game_notifications
        default:
          return true
      }
    } catch (error) {
      console.error('Error checking notification preferences:', error)
      return true // Default to sending if we can't check preferences
    }
  }
}