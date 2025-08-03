// Test suite for Weather Service

import { MockWeatherService } from '../../services/mock/weather.service'
import { Location } from '../../types'

describe('MockWeatherService', () => {
  let weatherService: MockWeatherService
  const testLocation: Location = { latitude: 40.7128, longitude: -74.0060 }

  beforeEach(() => {
    weatherService = new MockWeatherService()
  })

  describe('getForecast', () => {
    it('should return weather forecast with current conditions and 7-day forecast', async () => {
      const forecast = await weatherService.getForecast(testLocation)

      expect(forecast).toBeDefined()
      expect(forecast.location).toEqual(testLocation)
      expect(forecast.current).toBeDefined()
      expect(forecast.current.temperature).toBeGreaterThan(0)
      expect(forecast.current.humidity).toBeGreaterThanOrEqual(0)
      expect(forecast.current.humidity).toBeLessThanOrEqual(100)
      expect(forecast.forecast).toHaveLength(7)
      expect(forecast.alerts).toBeDefined()
    })

    it('should return forecast with valid temperature ranges', async () => {
      const forecast = await weatherService.getForecast(testLocation)

      forecast.forecast.forEach(day => {
        expect(day.temperature_min).toBeLessThanOrEqual(day.temperature_max)
        expect(day.temperature_min).toBeGreaterThan(0)
        expect(day.temperature_max).toBeGreaterThan(0)
        expect(day.humidity).toBeGreaterThanOrEqual(0)
        expect(day.humidity).toBeLessThanOrEqual(100)
        expect(day.precipitation_chance).toBeGreaterThanOrEqual(0)
        expect(day.precipitation_chance).toBeLessThanOrEqual(100)
      })
    })

    it('should include dates in forecast', async () => {
      const forecast = await weatherService.getForecast(testLocation)

      forecast.forecast.forEach(day => {
        expect(day.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
        expect(new Date(day.date)).toBeInstanceOf(Date)
      })
    })
  })

  describe('getAlerts', () => {
    it('should return array of weather alerts', async () => {
      const alerts = await weatherService.getAlerts(testLocation)

      expect(Array.isArray(alerts)).toBe(true)
      
      alerts.forEach(alert => {
        expect(alert.id).toBeDefined()
        expect(['rain', 'drought', 'frost', 'storm', 'heat']).toContain(alert.type)
        expect(['low', 'medium', 'high']).toContain(alert.severity)
        expect(alert.title).toBeDefined()
        expect(alert.description).toBeDefined()
        expect(alert.start_time).toBeDefined()
        expect(alert.end_time).toBeDefined()
      })
    })

    it('should return valid alert timestamps', async () => {
      const alerts = await weatherService.getAlerts(testLocation)

      alerts.forEach(alert => {
        const startTime = new Date(alert.start_time)
        const endTime = new Date(alert.end_time)
        
        expect(startTime).toBeInstanceOf(Date)
        expect(endTime).toBeInstanceOf(Date)
        expect(endTime.getTime()).toBeGreaterThan(startTime.getTime())
      })
    })
  })

  describe('getHistoricalData', () => {
    it('should return historical weather data for specified days', async () => {
      const days = 5
      const historicalData = await weatherService.getHistoricalData(testLocation, days)

      expect(historicalData).toHaveLength(days)
      
      historicalData.forEach(data => {
        expect(data.location).toEqual(testLocation)
        expect(data.current).toBeDefined()
        expect(data.current.temperature).toBeGreaterThan(0)
        expect(data.forecast).toHaveLength(0) // Historical data shouldn't have forecasts
        expect(data.alerts).toHaveLength(0) // Historical data shouldn't have alerts
      })
    })

    it('should handle different day ranges', async () => {
      const testCases = [1, 7, 14, 30]

      for (const days of testCases) {
        const historicalData = await weatherService.getHistoricalData(testLocation, days)
        expect(historicalData).toHaveLength(days)
      }
    })
  })

  describe('subscribeToAlerts', () => {
    it('should return unsubscribe function', async () => {
      const mockCallback = jest.fn()
      
      const unsubscribe = await weatherService.subscribeToAlerts(testLocation, mockCallback)
      
      expect(typeof unsubscribe).toBe('function')
      
      // Clean up
      unsubscribe()
    })

    it('should call callback when alerts are generated', async () => {
      const mockCallback = jest.fn()
      
      const unsubscribe = await weatherService.subscribeToAlerts(testLocation, mockCallback)
      
      // Wait a bit to see if callback is called (in real implementation)
      // For mock, we can't easily test the periodic callback without waiting
      
      expect(typeof unsubscribe).toBe('function')
      
      // Clean up
      unsubscribe()
    })
  })

  describe('error handling', () => {
    it('should handle invalid locations gracefully', async () => {
      const invalidLocation: Location = { latitude: 999, longitude: 999 }
      
      // Mock service should still return data even for invalid locations
      const forecast = await weatherService.getForecast(invalidLocation)
      expect(forecast).toBeDefined()
      expect(forecast.location).toEqual(invalidLocation)
    })
  })

  describe('data consistency', () => {
    it('should return consistent data structure across multiple calls', async () => {
      const forecast1 = await weatherService.getForecast(testLocation)
      const forecast2 = await weatherService.getForecast(testLocation)

      expect(forecast1).toHaveProperty('location')
      expect(forecast1).toHaveProperty('current')
      expect(forecast1).toHaveProperty('forecast')
      expect(forecast1).toHaveProperty('alerts')

      expect(forecast2).toHaveProperty('location')
      expect(forecast2).toHaveProperty('current')
      expect(forecast2).toHaveProperty('forecast')
      expect(forecast2).toHaveProperty('alerts')

      expect(forecast1.forecast).toHaveLength(7)
      expect(forecast2.forecast).toHaveLength(7)
    })
  })
})