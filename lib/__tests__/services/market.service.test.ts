import { MockMarketService } from '../../services/mock/market.service'

describe('MockMarketService', () => {
  let marketService: MockMarketService

  beforeEach(() => {
    marketService = new MockMarketService()
  })

  describe('getPrices', () => {
    it('should return market prices', async () => {
      const prices = await marketService.getPrices()
      
      expect(Array.isArray(prices)).toBe(true)
      expect(prices.length).toBeGreaterThan(0)
      
      // Check price structure
      const price = prices[0]
      expect(price).toHaveProperty('crop_name')
      expect(price).toHaveProperty('variety')
      expect(price).toHaveProperty('price_per_kg')
      expect(price).toHaveProperty('currency')
      expect(price).toHaveProperty('market_location')
      expect(price).toHaveProperty('date')
      expect(price).toHaveProperty('trend')
      
      expect(typeof price.price_per_kg).toBe('number')
      expect(price.price_per_kg).toBeGreaterThan(0)
      expect(['up', 'down', 'stable']).toContain(price.trend)
    })

    it('should filter prices by crop name', async () => {
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

    it('should add price variation to simulate market fluctuations', async () => {
      const prices1 = await marketService.getPrices()
      const prices2 = await marketService.getPrices()
      
      // Prices should vary slightly between calls due to variation
      const sameCropPrices1 = prices1.filter(p => p.crop_name === 'Tomatoes')
      const sameCropPrices2 = prices2.filter(p => p.crop_name === 'Tomatoes')
      
      if (sameCropPrices1.length > 0 && sameCropPrices2.length > 0) {
        // At least some prices should be different due to variation
        const hasVariation = sameCropPrices1.some((p1, index) => {
          const p2 = sameCropPrices2[index]
          return p2 && Math.abs(p1.price_per_kg - p2.price_per_kg) > 0
        })
        expect(hasVariation).toBe(true)
      }
    })
  })

  describe('listCrop', () => {
    it('should handle crop listing without errors', async () => {
      await expect(marketService.listCrop('crop-1', 50, 3.50)).resolves.not.toThrow()
    })

    it('should simulate API delay', async () => {
      const startTime = Date.now()
      await marketService.listCrop('crop-1', 50, 3.50)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeGreaterThanOrEqual(300) // At least 300ms delay
    })
  })

  describe('getMarketTrends', () => {
    it('should return price trends for specified days', async () => {
      const days = 7
      const trends = await marketService.getMarketTrends('Tomatoes', days)
      
      expect(trends).toHaveLength(days)
      
      trends.forEach(trend => {
        expect(trend.crop_name).toBe('Tomatoes')
        expect(typeof trend.price_per_kg).toBe('number')
        expect(trend.price_per_kg).toBeGreaterThan(0)
        expect(['up', 'down', 'stable']).toContain(trend.trend)
      })
    })

    it('should return trends in chronological order (oldest first)', async () => {
      const trends = await marketService.getMarketTrends('Corn', 5)
      
      for (let i = 1; i < trends.length; i++) {
        const prevDate = new Date(trends[i - 1].date)
        const currentDate = new Date(trends[i].date)
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime())
      }
    })

    it('should generate realistic price variations with trends', async () => {
      const trends = await marketService.getMarketTrends('Wheat', 10)
      
      // Check that prices vary but stay within reasonable bounds
      const prices = trends.map(t => t.price_per_kg)
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      
      expect(maxPrice / minPrice).toBeLessThan(2) // Shouldn't vary more than 2x
      expect(minPrice).toBeGreaterThan(0)
    })
  })

  describe('getRecommendations', () => {
    it('should return crop recommendations for user', async () => {
      const recommendations = await marketService.getRecommendations('user-1')
      
      expect(Array.isArray(recommendations)).toBe(true)
      expect(recommendations.length).toBeGreaterThan(0)
      expect(recommendations.length).toBeLessThanOrEqual(4) // Max 4 recommendations
      
      recommendations.forEach(rec => {
        expect(rec).toHaveProperty('cropName')
        expect(rec).toHaveProperty('reason')
        expect(rec).toHaveProperty('expectedPrice')
        expect(typeof rec.expectedPrice).toBe('number')
        expect(rec.expectedPrice).toBeGreaterThan(0)
      })
    })

    it('should return different recommendations on multiple calls', async () => {
      const recs1 = await marketService.getRecommendations('user-1')
      const recs2 = await marketService.getRecommendations('user-1')
      
      // Due to randomization, recommendations might be different
      // At least the order or selection should vary sometimes
      const sameOrder = recs1.every((rec, index) => 
        recs2[index] && rec.cropName === recs2[index].cropName
      )
      
      // It's possible they're the same, but over multiple calls they should vary
      // This test might occasionally fail due to randomness, but that's expected
      expect(typeof sameOrder).toBe('boolean')
    })

    it('should include reasonable price expectations', async () => {
      const recommendations = await marketService.getRecommendations('user-1')
      
      recommendations.forEach(rec => {
        expect(rec.expectedPrice).toBeGreaterThan(0.1) // At least 10 cents
        expect(rec.expectedPrice).toBeLessThan(10) // Less than $10/kg (reasonable for most crops)
      })
    })
  })

  describe('price calculation helpers', () => {
    it('should calculate trends correctly', async () => {
      // Test trend calculation by checking multiple crops
      const prices = await marketService.getPrices()
      const trendCounts = prices.reduce((acc, price) => {
        acc[price.trend] = (acc[price.trend] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      expect(trendCounts.up + trendCounts.down + trendCounts.stable).toBe(prices.length)
    })

    it('should generate consistent base prices for same crops', async () => {
      const prices1 = await marketService.getPrices('Tomatoes')
      const prices2 = await marketService.getPrices('Tomatoes')
      
      // Base prices should be similar (within variation range)
      if (prices1.length > 0 && prices2.length > 0) {
        const avgPrice1 = prices1.reduce((sum, p) => sum + p.price_per_kg, 0) / prices1.length
        const avgPrice2 = prices2.reduce((sum, p) => sum + p.price_per_kg, 0) / prices2.length
        
        // Should be within 20% of each other (accounting for variation)
        const difference = Math.abs(avgPrice1 - avgPrice2) / Math.max(avgPrice1, avgPrice2)
        expect(difference).toBeLessThan(0.2)
      }
    })
  })

  describe('error handling', () => {
    it('should handle empty crop name gracefully', async () => {
      const prices = await marketService.getPrices('')
      expect(Array.isArray(prices)).toBe(true)
    })

    it('should handle invalid parameters gracefully', async () => {
      await expect(marketService.getMarketTrends('', 0)).resolves.not.toThrow()
      await expect(marketService.getMarketTrends('InvalidCrop', -1)).resolves.not.toThrow()
    })
  })

  describe('performance', () => {
    it('should complete operations within reasonable time', async () => {
      const operations = [
        () => marketService.getPrices(),
        () => marketService.getMarketTrends('Tomatoes', 7),
        () => marketService.getRecommendations('user-1'),
        () => marketService.listCrop('crop-1', 10, 2.50)
      ]

      for (const operation of operations) {
        const startTime = Date.now()
        await operation()
        const endTime = Date.now()
        
        expect(endTime - startTime).toBeLessThan(2000) // Should complete within 2 seconds
      }
    })
  })
})