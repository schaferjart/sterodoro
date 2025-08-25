# Sterodoro

An offline-first Progressive Web App (PWA) for writing and understanding. Built with React 19, TypeScript, and Supabase.

## Features

- **Pomodoro Timer** - Customizable work/break cycles with session tracking
- **Performance Tracking** - Metrics collection during breaks with customizable trackers
- **Note Taking** - Session-specific note capture and organization
- **Reading Sessions** - Track reading progress and comprehension
- **Intake Tracking** - Monitor supplements, medications, and habits
- **Offline-First** - Full functionality without internet connection
- **Multi-Device Sync** - Automatic data synchronization across devices
- **Background Sync** - Seamless sync with progress tracking and retry mechanisms
- **Progressive Web App** - Installable app with service worker for offline functionality

## Architecture

### Offline-First Design
- **Local Storage**: IndexedDB (Dexie.js) for instant offline access
- **Cloud Storage**: Supabase PostgreSQL for multi-device sync
- **Sync Strategy**: Optimistic UI updates with background synchronization
- **Error Handling**: Comprehensive error reporting and recovery

### Technology Stack
- **Frontend**: React 19 + TypeScript + Tailwind CSS
- **Build Tool**: Vite with PWA plugin
- **Local Storage**: Dexie.js (IndexedDB wrapper)
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Deployment**: Static hosting (Vercel, Netlify, etc.)

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone Repository
```bash
git clone <repository-url>
cd sterodoro-7
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set Up Supabase
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your project URL and anon key
3. Create a `.env.local` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=Sterodoro
```

### 4. Set Up Database
Run the following SQL in your Supabase SQL editor:

```sql
-- Enable Row Level Security
ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

-- Create activity_objects table
CREATE TABLE activity_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  sub_activity TEXT,
  sub_sub_activity TEXT,
  info TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create session_logs table
CREATE TABLE session_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  activity_object_id UUID REFERENCES activity_objects(id),
  time_start TIMESTAMP NOT NULL,
  time_end TIMESTAMP NOT NULL,
  tracker_and_metric JSONB,
  notes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create intake_objects table
CREATE TABLE intake_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  default_quantity INTEGER DEFAULT 1,
  default_unit TEXT NOT NULL,
  info TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create intake_logs table
CREATE TABLE intake_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  intake_object_id UUID REFERENCES intake_objects(id),
  timestamp TIMESTAMP NOT NULL,
  quantity INTEGER NOT NULL,
  unit TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create reading_objects table
CREATE TABLE reading_objects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  book_name TEXT NOT NULL,
  author TEXT,
  year INTEGER,
  info TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create reading_logs table
CREATE TABLE reading_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  reading_object_id UUID REFERENCES reading_objects(id),
  time_start TIMESTAMP NOT NULL,
  time_end TIMESTAMP NOT NULL,
  tracker_and_metric JSONB,
  notes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create note_logs table
CREATE TABLE note_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  timestamp TIMESTAMP NOT NULL,
  title TEXT,
  content TEXT NOT NULL,
  tracker_and_metric JSONB,
  related_activities JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE activity_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE intake_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_objects ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE note_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own data" ON activity_objects
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON session_logs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON intake_objects
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON intake_logs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON reading_objects
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON reading_logs
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own data" ON note_logs
FOR ALL USING (auth.uid() = user_id);
```

### 5. Start Development Server
```bash
npm run dev
```

The app will be available at `http://localhost:5173` (or the next available port).

## Usage

### Getting Started
1. **Sign Up/Login** - Create an account or sign in with email/password
2. **Create Activities** - Add your work activities, hobbies, or tasks
3. **Configure Timer** - Set session duration, break length, and session count
4. **Start Timer** - Begin your productivity session
5. **Track Performance** - Rate your focus, energy, and mood during breaks
6. **Take Notes** - Capture insights and observations
7. **Review History** - Analyze your productivity patterns

### Offline Usage
- **Works offline** - All features available without internet
- **Automatic sync** - Data syncs when you're back online
- **No data loss** - All data stored locally and backed up to cloud

### Multi-Device
- **Sign in** on any device with the same account
- **Data syncs** automatically across all devices
- **Seamless experience** - Pick up where you left off

## Project Structure

```
sterodoro-7/
├── components/           # Reusable UI components
│   ├── AuthForm.tsx     # Authentication
│   ├── ErrorBoundary.tsx # Error handling
│   └── ...
├── screens/             # Main application screens
│   ├── SetupScreen.tsx  # Session configuration
│   ├── TimerScreen.tsx  # Timer interface
│   ├── TrackerScreen.tsx # Performance tracking
│   ├── HistoryScreen.tsx # Data visualization
│   └── NotePromptScreen.tsx # Note taking
├── lib/                 # Core business logic
│   ├── database.ts      # Supabase operations
│   ├── offline-storage.ts # IndexedDB operations
│   ├── sync-manager.ts  # Sync orchestration
│   ├── error-reporting.ts # Error handling
│   └── env-validation.ts # Environment validation
├── hooks/               # Custom React hooks
│   └── useSyncStatus.ts # Sync status management
├── types.ts             # TypeScript definitions
├── constants.ts         # Application constants
└── public/              # Static assets
    └── sw.js            # Service worker
```

## Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Deploy: `vercel --prod`

### Deploy to Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`

### Environment Variables for Production
Set these in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_APP_VERSION`
- `VITE_APP_NAME`

## Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing
```bash
# Manual testing components available in development
# Navigate to BackgroundSyncTest and OfflineStorageTest components
```

### Code Quality
- **TypeScript** - Strict type checking enabled
- **ESLint** - Code linting and formatting
- **Error Boundaries** - Graceful error handling
- **Error Reporting** - Structured error logging

## Data Flow

### Offline-First Architecture
```
User Action → Local State → IndexedDB → Cloud Sync → Supabase
     ↓              ↓              ↓              ↓           ↓
  Create Log → Update UI → Save Locally → Sync to Cloud → PostgreSQL
```

### Sync Strategy
- **Optimistic Updates** - UI updates immediately
- **Background Sync** - Data syncs in background
- **Retry Queue** - Failed operations retry automatically
- **Progress Tracking** - Real-time sync progress

## Security

- **Authentication** - Supabase Auth with email/password
- **Row-Level Security** - Users can only access their own data
- **HTTPS Required** - Full PWA features require HTTPS
- **No Sensitive Data** - All sensitive data handled by Supabase

## Performance

- **Offline-First** - Instant response, no network latency
- **Progressive Loading** - App loads progressively
- **Service Worker** - Caching for offline functionality
- **Optimized Build** - Tree shaking and code splitting

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

- **Issues** - Report bugs on GitHub
- **Documentation** - Check this README and code comments
- **Community** - Join discussions in GitHub issues

## Roadmap

- Automated test coverage
- Push notifications
- Data export/import
- Advanced analytics
- Team collaboration features
- Mobile app versions

---

**Built with React, TypeScript, and Supabase**
