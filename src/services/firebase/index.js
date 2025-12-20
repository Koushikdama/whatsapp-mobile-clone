/**
 * Firebase Services Export
 * Centralized export for all Firebase services
 */

// Core Firebase Config
export * from '../../config/firebaseConfig';

// Core Services
export { default as FirebaseService } from './FirebaseService';
export { handleFirebaseError, FirebaseError } from './FirebaseService';

// Authentication
export { default as authService } from './AuthService';

// User Management
export { default as userService } from './UserService';

// Settings
export { default as settingsService } from './SettingsService';

// Chat Management
export { default as chatFirebaseService } from './ChatFirebaseService';

// Messaging
export { default as messageFirebaseService } from './MessageFirebaseService';

// Status Updates
export { default as statusFirebaseService } from './StatusFirebaseService';

// Calls
export { default as callFirebaseService } from './CallFirebaseService';

// Migration
export { default as migrationService } from '../migration/migrationService';
