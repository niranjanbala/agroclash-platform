import { User, Plot, Crop, Notification, XPLog } from '../types'

export interface OfflineAction {
  id: string
  type: 'CREATE' | 'UPDATE' | 'DELETE'
  entity: 'plot' | 'crop' | 'notification' | 'xp_log' | 'user'
  entityId: string
  data: any
  timestamp: number
  synced: boolean
  retryCount: number
}

export interface OfflineData {
  plots: Plot[]
  crops: Crop[]
  notifications: Notification[]
  xpLogs: XPLog[]
  user: User | null
  lastSync: number
}

export interface OfflineService {
  // Data storage
  storeData(key: keyof OfflineData, data: any): Promise<void>
  getData<T>(key: keyof OfflineData): Promise<T | null>
  clearData(key?: keyof OfflineData): Promise<void>
  
  // Action queue management
  queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retryCount'>): Promise<void>
  getQueuedActions(): Promise<OfflineAction[]>
  markActionSynced(actionId: string): Promise<void>
  removeAction(actionId: string): Promise<void>
  clearQueue(): Promise<void>
  
  // Sync operations
  syncData(): Promise<{ success: boolean; syncedActions: number; errors: string[] }>
  isOnline(): boolean
  getLastSyncTime(): Promise<number>
  
  // Conflict resolution
  resolveConflicts(localData: any, serverData: any): any
  
  // Cache management
  getCacheSize(): Promise<number>
  clearCache(): Promise<void>
  
  // Network status
  onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void
}

export abstract class BaseOfflineService implements OfflineService {
  protected isOnlineStatus: boolean = true
  protected networkCallbacks: Set<(isOnline: boolean) => void> = new Set()
  protected syncInProgress: boolean = false

  constructor() {
    this.initializeNetworkMonitoring()
  }

  abstract storeData(key: keyof OfflineData, data: any): Promise<void>
  abstract getData<T>(key: keyof OfflineData): Promise<T | null>
  abstract clearData(key?: keyof OfflineData): Promise<void>
  abstract queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retryCount'>): Promise<void>
  abstract getQueuedActions(): Promise<OfflineAction[]>
  abstract markActionSynced(actionId: string): Promise<void>
  abstract removeAction(actionId: string): Promise<void>
  abstract clearQueue(): Promise<void>
  abstract syncData(): Promise<{ success: boolean; syncedActions: number; errors: string[] }>
  abstract resolveConflicts(localData: any, serverData: any): any
  abstract getCacheSize(): Promise<number>
  abstract clearCache(): Promise<void>

  isOnline(): boolean {
    return this.isOnlineStatus
  }

  async getLastSyncTime(): Promise<number> {
    const data = await this.getData<OfflineData>('lastSync' as any)
    return data || 0
  }

  onNetworkStatusChange(callback: (isOnline: boolean) => void): () => void {
    this.networkCallbacks.add(callback)
    return () => {
      this.networkCallbacks.delete(callback)
    }
  }

  protected initializeNetworkMonitoring(): void {
    if (typeof window !== 'undefined') {
      // Browser environment
      this.isOnlineStatus = navigator.onLine
      
      window.addEventListener('online', () => {
        this.isOnlineStatus = true
        this.notifyNetworkChange(true)
        this.autoSync()
      })
      
      window.addEventListener('offline', () => {
        this.isOnlineStatus = false
        this.notifyNetworkChange(false)
      })
    } else if (typeof global !== 'undefined') {
      // React Native environment - would need NetInfo
      // For now, assume online
      this.isOnlineStatus = true
    }
  }

  protected notifyNetworkChange(isOnline: boolean): void {
    this.networkCallbacks.forEach(callback => {
      try {
        callback(isOnline)
      } catch (error) {
        console.error('Error in network status callback:', error)
      }
    })
  }

  protected async autoSync(): Promise<void> {
    if (this.isOnline() && !this.syncInProgress) {
      try {
        await this.syncData()
      } catch (error) {
        console.error('Auto-sync failed:', error)
      }
    }
  }

  // Helper method to generate unique IDs
  protected generateId(): string {
    return `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Helper method to check if data is stale
  protected isDataStale(timestamp: number, maxAge: number = 5 * 60 * 1000): boolean {
    return Date.now() - timestamp > maxAge
  }

  // Helper method to merge arrays with conflict resolution
  protected mergeArrays<T extends { id: string; updated_at?: string }>(
    localArray: T[], 
    serverArray: T[], 
    conflictResolver?: (local: T, server: T) => T
  ): T[] {
    const merged = new Map<string, T>()
    
    // Add server data first
    serverArray.forEach(item => {
      merged.set(item.id, item)
    })
    
    // Add or merge local data
    localArray.forEach(localItem => {
      const serverId = localItem.id
      const serverItem = merged.get(serverId)
      
      if (serverItem) {
        // Conflict resolution
        if (conflictResolver) {
          merged.set(serverId, conflictResolver(localItem, serverItem))
        } else {
          // Default: use newer timestamp
          const localTime = new Date(localItem.updated_at || 0).getTime()
          const serverTime = new Date(serverItem.updated_at || 0).getTime()
          merged.set(serverId, localTime > serverTime ? localItem : serverItem)
        }
      } else {
        merged.set(serverId, localItem)
      }
    })
    
    return Array.from(merged.values())
  }

  // Helper method to create optimistic updates
  protected async createOptimisticUpdate<T>(
    entity: OfflineAction['entity'],
    operation: OfflineAction['type'],
    data: T,
    entityId?: string
  ): Promise<void> {
    const action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retryCount'> = {
      type: operation,
      entity,
      entityId: entityId || (data as any).id || this.generateId(),
      data
    }
    
    await this.queueAction(action)
  }

  // Helper method to handle sync errors with exponential backoff
  protected calculateRetryDelay(retryCount: number): number {
    const baseDelay = 1000 // 1 second
    const maxDelay = 30000 // 30 seconds
    const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay)
    return delay + Math.random() * 1000 // Add jitter
  }

  // Helper method to validate data integrity
  protected validateData(data: any, schema: any): boolean {
    // Basic validation - in a real app, you'd use a proper schema validator
    if (!data || typeof data !== 'object') return false
    
    // Check required fields based on schema
    for (const field of schema.required || []) {
      if (!(field in data)) return false
    }
    
    return true
  }

  // Helper method to compress data for storage
  protected compressData(data: any): string {
    // Simple JSON stringification - in a real app, you might use compression
    return JSON.stringify(data)
  }

  // Helper method to decompress data from storage
  protected decompressData(compressedData: string): any {
    try {
      return JSON.parse(compressedData)
    } catch (error) {
      console.error('Error decompressing data:', error)
      return null
    }
  }
}