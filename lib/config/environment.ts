// Environment configuration for service switching

export interface EnvironmentConfig {
  supabase: {
    url: string
    anonKey: string
  }
  services: {
    useMockWeather: boolean
    useMockMarket: boolean
    useMockPest: boolean
    useMockNotifications: boolean
  }
  features: {
    enableOfflineMode: boolean
    enablePushNotifications: boolean
    enableRealTimeUpdates: boolean
  }
  development: {
    enableDebugLogs: boolean
    mockDataSeed: string
  }
}

export const getEnvironmentConfig = (): EnvironmentConfig => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  return {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
    },
    services: {
      useMockWeather: process.env.USE_MOCK_WEATHER === 'true' || isDevelopment,
      useMockMarket: process.env.USE_MOCK_MARKET === 'true' || isDevelopment,
      useMockPest: process.env.USE_MOCK_PEST === 'true' || isDevelopment,
      useMockNotifications: process.env.USE_MOCK_NOTIFICATIONS === 'true' || isDevelopment
    },
    features: {
      enableOfflineMode: process.env.ENABLE_OFFLINE_MODE !== 'false',
      enablePushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
      enableRealTimeUpdates: process.env.ENABLE_REALTIME_UPDATES !== 'false'
    },
    development: {
      enableDebugLogs: isDevelopment || process.env.ENABLE_DEBUG_LOGS === 'true',
      mockDataSeed: process.env.MOCK_DATA_SEED || 'default-seed'
    }
  }
}

export const config = getEnvironmentConfig()