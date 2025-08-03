import { ApiConfigManager } from '../../config/api.config'

export interface ApiMetrics {
  service: string
  endpoint: string
  method: string
  status: number
  responseTime: number
  timestamp: number
  error?: string
  retryCount?: number
}

export interface ServiceHealth {
  service: string
  status: 'healthy' | 'degraded' | 'unhealthy'
  lastCheck: number
  responseTime: number
  uptime: number
  errorRate: number
  details?: string
}

export interface ApiUsage {
  service: string
  period: 'hour' | 'day' | 'month'
  calls: number
  limit: number
  remaining: number
  resetTime: number
}

export class ApiMonitor {
  private static instance: ApiMonitor
  private metrics: ApiMetrics[] = []
  private healthChecks: Map<string, ServiceHealth> = new Map()
  private usageTracking: Map<string, ApiUsage> = new Map()
  private alertCallbacks: Array<(alert: ApiAlert) => void> = []
  private config = ApiConfigManager.getInstance()

  private constructor() {
    this.startHealthChecks()
    this.startMetricsCleanup()
  }

  static getInstance(): ApiMonitor {
    if (!ApiMonitor.instance) {
      ApiMonitor.instance = new ApiMonitor()
    }
    return ApiMonitor.instance
  }

  // Record API call metrics
  recordMetric(metric: Omit<ApiMetrics, 'timestamp'>): void {
    if (!this.config.shouldTrackUsage()) return

    const fullMetric: ApiMetrics = {
      ...metric,
      timestamp: Date.now()
    }

    this.metrics.push(fullMetric)

    // Update usage tracking
    this.updateUsageTracking(metric.service)

    // Check for alerts
    this.checkForAlerts(fullMetric)

    // Log errors if enabled
    if (this.config.shouldLogErrors() && metric.error) {
      console.error(`API Error [${metric.service}]:`, {
        endpoint: metric.endpoint,
        method: metric.method,
        status: metric.status,
        error: metric.error,
        responseTime: metric.responseTime
      })
    }
  }

  // Get metrics for a service
  getMetrics(service?: string, timeRange?: number): ApiMetrics[] {
    let filteredMetrics = this.metrics

    if (service) {
      filteredMetrics = filteredMetrics.filter(m => m.service === service)
    }

    if (timeRange) {
      const cutoff = Date.now() - timeRange
      filteredMetrics = filteredMetrics.filter(m => m.timestamp > cutoff)
    }

    return filteredMetrics
  }

  // Get service health status
  getServiceHealth(service?: string): ServiceHealth[] {
    if (service) {
      const health = this.healthChecks.get(service)
      return health ? [health] : []
    }

    return Array.from(this.healthChecks.values())
  }

  // Get API usage statistics
  getUsageStats(service?: string): ApiUsage[] {
    if (service) {
      const usage = this.usageTracking.get(service)
      return usage ? [usage] : []
    }

    return Array.from(this.usageTracking.values())
  }

  // Calculate error rate for a service
  getErrorRate(service: string, timeRange: number = 60 * 60 * 1000): number {
    const metrics = this.getMetrics(service, timeRange)
    if (metrics.length === 0) return 0

    const errorCount = metrics.filter(m => m.status >= 400 || m.error).length
    return (errorCount / metrics.length) * 100
  }

  // Calculate average response time
  getAverageResponseTime(service: string, timeRange: number = 60 * 60 * 1000): number {
    const metrics = this.getMetrics(service, timeRange)
    if (metrics.length === 0) return 0

    const totalTime = metrics.reduce((sum, m) => sum + m.responseTime, 0)
    return totalTime / metrics.length
  }

  // Subscribe to alerts
  onAlert(callback: (alert: ApiAlert) => void): () => void {
    this.alertCallbacks.push(callback)
    
    return () => {
      const index = this.alertCallbacks.indexOf(callback)
      if (index > -1) {
        this.alertCallbacks.splice(index, 1)
      }
    }
  }

  // Manual health check
  async checkServiceHealth(service: string): Promise<ServiceHealth> {
    const startTime = Date.now()
    let status: ServiceHealth['status'] = 'healthy'
    let details = ''

    try {
      // Perform health check based on service type
      const isHealthy = await this.performHealthCheck(service)
      
      if (!isHealthy) {
        status = 'unhealthy'
        details = 'Health check failed'
      }

    } catch (error: any) {
      status = 'unhealthy'
      details = error.message || 'Health check error'
    }

    const responseTime = Date.now() - startTime
    const errorRate = this.getErrorRate(service)

    // Determine status based on error rate
    if (status === 'healthy' && errorRate > 10) {
      status = 'degraded'
      details = `High error rate: ${errorRate.toFixed(1)}%`
    }

    const health: ServiceHealth = {
      service,
      status,
      lastCheck: Date.now(),
      responseTime,
      uptime: this.calculateUptime(service),
      errorRate,
      details
    }

    this.healthChecks.set(service, health)
    return health
  }

  // Get system overview
  getSystemOverview(): {
    totalCalls: number
    errorRate: number
    averageResponseTime: number
    healthyServices: number
    totalServices: number
    alerts: number
  } {
    const allMetrics = this.getMetrics(undefined, 60 * 60 * 1000) // Last hour
    const totalCalls = allMetrics.length
    const errorCount = allMetrics.filter(m => m.status >= 400 || m.error).length
    const errorRate = totalCalls > 0 ? (errorCount / totalCalls) * 100 : 0
    
    const totalResponseTime = allMetrics.reduce((sum, m) => sum + m.responseTime, 0)
    const averageResponseTime = totalCalls > 0 ? totalResponseTime / totalCalls : 0

    const healthyServices = Array.from(this.healthChecks.values())
      .filter(h => h.status === 'healthy').length
    const totalServices = this.healthChecks.size

    return {
      totalCalls,
      errorRate,
      averageResponseTime,
      healthyServices,
      totalServices,
      alerts: this.getActiveAlerts().length
    }
  }

  private async performHealthCheck(service: string): Promise<boolean> {
    // Import services dynamically to avoid circular dependencies
    try {
      switch (service) {
        case 'weather':
          const { ServiceFactory } = await import('../factory')
          const weatherService = ServiceFactory.getWeatherService()
          if ('healthCheck' in weatherService && typeof weatherService.healthCheck === 'function') {
            return await weatherService.healthCheck()
          }
          return true

        case 'market':
          const marketService = ServiceFactory.getMarketService()
          if ('healthCheck' in marketService && typeof marketService.healthCheck === 'function') {
            return await marketService.healthCheck()
          }
          return true

        case 'auth':
          const authService = ServiceFactory.getAuthService()
          if ('healthCheck' in authService && typeof authService.healthCheck === 'function') {
            return await authService.healthCheck()
          }
          return true

        default:
          return true
      }
    } catch (error) {
      console.error(`Health check failed for ${service}:`, error)
      return false
    }
  }

  private updateUsageTracking(service: string): void {
    const now = Date.now()
    const hourStart = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000)
    
    const existing = this.usageTracking.get(service)
    if (existing && existing.resetTime === hourStart) {
      existing.calls++
      existing.remaining = Math.max(0, existing.limit - existing.calls)
    } else {
      // Get service config for limits
      const serviceConfig = this.config.getServiceConfig(service as any)
      const limit = serviceConfig?.config?.rateLimit || 1000

      this.usageTracking.set(service, {
        service,
        period: 'hour',
        calls: 1,
        limit,
        remaining: limit - 1,
        resetTime: hourStart + (60 * 60 * 1000)
      })
    }
  }

  private checkForAlerts(metric: ApiMetrics): void {
    if (!this.config.shouldAlertOnFailure()) return

    const alerts: ApiAlert[] = []

    // High error rate alert
    const errorRate = this.getErrorRate(metric.service, 10 * 60 * 1000) // Last 10 minutes
    if (errorRate > 20) {
      alerts.push({
        type: 'high_error_rate',
        service: metric.service,
        severity: 'high',
        message: `High error rate detected: ${errorRate.toFixed(1)}%`,
        timestamp: Date.now(),
        details: { errorRate, timeRange: '10m' }
      })
    }

    // Slow response time alert
    if (metric.responseTime > 10000) { // 10 seconds
      alerts.push({
        type: 'slow_response',
        service: metric.service,
        severity: 'medium',
        message: `Slow response time: ${metric.responseTime}ms`,
        timestamp: Date.now(),
        details: { responseTime: metric.responseTime, endpoint: metric.endpoint }
      })
    }

    // Rate limit alert
    const usage = this.usageTracking.get(metric.service)
    if (usage && usage.remaining < usage.limit * 0.1) { // Less than 10% remaining
      alerts.push({
        type: 'rate_limit_warning',
        service: metric.service,
        severity: 'medium',
        message: `Rate limit warning: ${usage.remaining} calls remaining`,
        timestamp: Date.now(),
        details: { remaining: usage.remaining, limit: usage.limit }
      })
    }

    // Send alerts
    alerts.forEach(alert => {
      this.alertCallbacks.forEach(callback => callback(alert))
    })
  }

  private calculateUptime(service: string): number {
    const metrics = this.getMetrics(service, 24 * 60 * 60 * 1000) // Last 24 hours
    if (metrics.length === 0) return 100

    const successCount = metrics.filter(m => m.status < 400 && !m.error).length
    return (successCount / metrics.length) * 100
  }

  private getActiveAlerts(): ApiAlert[] {
    // This would typically be stored in a more persistent way
    // For now, we'll calculate current alerts based on recent metrics
    const alerts: ApiAlert[] = []
    const services = ['weather', 'market', 'auth']

    services.forEach(service => {
      const errorRate = this.getErrorRate(service, 10 * 60 * 1000)
      if (errorRate > 20) {
        alerts.push({
          type: 'high_error_rate',
          service,
          severity: 'high',
          message: `High error rate: ${errorRate.toFixed(1)}%`,
          timestamp: Date.now(),
          details: { errorRate }
        })
      }
    })

    return alerts
  }

  private startHealthChecks(): void {
    if (!this.config.isMonitoringEnabled()) return

    const services = ['weather', 'market', 'auth']
    
    // Initial health checks
    services.forEach(service => {
      this.checkServiceHealth(service)
    })

    // Periodic health checks every 5 minutes
    setInterval(() => {
      services.forEach(service => {
        this.checkServiceHealth(service)
      })
    }, 5 * 60 * 1000)
  }

  private startMetricsCleanup(): void {
    // Clean up old metrics every hour
    setInterval(() => {
      const cutoff = Date.now() - (24 * 60 * 60 * 1000) // Keep 24 hours
      this.metrics = this.metrics.filter(m => m.timestamp > cutoff)
    }, 60 * 60 * 1000)
  }
}

export interface ApiAlert {
  type: 'high_error_rate' | 'slow_response' | 'service_down' | 'rate_limit_warning'
  service: string
  severity: 'low' | 'medium' | 'high'
  message: string
  timestamp: number
  details?: any
}

// Utility function to create a monitoring wrapper for API calls
export function withMonitoring<T extends (...args: any[]) => Promise<any>>(
  service: string,
  endpoint: string,
  method: string,
  fn: T
): T {
  const monitor = ApiMonitor.getInstance()

  return (async (...args: any[]) => {
    const startTime = Date.now()
    let status = 200
    let error: string | undefined

    try {
      const result = await fn(...args)
      return result
    } catch (err: any) {
      status = err.status || 500
      error = err.message || 'Unknown error'
      throw err
    } finally {
      const responseTime = Date.now() - startTime
      
      monitor.recordMetric({
        service,
        endpoint,
        method,
        status,
        responseTime,
        error
      })
    }
  }) as T
}