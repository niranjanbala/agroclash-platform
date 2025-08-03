import { createClient } from '@supabase/supabase-js';

interface LoadTestConfig {
  supabaseUrl: string;
  supabaseKey: string;
  concurrentUsers: number;
  testDuration: number; // in seconds
  operationsPerUser: number;
}

interface TestResult {
  operation: string;
  success: boolean;
  duration: number;
  error?: string;
}

class SupabaseLoadTester {
  private client;
  private results: TestResult[] = [];

  constructor(private config: LoadTestConfig) {
    this.client = createClient(config.supabaseUrl, config.supabaseKey);
  }

  async runLoadTest(): Promise<void> {
    console.log(`Starting load test with ${this.config.concurrentUsers} concurrent users`);
    
    const userPromises = Array.from({ length: this.config.concurrentUsers }, (_, i) =>
      this.simulateUser(i)
    );

    await Promise.all(userPromises);
    this.generateReport();
  }

  private async simulateUser(userId: number): Promise<void> {
    const testUser = {
      id: `test-user-${userId}`,
      email: `test${userId}@example.com`,
      name: `Test User ${userId}`
    };

    for (let i = 0; i < this.config.operationsPerUser; i++) {
      // Test authentication
      await this.testOperation('auth_signup', () => 
        this.client.auth.signUp({
          email: `${testUser.email}-${i}`,
          password: 'testpassword123'
        })
      );

      // Test plot creation
      await this.testOperation('plot_create', () =>
        this.client.from('plots').insert({
          user_id: testUser.id,
          name: `Plot ${userId}-${i}`,
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]
          }
        })
      );

      // Test plot retrieval
      await this.testOperation('plot_select', () =>
        this.client.from('plots').select('*').eq('user_id', testUser.id)
      );

      // Test crop creation
      await this.testOperation('crop_create', () =>
        this.client.from('crops').insert({
          plot_id: `plot-${userId}-${i}`,
          name: 'Tomato',
          sown_date: new Date().toISOString().split('T')[0],
          status: 'planted'
        })
      );

      // Test XP logging
      await this.testOperation('xp_log', () =>
        this.client.from('xp_logs').insert({
          user_id: testUser.id,
          action_type: 'crop_planted',
          xp_awarded: 10,
          description: 'Planted tomato crop'
        })
      );

      // Test real-time subscription
      await this.testOperation('realtime_subscribe', () =>
        new Promise((resolve) => {
          const subscription = this.client
            .channel(`user-${testUser.id}`)
            .on('postgres_changes', 
              { event: '*', schema: 'public', table: 'crops' },
              () => resolve(true)
            )
            .subscribe();
          
          // Unsubscribe after short delay
          setTimeout(() => {
            subscription.unsubscribe();
            resolve(true);
          }, 100);
        })
      );

      // Add delay between operations
      await this.delay(Math.random() * 100);
    }
  }

  private async testOperation(operation: string, fn: () => Promise<any>): Promise<void> {
    const startTime = Date.now();
    
    try {
      await fn();
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation,
        success: true,
        duration
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.push({
        operation,
        success: false,
        duration,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateReport(): void {
    const operationStats = this.results.reduce((acc, result) => {
      if (!acc[result.operation]) {
        acc[result.operation] = {
          total: 0,
          success: 0,
          failed: 0,
          totalDuration: 0,
          minDuration: Infinity,
          maxDuration: 0
        };
      }

      const stats = acc[result.operation];
      stats.total++;
      
      if (result.success) {
        stats.success++;
      } else {
        stats.failed++;
      }

      stats.totalDuration += result.duration;
      stats.minDuration = Math.min(stats.minDuration, result.duration);
      stats.maxDuration = Math.max(stats.maxDuration, result.duration);

      return acc;
    }, {} as Record<string, any>);

    console.log('\n=== SUPABASE LOAD TEST REPORT ===');
    console.log(`Total Operations: ${this.results.length}`);
    console.log(`Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`Operations per User: ${this.config.operationsPerUser}`);
    
    console.log('\n=== OPERATION STATISTICS ===');
    Object.entries(operationStats).forEach(([operation, stats]) => {
      const avgDuration = stats.totalDuration / stats.total;
      const successRate = (stats.success / stats.total) * 100;
      
      console.log(`\n${operation.toUpperCase()}:`);
      console.log(`  Total: ${stats.total}`);
      console.log(`  Success: ${stats.success} (${successRate.toFixed(2)}%)`);
      console.log(`  Failed: ${stats.failed}`);
      console.log(`  Avg Duration: ${avgDuration.toFixed(2)}ms`);
      console.log(`  Min Duration: ${stats.minDuration}ms`);
      console.log(`  Max Duration: ${stats.maxDuration}ms`);
    });

    // Overall statistics
    const totalSuccess = this.results.filter(r => r.success).length;
    const overallSuccessRate = (totalSuccess / this.results.length) * 100;
    const avgDuration = this.results.reduce((sum, r) => sum + r.duration, 0) / this.results.length;

    console.log('\n=== OVERALL STATISTICS ===');
    console.log(`Success Rate: ${overallSuccessRate.toFixed(2)}%`);
    console.log(`Average Response Time: ${avgDuration.toFixed(2)}ms`);
    
    // Performance thresholds
    const slowOperations = this.results.filter(r => r.duration > 1000);
    if (slowOperations.length > 0) {
      console.log(`\n⚠️  Slow Operations (>1s): ${slowOperations.length}`);
    }

    const failedOperations = this.results.filter(r => !r.success);
    if (failedOperations.length > 0) {
      console.log(`\n❌ Failed Operations: ${failedOperations.length}`);
      failedOperations.slice(0, 5).forEach(op => {
        console.log(`  - ${op.operation}: ${op.error}`);
      });
    }
  }
}

// Export for use in test scripts
export { SupabaseLoadTester, LoadTestConfig, TestResult };

// CLI runner
if (require.main === module) {
  const config: LoadTestConfig = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
    concurrentUsers: parseInt(process.env.CONCURRENT_USERS || '10'),
    testDuration: parseInt(process.env.TEST_DURATION || '60'),
    operationsPerUser: parseInt(process.env.OPERATIONS_PER_USER || '20')
  };

  const tester = new SupabaseLoadTester(config);
  tester.runLoadTest().catch(console.error);
}