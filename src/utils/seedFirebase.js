/**
 * Firebase Data Seeding Script
 * Run this script once to seed initial data from data.json to Firebase
 * 
 * Usage: Import this in your app and call seedFirebaseData() when needed
 */

import { migrationService } from '../services/migration/migrationService';
import data from '../data/data.json';

let isSeeding = false;
let hasSeeded = false;

export const seedFirebaseData = async () => {
    if (isSeeding || hasSeeded) {
        console.log('[Seeding] Already seeded or seeding in progress');
        return;
    }

    isSeeding = true;

    try {
        console.log('[Seeding] Starting Firebase data seeding...');
        console.log('[Seeding] This may take a few minutes...');
        
        const result = await migrationService.seedDataToFirebase(data);
        
        if (result.success) {
            console.log('[Seeding] ✅ Data seeding completed successfully!');
            console.log('[Seeding] Migration log:', result.log);
            hasSeeded = true;
            
            // Store in localStorage to prevent re-seeding
            localStorage.setItem('firebase_data_seeded', 'true');
            return { success: true, log: result.log };
        }
    } catch (error) {
        console.error('[Seeding] ❌ Data seeding failed:', error);
        return { success: false, error: error.message };
    } finally {
        isSeeding = false;
    }
};

export const isDataSeeded = () => {
    return localStorage.getItem('firebase_data_seeded') === 'true';
};

export const clearSeededFlag = () => {
    localStorage.removeItem('firebase_data_seeded');
    hasSeeded = false;
};

// Only export for manual use
export { migrationService };
