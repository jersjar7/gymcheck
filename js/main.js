// ===== js/main.js =====
import { AppState } from './core/state.js';
import { DataManager } from './core/data-manager.js';
import { showErrorMessage } from './ui/messages.js';
import { Navigation } from './modules/navigation.js';
import { WorkoutTracker } from './modules/workout-tracker.js';
import { TodayView } from './modules/today-view.js';
import { WeekView } from './modules/week-view.js';
import { ProgressView } from './modules/progress-view.js';
import { AdminPanel } from './modules/admin-panel.js';
import { HalfMonthSystem } from './systems/half-month-system.js';
import { TodayNavigation } from './modules/today-navigation.js';

class WorkoutApp {
    constructor() {
        this.isInitialized = false;
    }

    async init() {
        try {
            console.log('Initializing Workout App...');

            // Initialize data first
            await DataManager.initializeData();

            // Initialize basic modules
            Navigation.init();
            WorkoutTracker.init();
            TodayView.init();
            WeekView.init();
            ProgressView.init();
            AdminPanel.init();

            // Initialize TodayNavigation after data is loaded
            await TodayNavigation.init();

            // Initialize half-month system if enabled
            if (AppState.isHalfMonthSystem) {
                await HalfMonthSystem.init();
                // Check for plan switching daily
                setInterval(() => HalfMonthSystem.checkHalfMonthSwitch(), 24 * 60 * 60 * 1000);
            }

            // Start UI updates
            this.updateCurrentDateTime();
            setInterval(() => this.updateCurrentDateTime(), 60000);

            this.isInitialized = true;
            console.log('Workout App initialized successfully!');

        } catch (error) {
            console.error('Failed to initialize app:', error);
            showErrorMessage('Failed to load application data. Please refresh the page.');
        }
    }

    updateCurrentDateTime() {
    const now = new Date();
    const dateElement = document.querySelector('.current-date');
    const weekInfoElement = document.querySelector('.week-info');
    
    if (dateElement) {
        dateElement.textContent = now.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    if (weekInfoElement) {
        // REMOVE the redundant info since we already show the full date above
        // and the useful Day/Week/Part info is in the navigation area
        weekInfoElement.style.display = 'none';
    }
}
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new WorkoutApp();
    app.init();
});