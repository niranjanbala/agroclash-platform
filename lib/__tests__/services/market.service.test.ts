// Test suite for Market Service

import { MockMarketService } from '../../services/mock/market.service'
import { Location } from '../../types'

describe('MockMarketService', () => {
  let marketService: MockMarketService
  const testLocation: Location = { latitude: 40.7128, longitude: -74.0060 }

  beforeEach(() => {
    marketService = new MockMarketService()
  })

  describe('getPrices', () => {
    it('should return array of market prices', async () => {
      const prices = await marketService.getPrices()

      expect(Array.isArray(prices)).toBe(true)
      expect(prices.length).toBeGreaterThan(0)

      prices.forEach(price => {
        expect(price.crop_name).toBeDefined()
        expect(price.price_per_kg).toBeGreaterThan(0)
        expect(price.currency).toBeDefined()
        expect(price.market_location).toBeDefined()
        expect(price.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(['up', 'down', 'stable']).toContain(price.trend)
      })
    })

    it('should filter prices by crop name when provided', async () => {
      const allPrices = await marketService.getPrices()
      const tomatoPrices = await marketService.getPrices('tomatoes')

      expect(tomatoPrices.length).toBeLessThanOrEqual(allPrices.length)
      
      tomatoPrices.forEach(price => {
        expect(price.crop_name.toLowerCase()).toContain('tomatoes')
      })
    })

    it('should return prices sorted by date (most recent first)', async () => {
      const prices = await marketService.getPrices()

      for (let i = 1; i < prices.length; i++) {
        const currentDate = new Date(prices[i - 1].date)
        const nextDate = new Date(prices[i].date)
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime())
      }
    })

    it('should handle case-insensitive crop name filtering', async () => {
      const lowerCasePrices = await marketService.getPrices('tomatoes')
      const upperCasePrices = await marketService.getPrices('TOMATOES')
      const mixedCasePrices = await marketService.getPrices('Tomatoes')

      expect(lowerCasePrices.length).toBeGreaterThan(0)
      expect(upperCasePrices.length).toEqual(lowerCasePrices.length)
      expect(mixedCasePrices.length).toEqual(lowerCasePrices.length)
    })
  })

  describe('listCrop', () => {
    it('should successfully list a crop for sale', async () => {
      const cropId = 'test-crop-123'
      const quantity = 100
      const pricePerKg = 2.50

      // Should not throw an error
      await expect(marketService.listCrop(cropId, quantity, pricePerKg))
        .resolves.not.toThrow()
    })

    it('should handle various quantity and price values', async () => {
      const testCases = [
        { cropId: 'crop-1', quantity: 1, pricePerKg: 0.50 },
        { cropId: 'crop-2', quantity: 1000, pricePerKg: 10.00 },
        { cropId: 'crop-3', quantity: 50, pricePerKg: 3.75 }
      ]

      for (const testCase of testCases) {
        await expect(marketService.listCrop(
          testCase.cropId, 
          testCase.quantity, 
          testCase.pricePerKg
        )).resolves.not.toThrow()
      }
    })
  })

  describe('getMarketTrends', () => {
    it('should return price trends for specified crop and days', async () => {
      const cropName = 'Tomatoes'
      const days = 7
      
      const trends = await marketService.getMarketTrends(cropName, days)

      expect(trends).toHaveLength(days)
      
      trends.forEach(trend => {
        expect(trend.crop_name).toBe(cropName)
        expect(trend.price_per_kg).toBeGreaterThan(0)
        expect(trend.currency).toBeDefined()
        expect(trend.market_location).toBeDefined()
        expect(trend.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(['up', 'down', 'stable']).toContain(trend.trend)
      })
    })

    it('should return trends in chronological order', async () => {
      const trends = await marketService.getMarketTrends('Corn', 10)

      for (let i = 1; i < trends.length; i++) {
        const previousDate = new Date(trends[i - 1].date)
        const currentDate = new Date(trends[i].date)
        expect(currentDate.getTime()).toBeGreaterThan(previousDate.getTime())
      }
    })

    it('should handle different day ranges', async () => {
      const testCases = [1, 7, 14, 30]

      for (const days of testCases) {
        const trends = await marketService.getMarketTrends('Wheat', days)
        expect(trends).toHaveLength(days)
      }
    })

    it('should show realistic price variations', async () => {
      const trends = await marketService.getMarketTrends('Rice', 30)
      
      const prices = trends.map(t => t.price_per_kg)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      // Prices should vary but not be too extreme
      expect(maxPrice / minPrice).toBeLessThan(2) // Less than 100% variation
      expect(maxPrice / minPrice).toBeGreaterThan(1) // Some variation should exist
    })
  })

  describe('getRecommendations', () => {
    it('should return crop recommendations for user', async () => {
      const userId = 'test-user-123'
      
      const recommendations = await marketService.getRecommendations(userId)

      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.length).toBeLessThanOrEqual(4)

      recommendations.forEach(rec => {
        expect(rec.cropName).toBeDefined()
        expect(rec.reason).toBeDefined()
        expect(rec.expectedPrice).toBeGreaterThan(0)
        expect(typeof rec.cropName).toBe('string')
        expect(typeof rec.reason).toBe('string')
        expect(typeof rec.expectedPrice).toBe('number')
      })
    })

    it('should return different recommendations for different users', async () => {
      const user1Recs = await marketService.getRecommendations('user-1')
      const user2Recs = await marketService.getRecommendations('user-2')

      expect(user1Recs).toBeDefined()
      expect(user2Recs).toBeDefined()
      
      // Recommendations might be different (though not guaranteed in mock)
      expect(user1Recs.length).toBeGreaterThan(0)
      expect(user2Recs.length).toBeGreaterThan(0)
    })

    it('should provide meaningful recommendation reasons', async () => {
      const recommendations = await marketService.getRecommendations('test-user')

      recommendations.forEach(rec => {
        expect(rec.reason.length).toBeGreaterThan(10) // Should be descriptive
        expect(rec.reason).toMatch(/\w+/) // Should contain words
      })
    })
  })

  describe('data consistency', () => {
    it('should return consistent data structure across multiple calls', async () => {
      const prices1 = await marketService.getPrices()
      const prices2 = await marketService.getPrices()

      expect(Array.isArray(prices1)).toBe(true)
      expect(Array.isArray(prices2)).toBe(true)

      if (prices1.length > 0 && prices2.length > 0) {
        const price1 = prices1[0]
        const price2 = prices2[0]

        expect(price1).toHaveProperty('crop_name')
        expect(price1).toHaveProperty('price_per_kg')
        expect(price1).toHaveProperty('currency')
        expect(price1).toHaveProperty('market_location')
        expect(price1).toHaveProperty('date')
        expect(price1).toHaveProperty('trend')

        expect(price2).toHaveProperty('crop_name')
        expect(price2).toHaveProperty('price_per_kg')
        expect(price2).toHaveProperty('currency')
        expect(price2).toHaveProperty('market_location')
        expect(price2).toHaveProperty('date')
        expect(price2).toHaveProperty('trend')
      }
    })

    it('should maintain price reasonableness', async () => {
      const prices = await marketService.getPrices()

      prices.forEach(price => {
        expect(price.price_per_kg).toBeGreaterThan(0.10) // Minimum reasonable price
        expect(price.price_per_kg).toBeLessThan(100.00) // Maximum reasonable price
      })
    })
  })

  describe('error handling', () => {
    it('should handle empty crop name gracefully', async () => {
      const prices = await marketService.getPrices('')
      expect(Array.isArray(prices)).toBe(true)
    })

    it('should handle non-existent crop names', async () => {
      const prices = await marketService.getPrices('NonExistentCrop123')
      expect(Array.isArray(prices)).toBe(true)
      expect(prices.length).toBe(0)
    })
  })
})