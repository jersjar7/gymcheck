// ===== js/systems/half-month-system.js =====
import { AppState } from '../core/state.js';
import { loadJSON, getCurrentDate } from '../core/utils.js';
import { showSuccessMessage, showErrorMessage } from '../ui/messages.js';

export class HalfMonthSystem {
    static async init() {
        if (AppState.isHalfMonthSystem) {
            await this.checkAndSwitchPlans();
        }
    }
    
    static async checkAndSwitchPlans() {
        const today = getCurrentDate();
        const currentPlan = AppState.activePlans.activePlans?.workout;
        
        if (!currentPlan) return;
        
        // Check if we need to switch from Part 1 to Part 2
        if (today > currentPlan.endDate) {
            const nextPlan = AppState.activePlans.upcomingPlans?.workout;
            if (nextPlan && nextPlan.autoActivate) {
                await this.switchToNextPlan();
            }
        }
        
        // Check if it's time to switch to Part 2 (day 16 of month)
        const dayOfMonth = parseInt(today.split('-')[2]);
        if (currentPlan.part === 1 && dayOfMonth >= 16) {
            const nextPlan = AppState.activePlans.upcomingPlans?.workout;
            if (nextPlan && nextPlan.part === 2) {
                await this.switchToNextPlan();
            }
        }
    }
    
    static async switchToNextPlan() {
        try {
            console.log('Switching to next half-month plan...');
            
            // Move current plan to history
            if (!AppState.activePlans.planHistory) {
                AppState.activePlans.planHistory = [];
            }
            
            const currentPlan = AppState.activePlans.activePlans.workout;
            AppState.activePlans.planHistory.push({
                ...currentPlan,
                status: 'completed',
                completedDate: getCurrentDate()
            });
            
            // Move upcoming plan to active
            const nextPlan = AppState.activePlans.upcomingPlans.workout;
            AppState.activePlans.activePlans.workout = {
                ...nextPlan,
                status: 'active',
                daysRemaining: this.calculateDaysRemaining(nextPlan.startDate, nextPlan.endDate)
            };
            
            // Clear upcoming (will be set when next plan is uploaded)
            AppState.activePlans.upcomingPlans = {};
            
            // Update current date and month
            AppState.activePlans.currentDate = getCurrentDate();
            AppState.activePlans.currentMonth = this.getHalfMonthKey(getCurrentDate());
            
            // Reload the new workout plan
            if (AppState.activePlans.activePlans?.workout?.fullPath) {
                const newWorkoutPlan = await loadJSON(AppState.activePlans.activePlans.workout.fullPath);
                AppState.setState('currentWorkoutPlan', newWorkoutPlan);
            }
            
            showSuccessMessage('Successfully switched to Part 2 of the month!');
            
        } catch (error) {
            console.error('Error switching plans:', error);
            showErrorMessage('Failed to switch to next plan automatically.');
        }
    }
    
    static getHalfMonthKey(dateString) {
        const date = new Date(dateString + 'T00:00:00');
        const year = date.getFullYear();
        const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
        const dayOfMonth = date.getDate();
        const part = dayOfMonth <= 15 ? 'part1' : 'part2';
        
        return `${month}-${year}-${part}`;
    }
    
    static calculateDaysRemaining(startDate, endDate) {
        const today = new Date(getCurrentDate() + 'T00:00:00');
        const end = new Date(endDate + 'T00:00:00');
        const diffTime = end - today;
        return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    
    static checkHalfMonthSwitch() {
        if (AppState.isHalfMonthSystem) {
            this.checkAndSwitchPlans();
        }
    }
}