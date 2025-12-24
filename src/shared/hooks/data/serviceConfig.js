/**
 * Data Service Configuration
 * Switch between Firebase and REST API by changing the selected service
 */

// Import from index barrel export
import {
    authService,
    userService,
    chatFirebaseService,
    messageFirebaseService,
    statusFirebaseService,
    callFirebaseService,
    settingsService
} from '../../../services/firebase';

// Configuration: Choose your backend
const USE_FIREBASE = true; // Set to false to use REST API

// Export selected services
export const dataServices = USE_FIREBASE 
    ? {
        auth: authService,
        user: userService,
        chat: chatFirebaseService,
        message: messageFirebaseService,
        status: statusFirebaseService,
        call: callFirebaseService,
        settings: settingsService,
    }
    : {
        // REST API services (placeholder - implement as needed)
        auth: null,
        user: null,
        chat: null,
        message: null,
        status: null,
        call: null,
        settings: null,
    };

export const config = {
    useFirebase: USE_FIREBASE,
    // REST API base URL (configure in .env file)
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
};

export default dataServices;

