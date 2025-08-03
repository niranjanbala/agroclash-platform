# AgroClash Platform - API Documentation

## Overview

The AgroClash platform uses a service-oriented architecture with TypeScript interfaces and implementations. This document outlines the available services and their methods.

## Service Architecture

### Factory Pattern
All services are created through the `ServiceFactory` which allows switching between mock and real implementations:

```typescript
import { ServiceFactory } from '@/lib/services/factory'

// Get services (automatically uses mock or real based on environment)
const authService = ServiceFactory.getAuthService()
const plotService = ServiceFactory.getPlotService()
const cropService = ServiceFactory.getCropService()
```

## Authentication Service

### Interface: `IAuthService`

#### Methods

**`signUp(email: string, password: string, userData: Partial<User>): Promise<AuthResponse>`**
- Creates a new user account
- Returns authentication response with user data

**`signIn(email: string, password: string): Promise<AuthResponse>`**
- Authenticates existing user
- Returns authentication response with session

**`signOut(): Promise<void>`**
- Signs out current user
- Clears session data

**`getCurrentUser(): Promise<User | null>`**
- Gets current authenticated user
- Returns null if not authenticated

**`updateProfile(userId: string, updates: Partial<User>): Promise<User>`**
- Updates user profile information
- Returns updated user data

**`verifyOTP(email: string, token: string): Promise<AuthResponse>`**
- Verifies OTP for email confirmation
- Returns authentication response

## Plot Service

### Interface: `IPlotService`

#### Methods

**`createPlot(plotData: Omit<Plot, 'id' | 'created_at' | 'updated_at'>): Promise<Plot>`**
- Creates a new farm plot
- Validates polygon geometry
- Calculates area automatically

**`getPlots(userId: string): Promise<Plot[]>`**
- Retrieves all plots for a user
- Returns array of plot objects

**`getPlot(plotId: string): Promise<Plot | null>`**
- Gets specific plot by ID
- Returns null if not found

**`updatePlot(plotId: string, updates: Partial<Plot>): Promise<Plot>`**
- Updates plot information
- Recalculates area if geometry changes

**`deletePlot(plotId: string): Promise<void>`**
- Deletes a plot and associated data
- Cascades to related crops

**`validatePolygon(coordinates: number[][]): Promise<boolean>`**
- Validates polygon geometry
- Checks for self-intersections and minimum area

**`calculateArea(coordinates: number[][]): Promise<number>`**
- Calculates polygon area in square meters
- Uses geospatial calculations

## Crop Service

### Interface: `ICropService`

#### Methods

**`createCrop(cropData: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<Crop>`**
- Creates a new crop entry
- Initializes growth timeline

**`getCrops(plotId?: string, userId?: string): Promise<Crop[]>`**
- Gets crops filtered by plot or user
- Returns all crops if no filters

**`getCrop(cropId: string): Promise<Crop | null>`**
- Gets specific crop by ID
- Includes timeline data

**`updateCrop(cropId: string, updates: Partial<Crop>): Promise<Crop>`**
- Updates crop information
- Recalculates timeline if needed

**`deleteCrop(cropId: string): Promise<void>`**
- Deletes crop and timeline data

**`updateGrowthStage(cropId: string, stage: string, notes?: string): Promise<CropTimeline>`**
- Updates crop growth stage
- Creates timeline entry

**`getCropTimeline(cropId: string): Promise<CropTimeline[]>`**
- Gets complete growth timeline
- Ordered by date

**`calculateYield(cropId: string): Promise<number>`**
- Calculates expected yield
- Based on crop type and conditions

## Weather Service

### Interface: `IWeatherService`

#### Methods

**`getCurrentWeather(latitude: number, longitude: number): Promise<WeatherData>`**
- Gets current weather conditions
- Returns temperature, humidity, conditions

**`getForecast(latitude: number, longitude: number, days: number): Promise<WeatherData[]>`**
- Gets weather forecast
- Up to 7 days ahead

**`getWeatherHistory(latitude: number, longitude: number, startDate: Date, endDate: Date): Promise<WeatherData[]>`**
- Gets historical weather data
- Date range limited to 1 year

**`getWeatherAlerts(latitude: number, longitude: number): Promise<WeatherAlert[]>`**
- Gets active weather alerts
- Severe weather warnings

**`subscribeToAlerts(userId: string, latitude: number, longitude: number): Promise<void>`**
- Subscribes user to weather alerts
- Real-time notifications

## Market Service

### Interface: `IMarketService`

#### Methods

**`getMarketPrices(cropType?: string, region?: string): Promise<MarketPrice[]>`**
- Gets current market prices
- Filtered by crop type and region

**`getPriceHistory(cropType: string, region: string, days: number): Promise<MarketPrice[]>`**
- Gets historical price data
- Up to 365 days

**`getPriceTrends(cropType: string, region: string): Promise<PriceTrend>`**
- Analyzes price trends
- Returns trend analysis

**`getMarketRecommendations(userId: string): Promise<MarketRecommendation[]>`**
- Gets personalized recommendations
- Based on user's crops and market conditions

**`createListing(listingData: Omit<MarketListing, 'id' | 'created_at'>): Promise<MarketListing>`**
- Creates marketplace listing
- For selling crops

**`getListings(cropType?: string, region?: string): Promise<MarketListing[]>`**
- Gets marketplace listings
- Filtered by crop and region

## XP Service

### Interface: `IXPService`

#### Methods

**`awardXP(userId: string, amount: number, actionType: string, description?: string): Promise<XPLog>`**
- Awards XP to user
- Creates activity log entry

**`getXPLogs(userId: string, limit?: number): Promise<XPLog[]>`**
- Gets user's XP activity history
- Limited to recent entries

**`getLevelProgress(userId: string): Promise<LevelProgress>`**
- Gets current level and progress
- Calculates XP needed for next level

**`calculateLevel(xp: number): Promise<number>`**
- Calculates level from XP amount
- Uses exponential progression

**`getXPForLevel(level: number): Promise<number>`**
- Gets XP required for specific level
- Used for progress calculations

## Error Handling

All services use consistent error handling:

```typescript
try {
  const result = await service.method()
  // Handle success
} catch (error) {
  if (error instanceof ServiceError) {
    // Handle service-specific error
    console.error(error.message, error.code)
  } else {
    // Handle unexpected error
    console.error('Unexpected error:', error)
  }
}
```

## Common Error Codes

- `AUTH_REQUIRED` - User must be authenticated
- `INVALID_INPUT` - Input validation failed
- `NOT_FOUND` - Resource not found
- `PERMISSION_DENIED` - User lacks permission
- `RATE_LIMITED` - Too many requests
- `SERVICE_UNAVAILABLE` - External service error

## Real-time Subscriptions

Services support real-time updates through Supabase subscriptions:

```typescript
// Subscribe to plot changes
const subscription = plotService.subscribeTo('plots', {
  userId: currentUser.id
}, (payload) => {
  // Handle real-time updates
  console.log('Plot updated:', payload)
})

// Unsubscribe when component unmounts
subscription.unsubscribe()
```

## Environment Configuration

Services automatically switch between mock and real implementations based on environment:

```typescript
// In environment.ts
export const config = {
  USE_MOCK_SERVICES: process.env.NODE_ENV === 'development',
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
}
```

This allows for rapid development with mock data while maintaining production readiness.