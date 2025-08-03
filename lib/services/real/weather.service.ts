import { WeatherData, WeatherAlert, WeatherForecast, Location } from '../../types'
import { config } from '../../config/environment'

interface OpenWeatherMapResponse {
  coord: { lon: number; lat: number }
  weather: Array<{
    id: number
    main: string
    description: string
    icon: string
  }>
  main: {
    temp: number
    feels_like: number
    temp_min: number
    temp_max: number
    pressure: number
    humidity: number
  }
  wind: {
    speed: number
    deg: number
  }
  clouds: { all: number }
  dt: number
  sys: {
    country: string
    sunrise: number
    sunset: number
  }
  name: string
}

interface OpenWeatherMapForecastResponse {
  list: Array<{
    dt: number
    main: {
      temp: number
      temp_min: number
      temp_max: number
      humidity: number
    }
    weather: Array<{
      main: string
      description: string
      icon: string
    }>
    pop: number // Probability of precipitation
    dt_txt: string
  }>
  city: {
    name: string
    country: string
    coord: { lat: number; lon: number }
  }
}

interface OpenWeatherMapAlertsResponse {
  alerts?: Array<{
    sender_name: string
    event: string
    start: number
    end: number
    description: string
    tags: string[]
  }>
}

export class OpenWeatherMapService {
  private apiKey: string
  private baseUrl = 'https://api.openweathermap.org/data/2.5'
  private oneCallUrl = 'https://api.openweathermap.org/data/3.0/onecall'
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

  constructor() {
    this.apiKey = config.apis.openWeatherMapKey || ''
    if (!this.apiKey) {
      console.warn('OpenWeatherMap API key not configured')
    }
  }

  async getForecast(location: Location): Promise<WeatherData> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    const cacheKey = `forecast_${location.latitude}_${location.longitude}`
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      // Get current weather and 5-day forecast
      const [currentResponse, forecastResponse, alertsResponse] = await Promise.all([
        this.fetchWithRetry(`${this.baseUrl}/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${this.apiKey}&units=metric`),
        this.fetchWithRetry(`${this.baseUrl}/forecast?lat=${location.latitude}&lon=${location.longitude}&appid=${this.apiKey}&units=metric`),
        this.fetchWithRetry(`${this.oneCallUrl}?lat=${location.latitude}&lon=${location.longitude}&appid=${this.apiKey}&exclude=minutely,hourly,daily`).catch(() => null)
      ])

      const currentData: OpenWeatherMapResponse = await currentResponse.json()
      const forecastData: OpenWeatherMapForecastResponse = await forecastResponse.json()
      const alertsData: OpenWeatherMapAlertsResponse = alertsResponse ? await alertsResponse.json() : { alerts: [] }

      const weatherData: WeatherData = {
        location: {
          latitude: location.latitude,
          longitude: location.longitude
        },
        current: {
          temperature: Math.round(currentData.main.temp),
          humidity: currentData.main.humidity,
          wind_speed: Math.round(currentData.wind.speed * 3.6), // Convert m/s to km/h
          description: currentData.weather[0].description,
          icon: this.mapWeatherIcon(currentData.weather[0].icon)
        },
        forecast: this.processForecastData(forecastData),
        alerts: this.processAlertsData(alertsData.alerts || [])
      }

      this.setCache(cacheKey, weatherData, 10 * 60 * 1000) // Cache for 10 minutes
      return weatherData

    } catch (error) {
      console.error('OpenWeatherMap API error:', error)
      throw new Error('Failed to fetch weather data')
    }
  }

  async getAlerts(location: Location): Promise<WeatherAlert[]> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    const cacheKey = `alerts_${location.latitude}_${location.longitude}`
    const cached = this.getFromCache(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const response = await this.fetchWithRetry(
        `${this.oneCallUrl}?lat=${location.latitude}&lon=${location.longitude}&appid=${this.apiKey}&exclude=current,minutely,hourly,daily`
      )

      const data: OpenWeatherMapAlertsResponse = await response.json()
      const alerts = this.processAlertsData(data.alerts || [])

      this.setCache(cacheKey, alerts, 5 * 60 * 1000) // Cache for 5 minutes
      return alerts

    } catch (error) {
      console.error('OpenWeatherMap alerts API error:', error)
      return [] // Return empty array on error
    }
  }

  async getHistoricalData(location: Location, days: number): Promise<WeatherData[]> {
    if (!this.apiKey) {
      throw new Error('OpenWeatherMap API key not configured')
    }

    const historicalData: WeatherData[] = []
    const now = Math.floor(Date.now() / 1000)

    try {
      // OpenWeatherMap historical data requires a separate API call for each day
      const promises = Array.from({ length: days }, (_, i) => {
        const timestamp = now - (i + 1) * 24 * 60 * 60
        return this.fetchWithRetry(
          `${this.oneCallUrl}/timemachine?lat=${location.latitude}&lon=${location.longitude}&dt=${timestamp}&appid=${this.apiKey}&units=metric`
        )
      })

      const responses = await Promise.allSettled(promises)

      for (const response of responses) {
        if (response.status === 'fulfilled') {
          const data = await response.value.json()
          if (data.current) {
            historicalData.push({
              location,
              current: {
                temperature: Math.round(data.current.temp),
                humidity: data.current.humidity,
                wind_speed: Math.round(data.current.wind_speed * 3.6),
                description: data.current.weather[0].description,
                icon: this.mapWeatherIcon(data.current.weather[0].icon)
              },
              forecast: [],
              alerts: []
            })
          }
        }
      }

      return historicalData

    } catch (error) {
      console.error('OpenWeatherMap historical API error:', error)
      throw new Error('Failed to fetch historical weather data')
    }
  }

  async subscribeToAlerts(location: Location, callback: (alert: WeatherAlert) => void): Promise<() => void> {
    // OpenWeatherMap doesn't support real-time subscriptions
    // We'll implement polling instead
    const pollInterval = 5 * 60 * 1000 // 5 minutes
    let lastAlerts: WeatherAlert[] = []

    const poll = async () => {
      try {
        const currentAlerts = await this.getAlerts(location)
        
        // Find new alerts
        const newAlerts = currentAlerts.filter(alert => 
          !lastAlerts.some(lastAlert => lastAlert.id === alert.id)
        )

        // Notify about new alerts
        newAlerts.forEach(callback)
        lastAlerts = currentAlerts

      } catch (error) {
        console.error('Weather alerts polling error:', error)
      }
    }

    // Initial poll
    poll()

    // Set up polling
    const intervalId = setInterval(poll, pollInterval)

    // Return unsubscribe function
    return () => {
      clearInterval(intervalId)
    }
  }

  private async fetchWithRetry(url: string, retries: number = 3): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url)
        
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

  private processForecastData(data: OpenWeatherMapForecastResponse): WeatherForecast[] {
    // Group by date and take one forecast per day
    const dailyForecasts = new Map<string, any>()

    data.list.forEach(item => {
      const date = item.dt_txt.split(' ')[0]
      if (!dailyForecasts.has(date)) {
        dailyForecasts.set(date, item)
      }
    })

    return Array.from(dailyForecasts.values()).slice(0, 5).map(item => ({
      date: item.dt_txt.split(' ')[0],
      temperature_min: Math.round(item.main.temp_min),
      temperature_max: Math.round(item.main.temp_max),
      humidity: item.main.humidity,
      precipitation_chance: Math.round(item.pop * 100),
      description: item.weather[0].description,
      icon: this.mapWeatherIcon(item.weather[0].icon)
    }))
  }

  private processAlertsData(alerts: any[]): WeatherAlert[] {
    return alerts.map(alert => ({
      id: `owm_${alert.start}_${alert.event}`,
      type: this.mapAlertType(alert.event),
      severity: this.mapAlertSeverity(alert.tags),
      title: alert.event,
      description: alert.description,
      start_time: new Date(alert.start * 1000).toISOString(),
      end_time: new Date(alert.end * 1000).toISOString()
    }))
  }

  private mapWeatherIcon(owmIcon: string): string {
    // Map OpenWeatherMap icons to our internal icon system
    const iconMap: { [key: string]: string } = {
      '01d': 'clear-day',
      '01n': 'clear-night',
      '02d': 'partly-cloudy-day',
      '02n': 'partly-cloudy-night',
      '03d': 'cloudy',
      '03n': 'cloudy',
      '04d': 'cloudy',
      '04n': 'cloudy',
      '09d': 'rain',
      '09n': 'rain',
      '10d': 'rain',
      '10n': 'rain',
      '11d': 'thunderstorm',
      '11n': 'thunderstorm',
      '13d': 'snow',
      '13n': 'snow',
      '50d': 'fog',
      '50n': 'fog'
    }

    return iconMap[owmIcon] || 'cloudy'
  }

  private mapAlertType(event: string): WeatherAlert['type'] {
    const eventLower = event.toLowerCase()
    
    if (eventLower.includes('rain') || eventLower.includes('flood')) return 'rain'
    if (eventLower.includes('drought') || eventLower.includes('dry')) return 'drought'
    if (eventLower.includes('frost') || eventLower.includes('freeze')) return 'frost'
    if (eventLower.includes('storm') || eventLower.includes('wind')) return 'storm'
    if (eventLower.includes('heat') || eventLower.includes('hot')) return 'heat'
    
    return 'storm' // Default
  }

  private mapAlertSeverity(tags: string[]): WeatherAlert['severity'] {
    const tagString = tags.join(' ').toLowerCase()
    
    if (tagString.includes('extreme') || tagString.includes('severe')) return 'high'
    if (tagString.includes('moderate') || tagString.includes('watch')) return 'medium'
    
    return 'low'
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

    // Clean up old cache entries periodically
    if (this.cache.size > 100) {
      const now = Date.now()
      for (const [cacheKey, cached] of this.cache.entries()) {
        if (now - cached.timestamp > cached.ttl) {
          this.cache.delete(cacheKey)
        }
      }
    }
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    if (!this.apiKey) return false

    try {
      const response = await fetch(`${this.baseUrl}/weather?q=London&appid=${this.apiKey}`)
      return response.ok
    } catch {
      return false
    }
  }

  // Get API usage info (if available)
  async getApiUsage(): Promise<{ calls: number; limit: number } | null> {
    // OpenWeatherMap doesn't provide usage info in free tier
    return null
  }
}