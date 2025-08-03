// Shared utility functions for AgroClash platform

import { Location } from '../types'

/**
 * Calculate distance between two geographic points using Haversine formula
 */
export function calculateDistance(point1: Location, point2: Location): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(point2.latitude - point1.latitude)
  const dLon = toRadians(point2.longitude - point1.longitude)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(point1.latitude)) * Math.cos(toRadians(point2.latitude)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Calculate area of a polygon using the shoelace formula
 */
export function calculatePolygonArea(coordinates: number[][]): number {
  if (coordinates.length < 3) return 0
  
  let area = 0
  const n = coordinates.length
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n
    area += coordinates[i][0] * coordinates[j][1]
    area -= coordinates[j][0] * coordinates[i][1]
  }
  
  return Math.abs(area) / 2
}

/**
 * Format date for display
 */
export function formatDate(date: string | Date, format: 'short' | 'long' = 'short'): string {
  const d = new Date(date)
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }
  
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format XP numbers with appropriate suffixes
 */
export function formatXP(xp: number): string {
  if (xp >= 1000000) {
    return `${(xp / 1000000).toFixed(1)}M`
  }
  if (xp >= 1000) {
    return `${(xp / 1000).toFixed(1)}K`
  }
  return xp.toString()
}

/**
 * Calculate level from XP using exponential curve
 */
export function calculateLevelFromXP(xp: number): number {
  // Level formula: level = floor(sqrt(xp / 100))
  return Math.floor(Math.sqrt(xp / 100)) + 1
}

/**
 * Calculate XP required for next level
 */
export function getXPForLevel(level: number): number {
  // XP formula: xp = (level - 1)^2 * 100
  return Math.pow(level - 1, 2) * 100
}

/**
 * Generate random ID for mock data
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce function for search and input handling
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (attempt === maxRetries) {
        throw lastError
      }
      
      const delay = baseDelay * Math.pow(2, attempt)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  
  throw lastError!
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate phone number format (basic)
 */
export function isValidPhoneNumber(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
  return phoneRegex.test(phone)
}

/**
 * Generate color based on crop status
 */
export function getCropStatusColor(status: string): string {
  const colors = {
    planted: '#10B981', // green
    growing: '#F59E0B', // yellow
    flowering: '#8B5CF6', // purple
    ready: '#EF4444', // red
    harvested: '#6B7280' // gray
  }
  return colors[status as keyof typeof colors] || '#6B7280'
}

/**
 * Format currency values
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}