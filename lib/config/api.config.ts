export interface ApiConfig {
  mode: 'mock' | 'real' | 'hybrid'
  services: {
    weather: {
      provider: 'mock' | 'openweathermap'
      config: {
        apiKey?: string
        baseUrl?: string
        rateLimit?: number
        cacheTtl?: number
      }
    }
    market: {
      provider: 'mock' | 'coinapi' | 'custom'
      config: {
        apiKey?: string
        baseUrl?: string
        rateLimit?: number
        cacheTtl?: number
      }
    }
    auth: {
      provider: 'mock' | 'firebase' | 'supabase' | 'custom'
      config: {
        apiKey?: string
        projectId?: string
        authDomain?: string
        databaseURL?: string
      }
    }
    storage: {
      provider: 'mock' | 'firebase' | 'supabase' | 'aws-s3'
      config: {
        bucket?: string
        region?: string
        accessKeyId?: string
        secretAccessKey?: string
      }
    }
    notifications: {
      provider: 'mock' | 'firebase' | 'onesignal' | 'pusher'
      config: {
        apiKey?: string
        appId?: string
        serverKey?: string
      }
    }
  }
  fallback: {
    enabled: boolean
    strategy: 'mock' | 'cache' | 'offline'
  }
  monitoring: {
    enabled: boolean
    logErrors: boolean
    trackUsage: boolean
    alertOnFailure: boolean
  }
}

export const defaultApiConfig: ApiConfig = {
  mode: process.env.NODE_ENV === 'production' ? 'real' : 'mock',
  services: {
    weather: {
      provider: process.env.WEATHER_PROVIDER as any || 'mock',
      config: {
        apiKey: process.env.OPENWEATHERMAP_API_KEY,
        baseUrl: 'https://api.openweathermap.org/data/2.5',
        rateLimit: 1000, // calls per hour
        cacheTtl: 10 * 60 * 1000 // 10 minutes
      }
    },
    market: {
      provider: process.env.MARKET_PROVIDER as any || 'mock',
      config: {
        apiKey: process.env.MARKET_API_KEY,
        baseUrl: process.env.MARKET_API_URL,
        rateLimit: 100, // calls per hour
        cacheTtl: 5 * 60 * 1000 // 5 minutes
      }
    },
    auth: {
      provider: process.env.AUTH_PROVIDER as any || 'mock',
      config: {
        apiKey: process.env.FIREBASE_API_KEY,
        projectId: process.env.FIREBASE_PROJECT_ID,
        authDomain: process.env.FIREBASE_AUTH_DOMAIN,
        databaseURL: process.env.FIREBASE_DATABASE_URL
      }
    },
    storage: {
      provider: process.env.STORAGE_PROVIDER as any || 'mock',
      config: {
        bucket: process.env.STORAGE_BUCKET,
        region: process.env.STORAGE_REGION,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }
    },
    notifications: {
      provider: process.env.NOTIFICATIONS_PROVIDER as any || 'mock',
      config: {
        apiKey: process.env.NOTIFICATIONS_API_KEY,
        appId: process.env.NOTIFICATIONS_APP_ID,
        serverKey: process.env.NOTIFICATIONS_SERVER_KEY
      }
    }
  },
  fallback: {
    enabled: true,
    strategy: 'mock'
  },
  monitoring: {
    enabled: process.env.NODE_ENV === 'production',
    logErrors: true,
    trackUsage: true,
    alertOnFailure: process.env.NODE_ENV === 'production'
  }
}

export class ApiConfigManager {
  private static instance: ApiConfigManager
  private config: ApiConfig

  private constructor() {
    this.config = { ...defaultApiConfig }
    this.loadFromEnvironment()
  }

  static getInstance(): ApiConfigManager {
    if (!ApiConfigManager.instance) {
      ApiConfigManager.instance = new ApiConfigManager()
    }
    return ApiConfigManager.instance
  }

  getConfig(): ApiConfig {
    return { ...this.config }
  }

  getServiceConfig<T extends keyof ApiConfig['services']>(service: T): ApiConfig['services'][T] {
    return { ...this.config.services[service] }
  }

  updateConfig(updates: Partial<ApiConfig>): void {
    this.config = {
      ...this.config,
      ...updates,
      services: {
        ...this.config.services,
        ...updates.services
      }
    }
  }

  updateServiceConfig<T extends keyof ApiConfig['services']>(
    service: T, 
    updates: Partial<ApiConfig['services'][T]>
  ): void {
    this.config.services[service] = {
      ...this.config.services[service],
      ...updates,
      config: {
        ...this.config.services[service].config,
        ...updates.config
      }
    }
  }

  setMode(mode: ApiConfig['mode']): void {
    this.config.mode = mode
  }

  isServiceEnabled(service: keyof ApiConfig['services']): boolean {
    const serviceConfig = this.config.services[service]
    return serviceConfig.provider !== 'mock' || this.config.mode === 'mock'
  }

  shouldUseFallback(): boolean {
    return this.config.fallback.enabled
  }

  getFallbackStrategy(): ApiConfig['fallback']['strategy'] {
    return this.config.fallback.strategy
  }

  isMonitoringEnabled(): boolean {
    return this.config.monitoring.enabled
  }

  shouldLogErrors(): boolean {
    return this.config.monitoring.logErrors
  }

  shouldTrackUsage(): boolean {
    return this.config.monitoring.trackUsage
  }

  shouldAlertOnFailure(): boolean {
    return this.config.monitoring.alertOnFailure
  }

  private loadFromEnvironment(): void {
    // Load configuration from environment variables
    if (process.env.API_MODE) {
      this.config.mode = process.env.API_MODE as ApiConfig['mode']
    }

    // Weather service
    if (process.env.WEATHER_PROVIDER) {
      this.config.services.weather.provider = process.env.WEATHER_PROVIDER as any
    }
    if (process.env.OPENWEATHERMAP_API_KEY) {
      this.config.services.weather.config.apiKey = process.env.OPENWEATHERMAP_API_KEY
    }

    // Market service
    if (process.env.MARKET_PROVIDER) {
      this.config.services.market.provider = process.env.MARKET_PROVIDER as any
    }
    if (process.env.MARKET_API_KEY) {
      this.config.services.market.config.apiKey = process.env.MARKET_API_KEY
    }

    // Auth service
    if (process.env.AUTH_PROVIDER) {
      this.config.services.auth.provider = process.env.AUTH_PROVIDER as any
    }

    // Fallback settings
    if (process.env.FALLBACK_ENABLED) {
      this.config.fallback.enabled = process.env.FALLBACK_ENABLED === 'true'
    }
    if (process.env.FALLBACK_STRATEGY) {
      this.config.fallback.strategy = process.env.FALLBACK_STRATEGY as any
    }

    // Monitoring settings
    if (process.env.MONITORING_ENABLED) {
      this.config.monitoring.enabled = process.env.MONITORING_ENABLED === 'true'
    }
  }

  // Validate configuration
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Check required API keys for real services
    if (this.config.mode === 'real' || this.config.mode === 'hybrid') {
      if (this.config.services.weather.provider === 'openweathermap' && 
          !this.config.services.weather.config.apiKey) {
        errors.push('OpenWeatherMap API key is required')
      }

      if (this.config.services.market.provider !== 'mock' && 
          !this.config.services.market.config.apiKey) {
        errors.push('Market API key is required')
      }

      if (this.config.services.auth.provider === 'firebase' && 
          !this.config.services.auth.config.apiKey) {
        errors.push('Firebase API key is required')
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  // Export configuration for debugging
  export(): string {
    const safeConfig = { ...this.config }
    
    // Remove sensitive information
    Object.values(safeConfig.services).forEach(service => {
      if (service.config.apiKey) {
        service.config.apiKey = '***REDACTED***'
      }
      if (service.config.secretAccessKey) {
        service.config.secretAccessKey = '***REDACTED***'
      }
    })

    return JSON.stringify(safeConfig, null, 2)
  }
}