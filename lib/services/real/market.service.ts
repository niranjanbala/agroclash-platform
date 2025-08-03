import { MarketListing, MarketPrice, MarketTrend, MarketAnalytics } from '../../types'
import { ApiConfigManager } from '../../config/api.config'
import { withMonitoring } from '../monitoring/api-monitor'

interface CoinApiResponse {
  symbol_id: string
  time: string
  price: number
  volume_24h: number
  price_change_24h: number
}

interface MarketDataResponse {
  data: Array<{
    id: string
    symbol: string
    name: string
    current_price: number
    price_change_percentage_24h: number
    total_volume: number
    market_cap: number
  }>
}

export class RealMarketService {
  private apiKey: string
  private baseUrl: string
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  private config = ApiConfigManager.getInstance()

  constructor() {
    const marketConfig = this.config.getServiceConfig('market')
    this.apiKey = marketConfig.config.apiKey || ''
    this.baseUrl = marketConfig.config.baseUrl || 'https://api.coingecko.com/api/v3'
    
    if (!this.apiKey && marketConfig.provider !== 'mock') {
      console.warn('Market API key not configured, using free tier with rate limits')
    }
  }

  async getMarketPrices(): Promise<MarketPrice[]> {
    return withMonitoring('market', '/prices', 'GET', async () => {
      const cacheKey = 'market_prices'
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      try {
        // Map crop types to cryptocurrency symbols for demo purposes
        // In a real agricultural market, this would connect to commodity exchanges
        const cropToCrypto = {
          'wheat': 'bitcoin',
          'corn': 'ethereum',
          'rice': 'cardano',
          'tomato': 'solana',
          'potato': 'polkadot',
          'carrot': 'chainlink',
          'lettuce': 'litecoin',
          'onion': 'uniswap'
        }

        const symbols = Object.values(cropToCrypto).join(',')
        const url = `${this.baseUrl}/simple/price?ids=${symbols}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`
        
        const response = await this.fetchWithRetry(url)
        const data = await response.json()

        const prices: MarketPrice[] = Object.entries(cropToCrypto).map(([crop, crypto]) => {
          const cryptoData = data[crypto]
          if (!cryptoData) {
            return {
              crop_type: crop,
              current_price: Math.random() * 10 + 1, // Fallback random price
              price_change_24h: (Math.random() - 0.5) * 20,
              volume_24h: Math.floor(Math.random() * 10000),
              last_updated: new Date().toISOString()
            }
          }

          return {
            crop_type: crop,
            current_price: cryptoData.usd * 0.01, // Scale down for crop prices
            price_change_24h: cryptoData.usd_24h_change || 0,
            volume_24h: Math.floor((cryptoData.usd_24h_vol || 0) * 0.001), // Scale down volume
            last_updated: new Date().toISOString()
          }
        })

        this.setCache(cacheKey, prices, 5 * 60 * 1000) // Cache for 5 minutes
        return prices

      } catch (error) {
        console.error('Market API error:', error)
        // Return fallback data
        return this.getFallbackPrices()
      }
    })()
  }

  async getMarketTrends(timeframe: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<MarketTrend[]> {
    return withMonitoring('market', '/trends', 'GET', async () => {
      const cacheKey = `market_trends_${timeframe}`
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      try {
        const prices = await this.getMarketPrices()
        
        // Generate trend data based on current prices
        const trends: MarketTrend[] = prices.map(price => ({
          crop_type: price.crop_type,
          timeframe,
          trend_direction: price.price_change_24h > 0 ? 'up' : price.price_change_24h < 0 ? 'down' : 'stable',
          price_change_percentage: price.price_change_24h,
          volume_change_percentage: Math.random() * 40 - 20, // Random volume change
          support_level: price.current_price * 0.9,
          resistance_level: price.current_price * 1.1,
          prediction: this.generatePricePrediction(price),
          confidence_score: Math.random() * 40 + 60 // 60-100% confidence
        }))

        this.setCache(cacheKey, trends, 10 * 60 * 1000) // Cache for 10 minutes
        return trends

      } catch (error) {
        console.error('Market trends API error:', error)
        throw new Error('Failed to fetch market trends')
      }
    })()
  }

  async getMarketAnalytics(): Promise<MarketAnalytics> {
    return withMonitoring('market', '/analytics', 'GET', async () => {
      const cacheKey = 'market_analytics'
      const cached = this.getFromCache(cacheKey)
      if (cached) return cached

      try {
        const [prices, trends] = await Promise.all([
          this.getMarketPrices(),
          this.getMarketTrends('24h')
        ])

        const totalVolume = prices.reduce((sum, p) => sum + p.volume_24h, 0)
        const averagePrice = prices.reduce((sum, p) => sum + p.current_price, 0) / prices.length
        const gainers = prices.filter(p => p.price_change_24h > 0).length
        const losers = prices.filter(p => p.price_change_24h < 0).length

        const analytics: MarketAnalytics = {
          total_market_cap: totalVolume * averagePrice,
          total_volume_24h: totalVolume,
          market_dominance: this.calculateMarketDominance(prices),
          fear_greed_index: this.calculateFearGreedIndex(trends),
          volatility_index: this.calculateVolatilityIndex(prices),
          top_gainers: prices
            .sort((a, b) => b.price_change_24h - a.price_change_24h)
            .slice(0, 5)
            .map(p => ({
              crop_type: p.crop_type,
              price_change_percentage: p.price_change_24h,
              current_price: p.current_price
            })),
          top_losers: prices
            .sort((a, b) => a.price_change_24h - b.price_change_24h)
            .slice(0, 5)
            .map(p => ({
              crop_type: p.crop_type,
              price_change_percentage: p.price_change_24h,
              current_price: p.current_price
            })),
          market_sentiment: gainers > losers ? 'bullish' : losers > gainers ? 'bearish' : 'neutral',
          last_updated: new Date().toISOString()
        }

        this.setCache(cacheKey, analytics, 15 * 60 * 1000) // Cache for 15 minutes
        return analytics

      } catch (error) {
        console.error('Market analytics API error:', error)
        throw new Error('Failed to fetch market analytics')
      }
    })()
  }

  async getListings(filters?: {
    crop_type?: string
    listing_type?: 'buy' | 'sell'
    min_price?: number
    max_price?: number
    location?: string
    limit?: number
  }): Promise<MarketListing[]> {
    return withMonitoring('market', '/listings', 'GET', async () => {
      // For demo purposes, generate mock listings based on current market prices
      // In a real implementation, this would fetch from a marketplace API
      
      const prices = await this.getMarketPrices()
      const listings: MarketListing[] = []

      prices.forEach(price => {
        // Skip if crop type filter doesn't match
        if (filters?.crop_type && price.crop_type !== filters.crop_type) {
          return
        }

        // Generate a few listings per crop
        for (let i = 0; i < 3; i++) {
          const isBuyListing = Math.random() > 0.5
          const priceVariation = 0.9 + Math.random() * 0.2 // ±10% price variation
          const listingPrice = price.current_price * priceVariation

          // Skip if price filters don't match
          if (filters?.min_price && listingPrice < filters.min_price) continue
          if (filters?.max_price && listingPrice > filters.max_price) continue
          if (filters?.listing_type && (isBuyListing ? 'buy' : 'sell') !== filters.listing_type) continue

          listings.push({
            id: `listing_${price.crop_type}_${i}_${Date.now()}`,
            seller_id: `user_${Math.floor(Math.random() * 1000)}`,
            seller_name: `Farmer ${Math.floor(Math.random() * 100)}`,
            crop_type: price.crop_type,
            quantity: Math.floor(Math.random() * 100) + 10,
            price_per_unit: parseFloat(listingPrice.toFixed(2)),
            total_price: 0, // Will be calculated
            listing_type: isBuyListing ? 'buy' : 'sell',
            location: filters?.location || 'Local Market',
            description: `Fresh ${price.crop_type} from organic farm`,
            images: [],
            created_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active'
          })
        }
      })

      // Apply limit
      const limit = filters?.limit || 20
      const result = listings.slice(0, limit)

      // Calculate total prices
      result.forEach(listing => {
        listing.total_price = listing.quantity * listing.price_per_unit
      })

      return result
    })()
  }

  async createListing(listing: Omit<MarketListing, 'id' | 'created_at' | 'status'>): Promise<MarketListing> {
    return withMonitoring('market', '/listings', 'POST', async () => {
      // In a real implementation, this would create a listing via API
      const newListing: MarketListing = {
        ...listing,
        id: `listing_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        created_at: new Date().toISOString(),
        status: 'active',
        total_price: listing.quantity * listing.price_per_unit
      }

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))

      return newListing
    })()
  }

  async updateListing(id: string, updates: Partial<MarketListing>): Promise<MarketListing> {
    return withMonitoring('market', `/listings/${id}`, 'PUT', async () => {
      // In a real implementation, this would update via API
      throw new Error('Listing update not implemented in demo mode')
    })()
  }

  async deleteListing(id: string): Promise<void> {
    return withMonitoring('market', `/listings/${id}`, 'DELETE', async () => {
      // In a real implementation, this would delete via API
      throw new Error('Listing deletion not implemented in demo mode')
    })()
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/ping`)
      return response.ok
    } catch {
      return false
    }
  }

  // Get API usage info
  async getApiUsage(): Promise<{ calls: number; limit: number } | null> {
    // Most free APIs don't provide usage info
    return null
  }

  private async fetchWithRetry(url: string, retries: number = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const headers: HeadersInit = {}
        if (this.apiKey) {
          headers['X-API-Key'] = this.apiKey
        }

        const response = await fetch(url, { headers })
        
        if (response.status === 429) {
          // Rate limited, wait and retry
          const retryAfter = parseInt(response.headers.get('Retry-After') || '60')
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000))
          continue
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        return response

      } catch (error) {
        if (i === retries - 1) throw error
        
        // Exponential backoff
        const delay = Math.pow(2, i) * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw new Error('Max retries exceeded')
  }

  private getFallbackPrices(): MarketPrice[] {
    const crops = ['wheat', 'corn', 'rice', 'tomato', 'potato', 'carrot', 'lettuce', 'onion']
    
    return crops.map(crop => ({
      crop_type: crop,
      current_price: Math.random() * 10 + 1,
      price_change_24h: (Math.random() - 0.5) * 20,
      volume_24h: Math.floor(Math.random() * 10000),
      last_updated: new Date().toISOString()
    }))
  }

  private generatePricePrediction(price: MarketPrice): string {
    const change = price.price_change_24h
    if (change > 5) return 'Strong upward trend expected'
    if (change > 0) return 'Moderate growth expected'
    if (change > -5) return 'Sideways movement expected'
    return 'Potential decline expected'
  }

  private calculateMarketDominance(prices: MarketPrice[]): { [crop: string]: number } {
    const totalVolume = prices.reduce((sum, p) => sum + p.volume_24h, 0)
    const dominance: { [crop: string]: number } = {}

    prices.forEach(price => {
      dominance[price.crop_type] = (price.volume_24h / totalVolume) * 100
    })

    return dominance
  }

  private calculateFearGreedIndex(trends: MarketTrend[]): number {
    const upTrends = trends.filter(t => t.trend_direction === 'up').length
    const totalTrends = trends.length
    
    if (totalTrends === 0) return 50
    
    const ratio = upTrends / totalTrends
    return Math.round(ratio * 100)
  }

  private calculateVolatilityIndex(prices: MarketPrice[]): number {
    const changes = prices.map(p => Math.abs(p.price_change_24h))
    const avgChange = changes.reduce((sum, c) => sum + c, 0) / changes.length
    
    return Math.round(avgChange)
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data
    }
    
    if (cached) {
      this.cache.delete(key)
    }
    
    return null
  }

  private setCache(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })

    // Clean up old cache entries
    if (this.cache.size > 50) {
      const now = Date.now()
      for (const [cacheKey, cached] of this.cache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.cache.delete(cacheKey)
        }
      }
    }
  }
}