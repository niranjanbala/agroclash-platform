// Mock Pest Service Implementation

import { PestService } from '../interfaces'
import { PestBattle } from '../../types'
import { generateId } from '../../utils'

export class MockPestService implements PestService {
  private pestBattles: Map<string, PestBattle[]> = new Map()
  private plotBattles: Map<string, PestBattle[]> = new Map()

  // Pest types and their characteristics
  private readonly PEST_TYPES = {
    'aphids': {
      name: 'Aphids',
      description: 'Small insects that suck plant juices',
      commonCrops: ['tomatoes', 'peppers', 'lettuce'],
      baseXP: 15
    },
    'caterpillars': {
      name: 'Caterpillars',
      description: 'Larvae that eat leaves and fruits',
      commonCrops: ['corn', 'tomatoes', 'cabbage'],
      baseXP: 20
    },
    'spider_mites': {
      name: 'Spider Mites',
      description: 'Tiny mites that cause leaf damage',
      commonCrops: ['beans', 'corn', 'tomatoes'],
      baseXP: 18
    },
    'whiteflies': {
      name: 'Whiteflies',
      description: 'Small flying insects that damage plants',
      commonCrops: ['tomatoes', 'peppers', 'cucumbers'],
      baseXP: 16
    },
    'thrips': {
      name: 'Thrips',
      description: 'Tiny insects that cause silvery damage',
      commonCrops: ['onions', 'peppers', 'tomatoes'],
      baseXP: 17
    },
    'cutworms': {
      name: 'Cutworms',
      description: 'Larvae that cut plant stems at soil level',
      commonCrops: ['corn', 'tomatoes', 'peppers'],
      baseXP: 22
    },
    'flea_beetles': {
      name: 'Flea Beetles',
      description: 'Small beetles that create shot holes in leaves',
      commonCrops: ['potatoes', 'tomatoes', 'eggplant'],
      baseXP: 19
    }
  }

  async createPestBattle(plotId: string, pestType: string, severity: PestBattle['severity']): Promise<PestBattle> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    const pestInfo = this.PEST_TYPES[pestType as keyof typeof this.PEST_TYPES]
    const baseXP = pestInfo?.baseXP || 15

    // Calculate XP reward based on severity
    const severityMultiplier = {
      'low': 1,
      'medium': 1.5,
      'high': 2
    }

    const xpReward = Math.round(baseXP * severityMultiplier[severity])

    const battle: PestBattle = {
      id: generateId(),
      user_id: '', // Will be set by the calling service
      plot_id: plotId,
      pest_type: pestType,
      severity,
      status: 'active',
      xp_reward: xpReward,
      created_at: new Date().toISOString(),
      resolved_at: undefined
    }

    // Store battle
    if (!this.plotBattles.has(plotId)) {
      this.plotBattles.set(plotId, [])
    }
    this.plotBattles.get(plotId)!.push(battle)

    return battle
  }

  async resolvePestBattle(battleId: string, success: boolean): Promise<{ battle: PestBattle; xpAwarded: number }> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))

    // Find the battle
    let battle: PestBattle | undefined
    let plotId: string | undefined

    for (const [pid, battles] of this.plotBattles.entries()) {
      const foundBattle = battles.find(b => b.id === battleId)
      if (foundBattle) {
        battle = foundBattle
        plotId = pid
        break
      }
    }

    if (!battle) {
      throw new Error('Pest battle not found')
    }

    if (battle.status === 'resolved') {
      throw new Error('Battle already resolved')
    }

    // Update battle status
    battle.status = 'resolved'
    battle.resolved_at = new Date().toISOString()

    // Calculate XP awarded based on success
    const xpAwarded = success ? battle.xp_reward : Math.round(battle.xp_reward * 0.3)

    return { battle, xpAwarded }
  }

  async getActiveBattles(userId: string): Promise<PestBattle[]> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const activeBattles: PestBattle[] = []

    // Get all battles for user's plots
    for (const battles of this.plotBattles.values()) {
      const userBattles = battles.filter(battle => 
        battle.user_id === userId && battle.status === 'active'
      )
      activeBattles.push(...userBattles)
    }

    // Sort by creation date (most recent first)
    return activeBattles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  async getPestHistory(plotId: string): Promise<PestBattle[]> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const battles = this.plotBattles.get(plotId) || []
    
    // Sort by creation date (most recent first)
    return battles.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
  }

  // Additional helper methods for mock service

  async generateRandomPestBattle(plotId: string, userId: string): Promise<PestBattle | null> {
    // 20% chance of generating a pest battle
    if (Math.random() > 0.2) {
      return null
    }

    const pestTypes = Object.keys(this.PEST_TYPES)
    const severities: PestBattle['severity'][] = ['low', 'medium', 'high']
    
    const randomPestType = pestTypes[Math.floor(Math.random() * pestTypes.length)]
    const randomSeverity = severities[Math.floor(Math.random() * severities.length)]

    const battle = await this.createPestBattle(plotId, randomPestType, randomSeverity)
    battle.user_id = userId

    return battle
  }

  async getPestTypeInfo(pestType: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return this.PEST_TYPES[pestType as keyof typeof this.PEST_TYPES] || null
  }

  async getAllPestTypes(): Promise<any[]> {
    await new Promise(resolve => setTimeout(resolve, 100))
    
    return Object.entries(this.PEST_TYPES).map(([key, value]) => ({
      id: key,
      ...value
    }))
  }

  async getBattleStatistics(userId: string): Promise<{
    totalBattles: number
    wonBattles: number
    activeBattles: number
    totalXPEarned: number
  }> {
    await new Promise(resolve => setTimeout(resolve, 250))

    let totalBattles = 0
    let wonBattles = 0
    let activeBattles = 0
    let totalXPEarned = 0

    for (const battles of this.plotBattles.values()) {
      const userBattles = battles.filter(battle => battle.user_id === userId)
      
      totalBattles += userBattles.length
      activeBattles += userBattles.filter(b => b.status === 'active').length
      
      // For resolved battles, assume 70% success rate for XP calculation
      const resolvedBattles = userBattles.filter(b => b.status === 'resolved')
      wonBattles += Math.round(resolvedBattles.length * 0.7)
      totalXPEarned += resolvedBattles.reduce((sum, battle) => sum + battle.xp_reward, 0)
    }

    return {
      totalBattles,
      wonBattles,
      activeBattles,
      totalXPEarned
    }
  }

  // Method to simulate pest pressure based on weather and crop conditions
  async calculatePestRisk(plotId: string, cropType: string, weatherConditions: any): Promise<{
    riskLevel: 'low' | 'medium' | 'high'
    recommendedActions: string[]
    likelyPests: string[]
  }> {
    await new Promise(resolve => setTimeout(resolve, 200))

    // Simple risk calculation based on crop type and weather
    const cropRisk = this.getCropPestRisk(cropType)
    const weatherRisk = this.getWeatherPestRisk(weatherConditions)
    
    const combinedRisk = (cropRisk + weatherRisk) / 2
    
    let riskLevel: 'low' | 'medium' | 'high'
    if (combinedRisk < 0.3) riskLevel = 'low'
    else if (combinedRisk < 0.7) riskLevel = 'medium'
    else riskLevel = 'high'

    const likelyPests = this.getLikelyPests(cropType)
    const recommendedActions = this.getRecommendedActions(riskLevel, likelyPests)

    return {
      riskLevel,
      recommendedActions,
      likelyPests
    }
  }

  private getCropPestRisk(cropType: string): number {
    const riskLevels: { [key: string]: number } = {
      'tomatoes': 0.8,
      'peppers': 0.7,
      'corn': 0.6,
      'lettuce': 0.5,
      'beans': 0.6,
      'potatoes': 0.7,
      'onions': 0.4,
      'carrots': 0.3
    }
    
    return riskLevels[cropType.toLowerCase()] || 0.5
  }

  private getWeatherPestRisk(weatherConditions: any): number {
    if (!weatherConditions) return 0.5
    
    let risk = 0.5
    
    // High humidity increases pest risk
    if (weatherConditions.humidity > 70) risk += 0.2
    
    // Warm temperatures increase pest activity
    if (weatherConditions.temperature > 25) risk += 0.1
    
    // Recent rain can increase some pest populations
    if (weatherConditions.recent_rain) risk += 0.1
    
    return Math.min(risk, 1.0)
  }

  private getLikelyPests(cropType: string): string[] {
    const pests: string[] = []
    
    for (const [pestType, info] of Object.entries(this.PEST_TYPES)) {
      if (info.commonCrops.includes(cropType.toLowerCase())) {
        pests.push(pestType)
      }
    }
    
    return pests.length > 0 ? pests : ['aphids', 'spider_mites']
  }

  private getRecommendedActions(riskLevel: string, likelyPests: string[]): string[] {
    const actions: string[] = []
    
    switch (riskLevel) {
      case 'low':
        actions.push('Continue regular monitoring')
        actions.push('Maintain good plant hygiene')
        break
      case 'medium':
        actions.push('Increase monitoring frequency')
        actions.push('Consider preventive treatments')
        actions.push('Remove any infected plant material')
        break
      case 'high':
        actions.push('Implement immediate pest control measures')
        actions.push('Apply appropriate treatments')
        actions.push('Monitor daily for pest activity')
        actions.push('Consider biological control options')
        break
    }
    
    return actions
  }

  // Method to reset data (useful for testing)
  resetData(): void {
    this.pestBattles.clear()
    this.plotBattles.clear()
  }
}