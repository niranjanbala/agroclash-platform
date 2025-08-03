# Requirements Document

## Introduction

AgroClash is a gamified agriculture platform designed as a "Clash of Clans for Farmers" that combines farm management with engaging game mechanics. The platform consists of a Next.js PWA for web deployment and a React Native + Expo Android mobile app, both powered by a Supabase backend. The system enables farmers to manage irregular land plots, track crops, receive weather and pest alerts, earn XP and rewards through farming activities, collaborate via clans, visualize fields on satellite maps, and access advisory and market data. The platform follows a mock-first, modular architecture to enable rapid MVP development with progressive real API integration.

## Requirements

### Requirement 1

**User Story:** As a farmer, I want to register and authenticate securely, so that I can access my personalized farm management dashboard.

#### Acceptance Criteria

1. WHEN a user visits the platform THEN the system SHALL provide Supabase Auth integration with email/phone OTP options
2. WHEN a user completes authentication THEN the system SHALL collect basic user information including name, location, and optional clan preference
3. WHEN a user registers THEN the system SHALL create a user profile with initial XP level and resources
4. WHEN authentication is complete THEN the system SHALL redirect users to their personalized farm dashboard

### Requirement 2

**User Story:** As a farmer, I want to define and manage multiple irregular land plots on a map, so that I can accurately represent my actual farming areas.

#### Acceptance Criteria

1. WHEN a user accesses the plot manager THEN the system SHALL display an interactive map using Leaflet.js (web) or React Native Maps (mobile)
2. WHEN a user draws on the map THEN the system SHALL allow creation of irregular plot shapes using polygon drawing tools
3. WHEN a plot is created THEN the system SHALL store the plot as GeoJSON with calculated area, user-defined name, and assigned crop information
4. WHEN a user has multiple plots THEN the system SHALL display all plots with color-coded status indicators
5. WHEN a user selects a plot THEN the system SHALL allow editing of plot boundaries, name, and crop assignments

### Requirement 3

**User Story:** As a farmer, I want to assign and track crops on my plots with timeline management, so that I can monitor crop progress and receive timely alerts.

#### Acceptance Criteria

1. WHEN a user assigns a crop to a plot THEN the system SHALL store crop metadata including name, sown date, expected harvest date, and current status
2. WHEN a crop is assigned THEN the system SHALL create a timeline view showing crop progress stages
3. WHEN crop milestones are reached THEN the system SHALL provide warnings for watering, fertilizing, pest control, and harvesting
4. WHEN a user completes farming actions THEN the system SHALL update crop status and award appropriate XP
5. WHEN viewing crop tracker THEN the system SHALL display visual progress indicators and next recommended actions

### Requirement 4

**User Story:** As a farmer, I want to receive weather forecasts and pest alerts for my location, so that I can take preventive measures to protect my crops.

#### Acceptance Criteria

1. WHEN the system detects user location THEN it SHALL provide weather forecasts using mock data initially, with real API integration capability
2. WHEN weather conditions change THEN the system SHALL send relevant alerts for crop protection
3. WHEN pest risks are detected THEN the system SHALL create gamified pest battle events with XP rewards
4. WHEN alerts are generated THEN the system SHALL support both in-app notifications and push notifications via Expo
5. WHEN internet is unavailable THEN the system SHALL cache recent weather data for offline access

### Requirement 5

**User Story:** As a farmer, I want to earn XP, levels, and badges through farming activities, so that I stay motivated and engaged with best farming practices.

#### Acceptance Criteria

1. WHEN a user performs farming actions THEN the system SHALL award XP based on action type and difficulty
2. WHEN XP thresholds are reached THEN the system SHALL trigger level-ups with unlocked tools, tips, or resources
3. WHEN milestones are achieved THEN the system SHALL award badges based on XP, crop yields, or special achievements
4. WHEN users view their profile THEN the system SHALL display XP bars, current level, earned badges, and progress indicators
5. WHEN XP is awarded THEN the system SHALL log the action in xp_logs table for tracking and analytics

### Requirement 6

**User Story:** As a farmer, I want to access current market prices and sell my crops, so that I can make informed decisions about crop selection and timing.

#### Acceptance Criteria

1. WHEN a user accesses the marketplace THEN the system SHALL display current crop prices using mock data initially
2. WHEN a user has harvestable crops THEN the system SHALL allow marking surplus for sale
3. WHEN market conditions change THEN the system SHALL provide smart recommendations for crop selection
4. WHEN users browse the market THEN the system SHALL show demand indicators and price trends
5. WHEN real market APIs are integrated THEN the system SHALL seamlessly switch from mock to live data

### Requirement 7

**User Story:** As a farmer, I want to join or create clans with other farmers, so that I can collaborate, share knowledge, and compete in friendly leaderboards.

#### Acceptance Criteria

1. WHEN a user wants to join a clan THEN the system SHALL provide search and join functionality for existing clans
2. WHEN a user creates a clan THEN the system SHALL allow setting clan name, description, and membership rules
3. WHEN clan members interact THEN the system SHALL provide features for sharing tips and farming advice
4. WHEN viewing clan dashboard THEN the system SHALL display leaderboards by XP, area planted, and crop yields
5. WHEN clan activities occur THEN the system SHALL support collaborative quests and group achievements

### Requirement 8

**User Story:** As a farmer, I want the platform to work offline and on low-end Android devices, so that I can use it in areas with poor internet connectivity.

#### Acceptance Criteria

1. WHEN internet connectivity is lost THEN the system SHALL continue functioning with cached data
2. WHEN using offline mode THEN the system SHALL sync data automatically when connectivity is restored
3. WHEN running on low-end devices THEN the system SHALL maintain responsive performance with optimized resource usage
4. WHEN data is cached THEN the system SHALL use redux-persist and AsyncStorage for local data management
5. WHEN offline actions are performed THEN the system SHALL queue them for synchronization when online

### Requirement 9

**User Story:** As a farmer, I want multilingual support and accessible UI design, so that I can use the platform in my preferred language with ease.

#### Acceptance Criteria

1. WHEN a user selects language preferences THEN the system SHALL support multiple regional languages through i18n
2. WHEN using the interface THEN the system SHALL provide large buttons and icon-first navigation for field usability
3. WHEN accessibility features are needed THEN the system SHALL support voice assistant integration and audio tooltips
4. WHEN users interact with the platform THEN the system SHALL maintain consistent UX across web PWA and mobile app
5. WHEN displaying information THEN the system SHALL use clear visual hierarchies suitable for outdoor viewing conditions

### Requirement 10

**User Story:** As a platform administrator, I want a modular, mock-first architecture with service abstraction, so that I can rapidly deploy MVP and progressively integrate real APIs.

#### Acceptance Criteria

1. WHEN services are implemented THEN the system SHALL define clear interfaces for WeatherService, CropHealthService, MarketService, PestAlertService, and XPService
2. WHEN in development mode THEN the system SHALL use mock implementations returning static or randomized data
3. WHEN switching to production THEN the system SHALL use environment flags to toggle between mock and real API integrations
4. WHEN real APIs are integrated THEN the system SHALL support OpenWeatherMap, Sentinel Hub, KrishiHub, and other external services
5. WHEN deploying THEN the system SHALL maintain modular architecture allowing easy service swapping without code restructuring