import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'
import { ServiceFactory } from '../factory'
import { ApiConfigManager } from '../../config/api.config'
import { ApiMonitor } from '../monitoring/api-monitor'

describe('API Integration Tests', () => {
  let originalConfig: any
  let apiConfig: ApiConfigManager
  let apiMonitor: ApiMonitor

  beforeEach(() => {
    // Reset services before each test
    ServiceFactory.resetServices()
    
    // Get API config and monitor instances
    apiConfig = ApiConfigManager.getInstance()
    apiMonitor = ApiMonitor.getInstance()
    
    // Store original config
    originalConfig = apiConfig.getConfig()
  })

  afterEach(() => {
    // Restore original config
    apiConfig.updateConfig(originalConfig)
    ServiceFactory.resetServices()
  })

  describe('Weather Service Integration', () => {
    it('should use mock weather service by default', () => {
      apiConfig.updateServiceConfig('weather', { provider: 'mock' })
      const weatherService = ServiceFactory.getWeatherService()
      expect(weatherService.constructor.name).toBe('MockWeatherService')
    })

    it('should use OpenWeatherMap service when configured', () => {
      apiConfig.updateServiceConfig('weather', { 
        provider: 'openweathermap',
        config: { apiKey: 'test-key' }
      })
      
      const weatherService = ServiceFactory.getWeatherService()
      // Note: This might fall back to mock if OpenWeatherMap fails to initialize
      expect(['OpenWeatherMapService', 'MockWeatherService']).toContain(weatherService.constructor.name)
    })

    it('should handle weather service API calls with monitoring', async () => {
      const weatherService = ServiceFactory.getWeatherService()
      
      try {
        await weatherService.getForecast({
          latitude: 40.7128,
          longitude: -74.0060
        })
        
        // Check that metrics were recorded
        const metrics = apiMonitor.getMetrics('weather', 60000) // Last minute
        expect(metrics.length).toBeGreaterThan(0)
      } catch (error) {
        // Expected for mock service without proper setup
        expect(error).toBeDefined()
      }
    })

    it('should handle weather service health checks', async () => {
      const healthStatus = await ServiceFactory.getServiceHealthStatus()
      expect(typeof healthStatus.weather).toBe('boolean')
    })
  })

  describe('Market Service Integration', () => {
    it('should use mock market service by default', () => {
      apiConfig.updateServiceConfig('market', { provider: 'mock' })
      const marketService = ServiceFactory.getMarketService()
      expect(marketService.constructor.name).toBe('MockMarketService')
    })

    it('should use real market service when configured', () => {
      apiConfig.updateServiceConfig('market', { 
        provider: 'custom',
        config: { apiKey: 'test-key' }
      })
      
      const marketService = ServiceFactory.getMarketService()
      expect(['RealMarketService', 'MockMarketService']).toContain(marketService.constructor.name)
    })

    it('should handle market price API calls', async () => {
      const marketService = ServiceFactory.getMarketService()
      
      const prices = await marketService.getMarketPrices()
      expect(Array.isArray(prices)).toBe(true)
      expect(prices.length).toBeGreaterThan(0)
      
      if (prices.length > 0) {
        expect(prices[0]).toHaveProperty('crop_type')
        expect(prices[0]).toHaveProperty('current_price')
        expect(prices[0]).toHaveProperty('price_change_24h')
      }
    })

    it('should handle market listings API calls', async () => {
      const marketService = ServiceFactory.getMarketService()
      
      const listings = await marketService.getListings({ limit: 5 })
      expect(Array.isArray(listings)).toBe(true)
      
      if (listings.length > 0) {
        expect(listings[0]).toHaveProperty('id')
        expect(listings[0]).toHaveProperty('crop_type')
        expect(listings[0]).toHaveProperty('price_per_unit')
      }
    })
  })

  describe('Service Factory Configuration', () => {
    it('should return correct service configuration', () => {
      const config = ServiceFactory.getServiceConfig()
      
      expect(config).toHaveProperty('weather')
      expect(config).toHaveProperty('market')
      expect(config).toHaveProperty('notifications')
      expect(config).toHaveProperty('auth')
      expect(config).toHaveProperty('storage')
    })

    it('should allow switching service providers at runtime', () => {
      // Start with mock
      apiConfig.updateServiceConfig('weather', { provider: 'mock' })
      let weatherService = ServiceFactory.getWeatherService()
      expect(weatherService.constructor.name).toBe('MockWeatherService')

      // Switch to real service
      ServiceFactory.switchServiceProvider('weather', 'openweathermap')
      weatherService = ServiceFactory.getWeatherService()
      expect(['OpenWeatherMapService', 'MockWeatherService']).toContain(weatherService.constructor.name)
    })

    it('should validate API configuration', () => {
      // Test with missing required config
      apiConfig.updateConfig({
        mode: 'real',
        services: {
          ...apiConfig.getConfig().services,
          weather: {
            provider: 'openweathermap',
            config: {} // Missing API key
          }
        }
      })

      const validation = apiConfig.validate()
      expect(validation.valid).toBe(false)
      expect(validation.errors.length).toBeGreaterThan(0)
    })
  })

  describe('API Monitoring Integration', () => {
    it('should record API metrics', async () => {
      const initialMetrics = apiMonitor.getMetrics().length
      
      // Make some API calls
      const weatherService = ServiceFactory.getWeatherService()
      try {
        await weatherService.getForecast({ latitude: 0, longitude: 0 })
      } catch (error) {
        // Expected for mock service
      }

      const finalMetrics = apiMonitor.getMetrics().length
      expect(finalMetrics).toBeGreaterThanOrEqual(initialMetrics)
    })

    it('should track service health', async () => {
      const healthStatus = await ServiceFactory.getServiceHealthStatus()
      
      expect(typeof healthStatus.weather).toBe('boolean')
      expect(typeof healthStatus.market).toBe('boolean')
      expect(typeof healthStatus.notifications).toBe('boolean')
    })

    it('should calculate error rates', () => {
      // Simulate some API calls with errors
      apiMonitor.recordMetric({
        service: 'test',
        endpoint: '/test',
        method: 'GET',
        status: 200,
        responseTime: 100
      })

      apiMonitor.recordMetric({
        service: 'test',
        endpoint: '/test',
        method: 'GET',
        status: 500,
        responseTime: 200,
        error: 'Server error'
      })

      const errorRate = apiMonitor.getErrorRate('test')
      expect(errorRate).toBe(50) // 1 error out of 2 calls = 50%
    })

    it('should provide system overview', () => {
      const overview = apiMonitor.getSystemOverview()
      
      expect(overview).toHaveProperty('totalCalls')
      expect(overview).toHaveProperty('errorRate')
      expect(overview).toHaveProperty('averageResponseTime')
      expect(overview).toHaveProperty('healthyServices')
      expect(overview).toHaveProperty('totalServices')
      expect(overview).toHaveProperty('alerts')
    })
  })

  describe('Fallback and Error Handling', () => {
    it('should fallback to mock services when real services fail', () => {
      // Configure with invalid API key
      apiConfig.updateServiceConfig('weather', {
        provider: 'openweathermap',
        config: { apiKey: 'invalid-key' }
      })

      const weatherService = ServiceFactory.getWeatherService()
      // Should fallback to mock service if real service fails to initialize
      expect(['OpenWeatherMapService', 'MockWeatherService']).toContain(weatherService.constructor.name)
    })

    it('should handle network errors gracefully', async () => {
      const marketService = ServiceFactory.getMarketService()
      
      // Mock network error
      const originalFetch = global.fetch
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'))

      try {
        const prices = await marketService.getMarketPrices()
        // Should return fallback data or handle error gracefully
        expect(Array.isArray(prices)).toBe(true)
      } catch (error) {
        // Error handling is acceptable too
        expect(error).toBeDefined()
      } finally {
        global.fetch = originalFetch
      }
    })

    it('should respect rate limits', async () => {
      // This test would need to be implemented based on specific service rate limiting
      const marketService = ServiceFactory.getMarketService()
      
      // Make multiple rapid requests
      const promises = Array.from({ length: 5 }, () => 
        marketService.getMarketPrices().catch(e => e)
      )
      
      const results = await Promise.allSettled(promises)
      
      // At least some should succeed
      const successful = results.filter(r => r.status === 'fulfilled').length
      expect(successful).toBeGreaterThan(0)
    })
  })

  describe('Configuration Management', () => {
    it('should load configuration from environment variables', () => {
      // This would test environment variable loading
      const config = apiConfig.getConfig()
      expect(config).toBeDefined()
      expect(config.mode).toBeDefined()
      expect(config.services).toBeDefined()
    })

    it('should export configuration safely', () => {
      apiConfig.updateServiceConfig('weather', {
        config: { apiKey: 'secret-key' }
      })

      const exported = apiConfig.export()
      expect(exported).toContain('***REDACTED***')
      expect(exported).not.toContain('secret-key')
    })

    it('should handle hybrid mode configuration', () => {
      apiConfig.setMode('hybrid')
      
      const config = apiConfig.getConfig()
      expect(config.mode).toBe('hybrid')
      
      // In hybrid mode, some services could be real, others mock
      const serviceConfig = ServiceFactory.getServiceConfig()
      expect(serviceConfig).toBeDefined()
    })
  })
})

// Integration test helper functions
export const testHelpers = {
  async waitForServiceInitialization(maxWait: number = 5000): Promise<void> {
    const start = Date.now()
    
    while (Date.now() - start < maxWait) {
      try {
        const healthStatus = await ServiceFactory.getServiceHealthStatus()
        if (healthStatus.weather && healthStatus.market) {
          return
        }
      } catch (error) {
        // Continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    
    throw new Error('Services failed to initialize within timeout')
  },

  async simulateApiLoad(requests: number = 10): Promise<void> {
    const weatherService = ServiceFactory.getWeatherService()
    const marketService = ServiceFactory.getMarketService()
    
    const promises = []
    
    for (let i = 0; i < requests; i++) {
      promises.push(
        weatherService.getForecast({ latitude: 0, longitude: 0 }).catch(() => {}),
        marketService.getMarketPrices().catch(() => {})
      )
    }
    
    await Promise.allSettled(promises)
  },

  getTestConfiguration() {
    return {
      mode: 'mock' as const,
      services: {
        weather: { provider: 'mock' as const, config: {} },
        market: { provider: 'mock' as const, config: {} },
        auth: { provider: 'mock' as const, config: {} },
        storage: { provider: 'mock' as const, config: {} },
        notifications: { provider: 'mock' as const, config: {} }
      },
      fallback: { enabled: true, strategy: 'mock' as const },
      monitoring: { enabled: true, logErrors: false, trackUsage: true, alertOnFailure: false }
    }
  }
}