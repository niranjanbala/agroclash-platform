// Mock XP Service Implementation

import { XPService } from '../interfaces'
import { XPLog } from '../../types'
import { generateId, calculateLevelFromXP, getXPForLevel } from '../../utils'

export class MockXPService implements XPService {
  private xpLogs: Map<string, XPLog[]> = new Map()
  private userXP: Map<string, number> = new Map()

  // XP rewards for different actions
  private readonly XP_REWARDS = {
    'plant_crop': 10,
    'water_crop': 5,
    'harvest_crop': 25,
    'create_plot': 15,
    'win_pest_battle': 20,
    'join_clan': 30,
    'daily_login': 5,
    'complete_quest': 50,
    'help_clan_member': 15,
    'market_sale': 20,
    'weather_alert_action': 10
  }

  async awardXP(userId: string, actionType: string, xpAmount: number, description?: string): Promise<XPLog> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200))

    // Use predefined XP amount if available, otherwise use provided amount
    const finalXPAmount = this.XP_REWARDS[actionType as keyof typeof this.XP_REWARDS] || xpAmount

    const xpLog: XPLog = {
      id: generateId(),
      user_id: userId,
      action_type: actionType,
      xp_awarded: finalXPAmount,
      description: description || this.getDefaultDescription(actionType),
      created_at: new Date().toISOString()
    }

    // Store XP log
    if (!this.xpLogs.has(userId)) {
      this.xpLogs.set(userId, [])
    }
    this.xpLogs.get(userId)!.push(xpLog)

    // Update user's total XP
    const currentXP = this.userXP.get(userId) || 0
    this.userXP.set(userId, currentXP + finalXPAmount)

    return xpLog
  }

  calculateLevel(xp: number): number {
    return calculateLevelFromXP(xp)
  }

  async getXPLogs(userId: string, limit: number = 50): Promise<XPLog[]> {
    await new Promise(resolve => setTimeout(resolve, 150))

    const logs = this.xpLogs.get(userId) || []
    
    // Sort by creation date (most recent first) and apply limit
    return logs
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit)
  }

  async getLevelProgress(userId: string): Promise<{ currentLevel: number; currentXP: number; xpToNextLevel: number }> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const currentXP = this.userXP.get(userId) || 0
    const currentLevel = this.calculateLevel(currentXP)
    const xpForCurrentLevel = getXPForLevel(currentLevel)
    const xpForNextLevel = getXPForLevel(currentLevel + 1)
    const xpToNextLevel = xpForNextLevel - currentXP

    return {
      currentLevel,
      currentXP,
      xpToNextLevel: Math.max(0, xpToNextLevel)
    }
  }

  async checkLevelUp(userId: string, previousXP: number, newXP: number): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 100))

    const previousLevel = this.calculateLevel(previousXP)
    const newLevel = this.calculateLevel(newXP)

    return newLevel > previousLevel
  }

  // Additional helper methods for mock service

  async simulateUserActivity(userId: string): Promise<void> {
    // Simulate some user activity for demo purposes
    const activities = [
      { action: 'daily_login', description: 'Daily login bonus' },
      { action: 'plant_crop', description: 'Planted tomatoes in Plot A' },
      { action: 'water_crop', description: 'Watered corn crops' },
      { action: 'harvest_crop', description: 'Harvested wheat from Plot B' },
      { action: 'win_pest_battle', description: 'Successfully defended against aphids' }
    ]

    for (const activity of activities) {
      await this.awardXP(userId, activity.action, 0, activity.description)
      // Add some delay between activities
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  async getUserTotalXP(userId: string): Promise<number> {
    return this.userXP.get(userId) || 0
  }

  async getLeaderboard(limit: number = 10): Promise<{ userId: string; xp: number; level: number }[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const leaderboard = Array.from(this.userXP.entries())
      .map(([userId, xp]) => ({
        userId,
        xp,
        level: this.calculateLevel(xp)
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit)

    return leaderboard
  }

  private getDefaultDescription(actionType: string): string {
    const descriptions: { [key: string]: string } = {
      'plant_crop': 'Planted a new crop',
      'water_crop': 'Watered crops',
      'harvest_crop': 'Harvested crops',
      'create_plot': 'Created a new plot',
      'win_pest_battle': 'Won a pest battle',
      'join_clan': 'Joined a clan',
      'daily_login': 'Daily login bonus',
      'complete_quest': 'Completed a quest',
      'help_clan_member': 'Helped a clan member',
      'market_sale': 'Sold crops at market',
      'weather_alert_action': 'Responded to weather alert'
    }

    return descriptions[actionType] || `Performed action: ${actionType}`
  }

  // Method to reset user data (useful for testing)
  resetUserData(userId: string): void {
    this.xpLogs.delete(userId)
    this.userXP.delete(userId)
  }

  // Method to get all available action types and their XP rewards
  getActionTypes(): { [key: string]: number } {
    return { ...this.XP_REWARDS }
  }
}