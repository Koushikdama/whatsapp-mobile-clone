/**
 * Data Service Configuration
 * Switch between Firebase and REST API by changing the selected service
 */

// Import service implementations
import * as firebaseServices from '../../services/firebase';
import * as restApiServices from '../../services/api';

// Configuration: Choose your backend
const USE_FIREBASE = true; // Set to false to use REST API

// Export selected services
export const dataServices = USE_FIREBASE 
    ? {
        auth: firebaseServices.authService,
        user: firebaseServices.userService,
        chat: firebaseServices.chatFirebaseService,
        message: firebaseServices.messageFirebaseService,
        status: firebaseServices.statusFirebaseService,
        call: firebaseServices.callFirebaseService,
        settings: firebaseServices.settingsService,
    }
    : {
        // REST API services
        auth: restApiServices.authRestService,
        user: restApiServices.userRestService,
        chat: restApiServices.chatRestService,
        message: restApiServices.messageRestService,
        status: restApiServices.statusRestService,
        call: restApiServices.callRestService,
        settings: restApiServices.settingsRestService,
    };

export const config = {
    useFirebase: USE_FIREBASE,
    // REST API base URL (configure in .env file)
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
};

export default dataServices;
