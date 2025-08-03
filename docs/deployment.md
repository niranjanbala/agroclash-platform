# AgroClash Platform - Deployment Guide

## Overview

This guide covers the deployment process for the AgroClash platform, including both web and mobile applications.

## Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web App       │    │   Mobile App    │    │   Supabase      │
│   (Vercel)      │    │   (Expo/App     │    │   (Backend)     │
│                 │    │    Stores)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Shared Lib    │
                    │   (npm package) │
                    └─────────────────┘
```

## Prerequisites

### Required Accounts
- [Vercel](https://vercel.com) - Web app hosting
- [Expo](https://expo.dev) - Mobile app distribution
- [Supabase](https://supabase.com) - Backend services
- [GitHub](https://github.com) - Code repository
- Apple Developer Account (for iOS)
- Google Play Console (for Android)

### Required Tools
- Node.js 18+
- npm or yarn
- Git
- Expo CLI
- Vercel CLI (optional)

## Environment Setup

### 1. Supabase Configuration

Create a new Supabase project:

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create new project
3. Note down the project URL and anon key
4. Run database migrations:

```sql
-- Run the SQL files in order:
-- 1. lib/supabase/migrations/001_initial_schema.sql
-- 2. lib/supabase/migrations/002_rls_policies.sql
-- 3. lib/supabase/migrations/003_functions_triggers.sql
-- 4. lib/supabase/migrations/004_seed_data.sql
```

5. Enable PostGIS extension:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

### 2. Environment Variables

#### Web App (.env.local)
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NEXT_PUBLIC_USE_MOCK_SERVICES=false

# Weather API (optional)
WEATHER_API_KEY=your_weather_api_key

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### Mobile App (.env)
```bash
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# App Configuration
EXPO_PUBLIC_APP_URL=https://your-domain.com
EXPO_PUBLIC_USE_MOCK_SERVICES=false

# Expo
EXPO_PROJECT_ID=your_expo_project_id
```

## Web App Deployment (Vercel)

### Automatic Deployment

1. **Connect Repository**:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the `agroclash-web` directory as root

2. **Configure Build Settings**:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": ".next",
     "installCommand": "npm install",
     "devCommand": "npm run dev"
   }
   ```

3. **Environment Variables**:
   - Add all environment variables from `.env.local`
   - Ensure `NEXT_PUBLIC_USE_MOCK_SERVICES=false` for production

4. **Domain Configuration**:
   - Add custom domain in Vercel dashboard
   - Configure DNS records as instructed

### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Navigate to web app
cd agroclash-web

# Deploy
vercel --prod
```

### Build Optimization

#### Next.js Configuration
```javascript
// next.config.ts
const nextConfig = {
  // Enable PWA
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  
  // Image optimization
  images: {
    domains: ['your-supabase-url.supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Bundle analyzer (development only)
  ...(process.env.ANALYZE === 'true' && {
    webpack: (config) => {
      config.plugins.push(new BundleAnalyzerPlugin())
      return config
    },
  }),
}
```

#### Performance Optimizations
- Enable gzip compression
- Configure CDN caching headers
- Implement service worker for offline functionality
- Use dynamic imports for code splitting

## Mobile App Deployment

### Expo Development Build

1. **Install EAS CLI**:
```bash
npm install -g @expo/eas-cli
```

2. **Configure EAS**:
```bash
cd agroclash-mobile
eas login
eas build:configure
```

3. **Build Configuration** (`eas.json`):
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m1-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m1-medium"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### iOS Deployment

1. **Prerequisites**:
   - Apple Developer Account ($99/year)
   - App Store Connect access
   - iOS distribution certificate

2. **Build for iOS**:
```bash
eas build --platform ios --profile production
```

3. **Submit to App Store**:
```bash
eas submit --platform ios
```

4. **App Store Configuration**:
   - App name: "AgroClash"
   - Category: "Productivity" or "Business"
   - Age rating: 4+ (suitable for all ages)
   - Keywords: "farming, agriculture, gamification, crops"

### Android Deployment

1. **Prerequisites**:
   - Google Play Console account ($25 one-time fee)
   - Android keystore

2. **Build for Android**:
```bash
eas build --platform android --profile production
```

3. **Submit to Play Store**:
```bash
eas submit --platform android
```

4. **Play Store Configuration**:
   - App name: "AgroClash"
   - Category: "Productivity"
   - Content rating: Everyone
   - Target audience: 18+

## Database Deployment

### Production Database Setup

1. **Supabase Project Configuration**:
   - Enable Row Level Security on all tables
   - Configure authentication providers
   - Set up storage buckets for file uploads
   - Configure real-time subscriptions

2. **Database Migrations**:
```bash
# Run migrations in order
psql -h your-db-host -U postgres -d postgres -f lib/supabase/migrations/001_initial_schema.sql
psql -h your-db-host -U postgres -d postgres -f lib/supabase/migrations/002_rls_policies.sql
psql -h your-db-host -U postgres -d postgres -f lib/supabase/migrations/003_functions_triggers.sql
psql -h your-db-host -U postgres -d postgres -f lib/supabase/migrations/004_seed_data.sql
```

3. **Backup Strategy**:
   - Enable automated backups in Supabase
   - Set up point-in-time recovery
   - Configure backup retention policy

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy AgroClash Platform

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          npm ci
          cd agroclash-web && npm ci
          cd ../agroclash-mobile && npm ci
      
      - name: Run tests
        run: |
          npm test
          cd agroclash-web && npm test
      
      - name: Build web app
        run: cd agroclash-web && npm run build

  deploy-web:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          working-directory: ./agroclash-web

  deploy-mobile:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
        with:
          submodules: recursive
      
      - name: Setup Expo
        uses: expo/expo-github-action@v7
        with:
          expo-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      
      - name: Build and deploy
        run: |
          cd agroclash-mobile
          eas build --platform all --non-interactive
```

## Monitoring and Analytics

### Application Monitoring

1. **Vercel Analytics** (Web):
   - Automatic performance monitoring
   - Core Web Vitals tracking
   - User analytics

2. **Expo Analytics** (Mobile):
   - Crash reporting
   - Performance monitoring
   - User engagement metrics

3. **Supabase Monitoring**:
   - Database performance
   - API usage statistics
   - Real-time connection monitoring

### Error Tracking

```typescript
// Error tracking setup
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### Performance Monitoring

```typescript
// Performance monitoring
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric) {
  // Send to your analytics service
  gtag('event', metric.name, {
    value: Math.round(metric.value),
    event_label: metric.id,
  })
}

getCLS(sendToAnalytics)
getFID(sendToAnalytics)
getFCP(sendToAnalytics)
getLCP(sendToAnalytics)
getTTFB(sendToAnalytics)
```

## Security Considerations

### Web Security
- HTTPS enforcement
- Content Security Policy (CSP)
- CORS configuration
- Rate limiting
- Input validation and sanitization

### Mobile Security
- Certificate pinning
- Secure storage for sensitive data
- Biometric authentication
- App transport security

### Database Security
- Row Level Security (RLS) policies
- API key rotation
- Connection encryption
- Audit logging

## Rollback Strategy

### Web App Rollback
```bash
# Vercel rollback to previous deployment
vercel rollback [deployment-url]
```

### Mobile App Rollback
- Use Expo Updates for over-the-air updates
- Maintain previous app store versions
- Implement feature flags for gradual rollouts

### Database Rollback
- Point-in-time recovery from Supabase
- Migration rollback scripts
- Data backup restoration

## Post-Deployment Checklist

- [ ] Verify all environment variables are set correctly
- [ ] Test authentication flow
- [ ] Verify database connections
- [ ] Test real-time features
- [ ] Check mobile app functionality
- [ ] Verify PWA installation
- [ ] Test offline functionality
- [ ] Monitor error rates and performance
- [ ] Verify analytics tracking
- [ ] Test payment processing (if applicable)

## Troubleshooting

### Common Issues

1. **Build Failures**:
   - Check Node.js version compatibility
   - Verify environment variables
   - Clear build cache

2. **Database Connection Issues**:
   - Verify Supabase URL and keys
   - Check RLS policies
   - Validate database migrations

3. **Mobile App Issues**:
   - Check Expo configuration
   - Verify native dependencies
   - Test on physical devices

### Support Resources
- [Vercel Documentation](https://vercel.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)

This deployment guide ensures a smooth and reliable deployment process for the AgroClash platform across all environments.