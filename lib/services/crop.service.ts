// Crop Service Implementation using Supabase

import { supabase } from '../supabase/client'
import { CropService } from './interfaces'
import { Crop } from '../types'

export class SupabaseCropService implements CropService {
  async assignCrop(cropData: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<Crop> {
    try {
      const { data, error } = await supabase
        .from('crops')
        .insert({
          plot_id: cropData.plot_id,
          name: cropData.name,
          variety: cropData.variety,
          sown_date: cropData.sown_date,
          expected_harvest_date: cropData.expected_harvest_date,
          status: cropData.status || 'planted',
          growth_stage: cropData.growth_stage || 'seedling',
          quantity_planted: cropData.quantity_planted,
          notes: cropData.notes
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to assign crop: ${error.message}`)
      }

      return this.mapDatabaseCropToCrop(data)
    } catch (error) {
      console.error('Assign crop error:', error)
      throw error
    }
  }

  async updateCropStatus(
    cropId: string, 
    status: Crop['status'], 
    growthStage?: Crop['growth_stage']
  ): Promise<Crop> {
    try {
      const updateData: any = { status }
      
      if (growthStage) {
        updateData.growth_stage = growthStage
      }

      // Set actual harvest date if status is harvested
      if (status === 'harvested') {
        updateData.actual_harvest_date = new Date().toISOString().split('T')[0]
      }

      const { data, error } = await supabase
        .from('crops')
        .update(updateData)
        .eq('id', cropId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to update crop status: ${error.message}`)
      }

      return this.mapDatabaseCropToCrop(data)
    } catch (error) {
      console.error('Update crop status error:', error)
      throw error
    }
  }

  async getCrops(plotId: string): Promise<Crop[]> {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('plot_id', plotId)
        .order('sown_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch crops: ${error.message}`)
      }

      return data.map(crop => this.mapDatabaseCropToCrop(crop))
    } catch (error) {
      console.error('Get crops error:', error)
      throw error
    }
  }

  async getCrop(cropId: string): Promise<Crop> {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select('*')
        .eq('id', cropId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch crop: ${error.message}`)
      }

      return this.mapDatabaseCropToCrop(data)
    } catch (error) {
      console.error('Get crop error:', error)
      throw error
    }
  }

  async getCropTimeline(cropId: string): Promise<any[]> {
    try {
      const crop = await this.getCrop(cropId)
      const timeline = this.generateCropTimeline(crop)
      
      return timeline
    } catch (error) {
      console.error('Get crop timeline error:', error)
      throw error
    }
  }

  async harvestCrop(cropId: string): Promise<{ crop: Crop; xpAwarded: number }> {
    try {
      // Get current crop data
      const crop = await this.getCrop(cropId)
      
      if (crop.status === 'harvested') {
        throw new Error('Crop has already been harvested')
      }

      if (crop.status !== 'ready') {
        throw new Error('Crop is not ready for harvest')
      }

      // Update crop status to harvested
      const harvestedCrop = await this.updateCropStatus(cropId, 'harvested')

      // Calculate XP reward based on crop type and quantity
      const xpAwarded = this.calculateHarvestXP(harvestedCrop)

      return {
        crop: harvestedCrop,
        xpAwarded
      }
    } catch (error) {
      console.error('Harvest crop error:', error)
      throw error
    }
  }

  // Helper method to map database crop to our Crop type
  private mapDatabaseCropToCrop(dbCrop: any): Crop {
    return {
      id: dbCrop.id,
      plot_id: dbCrop.plot_id,
      name: dbCrop.name,
      variety: dbCrop.variety,
      sown_date: dbCrop.sown_date,
      expected_harvest_date: dbCrop.expected_harvest_date,
      actual_harvest_date: dbCrop.actual_harvest_date,
      status: dbCrop.status,
      growth_stage: dbCrop.growth_stage,
      quantity_planted: dbCrop.quantity_planted,
      quantity_harvested: dbCrop.quantity_harvested,
      notes: dbCrop.notes,
      created_at: dbCrop.created_at,
      updated_at: dbCrop.updated_at
    }
  }

  // Generate timeline events for a crop
  private generateCropTimeline(crop: Crop): any[] {
    const timeline = []
    const sownDate = new Date(crop.sown_date)
    const today = new Date()

    // Planting event
    timeline.push({
      id: 'planted',
      title: 'Crop Planted',
      description: `${crop.name} ${crop.variety ? `(${crop.variety})` : ''} was planted`,
      date: crop.sown_date,
      status: 'completed',
      type: 'milestone',
      icon: '🌱'
    })

    // Generate growth stage events
    const growthStages = [
      { stage: 'seedling', title: 'Seedling Stage', icon: '🌱', days: 7 },
      { stage: 'vegetative', title: 'Vegetative Growth', icon: '🌿', days: 21 },
      { stage: 'flowering', title: 'Flowering Stage', icon: '🌸', days: 35 },
      { stage: 'fruiting', title: 'Fruiting Stage', icon: '🍅', days: 50 },
      { stage: 'mature', title: 'Maturity', icon: '🌾', days: 70 }
    ]

    growthStages.forEach(stage => {
      const stageDate = new Date(sownDate)
      stageDate.setDate(sownDate.getDate() + stage.days)

      let status = 'pending'
      if (crop.status === 'harvested' || stageDate <= today) {
        status = 'completed'
      } else if (crop.growth_stage === stage.stage) {
        status = 'current'
      }

      timeline.push({
        id: stage.stage,
        title: stage.title,
        description: `Expected ${stage.title.toLowerCase()} phase`,
        date: stageDate.toISOString().split('T')[0],
        status,
        type: 'growth_stage',
        icon: stage.icon
      })
    })

    // Expected harvest event
    if (crop.expected_harvest_date) {
      const expectedDate = new Date(crop.expected_harvest_date)
      let harvestStatus = 'pending'
      
      if (crop.status === 'harvested') {
        harvestStatus = 'completed'
      } else if (expectedDate <= today && crop.status === 'ready') {
        harvestStatus = 'ready'
      } else if (expectedDate < today) {
        harvestStatus = 'overdue'
      }

      timeline.push({
        id: 'expected_harvest',
        title: 'Expected Harvest',
        description: 'Crop should be ready for harvest',
        date: crop.expected_harvest_date,
        status: harvestStatus,
        type: 'milestone',
        icon: '🚜'
      })
    }

    // Actual harvest event
    if (crop.actual_harvest_date) {
      timeline.push({
        id: 'actual_harvest',
        title: 'Harvested',
        description: `Crop was successfully harvested${crop.quantity_harvested ? ` (${crop.quantity_harvested} units)` : ''}`,
        date: crop.actual_harvest_date,
        status: 'completed',
        type: 'milestone',
        icon: '✅'
      })
    }

    // Sort timeline by date
    return timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  // Calculate XP reward for harvesting
  private calculateHarvestXP(crop: Crop): number {
    const baseXP = 25 // Base XP for any harvest
    
    // Bonus XP based on crop type
    const cropMultipliers: { [key: string]: number } = {
      'tomatoes': 1.2,
      'corn': 1.0,
      'wheat': 0.8,
      'rice': 1.1,
      'potatoes': 0.9,
      'lettuce': 1.3,
      'peppers': 1.4,
      'carrots': 1.0
    }

    const multiplier = cropMultipliers[crop.name.toLowerCase()] || 1.0
    let totalXP = Math.round(baseXP * multiplier)

    // Bonus for quantity harvested
    if (crop.quantity_harvested && crop.quantity_harvested > 0) {
      totalXP += Math.min(crop.quantity_harvested * 2, 50) // Max 50 bonus XP
    }

    // Bonus for timely harvest (within expected timeframe)
    if (crop.expected_harvest_date && crop.actual_harvest_date) {
      const expectedDate = new Date(crop.expected_harvest_date)
      const actualDate = new Date(crop.actual_harvest_date)
      const daysDifference = Math.abs((actualDate.getTime() - expectedDate.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDifference <= 3) { // Harvested within 3 days of expected date
        totalXP += 10 // Timely harvest bonus
      }
    }

    return totalXP
  }

  // Additional helper methods for crop management

  /**
   * Get crops by status for a user
   */
  async getCropsByStatus(userId: string, status: Crop['status']): Promise<Crop[]> {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          plots!inner (
            user_id
          )
        `)
        .eq('plots.user_id', userId)
        .eq('status', status)
        .order('sown_date', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch crops by status: ${error.message}`)
      }

      return data.map(crop => this.mapDatabaseCropToCrop(crop))
    } catch (error) {
      console.error('Get crops by status error:', error)
      throw error
    }
  }

  /**
   * Get crop statistics for a user
   */
  async getCropStatistics(userId: string): Promise<{
    totalCrops: number
    activeCrops: number
    harvestedCrops: number
    readyForHarvest: number
    cropsByStatus: { [key: string]: number }
  }> {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          status,
          plots!inner (
            user_id
          )
        `)
        .eq('plots.user_id', userId)

      if (error) {
        throw new Error(`Failed to fetch crop statistics: ${error.message}`)
      }

      const totalCrops = data.length
      const activeCrops = data.filter(crop => crop.status !== 'harvested').length
      const harvestedCrops = data.filter(crop => crop.status === 'harvested').length
      const readyForHarvest = data.filter(crop => crop.status === 'ready').length

      const cropsByStatus = data.reduce((acc, crop) => {
        acc[crop.status] = (acc[crop.status] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      return {
        totalCrops,
        activeCrops,
        harvestedCrops,
        readyForHarvest,
        cropsByStatus
      }
    } catch (error) {
      console.error('Get crop statistics error:', error)
      throw error
    }
  }

  /**
   * Update crop with care action (watering, fertilizing, etc.)
   */
  async recordCareAction(
    cropId: string, 
    actionType: 'watering' | 'fertilizing' | 'pest_control' | 'pruning',
    notes?: string
  ): Promise<Crop> {
    try {
      // This could be expanded to track care actions in a separate table
      // For now, we'll just update the crop's notes
      const crop = await this.getCrop(cropId)
      const timestamp = new Date().toISOString()
      const actionNote = `${actionType} on ${timestamp}${notes ? `: ${notes}` : ''}`
      
      const updatedNotes = crop.notes 
        ? `${crop.notes}\n${actionNote}`
        : actionNote

      const { data, error } = await supabase
        .from('crops')
        .update({ notes: updatedNotes })
        .eq('id', cropId)
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to record care action: ${error.message}`)
      }

      return this.mapDatabaseCropToCrop(data)
    } catch (error) {
      console.error('Record care action error:', error)
      throw error
    }
  }

  /**
   * Get crops that need attention (overdue for care, ready for harvest, etc.)
   */
  async getCropsNeedingAttention(userId: string): Promise<{
    readyForHarvest: Crop[]
    overdue: Crop[]
    needsWatering: Crop[]
  }> {
    try {
      const { data, error } = await supabase
        .from('crops')
        .select(`
          *,
          plots!inner (
            user_id
          )
        `)
        .eq('plots.user_id', userId)
        .neq('status', 'harvested')

      if (error) {
        throw new Error(`Failed to fetch crops needing attention: ${error.message}`)
      }

      const crops = data.map(crop => this.mapDatabaseCropToCrop(crop))
      const today = new Date()

      const readyForHarvest = crops.filter(crop => crop.status === 'ready')
      
      const overdue = crops.filter(crop => {
        if (!crop.expected_harvest_date) return false
        const expectedDate = new Date(crop.expected_harvest_date)
        return expectedDate < today && crop.status !== 'ready'
      })

      // Simple heuristic for crops needing watering (planted more than 3 days ago)
      const needsWatering = crops.filter(crop => {
        const sownDate = new Date(crop.sown_date)
        const daysSincePlanted = (today.getTime() - sownDate.getTime()) / (1000 * 60 * 60 * 24)
        return daysSincePlanted > 3 && crop.status !== 'ready'
      })

      return {
        readyForHarvest,
        overdue,
        needsWatering
      }
    } catch (error) {
      console.error('Get crops needing attention error:', error)
      throw error
    }
  }

  /**
   * Calculate crop progress percentage
   */
  calculateCropProgress(crop: Crop): number {
    if (crop.status === 'harvested') return 100

    const sownDate = new Date(crop.sown_date)
    const today = new Date()
    const daysSincePlanted = (today.getTime() - sownDate.getTime()) / (1000 * 60 * 60 * 24)

    if (crop.expected_harvest_date) {
      const expectedDate = new Date(crop.expected_harvest_date)
      const totalGrowingDays = (expectedDate.getTime() - sownDate.getTime()) / (1000 * 60 * 60 * 24)
      return Math.min(100, Math.max(0, (daysSincePlanted / totalGrowingDays) * 100))
    }

    // Default to 90-day growing cycle if no expected harvest date
    return Math.min(100, Math.max(0, (daysSincePlanted / 90) * 100))
  }

  /**
   * Get recommended next actions for a crop
   */
  getRecommendedActions(crop: Crop): string[] {
    const actions: string[] = []
    const today = new Date()
    const sownDate = new Date(crop.sown_date)
    const daysSincePlanted = (today.getTime() - sownDate.getTime()) / (1000 * 60 * 60 * 24)

    switch (crop.status) {
      case 'planted':
        if (daysSincePlanted > 7) {
          actions.push('Check for germination')
          actions.push('Water if soil is dry')
        }
        break
      case 'growing':
        actions.push('Regular watering')
        actions.push('Check for pests')
        if (daysSincePlanted > 14) {
          actions.push('Consider fertilizing')
        }
        break
      case 'flowering':
        actions.push('Reduce watering frequency')
        actions.push('Monitor for fruit development')
        actions.push('Check for pollination issues')
        break
      case 'ready':
        actions.push('Harvest immediately')
        actions.push('Prepare storage containers')
        break
    }

    // General recommendations based on growth stage
    if (crop.growth_stage === 'seedling') {
      actions.push('Protect from strong winds')
      actions.push('Ensure adequate sunlight')
    } else if (crop.growth_stage === 'vegetative') {
      actions.push('Prune if necessary')
      actions.push('Support plant structure')
    }

    return actions
  }
}