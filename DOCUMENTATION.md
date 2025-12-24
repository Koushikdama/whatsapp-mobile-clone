# WhatsApp Mobile Clone - High-Level Documentation

## Executive Summary

This is a **comprehensive WhatsApp mobile clone** built with React, featuring real-time messaging, voice/video calls, status updates, integrated games, and extensive customization options. The application supports multiple layouts (mobile, tablet, desktop) and uses Firebase as its backend infrastructure with an abstraction layer that allows switching to a REST API backend.

**Key Highlights:**
- 🔥 Real-time messaging with Firebase Realtime Database & Firestore
- 📞 WebRTC-based voice and video calls with advanced features
- 🎮 Integrated multiplayer games (Chess, Ludo, Tic-Tac-Toe, Snake & Ladders)
- 📱 Fully responsive (Mobile, Tablet, Desktop layouts)
- 🌐 Multi-language support with i18next
- 🔔 FCM push notifications
- 🎨 Extensive theming and customization
- 🔒 Comprehensive security and privacy controls

---

## Table of Contents

1. [Project Architecture](#project-architecture)
2. [Technology Stack](#technology-stack)
3. [Core Features](#core-features)
4. [Module Structure](#module-structure)
5. [Firebase Integration](#firebase-integration)
6. [State Management](#state-management)
7. [Routing & Navigation](#routing--navigation)
8. [Service Layer](#service-layer)
9. [Security & Privacy](#security--privacy)
10. [Deployment & Build](#deployment--build)

---

## Project Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     User Interface                      │
│  (Mobile Layout / Tablet Layout / Desktop Layout)       │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Feature Modules                        │
│  • Auth  • Chat  • Call  • Status  • Settings          │
│  • Games • Groups • Channels • Notifications           │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│              Shared Layer (Context, Hooks)              │
│  • AppContext  • CallContext                           │
│  • Custom Hooks (useStorage, useNotifications, etc.)    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Service Layer                          │
│  • Firebase Services (Auth, Chat, User, Status, Calls) │
│  • REST API Services (Backend abstraction layer)       │
│  • WebRTC Service  • WebSocket Service                 │
│  • Specialized Services (Translation, Notifications)    │
└─────────────────┬───────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────┐
│                  Backend & Storage                      │
│  • Firebase (Firestore + Realtime Database)            │
│  • Firebase Authentication                             │
│  • Firebase Storage                                    │
│  • Firebase Cloud Messaging (FCM)                      │
└─────────────────────────────────────────────────────────┘
```

### Directory Structure

```
whatsapp-mobile-clone/
├── src/
│   ├── config/                  # Firebase configuration
│   ├── core/
│   │   ├── layout/             # Mobile, Tablet, Desktop layouts
│   │   └── router/             # Protected routes
│   ├── data/                    # Static data and seed data
│   ├── features/                # Feature modules (11 modules)
│   │   ├── auth/               # Authentication
│   │   ├── call/               # Voice/Video calls
│   │   ├── channels/           # Broadcast channels
│   │   ├── chat/               # Messaging
│   │   ├── games/              # Integrated games
│   │   ├── groups/             # Group management
│   │   ├── notifications/      # Notification handling
│   │   ├── settings/           # User settings
│   │   ├── status/             # Status updates (stories)
│   │   ├── updates/            # Updates tab
│   │   └── users/              # User profiles
│   ├── services/                # Service layer
│   │   ├── firebase/           # Firebase services (12 services)
│   │   ├── api/                # REST API services (8 services)
│   │   └── [specialized services]
│   ├── shared/                  # Shared resources
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React contexts
│   │   ├── hooks/              # Custom hooks
│   │   ├── i18n/               # Internationalization
│   │   ├── styles/             # Global styles
│   │   └── utils/              # Utility functions
│   └── utils/                   # Additional utilities
├── public/                      # Static assets
├── App.jsx                      # Root component
├── index.jsx                    # Entry point
├── vite.config.js              # Vite configuration
└── package.json                 # Dependencies
```

---

## Technology Stack

### Frontend Framework
- **React 19.2.3** - UI library
- **React Router DOM 7.10.1** - Client-side routing
- **Vite 6.2.0** - Build tool and dev server

### Backend & Database
- **Firebase 12.7.0**
  - Firestore - Structured data (users, chats, settings)
  - Realtime Database - Messages and typing indicators
  - Authentication - Email/password auth
  - Storage - Media uploads
  - Cloud Messaging (FCM) - Push notifications

### Real-time Communication
- **WebRTC** - Peer-to-peer audio/video calls
- **WebSocket** - Real-time signaling
- **Firebase Realtime Database** - Live message sync

### UI & Styling
- **Framer Motion 12.23.26** - Animations
- **Lucide React 0.561.0** - Icon library
- **Lottie React 2.4.0** - Lottie animations
- **Emoji Mart** - Emoji picker
- **Vanilla CSS** - Custom styling

### Advanced Features
- **@mediapipe/face_mesh** - Face tracking for AR effects
- **@mediapipe/selfie_segmentation** - Virtual backgrounds
- **Chess.js** - Chess game logic
- **React Chessboard** - Chess UI
- **React Markdown** - Markdown rendering
- **i18next** - Internationalization

### Development Tools
- **Terser** - Code minification
- **gh-pages** - GitHub Pages deployment

---

## Core Features

### 1. Authentication & User Management

**Features:**
- Email/password authentication via Firebase Auth
- User registration with automatic profile creation
- Password reset functionality
- OTP verification flow
- Session management with localStorage/sessionStorage
- Protected routes

**Key Components:**
- `Login.jsx` - Login form
- `Signup.jsx` - Registration form
- `VerifyOtp.jsx` - OTP verification
- `ProtectedRoute.jsx` - Route guard

**Services:**
- `AuthService.js` - Firebase authentication operations

---

### 2. Messaging & Chat

**Features:**
- **Individual Chats** - One-on-one messaging
- **Group Chats** - Multi-participant conversations
- **Message Types:**
  - Text messages
  - Image/video messages
  - Audio messages
  - Document attachments
  - Voice notes
  - Polls
  - Location sharing
  - Contact cards
  - Game invites
- **Message Features:**
  - Reply to messages
  - Forward messages
  - Delete messages (for me/everyone)
  - Star messages
  - Message reactions
  - Message threading
  - Typing indicators
  - Read receipts
  - Message status (sent/delivered/read)
  - Message translation
- **Chat Management:**
  - Pin chats
  - Archive chats
  - Mute notifications
  - Search messages
  - Advanced search (filters by type, date, sender)
  - Starred messages collection
  - Chat wallpaper customization
  - Chat lock with PIN

**Key Components:**
- `ChatList.jsx` - List of all chats
- `ChatWindow.jsx` - Main chat interface
- `MessageBubble.jsx` - Individual message rendering
- `MessageList.jsx` - Scrollable message list
- `NewChat.jsx` - Create new chat
- `GroupInfo.jsx` - Group details and management (97KB - very comprehensive)
- `ArchivedChats.jsx` - Archived conversations
- `AttachmentMenu.jsx` - File attachment options
- `PollBubble.jsx` - Poll message display
- `PollModal.jsx` - Create poll
- `TypingIndicator.jsx` - Real-time typing status

**Services:**
- `ChatFirebaseService.js` - Chat CRUD operations
- `MessageFirebaseService.js` - Message operations
- `ChatService.js` - Additional chat utilities
- `TranslationService.js` - Message translation
- `OfflineMessageService.js` - Offline message handling

---

### 3. Voice & Video Calls

**Features:**
- **Call Types:**
  - Voice calls (audio-only)
  - Video calls
  - Group calls (multiple participants)
  - Walkie-Talkie mode (push-to-talk)
- **Advanced Call Features:**
  - Virtual backgrounds (AI-powered selfie segmentation)
  - Noise cancellation
  - Call reactions (emoji reactions during calls)
  - Avatar customization with AR effects
  - Screen sharing
  - Call recording
  - Call history tracking
- **Call Quality:**
  - WebRTC peer-to-peer connection
  - Adaptive bitrate
  - Network quality indicators
  - Auto-reconnection

**Key Components:**
- `CallOverlay.jsx` - Active call interface
- `CallsTab.jsx` - Call history list
- `IncomingCallNotification.jsx` - Incoming call alert
- `ParticipantGrid.jsx` - Multi-participant video grid
- `VirtualBackgroundPicker.jsx` - Background selection
- `NoiseCancellationControl.jsx` - Audio controls
- `CallReactionsOverlay.jsx` - Reaction display
- `CallReactionsPicker.jsx` - Emoji picker for calls
- `AvatarCustomization.jsx` - Avatar effects
- `WalkieTalkieModal.jsx` - Push-to-talk interface

**Services:**
- `WebRTCService.js` - WebRTC connection management (21KB)
- `SignalingService.js` - WebRTC signaling (23KB)
- `CallFirebaseService.js` - Call history
- `GroupCallManager.js` - Multi-party call orchestration
- `VirtualBackgroundService.js` - Background effects
- `NoiseCancellationService.js` - Audio processing
- `CallReactionsService.js` - Reaction handling
- `CallRecordingService.js` - Recording functionality
- `WalkieTalkieService.js` - Push-to-talk service

**Context:**
- `CallContext` - Global call state management

---

### 4. Status Updates (Stories)

**Features:**
- Create image/video/text status updates
- 24-hour automatic expiry
- Privacy controls (who can view)
- View status from contacts
- Status viewers tracking
- Mute status updates from specific contacts

**Key Components:**
- Status creation and viewing UI
- Privacy settings for status

**Services:**
- `StatusFirebaseService.js` - Status CRUD operations

---

### 5. Channels

**Features:**
- Broadcast channels (one-to-many communication)
- Channel creation and management
- Subscribe/unsubscribe functionality
- Channel updates feed

**Services:**
- Firebase integration for channels

---

### 6. Integrated Games

**Features:**
- **Supported Games:**
  - Chess (full game logic with chess.js)
  - Ludo (multiplayer board game)
  - Tic-Tac-Toe
  - Snake & Ladders
- **Game Features:**
  - Send game invites in chat
  - Multiplayer support
  - Spectator mode (watch ongoing games)
  - Game history and replay
  - In-game chat
  - Move history tracking
  - Floating game view (play while chatting)

**Key Components:**
- `ChessGame.jsx` - Chess implementation
- `LudoGame.jsx` - Ludo game
- `TicTacToeGame.jsx` - Tic-Tac-Toe
- `SnakeLaddersGame.jsx` - Snake & Ladders
- `GameInviteModal.jsx` - Send game invites
- `GameInviteBubble.jsx` - Game invite message
- `GameSpectatorMode.jsx` - Watch games
- `GameHistoryPanel.jsx` - View past games
- `GlobalGameUI.jsx` - Global game interface
- `FloatingGameView.jsx` - Minimized game window
- `GameChatPanel.jsx` - In-game chat
- `GameReplayViewer.jsx` - Replay past games
- `MoveHistoryPanel.jsx` - Track moves

**Services:**
- `GameService.js` - Game logic and state management
- `ReplayEngine.js` - Game replay functionality

---

### 7. Settings & Customization

**Features:**
- **Profile Settings:**
  - Name, avatar, about, phone number
  - Avatar generation with DiceBear
  - Profile photo upload
- **Appearance:**
  - Light/Dark theme
  - Custom app color
  - Chat bubble colors (incoming/outgoing)
  - Chat wallpapers (per-chat or global)
  - Font size adjustment
  - Logo effects
- **Privacy Settings:**
  - Last seen visibility (everyone/contacts/nobody)
  - Profile photo visibility
  - About visibility
  - Status privacy
  - Read receipts
  - Blocked users management
- **Security:**
  - App lock with PIN
  - Chat lock (individual chat PINs)
  - Archive lock
  - Two-step verification support
- **Notifications:**
  - Push notification preferences
  - Notification sounds
  - In-app notifications
  - Per-chat notification settings
- **Call Settings:**
  - Virtual background preferences
  - Noise cancellation toggle
  - Call quality settings
- **Storage Management:**
  - View storage usage
  - Clear cache
  - Manage media downloads
- **Language:**
  - Multi-language support (i18next)
  - Translation preferences

**Key Components:**
- `SettingsTab.jsx` - Main settings interface (71KB - comprehensive)
- `AvatarSettings.jsx` - Avatar customization
- `PrivacySettings.jsx` - Privacy controls
- `CallSettings.jsx` - Call preferences
- `BlockedUsersList.jsx` - Manage blocked users
- `StorageManagement.jsx` - Storage analytics
- `StarredMessagesScreen.jsx` - Starred messages
- Privacy sub-components:
  - `LastSeenPrivacy.jsx`
  - `ProfilePhotoPrivacy.jsx`
  - `AboutPrivacy.jsx`

**Services:**
- `SettingsService.js` - User settings persistence

---

### 8. Notifications

**Features:**
- **Firebase Cloud Messaging (FCM):**
  - Push notifications
  - Foreground notifications
  - Background notifications (service worker)
  - Notification permission management
  - FCM token management
- **In-app Notifications:**
  - New message notifications
  - Call notifications
  - Status update notifications
  - Follow request notifications
- **Notification Bell:**
  - Unread notification count
  - Notification center

**Key Components:**
- `NotificationBell.jsx` - Notification icon with badge
- `NotificationPrompt.jsx` - Request notification permission

**Services:**
- `UnifiedNotificationService.js` - Notification orchestration
- `NotificationFirebaseService.js` - FCM integration
- `notificationService.js` - Core notification logic

**Storage:**
- FCM token stored in localStorage
- Notification preferences in user settings

---

### 9. Group Management

**Features:**
- Create groups with multiple participants
- Group info and settings
- Add/remove participants
- Group admin controls
- Group roles (owner, admin, member)
- Group invite links (shareable URLs)
- Join groups via invite link
- Group description and icon
- Group wallpaper

**Key Components:**
- `GroupInfo.jsx` - Comprehensive group management (97KB)
- `JoinGroupPage.jsx` - Join via invite link

**Services:**
- `GroupService.js` - Group operations
- `GroupInviteLinkService.js` - Invite link generation and validation

---

### 10. User Contacts & Social

**Features:**
- Contact list management
- User search
- Follow/unfollow system
- Follow requests (accept/reject)
- Followers/Following lists
- User profile viewing
- Blocked users

**Services:**
- `UserService.js` - User profile operations
- `FollowFirebaseService.js` - Follow relationship management (21KB)

---

### 11. Additional Features

**Music Sharing:**
- Music session service
- Music share requests
- Collaborative music listening

**Offline Support:**
- Offline message queuing
- Auto-sync when online
- Offline banner notification

**WebSocket Integration:**
- Real-time signaling
- Presence tracking
- Event broadcasting

**UI Feedback:**
- Toast notifications
- Loading states
- Error handling
- Confirmation dialogs

**Components:**
- `MusicSessionService.js` - Music sharing
- `MusicRequestModal.jsx` - Request music
- `MusicShareRequest.jsx` - Share music
- `OfflineBanner.jsx` - Offline indicator
- `UIFeedback.jsx` - Feedback system
- `WebSocketService.js` - WebSocket management

---

## Module Structure

### Feature Modules (11 Total)

Each feature module follows a consistent structure:

```
features/<module-name>/
├── components/       # UI components
├── hooks/           # Feature-specific hooks (optional)
├── context/         # Feature context (optional)
└── utils/           # Feature utilities (optional)
```

#### 1. `features/auth/`
- **Purpose:** User authentication and registration
- **Components:** Login, Signup, VerifyOtp
- **Services:** AuthService

#### 2. `features/chat/`
- **Purpose:** Messaging and conversations
- **Components:** 24 components including ChatWindow, MessageBubble, GroupInfo
- **Hooks:** Chat-specific hooks
- **Sub-modules:**
  - `message/` - Message components
  - `threading/` - Message threading

#### 3. `features/call/`
- **Purpose:** Voice and video calls
- **Components:** 9 components including CallOverlay, ParticipantGrid
- **Context:** CallContext
- **Advanced Features:** Virtual backgrounds, noise cancellation, reactions

#### 4. `features/channels/`
- **Purpose:** Broadcast channels
- **Components:** Channel management UI

#### 5. `features/games/`
- **Purpose:** Integrated multiplayer games
- **Components:** 18+ components for Chess, Ludo, Tic-Tac-Toe, Snake & Ladders
- **Sub-modules:**
  - `chess/` - Chess game
  - `ludo/` - Ludo game
  - `snake-ladders/` - Snake & Ladders
  - `replay/` - Game replay system

#### 6. `features/groups/`
- **Purpose:** Group chat management
- **Components:** Group creation, invite links, join page

#### 7. `features/notifications/`
- **Purpose:** Notification handling
- **Components:** Notification UI

#### 8. `features/settings/`
- **Purpose:** User preferences and customization
- **Components:** 7+ components for various settings
- **Sub-modules:**
  - `privacy/` - Privacy-specific settings

#### 9. `features/status/`
- **Purpose:** Status updates (stories)
- **Components:** Status creation and viewing

#### 10. `features/updates/`
- **Purpose:** Updates tab and news feed
- **Components:** Updates UI

#### 11. `features/users/`
- **Purpose:** User profiles and contacts
- **Components:** Profile viewing, user search

---

## Firebase Integration

### Firebase Services (12 Total)

Located in `src/services/firebase/`:

1. **AuthService.js** - Authentication (login, signup, logout)
2. **UserService.js** - User profiles and contact management
3. **ChatFirebaseService.js** - Chat operations (22KB - comprehensive)
4. **MessageFirebaseService.js** - Message CRUD operations
5. **StatusFirebaseService.js** - Status updates
6. **CallFirebaseService.js** - Call history
7. **SettingsService.js** - User settings persistence
8. **GroupService.js** - Group management
9. **FollowFirebaseService.js** - Follow relationships (21KB)
10. **NotificationFirebaseService.js** - FCM notifications
11. **FirebaseService.js** - Core Firebase utilities
12. **index.js** - Service exports

### Firebase Configuration

**Location:** `src/config/firebaseConfig.js`

**Services Initialized:**
- Firebase App
- Firestore
- Realtime Database
- Authentication
- Storage
- Cloud Messaging (FCM)

**Environment Variables:**
```env
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
```

### Firebase Data Models

**Firestore Collections:**
- `users` - User profiles
- `chats` - Chat metadata
  - `chats/{chatId}/userSettings` - Per-user chat settings
- `calls` - Call history
- `statusUpdates` - Status/stories
- `channels` - Broadcast channels
- `gameConfigs` - Game configurations
- `follows` - Follow relationships
- `groupInviteLinks` - Group invite URLs
- `notifications` - User notifications

**Realtime Database:**
- `/messages/{chatId}` - Chat messages
- `/typing/{chatId}` - Typing indicators
- `/presence/{userId}` - User online status

### Firebase Security Rules

**Firestore Rules:** `firestore.rules`
- User data protected by ownership
- Chat access restricted to participants
- Follow system with proper validation
- Group invite link access control

**Realtime DB Rules:** `database.rules.json`
- Message access by chat participants
- Typing indicator permissions

---

## State Management

### Global State (AppContext)

**Location:** `src/shared/context/AppContext.jsx` (2061 lines - very comprehensive)

**State Managed:**
- Authentication state (`isAuthenticated`, `user`)
- Chat data (all user chats)
- Active chat selection
- Theme (light/dark mode)
- Chat settings (colors, wallpapers, font size)
- Security settings (app lock, chat lock, PINs)
- Privacy settings
- Notification state (FCM token, permission)
- Language preference
- Session management
- Online/offline status
- Logo effects
- Follow requests
- Blocked users

**Storage Integration:**
- **localStorage:** Persistent data (auth, theme, settings)
- **sessionStorage:** Temporary data (active session)
- **Cookies:** Optional cookie-based storage

**Custom Hooks Used:**
- `useLocalStorage` - Persistent storage
- `useSessionStorage` - Session storage
- `useCookie` - Cookie management
- `useNotifications` - FCM integration

### Call State (CallContext)

**Location:** `src/features/call/context/CallContext.jsx`

**State Managed:**
- Active call state
- Call participants
- Call type (voice/video/group)
- Call quality metrics
- Virtual background state
- Noise cancellation state

---

## Routing & Navigation

### Multi-Layout System

The app uses responsive layouts based on screen size:

**Layouts:**
1. **MobileLayout** - For mobile devices
2. **TabletLayout** - For tablets
3. **DesktopLayout** - For desktop browsers

**Layout Selector:** Automatically chooses layout based on `useResponsive()` hook

### Route Structure

**Public Routes:**
- `/login` - Login page
- `/signup` - Registration page
- `/verify-otp` - OTP verification

**Protected Routes:**
All other routes require authentication via `ProtectedRoute` component.

**Main Navigation Tabs (Mobile):**
- Chats
- Calls
- Status Updates
- Settings

**Additional Routes:**
- Individual chat view
- Group info
- New chat/group
- Settings sub-pages
- Game interfaces
- 
Join group via invite link

### Protected Route Implementation

Uses Firebase Auth state to guard routes. Redirects to `/login` if not authenticated.

---

## Service Layer

### Architecture

The service layer provides a **backend-agnostic abstraction**:

```
Components → Feature Hooks → Service Config → Firebase/REST Services
```

**Service Config:** `src/shared/hooks/data/serviceConfig.js`

Toggle between backends:
```javascript
const USE_FIREBASE = true; // or false for REST API
```

### Service Categories

#### 1. Firebase Services (`src/services/firebase/`)
- Real-time subscriptions
- Direct Firebase SDK integration
- Optimized for Firebase features

#### 2. REST API Services (`src/services/api/`)
Template services for backend integration:
- `authRestService.js`
- `userRestService.js`
- `chatRestService.js`
- `messageRestService.js`
- `statusRestService.js`
- `callRestService.js`
- `settingsRestService.js`
- `notificationRestService.js`

**API Client:** `src/shared/utils/apiClient.js`
- Axios-based HTTP client
- Automatic token management
- Request/response interceptors
- Error handling

#### 3. Specialized Services (`src/services/`)
- `WebRTCService.js` - WebRTC peer connections
- `WebSocketService.js` - WebSocket communication
- `SignalingService.js` - Call signaling
- `TranslationService.js` - Message translation
- `AvatarService.js` - Avatar generation (DiceBear)
- `PollService.js` - Poll functionality
- `GameService.js` - Game logic
- `MusicSessionService.js` - Music sharing
- `OfflineMessageService.js` - Offline sync
- `UnifiedNotificationService.js` - Notification orchestration
- `VirtualBackgroundService.js` - AI background effects
- `NoiseCancellationService.js` - Audio processing
- `CallReactionsService.js` - Call reactions
- `CallRecordingService.js` - Call recording
- `GroupCallManager.js` - Multi-party calls
- `GroupInviteLinkService.js` - Invite link management
- `WalkieTalkieService.js` - Push-to-talk
- `ReplayEngine.js` - Game replay

### Data Fetching Hooks

**Generic Hooks:**
- `useFetch` - GET operations with caching
- `useFetchRealtime` - Real-time subscriptions
- `useMutation` - CREATE/UPDATE/DELETE operations
- `useCRUD` - Complete resource management

**Feature Hooks:**
- `useAuth` - Authentication
- `useUser` - User profiles
- `useChats` - Chat operations
- `useMessages` - Messaging
- `useStatus` - Status updates
- `useCalls` - Call history
- `useSettings` - User settings

---

## Security & Privacy

### Authentication
- Firebase Authentication (email/password)
- Session management with secure tokens
- Protected routes
- Auto logout on token expiration

### Privacy Controls
- Last seen visibility (everyone/contacts/nobody)
- Profile photo visibility
- About text visibility
- Status privacy settings
- Read receipt toggle
- Blocked users list

### Security Features
- App lock with PIN
- Individual chat lock with PIN
- Archive lock with PIN
- Two-step verification support
- End-to-end encryption ready (via Firebase)

### Firestore Security Rules
- User data access restricted to owner
- Chat access limited to participants
- Follow relationships validated
- Group invite links properly secured
- Notifications scoped to user

### Data Privacy
- Local storage for sensitive settings
- Secure cookie options (HttpOnly, Secure, SameSite)
- Firebase Cloud Messaging with token management
- No plaintext password storage

---

## Deployment & Build

### Build Configuration

**Build Tool:** Vite 6.2.0

**Config:** `vite.config.js`
- React plugin
- Code splitting
- Terser minification
- Asset optimization

### Scripts

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

### Deployment Target

**GitHub Pages:** `https://koushikdama.github.io/whatsapp-mobile-clone`

### Environment Setup

1. Copy `.env.local.example` to `.env.local`
2. Configure Firebase credentials
3. (Optional) Set REST API base URL for future backend

### Firebase Deployment

```bash
# Deploy Firestore rules
firebase deploy --only firestore:rules

# Deploy Realtime Database rules
firebase deploy --only database

# Deploy all Firebase resources
firebase deploy
```

### Service Worker

**Location:** `/public/firebase-messaging-sw.js`

Handles background push notifications via FCM.

---

## Key File References

### Large/Critical Files
- `AppContext.jsx` - 2061 lines (global state)
- `GroupInfo.jsx` - 97KB (group management)
- `SettingsTab.jsx` - 71KB (settings interface)
- `ChatWindow.jsx` - 40KB (main chat UI)
- `SignalingService.js` - 23KB (WebRTC signaling)
- `ChatFirebaseService.js` - 22KB (chat operations)
- `WebRTCService.js` - 21KB (WebRTC management)
- `FollowFirebaseService.js` - 21KB (social features)

### Documentation Files
- `FIREBASE_README.md` - Firebase migration guide
- `DATA_HOOKS_GUIDE.md` - Data fetching patterns
- `FCM_NOTIFICATIONS_GUIDE.md` - Push notifications setup

### Configuration Files
- `firestore.rules` - Firestore security rules
- `database.rules.json` - Realtime DB rules
- `firestore.indexes.json` - Firestore indexes
- `firebase.json` - Firebase project config
- `.firebaserc` - Firebase project ID

---

## Future Enhancements

Based on the codebase structure, potential improvements include:

1. **Backend Migration:** Switch from Firebase to custom REST API using the existing service abstraction
2. **End-to-End Encryption:** Implement custom E2E encryption layer
3. **Media Streaming:** Add live video streaming for channels
4. **Advanced AI:** Enhance virtual backgrounds with more AI models
5. **More Games:** Expand game library
6. **Desktop App:** Electron wrapper for desktop application
7. **Payment Integration:** In-app payments for premium features

---

## Getting Started (Quick Setup)

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Firebase account (already configured)

### Installation

```bash
# Clone repository
git clone <repo-url>

# Install dependencies
npm install

# Setup environment
cp .env.local.example .env.local

# Start development server
npm run dev
```

### First Run

1. Open `http://localhost:5173` (or port shown)
2. Create an account (Signup)
3. Login with created credentials
4. Grant notification permissions (optional)
5. Start chatting!

---

## Support & Maintenance

### Browser Compatibility
- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari 16.4+ (iOS support)
- ⚠️ Safari <16.4 (limited features)

### Known Limitations
- WebRTC requires HTTPS (works on localhost)
- Push notifications need HTTPS
- Some features require modern browser APIs

### Troubleshooting

Check existing documentation:
- Firebase connection issues → `FIREBASE_README.md`
- Data fetching problems → `DATA_HOOKS_GUIDE.md`
- Notification issues → `FCM_NOTIFICATIONS_GUIDE.md`

---

## Conclusion

This WhatsApp clone is a **production-ready, feature-rich** messaging application with:
- ✅ Comprehensive messaging features
- ✅ WebRTC voice/video calls with advanced effects
- ✅ Real-time Firebase backend
- ✅ Extensible architecture (Firebase ↔ REST API)
- ✅ Rich customization and privacy controls
- ✅ Integrated multiplayer games
- ✅ Mobile-first responsive design
- ✅ Push notification support

The modular architecture and service abstraction make it highly maintainable and scalable for future enhancements.
