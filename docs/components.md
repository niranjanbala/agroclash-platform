# AgroClash Platform - Component Documentation

## Overview

This document provides comprehensive documentation for all React components in the AgroClash platform, organized by feature area.

## Component Architecture

### Design Principles
- **Composition over Inheritance**: Components are composed of smaller, reusable parts
- **Single Responsibility**: Each component has one clear purpose
- **Props Interface**: All components use TypeScript interfaces for props
- **Accessibility**: WCAG 2.1 AA compliance with proper ARIA attributes
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Common Patterns
- **Container/Presentational**: Logic containers with presentational components
- **Compound Components**: Related components that work together
- **Render Props**: Flexible component composition
- **Custom Hooks**: Shared logic extraction

## Authentication Components

### AuthProvider
**Location**: `src/components/auth/AuthProvider.tsx`

React Context provider for authentication state management.

```typescript
interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>
  signOut: () => Promise<void>
  updateProfile: (updates: Partial<User>) => Promise<void>
}
```

**Usage:**
```tsx
<AuthProvider>
  <App />
</AuthProvider>
```

### LoginForm
**Location**: `src/components/auth/LoginForm.tsx`

User login interface with email/password authentication.

**Props:**
```typescript
interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToSignUp?: () => void
  className?: string
}
```

**Features:**
- Form validation with error handling
- Loading states and feedback
- Forgot password functionality
- Accessibility compliance

### SignUpForm
**Location**: `src/components/auth/SignUpForm.tsx`

User registration form with profile setup.

**Props:**
```typescript
interface SignUpFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
  className?: string
}
```

**Features:**
- Multi-step registration process
- Real-time validation
- Profile picture upload
- Terms and conditions acceptance

### ProtectedRoute
**Location**: `src/components/auth/ProtectedRoute.tsx`

Route protection wrapper for authenticated pages.

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireLevel?: number
}
```

## Plot Management Components

### LeafletMap
**Location**: `src/components/maps/LeafletMap.tsx`

Interactive mapping component with polygon drawing capabilities.

**Props:**
```typescript
interface LeafletMapProps {
  plots: Plot[]
  onPlotCreate?: (coordinates: number[][]) => void
  onPlotSelect?: (plot: Plot) => void
  onPlotEdit?: (plotId: string, coordinates: number[][]) => void
  center?: [number, number]
  zoom?: number
  height?: string
  className?: string
}
```

**Features:**
- Interactive polygon drawing
- Plot visualization and editing
- Geospatial calculations
- Layer management
- Responsive design

### PlotManager
**Location**: `src/components/plots/PlotManager.tsx`

Main dashboard for plot management and overview.

**Props:**
```typescript
interface PlotManagerProps {
  userId: string
  className?: string
}
```

**Features:**
- Plot creation and editing
- Plot statistics and analytics
- Crop assignment to plots
- Real-time updates

### PlotForm
**Location**: `src/components/plots/PlotForm.tsx`

Form component for creating and editing plots.

**Props:**
```typescript
interface PlotFormProps {
  plot?: Plot
  onSubmit: (plotData: PlotFormData) => Promise<void>
  onCancel?: () => void
  className?: string
}
```

## Crop Management Components

### CropTracker
**Location**: `src/components/crops/CropTracker.tsx`

Comprehensive crop lifecycle tracking interface.

**Props:**
```typescript
interface CropTrackerProps {
  plotId?: string
  userId: string
  className?: string
}
```

**Features:**
- Crop creation and management
- Growth stage tracking
- Timeline visualization
- Yield calculations
- Health monitoring

### CropTimeline
**Location**: `src/components/crops/CropTimeline.tsx`

Visual timeline component for crop growth stages.

**Props:**
```typescript
interface CropTimelineProps {
  cropId: string
  timeline: CropTimeline[]
  onStageUpdate?: (stage: string, notes?: string) => void
  className?: string
}
```

**Features:**
- Interactive timeline visualization
- Stage progression tracking
- Notes and observations
- Expected vs. actual dates

### CropStats
**Location**: `src/components/crops/CropStats.tsx`

Analytics and statistics dashboard for crops.

**Props:**
```typescript
interface CropStatsProps {
  crops: Crop[]
  timeRange?: 'week' | 'month' | 'season' | 'year'
  className?: string
}
```

## Gamification Components

### XPDisplay
**Location**: `src/components/gamification/XPDisplay.tsx`

Experience points and level progression display.

**Props:**
```typescript
interface XPDisplayProps {
  showDetails?: boolean
  showRecentActivity?: boolean
  className?: string
}
```

**Features:**
- Animated progress bars
- Level benefits display
- Recent activity log
- Compact and detailed views

### BadgeSystem
**Location**: `src/components/gamification/BadgeSystem.tsx`

Achievement and badge management interface.

**Props:**
```typescript
interface BadgeSystemProps {
  showEarned?: boolean
  showAvailable?: boolean
  className?: string
}
```

**Features:**
- Badge collection display
- Achievement progress tracking
- Rarity system visualization
- Badge detail modals

### QuestSystem
**Location**: `src/components/gamification/QuestSystem.tsx`

Daily and weekly quest management.

**Props:**
```typescript
interface QuestSystemProps {
  className?: string
}
```

**Features:**
- Active quest tracking
- Progress visualization
- Reward claiming
- Quest history

### Leaderboard
**Location**: `src/components/gamification/Leaderboard.tsx`

Competitive ranking system.

**Props:**
```typescript
interface LeaderboardProps {
  type?: 'global' | 'clan' | 'friends'
  limit?: number
  className?: string
}
```

## Weather Components

### WeatherDashboard
**Location**: `src/components/weather/WeatherDashboard.tsx`

Comprehensive weather information display.

**Props:**
```typescript
interface WeatherDashboardProps {
  latitude: number
  longitude: number
  className?: string
}
```

**Features:**
- Current conditions display
- Multi-day forecast
- Weather alerts
- Historical data access

### WeatherForecast
**Location**: `src/components/weather/WeatherForecast.tsx`

Multi-day weather forecast component.

**Props:**
```typescript
interface WeatherForecastProps {
  latitude: number
  longitude: number
  days?: number
  className?: string
}
```

### WeatherAlerts
**Location**: `src/components/weather/WeatherAlerts.tsx`

Weather alert and notification management.

**Props:**
```typescript
interface WeatherAlertsProps {
  latitude: number
  longitude: number
  onAlertAction?: (alert: WeatherAlert, action: string) => void
  className?: string
}
```

## Marketplace Components

### MarketplaceDashboard
**Location**: `src/components/marketplace/MarketplaceDashboard.tsx`

Main marketplace interface and overview.

**Props:**
```typescript
interface MarketplaceDashboardProps {
  userId: string
  className?: string
}
```

**Features:**
- Market price overview
- Trending crops display
- Quick listing creation
- Recommendation system

### MarketPrices
**Location**: `src/components/marketplace/MarketPrices.tsx`

Market price tracking and visualization.

**Props:**
```typescript
interface MarketPricesProps {
  cropType?: string
  region?: string
  showTrends?: boolean
  className?: string
}
```

### CropListings
**Location**: `src/components/marketplace/CropListings.tsx`

Marketplace listings for buying and selling crops.

**Props:**
```typescript
interface CropListingsProps {
  cropType?: string
  region?: string
  userId?: string
  mode?: 'buy' | 'sell' | 'all'
  className?: string
}
```

## Common UI Components

### LoadingSpinner
Reusable loading indicator with customizable size and color.

### ErrorBoundary
Error boundary component for graceful error handling.

### Modal
Accessible modal component with backdrop and focus management.

### Toast
Notification system for user feedback and alerts.

### Button
Consistent button component with variants and states.

### Input
Form input component with validation and error states.

### Card
Container component for content grouping.

## Component Testing

### Testing Patterns
All components include comprehensive tests using Jest and React Testing Library:

```typescript
// Example test structure
describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName {...defaultProps} />)
    expect(screen.getByRole('...')).toBeInTheDocument()
  })

  it('handles user interactions', async () => {
    const mockHandler = jest.fn()
    render(<ComponentName onAction={mockHandler} />)
    
    await user.click(screen.getByRole('button'))
    expect(mockHandler).toHaveBeenCalled()
  })

  it('displays loading states', () => {
    render(<ComponentName loading={true} />)
    expect(screen.getByRole('progressbar')).toBeInTheDocument()
  })
})
```

### Accessibility Testing
Components are tested for accessibility compliance:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

it('should not have accessibility violations', async () => {
  const { container } = render(<ComponentName />)
  const results = await axe(container)
  expect(results).toHaveNoViolations()
})
```

## Performance Optimization

### Code Splitting
Components are lazy-loaded where appropriate:

```typescript
const LazyComponent = lazy(() => import('./HeavyComponent'))

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <LazyComponent />
    </Suspense>
  )
}
```

### Memoization
Performance-critical components use React.memo and useMemo:

```typescript
const ExpensiveComponent = memo(({ data }) => {
  const processedData = useMemo(() => 
    expensiveCalculation(data), [data]
  )
  
  return <div>{processedData}</div>
})
```

### Virtual Scrolling
Large lists use virtual scrolling for performance:

```typescript
import { FixedSizeList as List } from 'react-window'

function VirtualizedList({ items }) {
  return (
    <List
      height={600}
      itemCount={items.length}
      itemSize={50}
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index]}
        </div>
      )}
    </List>
  )
}
```

This component architecture ensures maintainability, reusability, and excellent user experience across the AgroClash platform.