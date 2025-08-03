# AgroClash Platform

A gamified agriculture platform that combines farming management with social gaming elements. Built as a Progressive Web App (PWA) with Next.js and a companion React Native mobile app.

## 🌟 Project Overview

AgroClash is a comprehensive agricultural platform that gamifies farming activities, enabling farmers to:
- Manage plots and track crops with interactive mapping
- Participate in gamified experiences with XP, levels, and achievements
- Access real-time weather data and market information
- Connect with other farmers through clan systems
- Battle virtual pests and complete daily quests

## 🏗️ Architecture

### Monorepo Structure
```
agroclash-platform/
├── agroclash-web/          # Next.js PWA (submodule)
├── agroclash-mobile/       # React Native app (submodule)
├── lib/                    # Shared TypeScript library
│   ├── services/          # Business logic services
│   ├── types/             # Shared TypeScript types
│   ├── utils/             # Utility functions
│   └── supabase/          # Database schema and migrations
├── .kiro/specs/           # Feature specifications
└── docs/                  # Documentation
```

### Technology Stack

**Frontend (Web)**
- Next.js 14 with App Router
- TypeScript
- Tailwind CSS
- Leaflet.js for mapping
- PWA capabilities

**Frontend (Mobile)**
- React Native with Expo
- TypeScript
- React Navigation
- Expo Location & Maps

**Backend & Database**
- Supabase (PostgreSQL + Auth + Real-time)
- PostGIS for geospatial data
- Row Level Security (RLS)
- Real-time subscriptions

**Development**
- Mock-first development approach
- Jest for testing
- ESLint + Prettier
- GitHub submodules for code organization

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Git

### Installation

1. **Clone with submodules:**
```bash
git clone --recursive https://github.com/niranjanbala/agroclash-platform.git
cd agroclash-platform
```

2. **Install dependencies:**
```bash
# Install shared library dependencies
cd lib && npm install && cd ..

# Install web app dependencies
cd agroclash-web && npm install && cd ..

# Install mobile app dependencies
cd agroclash-mobile && npm install && cd ..
```

3. **Set up environment variables:**
```bash
# Copy example files and configure
cp agroclash-web/.env.local.example agroclash-web/.env.local
cp agroclash-mobile/.env.example agroclash-mobile/.env
```

4. **Run development servers:**
```bash
# Web app (http://localhost:3000)
cd agroclash-web && npm run dev

# Mobile app
cd agroclash-mobile && npm start
```

## 📋 Development Progress

See [PROGRESS.md](./PROGRESS.md) for detailed development progress and completed features.

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📚 Documentation

- [Development Progress](./PROGRESS.md) - Detailed progress tracking (85% complete)
- [API Documentation](./docs/api.md) - Complete service layer documentation
- [Component Documentation](./docs/components.md) - React component reference
- [Deployment Guide](./docs/deployment.md) - Production deployment instructions
- [Changelog](./CHANGELOG.md) - Version history and release notes
- [Database Schema](./lib/supabase/schema.sql) - Complete database structure

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
