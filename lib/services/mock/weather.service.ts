// Mock Weather Service Implementation

import { WeatherService } from '../interfaces'
import { WeatherData, WeatherAlert, WeatherForecast, Location } from '../../types'
import { generateId } from '../../utils'

export class MockWeatherService implements WeatherService {
  private mockData: WeatherData[] = []
  private alertSubscriptions: Map<string, (alert: WeatherAlert) => void> = new Map()

  constructor() {
    this.generateMockData()
  }

  async getForecast(location: Location): Promise<WeatherData> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    const forecast: WeatherForecast[] = []
    const today = new Date()

    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      
      forecast.push({
        date: date.toISOString().split('T')[0],
        temperature_min: Math.round(15 + Math.random() * 10),
        temperature_max: Math.round(25 + Math.random() * 15),
        humidity: Math.round(40 + Math.random() * 40),
        precipitation_chance: Math.round(Math.random() * 100),
        description: this.getRandomWeatherDescription(),
        icon: this.getRandomWeatherIcon()
      })
    }

    const alerts = await this.getAlerts(location)

    return {
      location,
      current: {
        temperature: Math.round(20 + Math.random() * 15),
        humidity: Math.round(50 + Math.random() * 30),
        wind_speed: Math.round(Math.random() * 20),
        description: this.getRandomWeatherDescription(),
        icon: this.getRandomWeatherIcon()
      },
      forecast,
      alerts
    }
  }

  async getAlerts(location: Location): Promise<WeatherAlert[]> {
    await new Promise(resolve => setTimeout(resolve, 200))

    const alerts: WeatherAlert[] = []
    const alertTypes: WeatherAlert['type'][] = ['rain', 'drought', 'frost', 'storm', 'heat']
    const severities: WeatherAlert['severity'][] = ['low', 'medium', 'high']

    // Generate random alerts (30% chance)
    if (Math.random() < 0.3) {
      const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)]
      const severity = severities[Math.floor(Math.random() * severities.length)]
      
      alerts.push({
        id: generateId(),
        type: alertType,
        severity,
        title: this.getAlertTitle(alertType, severity),
        description: this.getAlertDescription(alertType, severity),
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
    }

    return alerts
  }

  async getHistoricalData(location: Location, days: number): Promise<WeatherData[]> {
    await new Promise(resolve => setTimeout(resolve, 300))

    const historicalData: WeatherData[] = []
    const today = new Date()

    for (let i = days; i > 0; i--) {
      const date = new Date(today)
      date.setDate(today.getDate() - i)

      historicalData.push({
        location,
        current: {
          temperature: Math.round(18 + Math.random() * 12),
          humidity: Math.round(45 + Math.random() * 35),
          wind_speed: Math.round(Math.random() * 15),
          description: this.getRandomWeatherDescription(),
          icon: this.getRandomWeatherIcon()
        },
        forecast: [], // Historical data doesn't include forecasts
        alerts: []
      })
    }

    return historicalData
  }

  async subscribeToAlerts(location: Location, callback: (alert: WeatherAlert) => void): Promise<() => void> {
    const subscriptionId = generateId()
    this.alertSubscriptions.set(subscriptionId, callback)

    // Simulate periodic alerts (every 30 seconds for demo)
    const interval = setInterval(async () => {
      const alerts = await this.getAlerts(location)
      alerts.forEach(alert => callback(alert))
    }, 30000)

    // Return unsubscribe function
    return () => {
      this.alertSubscriptions.delete(subscriptionId)
      clearInterval(interval)
    }
  }

  private generateMockData(): void {
    // Pre-generate some mock data for consistent responses
    this.mockData = []
  }

  private getRandomWeatherDescription(): string {
    const descriptions = [
      'Clear sky',
      'Partly cloudy',
      'Cloudy',
      'Light rain',
      'Heavy rain',
      'Thunderstorm',
      'Sunny',
      'Overcast',
      'Drizzle',
      'Fog'
    ]
    return descriptions[Math.floor(Math.random() * descriptions.length)]
  }

  private getRandomWeatherIcon(): string {
    const icons = [
      '☀️', '⛅', '☁️', '🌦️', '🌧️', '⛈️', '🌤️', '🌥️', '🌫️'
    ]
    return icons[Math.floor(Math.random() * icons.length)]
  }

  private getAlertTitle(type: WeatherAlert['type'], severity: WeatherAlert['severity']): string {
    const titles = {
      rain: {
        low: 'Light Rain Expected',
        medium: 'Moderate Rain Warning',
        high: 'Heavy Rain Alert'
      },
      drought: {
        low: 'Dry Conditions',
        medium: 'Drought Watch',
        high: 'Severe Drought Warning'
      },
      frost: {
        low: 'Frost Possible',
        medium: 'Frost Warning',
        high: 'Hard Freeze Alert'
      },
      storm: {
        low: 'Storm Watch',
        medium: 'Storm Warning',
        high: 'Severe Storm Alert'
      },
      heat: {
        low: 'Warm Weather',
        medium: 'Heat Advisory',
        high: 'Extreme Heat Warning'
      }
    }
    return titles[type][severity]
  }

  private getAlertDescription(type: WeatherAlert['type'], severity: WeatherAlert['severity']): string {
    const descriptions = {
      rain: {
        low: 'Light rainfall expected. Good for crops but monitor soil moisture.',
        medium: 'Moderate rainfall expected. Ensure proper drainage in fields.',
        high: 'Heavy rainfall expected. Risk of flooding and crop damage.'
      },
      drought: {
        low: 'Dry conditions continuing. Consider irrigation planning.',
        medium: 'Extended dry period. Increase irrigation frequency.',
        high: 'Severe drought conditions. Implement water conservation measures.'
      },
      frost: {
        low: 'Frost possible overnight. Cover sensitive plants.',
        medium: 'Frost warning issued. Protect crops from freezing.',
        high: 'Hard freeze expected. Take immediate action to protect crops.'
      },
      storm: {
        low: 'Storms possible. Monitor weather conditions.',
        medium: 'Storms expected. Secure equipment and protect crops.',
        high: 'Severe storms with high winds. Risk of significant crop damage.'
      },
      heat: {
        low: 'Warm temperatures expected. Ensure adequate irrigation.',
        medium: 'Hot weather advisory. Increase watering frequency.',
        high: 'Extreme heat warning. Risk of heat stress to crops.'
      }
    }
    return descriptions[type][severity]
  }
}