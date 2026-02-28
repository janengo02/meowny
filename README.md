# Meowny

A personal finance and wealth management desktop application built with Electron, React, and TypeScript.

## Overview

Meowny helps you track your financial accounts, manage investment portfolios, monitor income sources, and visualize your financial progress through interactive dashboards. The application combines the convenience of a desktop app with cloud-based data storage for secure access across devices.

## Features

### Account & Portfolio Management

- **Account Management**: Create and manage asset and expense accounts with custom color-coding
- **Bucket System**: Organize money into buckets for expenses, savings, and investments
- **Bucket Categories**: Group buckets by custom categories
- **Goal Tracking**: Set min/max targets for each bucket and monitor progress
- **Market Value Tracking**: Track both contributed amounts and current market values
- **Unit Tracking**: Support for investment units (shares, index fund units, etc.)

### Transaction Management

- **Transaction Recording**: Log money movements between buckets
- **CSV Import**: Bulk import transactions from CSV files
- **Smart Column Mapping**: Flexible CSV column mapping with amount mapping strategies
- **Duplicate Detection**: Automatic checking for duplicate transactions during import

### Income Tracking

- **Income Sources**: Manage multiple income streams
- **Income History**: Track historical income data
- **Tax Categorization**: Monitor tax amounts by category
- **Income Analytics**: Visualize income trends and compare against savings

### Dashboard & Visualization

- **Assets Over Time Chart**: Monitor how your wealth changes
- **Expense Breakdown**: Pie chart visualization of expense categories
- **Bucket Goals Progress**: Track progress toward financial goals
- **Income Over Time**: Stacked bar charts showing income history
- **Income vs Savings**: Compare income against savings rates

### Settings & Customization

- **Hidden Buckets**: Hide specific buckets from view
- **Layout Preferences**: Customize your dashboard layout
- **Theme Support**: Light and dark mode options

## Technology Stack

### Frontend

- **React 19** - UI framework
- **TypeScript 5** - Type-safe development
- **Vite** - Fast build tool and dev server
- **Material-UI (MUI)** - Component library
- **Redux Toolkit** - State management
- **Chart.js** - Data visualization
- **React Hook Form + Zod** - Form handling and validation

### Backend

- **Electron** - Cross-platform desktop framework
- **Supabase** - PostgreSQL database and authentication
- **Node.js** - Server-side logic via Electron main process

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Vitest** - Unit testing

## Getting Started

### Prerequisites

- Node.js (version specified in package.json)
- npm or yarn

### Installation

```bash
npm install
```

### Development

Run the app in development mode:

```bash
npm run dev
```

### Building

Build for production:

```bash
npm run build
```

Create distributable packages:

```bash
# macOS
npm run dist:mac

# Windows
npm run dist:win

# Linux
npm run dist:linux
```

### Testing

```bash
npm test
```

### Linting & Formatting

```bash
# Lint code
npm run lint

# Format code
npm run format
```

## Project Structure

```text
meowny/
├── src/
│   ├── ui/              # React frontend
│   │   ├── features/    # Feature modules (auth, dashboard, etc.)
│   │   ├── shared/      # Shared components and utilities
│   │   └── store/       # Redux store
│   └── electron/        # Electron main process
│       ├── database/    # Supabase client and queries
│       └── main.ts      # IPC handlers and app initialization
├── supabase/            # Database schemas and migrations
└── package.json
```

## Architecture

The application follows a clean separation between the UI layer (React) and business logic (Electron main process):

- **Renderer Process**: React components handle UI only
- **Main Process**: Handles database queries, authentication, and security
- **Supabase**: Cloud PostgreSQL database with Row-Level Security (RLS)

Communication between processes uses Electron's IPC (Inter-Process Communication) for security.
