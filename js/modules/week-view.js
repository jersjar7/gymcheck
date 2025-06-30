// ===== js/modules/week-view.js =====
import { AppState } from '../core/state.js';
import { formatDate, findTodaysDayData } from '../core/utils.js';
import { createDayCard } from '../ui/components.js';

export class WeekView {
    static init() {
        AppState.onStateChange('currentWorkoutPlan', () => this.populate());
        this.setupNavigation();
        this.populate();
    }
    
    static setupNavigation() {
        const prevBtn = document.getElementById('prevWeek');
        const nextBtn = document.getElementById('nextWeek');
        
        if (prevBtn) prevBtn.addEventListener('click', () => this.navigateWeek(-1));
        if (nextBtn) nextBtn.addEventListener('click', () => this.navigateWeek(1));
    }
    
    static navigateWeek(direction) {
        // Implementation for week navigation
        console.log(`Navigate week: ${direction > 0 ? 'next' : 'previous'}`);
    }
    
    static populate() {
        if (!AppState.currentWorkoutPlan.weeks) return;
        
        this.populateWeekHeader();
        this.populateWeekProgress();
        this.populateWeekDays();
    }
    
    static populateWeekHeader() {
        const weekDates = document.querySelector('.week-dates');
        if (weekDates && AppState.activePlans.activePlans?.workout) {
            const startDate = AppState.activePlans.activePlans.workout.startDate;
            const endDate = AppState.activePlans.activePlans.workout.endDate;
            const partInfo = AppState.isHalfMonthSystem ? 
                ` - Part ${AppState.activePlans.activePlans.workout.part}` : '';
            weekDates.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}${partInfo}`;
        }
    }
    
    static populateWeekProgress() {
        // This would pull from actual progress data
        document.getElementById('workoutsCompleted').textContent = '4/5';
        document.getElementById('cardioCompleted').textContent = '5/5';
        document.getElementById('weeklyAdherence').textContent = '90%';
        document.getElementById('avgSleep').textContent = '7.2h';
    }
    
    static populateWeekDays() {
        const daysGrid = document.querySelector('.days-grid');
        if (!daysGrid || !AppState.currentWorkoutPlan.weeks) return;
        
        daysGrid.innerHTML = '';
        
        const todayData = findTodaysDayData(AppState.currentWorkoutPlan);
        const currentWeek = todayData ? todayData.weekNumber : 1;
        const weekKey = `week${currentWeek}`;
        const weekData = AppState.currentWorkoutPlan.weeks[weekKey];
        
        if (!weekData?.days) return;
        
        Object.entries(weekData.days).forEach(([dayKey, dayData]) => {
            const dayCard = createDayCard(dayData, dayKey);
            daysGrid.appendChild(dayCard);
        });
    }
}