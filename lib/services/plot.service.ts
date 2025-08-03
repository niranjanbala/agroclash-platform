// Plot Service Implementation using Supabase

import { supabase } from '../supabase/client'
import { PlotService } from './interfaces'
import { Plot } from '../types'
import { calculatePolygonArea } from '../utils'

export class SupabasePlotService implements PlotService {
  async createPlot(plotData: Omit<Plot, 'id' | 'created_at' | 'updated_at'>): Promise<Plot> {
    try {
      // Convert GeoJSON to PostGIS format
      const geometryWKT = this.geoJSONToWKT(plotData.geometry)

      const { data, error } = await supabase
        .from('plots')
        .insert({
          user_id: plotData.user_id,
          name: plotData.name,
          description: plotData.description,
          geometry: geometryWKT,
          soil_type: plotData.soil_type,
          irrigation_type: plotData.irrigation_type
        })
        .select(`
          *,
          crops (
            id,
            name,
            status,
            growth_stage
          )
        `)
        .single()

      if (error) {
        throw new Error(`Failed to create plot: ${error.message}`)
      }

      return this.mapDatabasePlotToPlot(data)
    } catch (error) {
      console.error('Create plot error:', error)
      throw error
    }
  }

  async updatePlot(plotId: string, updates: Partial<Plot>): Promise<Plot> {
    try {
      const updateData: any = {
        name: updates.name,
        description: updates.description,
        soil_type: updates.soil_type,
        irrigation_type: updates.irrigation_type,
        is_active: updates.is_active
      }

      // Convert geometry if provided
      if (updates.geometry) {
        updateData.geometry = this.geoJSONToWKT(updates.geometry)
      }

      const { data, error } = await supabase
        .from('plots')
        .update(updateData)
        .eq('id', plotId)
        .select(`
          *,
          crops (
            id,
            name,
            status,
            growth_stage
          )
        `)
        .single()

      if (error) {
        throw new Error(`Failed to update plot: ${error.message}`)
      }

      return this.mapDatabasePlotToPlot(data)
    } catch (error) {
      console.error('Update plot error:', error)
      throw error
    }
  }

  async deletePlot(plotId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('plots')
        .delete()
        .eq('id', plotId)

      if (error) {
        throw new Error(`Failed to delete plot: ${error.message}`)
      }
    } catch (error) {
      console.error('Delete plot error:', error)
      throw error
    }
  }

  async getPlots(userId: string): Promise<Plot[]> {
    try {
      const { data, error } = await supabase
        .from('plots')
        .select(`
          *,
          crops (
            id,
            name,
            status,
            growth_stage,
            sown_date,
            expected_harvest_date
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) {
        throw new Error(`Failed to fetch plots: ${error.message}`)
      }

      return data.map(plot => this.mapDatabasePlotToPlot(plot))
    } catch (error) {
      console.error('Get plots error:', error)
      throw error
    }
  }

  async getPlot(plotId: string): Promise<Plot> {
    try {
      const { data, error } = await supabase
        .from('plots')
        .select(`
          *,
          crops (
            id,
            name,
            variety,
            status,
            growth_stage,
            sown_date,
            expected_harvest_date,
            quantity_planted,
            quantity_harvested,
            notes
          )
        `)
        .eq('id', plotId)
        .single()

      if (error) {
        throw new Error(`Failed to fetch plot: ${error.message}`)
      }

      return this.mapDatabasePlotToPlot(data)
    } catch (error) {
      console.error('Get plot error:', error)
      throw error
    }
  }

  async calculateArea(geometry: GeoJSON.Polygon): Promise<number> {
    try {
      // Use PostGIS for accurate area calculation
      const geometryWKT = this.geoJSONToWKT(geometry)
      
      const { data, error } = await supabase
        .rpc('calculate_polygon_area', {
          geom_wkt: geometryWKT
        })

      if (error) {
        // Fallback to client-side calculation
        console.warn('PostGIS area calculation failed, using client-side calculation:', error)
        const coordinates = geometry.coordinates[0]
        return calculatePolygonArea(coordinates) / 10000 // Convert to hectares
      }

      return data || 0
    } catch (error) {
      console.error('Calculate area error:', error)
      // Fallback to client-side calculation
      const coordinates = geometry.coordinates[0]
      return calculatePolygonArea(coordinates) / 10000 // Convert to hectares
    }
  }

  // Helper method to convert GeoJSON to WKT format for PostGIS
  private geoJSONToWKT(geometry: GeoJSON.Polygon): string {
    const coordinates = geometry.coordinates[0]
    const coordString = coordinates
      .map(coord => `${coord[0]} ${coord[1]}`)
      .join(', ')
    
    return `POLYGON((${coordString}))`
  }

  // Helper method to convert PostGIS geometry to GeoJSON
  private wktToGeoJSON(wkt: string): GeoJSON.Polygon {
    // Simple WKT parser for POLYGON format
    const match = wkt.match(/POLYGON\(\(([^)]+)\)\)/)
    if (!match) {
      throw new Error('Invalid WKT format')
    }

    const coordString = match[1]
    const coordinates = coordString
      .split(', ')
      .map(coord => {
        const [lng, lat] = coord.split(' ').map(Number)
        return [lng, lat]
      })

    return {
      type: 'Polygon',
      coordinates: [coordinates]
    }
  }

  // Helper method to map database plot to our Plot type
  private mapDatabasePlotToPlot(dbPlot: any): Plot {
    let geometry: GeoJSON.Polygon

    try {
      // Handle different geometry formats from PostGIS
      if (typeof dbPlot.geometry === 'string') {
        geometry = this.wktToGeoJSON(dbPlot.geometry)
      } else if (dbPlot.geometry && dbPlot.geometry.coordinates) {
        geometry = dbPlot.geometry
      } else {
        // Fallback geometry
        geometry = {
          type: 'Polygon',
          coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
        }
      }
    } catch (error) {
      console.error('Error parsing geometry:', error)
      // Fallback geometry
      geometry = {
        type: 'Polygon',
        coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]]
      }
    }

    return {
      id: dbPlot.id,
      user_id: dbPlot.user_id,
      name: dbPlot.name,
      description: dbPlot.description,
      geometry,
      area_hectares: dbPlot.area_hectares || 0,
      soil_type: dbPlot.soil_type,
      irrigation_type: dbPlot.irrigation_type,
      is_active: dbPlot.is_active,
      crops: dbPlot.crops || [],
      created_at: dbPlot.created_at,
      updated_at: dbPlot.updated_at
    }
  }

  // Additional helper methods for plot management

  /**
   * Get plots within a geographic bounding box
   */
  async getPlotsInBounds(
    userId: string,
    bounds: {
      north: number
      south: number
      east: number
      west: number
    }
  ): Promise<Plot[]> {
    try {
      const { data, error } = await supabase
        .from('plots')
        .select(`
          *,
          crops (
            id,
            name,
            status,
            growth_stage
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)

      if (error) {
        throw new Error(`Failed to fetch plots in bounds: ${error.message}`)
      }

      // Filter plots that intersect with the bounds
      // In a real implementation, this would be done with PostGIS ST_Intersects
      const filteredPlots = data.filter(plot => {
        try {
          const geometry = this.mapDatabasePlotToPlot(plot).geometry
          const coordinates = geometry.coordinates[0]
          
          return coordinates.some(coord => {
            const [lng, lat] = coord
            return lng >= bounds.west && lng <= bounds.east &&
                   lat >= bounds.south && lat <= bounds.north
          })
        } catch {
          return false
        }
      })

      return filteredPlots.map(plot => this.mapDatabasePlotToPlot(plot))
    } catch (error) {
      console.error('Get plots in bounds error:', error)
      throw error
    }
  }

  /**
   * Get plot statistics for a user
   */
  async getPlotStatistics(userId: string): Promise<{
    totalPlots: number
    totalArea: number
    activeCrops: number
    plotsByStatus: { [key: string]: number }
  }> {
    try {
      const plots = await this.getPlots(userId)
      
      const totalPlots = plots.length
      const totalArea = plots.reduce((sum, plot) => sum + plot.area_hectares, 0)
      const activeCrops = plots.reduce((sum, plot) => 
        sum + (plot.crops?.filter(crop => crop.status !== 'harvested').length || 0), 0
      )

      const plotsByStatus = plots.reduce((acc, plot) => {
        const hasActiveCrops = plot.crops?.some(crop => crop.status !== 'harvested')
        const status = hasActiveCrops ? 'active' : 'inactive'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as { [key: string]: number })

      return {
        totalPlots,
        totalArea,
        activeCrops,
        plotsByStatus
      }
    } catch (error) {
      console.error('Get plot statistics error:', error)
      throw error
    }
  }

  /**
   * Validate plot geometry
   */
  validatePlotGeometry(geometry: GeoJSON.Polygon): {
    isValid: boolean
    errors: string[]
    area: number
  } {
    const errors: string[] = []
    let area = 0

    try {
      // Check if geometry has coordinates
      if (!geometry.coordinates || geometry.coordinates.length === 0) {
        errors.push('Geometry must have coordinates')
        return { isValid: false, errors, area }
      }

      const coordinates = geometry.coordinates[0]

      // Check minimum number of points (4 for a closed polygon)
      if (coordinates.length < 4) {
        errors.push('Polygon must have at least 4 points')
      }

      // Check if polygon is closed
      const firstPoint = coordinates[0]
      const lastPoint = coordinates[coordinates.length - 1]
      if (firstPoint[0] !== lastPoint[0] || firstPoint[1] !== lastPoint[1]) {
        errors.push('Polygon must be closed (first and last points must be the same)')
      }

      // Calculate area
      area = calculatePolygonArea(coordinates) / 10000 // Convert to hectares

      // Check minimum area (e.g., 0.01 hectares = 100 square meters)
      if (area < 0.01) {
        errors.push('Plot area must be at least 0.01 hectares (100 square meters)')
      }

      // Check maximum area (e.g., 1000 hectares)
      if (area > 1000) {
        errors.push('Plot area cannot exceed 1000 hectares')
      }

      // Check for self-intersecting polygon (basic check)
      if (this.isPolygonSelfIntersecting(coordinates)) {
        errors.push('Polygon cannot intersect with itself')
      }

    } catch (error) {
      errors.push('Invalid geometry format')
    }

    return {
      isValid: errors.length === 0,
      errors,
      area
    }
  }

  /**
   * Basic check for self-intersecting polygon
   */
  private isPolygonSelfIntersecting(coordinates: number[][]): boolean {
    // This is a simplified check - a full implementation would use more sophisticated algorithms
    const edges = []
    
    for (let i = 0; i < coordinates.length - 1; i++) {
      edges.push([coordinates[i], coordinates[i + 1]])
    }

    // Check each edge against every other non-adjacent edge
    for (let i = 0; i < edges.length; i++) {
      for (let j = i + 2; j < edges.length; j++) {
        // Skip adjacent edges and the closing edge
        if (j === edges.length - 1 && i === 0) continue
        
        if (this.doLinesIntersect(edges[i][0], edges[i][1], edges[j][0], edges[j][1])) {
          return true
        }
      }
    }

    return false
  }

  /**
   * Check if two line segments intersect
   */
  private doLinesIntersect(p1: number[], q1: number[], p2: number[], q2: number[]): boolean {
    const orientation = (p: number[], q: number[], r: number[]) => {
      const val = (q[1] - p[1]) * (r[0] - q[0]) - (q[0] - p[0]) * (r[1] - q[1])
      if (val === 0) return 0 // collinear
      return val > 0 ? 1 : 2 // clockwise or counterclockwise
    }

    const onSegment = (p: number[], q: number[], r: number[]) => {
      return q[0] <= Math.max(p[0], r[0]) && q[0] >= Math.min(p[0], r[0]) &&
             q[1] <= Math.max(p[1], r[1]) && q[1] >= Math.min(p[1], r[1])
    }

    const o1 = orientation(p1, q1, p2)
    const o2 = orientation(p1, q1, q2)
    const o3 = orientation(p2, q2, p1)
    const o4 = orientation(p2, q2, q1)

    // General case
    if (o1 !== o2 && o3 !== o4) return true

    // Special cases
    if (o1 === 0 && onSegment(p1, p2, q1)) return true
    if (o2 === 0 && onSegment(p1, q2, q1)) return true
    if (o3 === 0 && onSegment(p2, p1, q2)) return true
    if (o4 === 0 && onSegment(p2, q1, q2)) return true

    return false
  }
}