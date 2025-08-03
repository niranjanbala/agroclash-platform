// Test suite for utility functions

import {
  calculateDistance,
  calculatePolygonArea,
  formatDate,
  formatXP,
  calculateLevelFromXP,
  getXPForLevel,
  generateId,
  isValidEmail,
  isValidPhoneNumber,
  getCropStatusColor,
  formatCurrency
} from '../utils'

describe('Utility Functions', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two points correctly', () => {
      const point1 = { latitude: 40.7128, longitude: -74.0060 } // New York
      const point2 = { latitude: 34.0522, longitude: -118.2437 } // Los Angeles
      
      const distance = calculateDistance(point1, point2)
      expect(distance).toBeCloseTo(3944, 0) // Approximately 3944 km
    })

    it('should return 0 for identical points', () => {
      const point = { latitude: 40.7128, longitude: -74.0060 }
      const distance = calculateDistance(point, point)
      expect(distance).toBe(0)
    })
  })

  describe('calculatePolygonArea', () => {
    it('should calculate area of a simple square', () => {
      const square = [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1]
      ]
      const area = calculatePolygonArea(square)
      expect(area).toBe(1)
    })

    it('should return 0 for invalid polygon', () => {
      const invalid = [[0, 0], [1, 1]]
      const area = calculatePolygonArea(invalid)
      expect(area).toBe(0)
    })
  })

  describe('formatDate', () => {
    it('should format date in short format', () => {
      const date = '2024-01-15'
      const formatted = formatDate(date, 'short')
      expect(formatted).toBe('Jan 15')
    })

    it('should format date in long format', () => {
      const date = '2024-01-15'
      const formatted = formatDate(date, 'long')
      expect(formatted).toBe('January 15, 2024')
    })
  })

  describe('formatXP', () => {
    it('should format small XP numbers as-is', () => {
      expect(formatXP(500)).toBe('500')
    })

    it('should format thousands with K suffix', () => {
      expect(formatXP(1500)).toBe('1.5K')
    })

    it('should format millions with M suffix', () => {
      expect(formatXP(2500000)).toBe('2.5M')
    })
  })

  describe('calculateLevelFromXP', () => {
    it('should calculate correct level from XP', () => {
      expect(calculateLevelFromXP(0)).toBe(1)
      expect(calculateLevelFromXP(100)).toBe(2)
      expect(calculateLevelFromXP(400)).toBe(3)
      expect(calculateLevelFromXP(900)).toBe(4)
    })
  })

  describe('getXPForLevel', () => {
    it('should calculate XP required for level', () => {
      expect(getXPForLevel(1)).toBe(0)
      expect(getXPForLevel(2)).toBe(100)
      expect(getXPForLevel(3)).toBe(400)
      expect(getXPForLevel(4)).toBe(900)
    })
  })

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
      expect(typeof id1).toBe('string')
      expect(id1.length).toBeGreaterThan(0)
    })
  })

  describe('isValidEmail', () => {
    it('should validate correct email addresses', () => {
      expect(isValidEmail('test@example.com')).toBe(true)
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true)
    })

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('invalid-email')).toBe(false)
      expect(isValidEmail('test@')).toBe(false)
      expect(isValidEmail('@domain.com')).toBe(false)
    })
  })

  describe('isValidPhoneNumber', () => {
    it('should validate correct phone numbers', () => {
      expect(isValidPhoneNumber('+1234567890')).toBe(true)
      expect(isValidPhoneNumber('123-456-7890')).toBe(true)
      expect(isValidPhoneNumber('(123) 456-7890')).toBe(true)
    })

    it('should reject invalid phone numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false)
      expect(isValidPhoneNumber('abc')).toBe(false)
    })
  })

  describe('getCropStatusColor', () => {
    it('should return correct colors for crop statuses', () => {
      expect(getCropStatusColor('planted')).toBe('#10B981')
      expect(getCropStatusColor('growing')).toBe('#F59E0B')
      expect(getCropStatusColor('flowering')).toBe('#8B5CF6')
      expect(getCropStatusColor('ready')).toBe('#EF4444')
      expect(getCropStatusColor('harvested')).toBe('#6B7280')
      expect(getCropStatusColor('unknown')).toBe('#6B7280')
    })
  })

  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56')
      expect(formatCurrency(1000, 'EUR')).toBe('€1,000.00')
    })
  })
})