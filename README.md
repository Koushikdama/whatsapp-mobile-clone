# WhatsApp Mobile Clone

A comprehensive WhatsApp mobile clone built with React, featuring real-time messaging, voice/video calls, status updates, integrated games, and extensive customization options.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.2.3-61dafb.svg)
![Firebase](https://img.shields.io/badge/Firebase-12.7.0-orange.svg)

## 🌟 Features

### 💬 Messaging
- **Individual & Group Chats** - Real-time messaging with multiple participants
- **Rich Media Support** - Images, videos, audio, documents, voice notes
- **Message Features** - Reply, forward, delete, star, reactions, threading
- **Advanced Features** - Typing indicators, read receipts, message translation
- **Chat Management** - Pin, archive, mute, search, wallpaper customization

### 📞 Voice & Video Calls
- **WebRTC Calls** - High-quality peer-to-peer audio/video calls
- **Group Calls** - Multi-participant video conferencing
- **Advanced Features:**
  - Virtual backgrounds (AI-powered)
  - Noise cancellation
  - Call reactions
  - Avatar effects with AR
  - Screen sharing
  - Call recording
  - Walkie-Talkie mode

### 🎮 Integrated Games
- Chess (full game logic)
- Ludo
- Tic-Tac-Toe
- Snake & Ladders
- Game invites in chat
- Spectator mode
- Game replay system

### 📱 Additional Features
- **Status Updates** - 24-hour stories with privacy controls
- **Channels** - Broadcast messaging
- **Push Notifications** - Firebase Cloud Messaging integration
- **Offline Support** - Message queuing and auto-sync
- **Multi-language** - i18next integration
- **Responsive Design** - Mobile, tablet, and desktop layouts
- **Theming** - Light/dark mode, custom colors
- **Privacy & Security** - App lock, chat lock, comprehensive privacy controls

## 🚀 Live Demo

Visit the live application: [WhatsApp Mobile Clone](https://koushikdama.github.io/whatsapp-mobile-clone)

## 📋 Documentation

- **[Complete Documentation](./DOCUMENTATION.md)** - Comprehensive application documentation
- **[Deployment Guide](./DEPLOYMENT.md)** - Step-by-step deployment instructions
- **[Firebase Setup](./FIREBASE_README.md)** - Firebase integration guide
- **[Data Hooks Guide](./DATA_HOOKS_GUIDE.md)** - Data fetching patterns
- **[Notifications Guide](./FCM_NOTIFICATIONS_GUIDE.md)** - Push notifications setup

## 🛠️ Technology Stack

- **Frontend:** React 19.2.3, React Router DOM 7.10.1
- **Build Tool:** Vite 6.2.0
- **Backend:** Firebase (Firestore, Realtime Database, Authentication, Storage, FCM)
- **Real-time:** WebRTC, WebSocket
- **UI Libraries:** Framer Motion, Lucide React, Lottie
- **Advanced:** MediaPipe (face mesh, background segmentation), Chess.js
- **Internationalization:** i18next

## ⚡ Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Firebase account

### Installation

```bash
# Clone repository
git clone https://github.com/Koushikdama/whatsapp-mobile-clone.git
cd whatsapp-mobile-clone

# Install dependencies
npm install

# Setup environment variables
cp .env.local.example .env.local
# Edit .env.local with your Firebase credentials

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Build for Production

```bash
# Create production build
npm run build

# Preview production build
npm run preview

# Deploy to GitHub Pages
npm run deploy
```

## 🔐 Environment Variables

Create a `.env.local` file in the project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_DATABASE_URL=your_database_url
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id

# Optional
VITE_GIPHY_API_KEY=your_giphy_key
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed setup instructions.

## 📁 Project Structure

```
whatsapp-mobile-clone/
├── src/
│   ├── config/              # Firebase configuration
│   ├── core/                # Core layouts and routing
│   ├── features/            # Feature modules (11 modules)
│   │   ├── auth/           # Authentication
│   │   ├── chat/           # Messaging
│   │   ├── call/           # Voice/Video calls
│   │   ├── games/          # Integrated games
│   │   └── ...
│   ├── services/            # Service layer (Firebase & REST)
│   ├── shared/              # Shared components, hooks, utilities
│   └── utils/
├── public/
├── DOCUMENTATION.md         # Complete documentation
├── DEPLOYMENT.md            # Deployment guide
└── package.json
```

## 🔒 Security

- ✅ Firebase credentials protected with environment variables
- ✅ Firestore & Realtime Database security rules configured
- ✅ Authentication with Firebase Auth
- ✅ App lock, chat lock, and privacy controls
- ✅ No sensitive data in source code

## 🌐 Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari 16.4+ (iOS support)
- ⚠️ Safari <16.4 (limited features)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Author

**Koushik Dama**
- GitHub: [@Koushikdama](https://github.com/Koushikdama)

## 🙏 Acknowledgments

- React and Vite teams
- Firebase team
- Open source community
- All contributors

## 📞 Support

For issues and questions:
- Check the [Documentation](./DOCUMENTATION.md)
- Review the [Deployment Guide](./DEPLOYMENT.md)
- Open an issue on GitHub

---

**⭐ If you find this project helpful, please give it a star!**
