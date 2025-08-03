import { BaseOfflineService, OfflineAction, OfflineData } from '../offline.service'
import { ServiceFactory } from '../factory'

export class MockOfflineService extends BaseOfflineService {
  private storage: Map<string, any> = new Map()
  private actionQueue: OfflineAction[] = []
  private readonly STORAGE_PREFIX = 'agroclash_offline_'

  constructor() {
    super()
    this.loadFromLocalStorage()
  }

  async storeData(key: keyof OfflineData, data: any): Promise<void> {
    const storageKey = `${this.STORAGE_PREFIX}${key}`
    const compressedData = this.compressData(data)
    
    this.storage.set(storageKey, compressedData)
    
    // Also store in localStorage if available
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        localStorage.setItem(storageKey, compressedData)
      } catch (error) {
        console.warn('Failed to store data in localStorage:', error)
      }
    }
    
    console.log(`📱 Offline data stored: ${key}`)
  }

  async getData<T>(key: keyof OfflineData): Promise<T | null> {
    const storageKey = `${this.STORAGE_PREFIX}${key}`
    const compressedData = this.storage.get(storageKey)
    
    if (compressedData) {
      return this.decompressData(compressedData) as T
    }
    
    return null
  }

  async clearData(key?: keyof OfflineData): Promise<void> {
    if (key) {
      const storageKey = `${this.STORAGE_PREFIX}${key}`
      this.storage.delete(storageKey)
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(storageKey)
      }
      
      console.log(`🧹 Offline data cleared: ${key}`)
    } else {
      // Clear all data
      const keysToDelete = Array.from(this.storage.keys()).filter(k => 
        k.startsWith(this.STORAGE_PREFIX)
      )
      
      keysToDelete.forEach(k => {
        this.storage.delete(k)
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem(k)
        }
      })
      
      console.log('🧹 All offline data cleared')
    }
  }

  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'synced' | 'retryCount'>): Promise<void> {
    const queuedAction: OfflineAction = {
      id: this.generateId(),
      timestamp: Date.now(),
      synced: false,
      retryCount: 0,
      ...action
    }
    
    this.actionQueue.push(queuedAction)
    await this.storeData('actionQueue' as any, this.actionQueue)
    
    console.log(`📝 Action queued: ${action.type} ${action.entity} ${action.entityId}`)
    
    // Try to sync immediately if online
    if (this.isOnline()) {
      setTimeout(() => this.syncData(), 100)
    }
  }

  async getQueuedActions(): Promise<OfflineAction[]> {
    return [...this.actionQueue]
  }

  async markActionSynced(actionId: string): Promise<void> {
    const actionIndex = this.actionQueue.findIndex(a => a.id === actionId)
    if (actionIndex > -1) {
      this.actionQueue[actionIndex].synced = true
      await this.storeData('actionQueue' as any, this.actionQueue)
      console.log(`✅ Action marked as synced: ${actionId}`)
    }
  }

  async removeAction(actionId: string): Promise<void> {
    const actionIndex = this.actionQueue.findIndex(a => a.id === actionId)
    if (actionIndex > -1) {
      this.actionQueue.splice(actionIndex, 1)
      await this.storeData('actionQueue' as any, this.actionQueue)
      console.log(`🗑️ Action removed from queue: ${actionId}`)
    }
  }

  async clearQueue(): Promise<void> {
    this.actionQueue = []
    await this.storeData('actionQueue' as any, this.actionQueue)
    console.log('🧹 Action queue cleared')
  }

  async syncData(): Promise<{ success: boolean; syncedActions: number; errors: string[] }> {
    if (this.syncInProgress) {
      return { success: false, syncedActions: 0, errors: ['Sync already in progress'] }
    }

    if (!this.isOnline()) {
      return { success: false, syncedActions: 0, errors: ['Device is offline'] }
    }

    this.syncInProgress = true
    const errors: string[] = []
    let syncedActions = 0

    try {
      console.log('🔄 Starting data synchronization...')
      
      // Get all unsynced actions
      const unsyncedActions = this.actionQueue.filter(a => !a.synced)
      
      // Process actions in order
      for (const action of unsyncedActions) {
        try {
          await this.processAction(action)
          await this.markActionSynced(action.id)
          syncedActions++
        } catch (error) {
          console.error(`Error processing action ${action.id}:`, error)
          errors.push(`Failed to sync ${action.type} ${action.entity}: ${error}`)
          
          // Increment retry count
          action.retryCount++
          
          // Remove action if it has failed too many times
          if (action.retryCount >= 3) {
            await this.removeAction(action.id)
            errors.push(`Action ${action.id} removed after 3 failed attempts`)
          }
        }
      }

      // Update last sync time
      await this.storeData('lastSync' as any, Date.now())
      
      // Clean up synced actions
      this.actionQueue = this.actionQueue.filter(a => !a.synced)
      await this.storeData('actionQueue' as any, this.actionQueue)

      console.log(`✅ Sync completed: ${syncedActions} actions synced, ${errors.length} errors`)
      
      return {
        success: errors.length === 0,
        syncedActions,
        errors
      }
    } catch (error) {
      console.error('Sync failed:', error)
      errors.push(`Sync failed: ${error}`)
      
      return {
        success: false,
        syncedActions,
        errors
      }
    } finally {
      this.syncInProgress = false
    }
  }

  resolveConflicts(localData: any, serverData: any): any {
    // Simple conflict resolution: server wins for most cases
    // In a real app, you'd have more sophisticated conflict resolution
    
    if (!localData) return serverData
    if (!serverData) return localData
    
    // If both have timestamps, use the newer one
    if (localData.updated_at && serverData.updated_at) {
      const localTime = new Date(localData.updated_at).getTime()
      const serverTime = new Date(serverData.updated_at).getTime()
      
      if (localTime > serverTime) {
        console.log('🔄 Conflict resolved: local data is newer')
        return localData
      } else {
        console.log('🔄 Conflict resolved: server data is newer')
        return serverData
      }
    }
    
    // Default: merge objects, server data takes precedence
    return {
      ...localData,
      ...serverData,
      // Keep local ID if it exists
      id: localData.id || serverData.id
    }
  }

  async getCacheSize(): Promise<number> {
    let totalSize = 0
    
    for (const [key, value] of this.storage.entries()) {
      if (key.startsWith(this.STORAGE_PREFIX)) {
        totalSize += new Blob([value]).size
      }
    }
    
    return totalSize
  }

  async clearCache(): Promise<void> {
    await this.clearData()
    await this.clearQueue()
    console.log('🧹 Cache cleared')
  }

  private async processAction(action: OfflineAction): Promise<void> {
    // Simulate API calls to sync data
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
    
    // Simulate occasional failures
    if (Math.random() < 0.1) {
      throw new Error('Simulated network error')
    }
    
    console.log(`🔄 Processing action: ${action.type} ${action.entity} ${action.entityId}`)
    
    // In a real implementation, you would call the appropriate service methods
    // For now, we'll just simulate the sync
    switch (action.entity) {
      case 'plot':
        await this.syncPlotAction(action)
        break
      case 'crop':
        await this.syncCropAction(action)
        break
      case 'notification':
        await this.syncNotificationAction(action)
        break
      case 'xp_log':
        await this.syncXPAction(action)
        break
      case 'user':
        await this.syncUserAction(action)
        break
      default:
        throw new Error(`Unknown entity type: ${action.entity}`)
    }
  }

  private async syncPlotAction(action: OfflineAction): Promise<void> {
    // Simulate syncing plot data
    console.log(`📍 Syncing plot ${action.type}: ${action.entityId}`)
  }

  private async syncCropAction(action: OfflineAction): Promise<void> {
    // Simulate syncing crop data
    console.log(`🌱 Syncing crop ${action.type}: ${action.entityId}`)
  }

  private async syncNotificationAction(action: OfflineAction): Promise<void> {
    // Simulate syncing notification data
    console.log(`🔔 Syncing notification ${action.type}: ${action.entityId}`)
  }

  private async syncXPAction(action: OfflineAction): Promise<void> {
    // Simulate syncing XP data
    console.log(`⭐ Syncing XP ${action.type}: ${action.entityId}`)
  }

  private async syncUserAction(action: OfflineAction): Promise<void> {
    // Simulate syncing user data
    console.log(`👤 Syncing user ${action.type}: ${action.entityId}`)
  }

  private loadFromLocalStorage(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        // Load action queue
        const queueData = localStorage.getItem(`${this.STORAGE_PREFIX}actionQueue`)
        if (queueData) {
          this.actionQueue = this.decompressData(queueData) || []
        }
        
        // Load other cached data into memory
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key && key.startsWith(this.STORAGE_PREFIX)) {
            const value = localStorage.getItem(key)
            if (value) {
              this.storage.set(key, value)
            }
          }
        }
        
        console.log('📱 Offline data loaded from localStorage')
      } catch (error) {
        console.error('Error loading offline data:', error)
      }
    }
  }

  // Public methods for testing and debugging
  getStorageContents(): Map<string, any> {
    return new Map(this.storage)
  }

  getActionQueueContents(): OfflineAction[] {
    return [...this.actionQueue]
  }

  simulateNetworkChange(isOnline: boolean): void {
    this.isOnlineStatus = isOnline
    this.notifyNetworkChange(isOnline)
    
    if (isOnline) {
      this.autoSync()
    }
  }

  async forceSync(): Promise<{ success: boolean; syncedActions: number; errors: string[] }> {
    return await this.syncData()
  }
}