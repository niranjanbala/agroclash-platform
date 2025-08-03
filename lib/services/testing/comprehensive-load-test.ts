import { SupabaseLoadTester, LoadTestConfig } from './supabase-load-test';

/**
 * Comprehensive Load Testing Scenarios for AgroClash Platform
 * Tests various user patterns and system stress scenarios
 */

interface LoadTestScenario {
  name: string;
  description: string;
  config: LoadTestConfig;
  expectedMetrics: {
    maxResponseTime: number;
    minSuccessRate: number;
    maxErrorRate: number;
  };
}

class ComprehensiveLoadTester {
  private scenarios: LoadTestScenario[] = [
    {
      name: 'Light Load',
      description: 'Normal usage with few concurrent users',
      config: {
        supabaseUrl: process.env.SUPABASE_URL || 'https://test.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key',
        concurrentUsers: 5,
        testDuration: 60,
        operationsPerUser: 10
      },
      expectedMetrics: {
        maxResponseTime: 500,
        minSuccessRate: 99,
        maxErrorRate: 1
      }
    },
    {
      name: 'Medium Load',
      description: 'Moderate usage during peak hours',
      config: {
        supabaseUrl: process.env.SUPABASE_URL || 'https://test.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key',
        concurrentUsers: 25,
        testDuration: 120,
        operationsPerUser: 20
      },
      expectedMetrics: {
        maxResponseTime: 1000,
        minSuccessRate: 95,
        maxErrorRate: 5
      }
    },
    {
      name: 'Heavy Load',
      description: 'High usage during system stress',
      config: {
        supabaseUrl: process.env.SUPABASE_URL || 'https://test.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key',
        concurrentUsers: 100,
        testDuration: 300,
        operationsPerUser: 50
      },
      expectedMetrics: {
        maxResponseTime: 2000,
        minSuccessRate: 90,
        maxErrorRate: 10
      }
    },
    {
      name: 'Spike Load',
      description: 'Sudden traffic spike simulation',
      config: {
        supabaseUrl: process.env.SUPABASE_URL || 'https://test.supabase.co',
        supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key',
        concurrentUsers: 200,
        testDuration: 60,
        operationsPerUser: 10
      },
      expectedMetrics: {
        maxResponseTime: 3000,
        minSuccessRate: 85,
        maxErrorRate: 15
      }
    }
  ];

  async runAllScenarios(): Promise<void> {
    console.log('🚀 Starting Comprehensive Load Testing Suite');
    console.log(`Testing ${this.scenarios.length} scenarios`);
    
    const results = [];
    
    for (const scenario of this.scenarios) {
      console.log(`\n📊 Running scenario: ${scenario.name}`);
      console.log(`Description: ${scenario.description}`);
      
      const tester = new SupabaseLoadTester(scenario.config);
      const startTime = Date.now();
      
      try {
        await tester.runLoadTest();
        const duration = Date.now() - startTime;
        
        results.push({
          scenario: scenario.name,
          success: true,
          duration,
          config: scenario.config
        });
        
        console.log(`✅ Scenario completed in ${(duration / 1000).toFixed(2)}s`);
      } catch (error) {
        const duration = Date.now() - startTime;
        
        results.push({
          scenario: scenario.name,
          success: false,
          duration,
          error: error instanceof Error ? error.message : 'Unknown error',
          config: scenario.config
        });
        
        console.log(`❌ Scenario failed after ${(duration / 1000).toFixed(2)}s: ${error}`);
      }
      
      // Cool down period between scenarios
      console.log('⏳ Cooling down for 30 seconds...');
      await this.delay(30000);
    }
    
    this.generateComprehensiveReport(results);
  }

  async runFarmingWorkflowTest(): Promise<void> {
    console.log('🌾 Running Farming Workflow Load Test');
    
    const config: LoadTestConfig = {
      supabaseUrl: process.env.SUPABASE_URL || 'https://test.supabase.co',
      supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key',
      concurrentUsers: 50,
      testDuration: 180,
      operationsPerUser: 30
    };
    
    const tester = new FarmingWorkflowTester(config);
    await tester.runWorkflowTest();
  }

  async runRealTimeTest(): Promise<void> {
    console.log('⚡ Running Real-time Features Load Test');
    
    const config: LoadTestConfig = {
      supabaseUrl: process.env.SUPABASE_URL || 'https://test.supabase.co',
      supabaseKey: process.env.SUPABASE_ANON_KEY || 'test-key',
      concurrentUsers: 100,
      testDuration: 120,
      operationsPerUser: 20
    };
    
    const tester = new RealTimeTester(config);
    await tester.runRealTimeTest();
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateComprehensiveReport(results: any[]): void {
    console.log('\n' + '='.repeat(80));
    console.log('📈 COMPREHENSIVE LOAD TEST REPORT');
    console.log('='.repeat(80));
    
    const totalScenarios = results.length;
    const successfulScenarios = results.filter(r => r.success).length;
    const failedScenarios = totalScenarios - successfulScenarios;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
    
    console.log(`Total Scenarios: ${totalScenarios}`);
    console.log(`Successful: ${successfulScenarios}`);
    console.log(`Failed: ${failedScenarios}`);
    console.log(`Total Duration: ${(totalDuration / 1000 / 60).toFixed(2)} minutes`);
    console.log(`Success Rate: ${((successfulScenarios / totalScenarios) * 100).toFixed(2)}%`);
    
    console.log('\n📊 SCENARIO BREAKDOWN:');
    results.forEach(result => {
      const status = result.success ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`${status} ${result.scenario.padEnd(20)}: ${duration}s`);
      
      if (!result.success && result.error) {
        console.log(`   Error: ${result.error}`);
      }
    });
    
    console.log('\n🎯 RECOMMENDATIONS:');
    
    if (failedScenarios > 0) {
      console.log('⚠️  Some scenarios failed. Consider:');
      console.log('   - Increasing Supabase plan limits');
      console.log('   - Implementing connection pooling');
      console.log('   - Adding caching layers');
      console.log('   - Optimizing database queries');
    }
    
    const avgDuration = totalDuration / totalScenarios / 1000;
    if (avgDuration > 120) {
      console.log('⚠️  Long test durations detected. Consider:');
      console.log('   - Reducing test complexity');
      console.log('   - Optimizing test data setup');
      console.log('   - Parallel test execution');
    }
    
    if (successfulScenarios === totalScenarios) {
      console.log('🎉 All scenarios passed! System is performing well under load.');
    }
    
    console.log('='.repeat(80));
  }
}

class FarmingWorkflowTester extends SupabaseLoadTester {
  async runWorkflowTest(): Promise<void> {
    console.log('🌱 Testing complete farming workflow under load');
    
    const workflows = Array.from({ length: this.config.concurrentUsers }, (_, i) =>
      this.simulateFarmingWorkflow(i)
    );
    
    await Promise.all(workflows);
    this.generateReport();
  }

  private async simulateFarmingWorkflow(farmerId: number): Promise<void> {
    const farmer = {
      id: `farmer-${farmerId}`,
      email: `farmer${farmerId}@test.com`,
      name: `Farmer ${farmerId}`
    };

    // 1. User registration/login
    await this.testOperation('farmer_auth', () =>
      this.client.auth.signUp({
        email: farmer.email,
        password: 'testpass123'
      })
    );

    // 2. Create multiple plots
    for (let plotIndex = 0; plotIndex < 3; plotIndex++) {
      await this.testOperation('plot_creation', () =>
        this.client.from('plots').insert({
          user_id: farmer.id,
          name: `${farmer.name} Plot ${plotIndex + 1}`,
          geometry: this.generateRandomPolygon(),
          area_hectares: Math.random() * 5 + 1
        })
      );
    }

    // 3. Plant crops on plots
    for (let cropIndex = 0; cropIndex < 5; cropIndex++) {
      await this.testOperation('crop_planting', () =>
        this.client.from('crops').insert({
          plot_id: `${farmer.id}-plot-${cropIndex % 3}`,
          name: this.getRandomCropType(),
          sown_date: new Date().toISOString().split('T')[0],
          status: 'planted'
        })
      );
    }

    // 4. Update crop statuses (simulate growth)
    const growthStages = ['germinated', 'growing', 'flowering', 'fruiting'];
    for (let update = 0; update < 10; update++) {
      await this.testOperation('crop_update', () =>
        this.client.from('crops')
          .update({ 
            status: growthStages[Math.floor(Math.random() * growthStages.length)],
            updated_at: new Date().toISOString()
          })
          .eq('plot_id', `${farmer.id}-plot-${update % 3}`)
      );

      // Award XP for updates
      await this.testOperation('xp_award', () =>
        this.client.from('xp_logs').insert({
          user_id: farmer.id,
          action_type: 'crop_updated',
          xp_awarded: Math.floor(Math.random() * 20) + 5,
          description: 'Updated crop status'
        })
      );
    }

    // 5. Check weather and market data
    await this.testOperation('weather_check', () =>
      this.client.from('weather_cache').select('*').limit(1)
    );

    await this.testOperation('market_check', () =>
      this.client.from('market_prices').select('*').limit(10)
    );

    // 6. Join/interact with clan
    await this.testOperation('clan_interaction', () =>
      this.client.from('clans').select('*').limit(5)
    );

    // Add random delays to simulate real user behavior
    await this.delay(Math.random() * 1000);
  }

  private generateRandomPolygon() {
    const centerLat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const centerLng = -74.0060 + (Math.random() - 0.5) * 0.1;
    const size = 0.001;
    
    return {
      type: 'Polygon',
      coordinates: [[
        [centerLng - size, centerLat - size],
        [centerLng + size, centerLat - size],
        [centerLng + size, centerLat + size],
        [centerLng - size, centerLat + size],
        [centerLng - size, centerLat - size]
      ]]
    };
  }

  private getRandomCropType(): string {
    const crops = ['tomato', 'corn', 'wheat', 'rice', 'potato', 'carrot', 'lettuce', 'spinach'];
    return crops[Math.floor(Math.random() * crops.length)];
  }
}

class RealTimeTester extends SupabaseLoadTester {
  async runRealTimeTest(): Promise<void> {
    console.log('⚡ Testing real-time features under load');
    
    const realtimeTests = Array.from({ length: this.config.concurrentUsers }, (_, i) =>
      this.simulateRealTimeUser(i)
    );
    
    await Promise.all(realtimeTests);
    this.generateReport();
  }

  private async simulateRealTimeUser(userId: number): Promise<void> {
    const subscriptions = [];
    
    try {
      // Subscribe to multiple channels
      const channels = [
        `user-${userId}`,
        `farm-${userId}`,
        `clan-${userId % 10}`, // 10 clans max
        'global-market',
        'weather-alerts'
      ];

      for (const channelName of channels) {
        await this.testOperation('realtime_subscribe', () =>
          new Promise((resolve, reject) => {
            const subscription = this.client
              .channel(channelName)
              .on('postgres_changes', 
                { event: '*', schema: 'public' },
                (payload) => {
                  // Simulate processing real-time data
                  this.processRealtimeUpdate(payload);
                }
              )
              .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                  subscriptions.push(subscription);
                  resolve(true);
                } else {
                  reject(new Error(`Failed to subscribe to ${channelName}`));
                }
              });
          })
        );
      }

      // Simulate user activity that triggers real-time updates
      for (let i = 0; i < this.config.operationsPerUser; i++) {
        // Update user data (triggers real-time updates)
        await this.testOperation('realtime_trigger', () =>
          this.client.from('users')
            .update({ 
              last_activity: new Date().toISOString(),
              xp: Math.floor(Math.random() * 1000) + 500
            })
            .eq('id', `user-${userId}`)
        );

        // Update crop data
        await this.testOperation('crop_realtime_update', () =>
          this.client.from('crops')
            .update({ 
              status: 'updated',
              updated_at: new Date().toISOString()
            })
            .eq('user_id', `user-${userId}`)
        );

        await this.delay(Math.random() * 500 + 100);
      }

      // Keep subscriptions active for a while
      await this.delay(30000);

    } finally {
      // Clean up subscriptions
      subscriptions.forEach(sub => {
        try {
          sub.unsubscribe();
        } catch (error) {
          console.warn('Error unsubscribing:', error);
        }
      });
    }
  }

  private processRealtimeUpdate(payload: any): void {
    // Simulate processing real-time updates
    // This would normally update UI state, trigger notifications, etc.
    const processingTime = Math.random() * 10;
    
    // Record processing metrics
    this.testOperation('realtime_processing', () =>
      new Promise(resolve => setTimeout(resolve, processingTime))
    );
  }
}

// Export for CLI usage
export { ComprehensiveLoadTester, FarmingWorkflowTester, RealTimeTester };

// CLI runner
if (require.main === module) {
  const testType = process.argv[2] || 'all';
  const tester = new ComprehensiveLoadTester();
  
  switch (testType) {
    case 'all':
      tester.runAllScenarios().catch(console.error);
      break;
    case 'workflow':
      tester.runFarmingWorkflowTest().catch(console.error);
      break;
    case 'realtime':
      tester.runRealTimeTest().catch(console.error);
      break;
    default:
      console.error('Unknown test type. Use: all, workflow, or realtime');
      process.exit(1);
  }
}