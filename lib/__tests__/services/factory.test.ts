// Test suite for Service Factory

import { ServiceFactory } from '../../services/factory'
import { MockWeatherService } from '../../services/mock/weather.service'
import { MockMarketService } from '../../services/mock/market.service'
import { MockXPService } from '../../services/mock/xp.service'
import { MockPestService } from '../../services/mock/pest.service'

// Mock the config module
jest.mock('../../config/environment', () => ({
  config: {
    services: {
      useMockWeather: true,
      useMockMarket: true,
      useMockPest: true,
      useMockNotifications: true
    },
    development: {
      enableDebugLogs: false
    }
  }
}))

describe('ServiceFactory', () => {
  beforeEach(() => {
    // Reset services before each test
    ServiceFactory.resetServices()
  })

  describe('getWeatherService', () => {
    it('should return MockWeatherService when useMockWeather is true', () => {
      const service = ServiceFactory.getWeatherService()
      expect(service).toBeInstanceOf(MockWeatherService)
    })

    it('should return the same instance on multiple calls (singleton)', () => {
      const service1 = ServiceFactory.getWeatherService()
      const service2 = ServiceFactory.getWeatherService()
      expect(service1).toBe(service2)
    })
  })

  describe('getMarketService', () => {
    it('should return MockMarketService when useMockMarket is true', () => {
      const service = ServiceFactory.getMarketService()
      expect(service).toBeInstanceOf(MockMarketService)
    })

    it('should return the same instance on multiple calls (singleton)', () => {
      const service1 = ServiceFactory.getMarketService()
      const service2 = ServiceFactory.getMarketService()
      expect(service1).toBe(service2)
    })
  })

  describe('getXPService', () => {
    it('should return MockXPService', () => {
      const service = ServiceFactory.getXPService()
      expect(service).toBeInstanceOf(MockXPService)
    })

    it('should return the same instance on multiple calls (singleton)', () => {
      const service1 = ServiceFactory.getXPService()
      const service2 = ServiceFactory.getXPService()
      expect(service1).toBe(service2)
    })
  })

  describe('getPestService', () => {
    it('should return MockPestService when useMockPest is true', () => {
      const service = ServiceFactory.getPestService()
      expect(service).toBeInstanceOf(MockPestService)
    })

    it('should return the same instance on multiple calls (singleton)', () => {
      const service1 = ServiceFactory.getPestService()
      const service2 = ServiceFactory.getPestService()
      expect(service1).toBe(service2)
    })
  })

  describe('getNotificationService', () => {
    it('should throw error when notification service is not implemented', () => {
      expect(() => ServiceFactory.getNotificationService())
        .toThrow('Mock notification service not implemented yet')
    })
  })

  describe('resetServices', () => {
    it('should reset all services to null', () => {
      // Get services to initialize them
      const weather1 = ServiceFactory.getWeatherService()
      const market1 = ServiceFactory.getMarketService()

      // Reset services
      ServiceFactory.resetServices()

      // Get services again - should be new instances
      const weather2 = ServiceFactory.getWeatherService()
      const market2 = ServiceFactory.getMarketService()

      expect(weather1).not.toBe(weather2)
      expect(market1).not.toBe(market2)
    })
  })

  describe('service overrides', () => {
    it('should allow overriding weather service', () => {
      const customWeatherService = new MockWeatherService()
      ServiceFactory.setWeatherService(customWeatherService)

      const service = ServiceFactory.getWeatherService()
      expect(service).toBe(customWeatherService)
    })

    it('should allow overriding market service', () => {
      const customMarketService = new MockMarketService()
      ServiceFactory.setMarketService(customMarketService)

      const service = ServiceFactory.getMarketService()
      expect(service).toBe(customMarketService)
    })

    it('should allow overriding XP service', () => {
      const customXPService = new MockXPService()
      ServiceFactory.setXPService(customXPService)

      const service = ServiceFactory.getXPService()
      expect(service).toBe(customXPService)
    })

    it('should allow overriding pest service', () => {
      const customPestService = new MockPestService()
      ServiceFactory.setPestService(customPestService)

      const service = ServiceFactory.getPestService()
      expect(service).toBe(customPestService)
    })
  })

  describe('getServiceConfig', () => {
    it('should return current service configuration', () => {
      const config = ServiceFactory.getServiceConfig()

      expect(config).toEqual({
        weather: 'mock',
        market: 'mock',
        pest: 'mock',
        notifications: 'mock'
      })
    })
  })

  describe('logServiceConfiguration', () => {
    it('should not throw when logging configuration', () => {
      expect(() => ServiceFactory.logServiceConfiguration()).not.toThrow()
    })
  })

  describe('error handling', () => {
    it('should handle missing services gracefully', () => {
      // This tests the fallback behavior when real services aren't implemented
      expect(() => ServiceFactory.getWeatherService()).not.toThrow()
      expect(() => ServiceFactory.getMarketService()).not.toThrow()
      expect(() => ServiceFactory.getXPService()).not.toThrow()
      expect(() => ServiceFactory.getPestService()).not.toThrow()
    })
  })

  describe('service interface compliance', () => {
    it('should return services that implement required interfaces', async () => {
      const weatherService = ServiceFactory.getWeatherService()
      const marketService = ServiceFactory.getMarketService()
      const xpService = ServiceFactory.getXPService()
      const pestService = ServiceFactory.getPestService()

      // Test that services have required methods
      expect(typeof weatherService.getForecast).toBe('function')
      expect(typeof weatherService.getAlerts).toBe('function')
      expect(typeof weatherService.getHistoricalData).toBe('function')
      expect(typeof weatherService.subscribeToAlerts).toBe('function')

      expect(typeof marketService.getPrices).toBe('function')
      expect(typeof marketService.listCrop).toBe('function')
      expect(typeof marketService.getMarketTrends).toBe('function')
      expect(typeof marketService.getRecommendations).toBe('function')

      expect(typeof xpService.awardXP).toBe('function')
      expect(typeof xpService.calculateLevel).toBe('function')
      expect(typeof xpService.getXPLogs).toBe('function')
      expect(typeof xpService.getLevelProgress).toBe('function')

      expect(typeof pestService.createPestBattle).toBe('function')
      expect(typeof pestService.resolvePestBattle).toBe('function')
      expect(typeof pestService.getActiveBattles).toBe('function')
      expect(typeof pestService.getPestHistory).toBe('function')
    })

    it('should return services that work with actual method calls', async () => {
      const weatherService = ServiceFactory.getWeatherService()
      const marketService = ServiceFactory.getMarketService()
      const xpService = ServiceFactory.getXPService()
      const pestService = ServiceFactory.getPestService()

      // Test actual method calls
      const location = { latitude: 40.7128, longitude: -74.0060 }
      
      await expect(weatherService.getForecast(location)).resolves.toBeDefined()
      await expect(marketService.getPrices()).resolves.toBeDefined()
      await expect(xpService.awardXP('test-user', 'test-action', 10)).resolves.toBeDefined()
      await expect(pestService.createPestBattle('test-plot', 'aphids', 'low')).resolves.toBeDefined()
    })
  })
})