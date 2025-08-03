// Service interface definitions for AgroClash platform

import { 
  User, 
  Plot, 
  Crop, 
  WeatherData, 
  WeatherAlert, 
  MarketPrice, 
  XPLog, 
  PestBattle, 
  Badge, 
  UserBadge, 
  Location 
} from '../types'

export interface AuthService {
  signUp(email: string, password: string, userData: Partial<User>): Promise<User>
  signIn(email: string, password: string): Promise<User>
  signOut(): Promise<void>
  getCurrentUser(): Promise<User | null>
  updateProfile(userId: string, updates: Partial<User>): Promise<User>
  sendOTP(phoneNumber: string): Promise<void>
  verifyOTP(phoneNumber: string, otp: string): Promise<User>
}

export interface PlotService {
  createPlot(plotData: Omit<Plot, 'id' | 'created_at' | 'updated_at'>): Promise<Plot>
  updatePlot(plotId: string, updates: Partial<Plot>): Promise<Plot>
  deletePlot(plotId: string): Promise<void>
  getPlots(userId: string): Promise<Plot[]>
  getPlot(plotId: string): Promise<Plot>
  calculateArea(geometry: GeoJSON.Polygon): Promise<number>
}

export interface CropService {
  assignCrop(cropData: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<Crop>
  updateCropStatus(cropId: string, status: Crop['status'], growthStage?: Crop['growth_stage']): Promise<Crop>
  getCrops(plotId: string): Promise<Crop[]>
  getCrop(cropId: string): Promise<Crop>
  getCropTimeline(cropId: string): Promise<any[]>
  harvestCrop(cropId: string): Promise<{ crop: Crop; xpAwarded: number }>
}

export interface WeatherService {
  getForecast(location: Location): Promise<WeatherData>
  getAlerts(location: Location): Promise<WeatherAlert[]>
  getHistoricalData(location: Location, days: number): Promise<WeatherData[]>
  subscribeToAlerts(location: Location, callback: (alert: WeatherAlert) => void): Promise<() => void>
}

export interface MarketService {
  getPrices(cropName?: string, location?: Location): Promise<MarketPrice[]>
  listCrop(cropId: string, quantity: number, pricePerKg: number): Promise<void>
  getMarketTrends(cropName: string, days: number): Promise<MarketPrice[]>
  getRecommendations(userId: string): Promise<{ cropName: string; reason: string; expectedPrice: number }[]>
}

export interface XPService {
  awardXP(userId: string, actionType: string, xpAmount: number, description?: string): Promise<XPLog>
  calculateLevel(xp: number): number
  getXPLogs(userId: string, limit?: number): Promise<XPLog[]>
  getLevelProgress(userId: string): Promise<{ currentLevel: number; currentXP: number; xpToNextLevel: number }>
  checkLevelUp(userId: string, previousXP: number, newXP: number): Promise<boolean>
}

export interface BadgeService {
  getAllBadges(): Promise<Badge[]>
  getUserBadges(userId: string): Promise<UserBadge[]>
  checkBadgeEligibility(userId: string): Promise<Badge[]>
  awardBadge(userId: string, badgeId: string): Promise<UserBadge>
}

export interface ClanService {
  createClan(name: string, description: string, leaderId: string): Promise<any>
  joinClan(userId: string, clanId: string): Promise<void>
  leaveClan(userId: string): Promise<void>
  getClanMembers(clanId: string): Promise<User[]>
  getClanLeaderboard(clanId: string): Promise<User[]>
  searchClans(query: string, location?: Location): Promise<any[]>
}

export interface NotificationService {
  sendPushNotification(userId: string, title: string, body: string, data?: any): Promise<void>
  scheduleNotification(userId: string, title: string, body: string, scheduledTime: Date, data?: any): Promise<string>
  cancelNotification(notificationId: string): Promise<void>
  subscribeToTopic(userId: string, topic: string): Promise<void>
  unsubscribeFromTopic(userId: string, topic: string): Promise<void>
}

export interface PestService {
  createPestBattle(plotId: string, pestType: string, severity: PestBattle['severity']): Promise<PestBattle>
  resolvePestBattle(battleId: string, success: boolean): Promise<{ battle: PestBattle; xpAwarded: number }>
  getActiveBattles(userId: string): Promise<PestBattle[]>
  getPestHistory(plotId: string): Promise<PestBattle[]>
}