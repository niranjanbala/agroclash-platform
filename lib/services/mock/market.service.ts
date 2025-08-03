// Mock Market Service Implementation

import { MarketService } from '../interfaces'
import { MarketPrice, Location } from '../../types'
import { generateId } from '../../utils'

export class MockMarketService implements MarketService {
  private mockPrices: MarketPrice[] = []
  private priceHistory: Map<string, MarketPrice[]> = new Map()

  constructor() {
    this.generateMockPrices()
  }

  async getPrices(cropName?: string, location?: Location): Promise<MarketPrice[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 400))

    let prices = [...this.mockPrices]

    // Filter by crop name if provided
    if (cropName) {
      prices = prices.filter(price => 
        price.crop_name.toLowerCase().includes(cropName.toLowerCase())
      )
    }

    // Sort by date (most recent first)
    prices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Add some price variation to simulate real market fluctuations
    return prices.map(price => ({
      ...price,
      price_per_kg: this.addPriceVariation(price.price_per_kg),
      trend: this.calculateTrend(price.crop_name)
    }))
  }

  async listCrop(cropId: string, quantity: number, pricePerKg: number): Promise<void> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300))

    // In a real implementation, this would create a listing in the marketplace
    console.log(`Listed crop ${cropId}: ${quantity}kg at $${pricePerKg}/kg`)
  }

  async getMarketTrends(cropName: string, days: number): Promise<MarketPrice[]> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const trends: MarketPrice[] = []
    const basePrice = this.getBasePriceForCrop(cropName)
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)

      // Generate realistic price trend with some volatility
      const dayVariation = (Math.random() - 0.5) * 0.2 // ±10% daily variation
      const trendFactor = 1 + (Math.sin(i / 10) * 0.1) // Seasonal trend
      const price = basePrice * trendFactor * (1 + dayVariation)

      trends.push({
        crop_name: cropName,
        price_per_kg: Math.round(price * 100) / 100,
        currency: 'USD',
        market_location: this.getRandomMarketLocation(),
        date: date.toISOString().split('T')[0],
        trend: this.calculateTrendFromHistory(trends, price)
      })
    }

    return trends
  }

  async getRecommendations(userId: string): Promise<{ cropName: string; reason: string; expectedPrice: number }[]> {
    await new Promise(resolve => setTimeout(resolve, 600))

    const recommendations = [
      {
        cropName: 'Tomatoes',
        reason: 'High demand and good weather conditions expected',
        expectedPrice: 3.50
      },
      {
        cropName: 'Corn',
        reason: 'Seasonal price increase anticipated',
        expectedPrice: 0.85
      },
      {
        cropName: 'Soybeans',
        reason: 'Export demand increasing',
        expectedPrice: 1.20
      },
      {
        cropName: 'Wheat',
        reason: 'Supply shortage in regional markets',
        expectedPrice: 0.95
      },
      {
        cropName: 'Rice',
        reason: 'Stable demand with good profit margins',
        expectedPrice: 1.10
      }
    ]

    // Return 2-3 random recommendations
    const shuffled = recommendations.sort(() => 0.5 - Math.random())
    return shuffled.slice(0, 2 + Math.floor(Math.random() * 2))
  }

  private generateMockPrices(): void {
    const crops = [
      { name: 'Tomatoes', basePrice: 3.20, varieties: ['Cherry', 'Roma', 'Beefsteak'] },
      { name: 'Corn', basePrice: 0.80, varieties: ['Sweet', 'Field', 'Popcorn'] },
      { name: 'Wheat', basePrice: 0.90, varieties: ['Winter', 'Spring', 'Durum'] },
      { name: 'Rice', basePrice: 1.05, varieties: ['Basmati', 'Jasmine', 'Brown'] },
      { name: 'Soybeans', basePrice: 1.15, varieties: ['Edamame', 'Black', 'Yellow'] },
      { name: 'Potatoes', basePrice: 0.65, varieties: ['Russet', 'Red', 'Yukon'] },
      { name: 'Onions', basePrice: 0.85, varieties: ['Yellow', 'Red', 'White'] },
      { name: 'Carrots', basePrice: 1.25, varieties: ['Orange', 'Purple', 'Baby'] },
      { name: 'Lettuce', basePrice: 2.10, varieties: ['Iceberg', 'Romaine', 'Butter'] },
      { name: 'Peppers', basePrice: 2.80, varieties: ['Bell', 'Jalapeño', 'Habanero'] }
    ]

    const markets = [
      'Central Market',
      'Farmers Market',
      'Wholesale District',
      'Regional Hub',
      'Local Co-op'
    ]

    this.mockPrices = []

    crops.forEach(crop => {
      crop.varieties.forEach(variety => {
        markets.forEach(market => {
          const priceVariation = (Math.random() - 0.5) * 0.3 // ±15% variation
          const price = crop.basePrice * (1 + priceVariation)

          this.mockPrices.push({
            crop_name: crop.name,
            variety,
            price_per_kg: Math.round(price * 100) / 100,
            currency: 'USD',
            market_location: market,
            date: new Date().toISOString().split('T')[0],
            trend: 'stable'
          })
        })
      })
    })
  }

  private addPriceVariation(basePrice: number): number {
    const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
    return Math.round(basePrice * (1 + variation) * 100) / 100
  }

  private calculateTrend(cropName: string): 'up' | 'down' | 'stable' {
    // Simple trend calculation based on crop name hash
    const hash = cropName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const trendValue = hash % 3
    
    switch (trendValue) {
      case 0: return 'up'
      case 1: return 'down'
      default: return 'stable'
    }
  }

  private calculateTrendFromHistory(history: MarketPrice[], currentPrice: number): 'up' | 'down' | 'stable' {
    if (history.length === 0) return 'stable'
    
    const lastPrice = history[history.length - 1].price_per_kg
    const difference = currentPrice - lastPrice
    const threshold = lastPrice * 0.02 // 2% threshold
    
    if (difference > threshold) return 'up'
    if (difference < -threshold) return 'down'
    return 'stable'
  }

  private getBasePriceForCrop(cropName: string): number {
    const basePrices: { [key: string]: number } = {
      'Tomatoes': 3.20,
      'Corn': 0.80,
      'Wheat': 0.90,
      'Rice': 1.05,
      'Soybeans': 1.15,
      'Potatoes': 0.65,
      'Onions': 0.85,
      'Carrots': 1.25,
      'Lettuce': 2.10,
      'Peppers': 2.80
    }
    
    return basePrices[cropName] || 1.00
  }

  private getRandomMarketLocation(): string {
    const locations = [
      'Central Market',
      'Farmers Market',
      'Wholesale District',
      'Regional Hub',
      'Local Co-op',
      'Export Terminal',
      'Processing Plant'
    ]
    
    return locations[Math.floor(Math.random() * locations.length)]
  }
}