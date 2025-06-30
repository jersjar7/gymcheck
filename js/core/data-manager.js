// ===== js/core/data-manager.js =====
import { loadJSON } from './utils.js';
import { AppState } from './state.js';

export class DataManager {
    static async initializeData() {
        try {
            // Load configuration files
            AppState.setState('currentSettings', await loadJSON('config/settings.json'));
            AppState.setState('activePlans', await loadJSON('config/active-plans.json'));
            
            // Detect if we're using half-month system
            const isHalfMonth = AppState.currentSettings.planStructure?.type === 'half-month' || 
                              AppState.activePlans.systemType === 'half-month';
            AppState.setState('isHalfMonthSystem', isHalfMonth);
            
            // Load active workout plan
            if (AppState.activePlans.activePlans?.workout?.fullPath) {
                const workoutPlan = await loadJSON(AppState.activePlans.activePlans.workout.fullPath);
                AppState.setState('currentWorkoutPlan', workoutPlan);
            }
            
            // Try to load progress data
            try {
                const progressData = await loadJSON('progress/monthly-progress-2025.json');
                AppState.setState('progressData', progressData);
            } catch (error) {
                AppState.setState('progressData', this.initializeProgressData());
            }
            
        } catch (error) {
            console.error('Error initializing data:', error);
            throw error;
        }
    }
    
    static initializeProgressData() {
        return {
            year: new Date().getFullYear(),
            months: {},
            lastUpdated: new Date().toISOString().split('T')[0]
        };
    }
    
    static async saveProgressData() {
        // In a real app, this would save to a backend
        // For now, just log that we would save
        console.log('Would save progress data:', AppState.progressData);
    }
}