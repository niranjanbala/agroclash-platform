// Service Factory for Mock/Real Service Switching

import { config } from '../config/environment'
import { ApiConfigManager } from '../config/api.config'

// Import service interfaces
import { 
  WeatherService, 
  MarketService, 
  XPService, 
  PestService,
  NotificationService,
  ClanService 
} from './interfaces'

// Import mock implementations
import { MockWeatherService } from './mock/weather.service'
import { MockMarketService } from './mock/market.service'
import { MockXPService } from './mock/xp.service'
import { MockPestService } from './mock/pest.service'
import { MockClanService } from './mock/clan.service'
import { MockNotificationService } from './mock/notification.service'

// Import real implementations
import { OpenWeatherMapService } from './real/weather.service'
import { RealMarketService } from './real/market.service'

export class ServiceFactory {
  private static weatherService: WeatherService | null = null
  private static marketService: MarketService | null = null
  private static xpService: XPService | null = null
  private static pestService: PestService | null = null
  private static notificationService: NotificationService | null = null
  private static clanService: ClanService | null = null
  private static apiConfig = ApiConfigManager.getInstance()

  static getWeatherService(): WeatherService {
    if (!this.weatherService) {
      const weatherConfig = this.apiConfig.getServiceConfig('weather')
      
      switch (weatherConfig.provider) {
        case 'openweathermap':
          try {
            this.weatherService = new OpenWeatherMapService() as any
          } catch (error) {
            console.warn('Failed to initialize OpenWeatherMap service, falling back to mock:', error)
            this.weatherService = new MockWeatherService()
          }
          break
        case 'mock':
        default:
          this.weatherService = new MockWeatherService()
          break
      }
    }
    return this.weatherService
  }

  static getMarketService(): MarketService {
    if (!this.marketService) {
      const marketConfig = this.apiConfig.getServiceConfig('market')
      
      switch (marketConfig.provider) {
        case 'coinapi':
        case 'custom':
          try {
            this.marketService = new RealMarketService() as any
          } catch (error) {
            console.warn('Failed to initialize real market service, falling back to mock:', error)
            this.marketService = new MockMarketService()
          }
          break
        case 'mock':
        default:
          this.marketService = new MockMarketService()
          break
      }
    }
    return this.marketService
  }

  static getXPService(): XPService {
    if (!this.xpService) {
      // XP service is always mock as it's internal business logic
      this.xpService = new MockXPService()
    }
    return this.xpService
  }

  static getPestService(): PestService {
    if (!this.pestService) {
      // Pest service is always mock as it's internal business logic
      // In the future, this could integrate with ML models for pest prediction
      this.pestService = new MockPestService()
    }
    return this.pestService
  }

  static getNotificationService(): NotificationService {
    if (!this.notificationService) {
      const notificationConfig = this.apiConfig.getServiceConfig('notifications')
      
      switch (notificationConfig.provider) {
        case 'firebase':
        case 'onesignal':
        case 'pusher':
          // TODO: Implement real notification services
          console.warn('Real notification service not implemented, falling back to mock')
          this.notificationService = new MockNotificationService()
          break
        case 'mock':
        default:
          this.notificationService = new MockNotificationService()
          break
      }
    }
    return this.notificationService
  }

  static getClanService(): ClanService {
    if (!this.clanService) {
      // Clan service is always mock as it's internal business logic
      this.clanService = new MockClanService()
    }
    return this.clanService
  }

  // Method to reset all services (useful for testing)
  static resetServices(): void {
    this.weatherService = null
    this.marketService = null
    this.xpService = null
    this.pestService = null
    this.notificationService = null
    this.clanService = null
  }

  // Method to override services for testing
  static setWeatherService(service: WeatherService): void {
    this.weatherService = service
  }

  static setMarketService(service: MarketService): void {
    this.marketService = service
  }

  static setXPService(service: XPService): void {
    this.xpService = service
  }

  static setPestService(service: PestService): void {
    this.pestService = service
  }

  static setNotificationService(service: NotificationService): void {
    this.notificationService = service
  }

  static setClanService(service: ClanService): void {
    this.clanService = service
  }

  // Method to get service configuration info
  static getServiceConfig(): {
    weather: string
    market: string
    pest: string
    notifications: string
    auth: string
    storage: string
  } {
    const apiConfig = this.apiConfig.getConfig()
    return {
      weather: apiConfig.services.weather.provider,
      market: apiConfig.services.market.provider,
      pest: 'mock', // Always mock for now
      notifications: apiConfig.services.notifications.provider,
      auth: apiConfig.services.auth.provider,
      storage: apiConfig.services.storage.provider
    }
  }

  // Method to log service configuration
  static logServiceConfiguration(): void {
    if (config.development.enableDebugLogs) {
      const serviceConfig = this.getServiceConfig()
      console.log('AgroClash Service Configuration:', serviceConfig)
      
      // Log API config validation
      const validation = this.apiConfig.validate()
      if (!validation.valid) {
        console.warn('API Configuration Issues:', validation.errors)
      }
    }
  }

  // Method to get API configuration manager
  static getApiConfig(): ApiConfigManager {
    return this.apiConfig
  }

  // Method to switch service providers at runtime
  static switchServiceProvider<T extends keyof typeof this.apiConfig.getConfig.services>(
    service: T, 
    provider: string
  ): void {
    this.apiConfig.updateServiceConfig(service as any, { provider } as any)
    
    // Reset the corresponding service to force re-initialization
    switch (service) {
      case 'weather':
        this.weatherService = null
        break
      case 'market':
        this.marketService = null
        break
      case 'notifications':
        this.notificationService = null
        break
    }
  }

  // Method to get service health status
  static async getServiceHealthStatus(): Promise<{
    weather: boolean
    market: boolean
    notifications: boolean
  }> {
    const results = await Promise.allSettled([
      this.checkServiceHealth('weather'),
      this.checkServiceHealth('market'),
      this.checkServiceHealth('notifications')
    ])

    return {
      weather: results[0].status === 'fulfilled' ? results[0].value : false,
      market: results[1].status === 'fulfilled' ? results[1].value : false,
      notifications: results[2].status === 'fulfilled' ? results[2].value : false
    }
  }

  private static async checkServiceHealth(serviceType: string): Promise<boolean> {
    try {
      let service: any
      
      switch (serviceType) {
        case 'weather':
          service = this.getWeatherService()
          break
        case 'market':
          service = this.getMarketService()
          break
        case 'notifications':
          service = this.getNotificationService()
          break
        default:
          return false
      }

      // Check if service has a health check method
      if (service && typeof service.healthCheck === 'function') {
        return await service.healthCheck()
      }

      return true // Assume healthy if no health check method
    } catch (error) {
      console.error(`Health check failed for ${serviceType}:`, error)
      return false
    }
  }
}

// Initialize service configuration logging
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  ServiceFactory.logServiceConfiguration()
}