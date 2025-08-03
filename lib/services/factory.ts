// Service Factory for Mock/Real Service Switching

import { config } from '../config/environment'

// Import service interfaces
import { 
  WeatherService, 
  MarketService, 
  XPService, 
  PestService,
  NotificationService 
} from './interfaces'

// Import mock implementations
import { MockWeatherService } from './mock/weather.service'
import { MockMarketService } from './mock/market.service'
import { MockXPService } from './mock/xp.service'
import { MockPestService } from './mock/pest.service'

// Import real implementations (to be implemented later)
// import { OpenWeatherService } from './real/weather.service'
// import { KrishiHubMarketService } from './real/market.service'
// import { ExpoNotificationService } from './real/notification.service'

export class ServiceFactory {
  private static weatherService: WeatherService | null = null
  private static marketService: MarketService | null = null
  private static xpService: XPService | null = null
  private static pestService: PestService | null = null
  private static notificationService: NotificationService | null = null

  static getWeatherService(): WeatherService {
    if (!this.weatherService) {
      if (config.services.useMockWeather) {
        this.weatherService = new MockWeatherService()
      } else {
        // TODO: Implement real weather service
        // this.weatherService = new OpenWeatherService()
        console.warn('Real weather service not implemented, falling back to mock')
        this.weatherService = new MockWeatherService()
      }
    }
    return this.weatherService
  }

  static getMarketService(): MarketService {
    if (!this.marketService) {
      if (config.services.useMockMarket) {
        this.marketService = new MockMarketService()
      } else {
        // TODO: Implement real market service
        // this.marketService = new KrishiHubMarketService()
        console.warn('Real market service not implemented, falling back to mock')
        this.marketService = new MockMarketService()
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
      if (config.services.useMockPest) {
        this.pestService = new MockPestService()
      } else {
        // TODO: Implement real pest service with ML models
        console.warn('Real pest service not implemented, falling back to mock')
        this.pestService = new MockPestService()
      }
    }
    return this.pestService
  }

  static getNotificationService(): NotificationService {
    if (!this.notificationService) {
      if (config.services.useMockNotifications) {
        // TODO: Implement mock notification service
        throw new Error('Mock notification service not implemented yet')
      } else {
        // TODO: Implement real notification service
        // this.notificationService = new ExpoNotificationService()
        throw new Error('Real notification service not implemented yet')
      }
    }
    return this.notificationService
  }

  // Method to reset all services (useful for testing)
  static resetServices(): void {
    this.weatherService = null
    this.marketService = null
    this.xpService = null
    this.pestService = null
    this.notificationService = null
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

  // Method to get service configuration info
  static getServiceConfig(): {
    weather: 'mock' | 'real'
    market: 'mock' | 'real'
    pest: 'mock' | 'real'
    notifications: 'mock' | 'real'
  } {
    return {
      weather: config.services.useMockWeather ? 'mock' : 'real',
      market: config.services.useMockMarket ? 'mock' : 'real',
      pest: config.services.useMockPest ? 'mock' : 'real',
      notifications: config.services.useMockNotifications ? 'mock' : 'real'
    }
  }

  // Method to log service configuration
  static logServiceConfiguration(): void {
    if (config.development.enableDebugLogs) {
      const serviceConfig = this.getServiceConfig()
      console.log('AgroClash Service Configuration:', serviceConfig)
    }
  }
}

// Initialize service configuration logging
if (typeof window !== 'undefined' || typeof global !== 'undefined') {
  ServiceFactory.logServiceConfiguration()
}