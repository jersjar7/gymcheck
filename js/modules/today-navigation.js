import { AppState } from '../core/state.js';
import { formatDate, getCurrentDate } from '../core/utils.js';
import { createExerciseElement } from '../ui/components.js';

export class TodayNavigation {
    static currentViewDate = null;
    static allWorkoutDays = [];
    static currentDayIndex = -1;
    
    static init() {
        this.setupEventListeners();
        this.loadAllWorkoutDays();
        this.setToday();
    }
    
    static setupEventListeners() {
        const prevBtn = document.getElementById('prevWorkoutBtn');
        const nextBtn = document.getElementById('nextWorkoutBtn');
        const returnTodayBtn = document.getElementById('returnTodayBtn');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.navigateWorkout(-1));
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.navigateWorkout(1));
        }
        
        if (returnTodayBtn) {
            returnTodayBtn.addEventListener('click', () => this.setToday());
        }
    }
    
    static loadAllWorkoutDays() {
        this.allWorkoutDays = [];
        
        if (!AppState.currentWorkoutPlan.weeks) return;
        
        // Collect all days from all weeks
        for (const weekKey in AppState.currentWorkoutPlan.weeks) {
            const weekData = AppState.currentWorkoutPlan.weeks[weekKey];
            if (weekData.days) {
                for (const dayKey in weekData.days) {
                    const dayData = weekData.days[dayKey];
                    this.allWorkoutDays.push({
                        ...dayData,
                        weekKey,
                        dayKey,
                        weekNumber: weekData.weekNumber || parseInt(weekKey.replace('week', ''))
                    });
                }
            }
        }
        
        // Sort by date
        this.allWorkoutDays.sort((a, b) => new Date(a.date) - new Date(b.date));
    }
    
    static setToday() {
        const today = getCurrentDate();
        this.currentViewDate = today;
        
        // Find today's index
        this.currentDayIndex = this.allWorkoutDays.findIndex(day => day.date === today);
        
        if (this.currentDayIndex === -1) {
            // If today is not found, find the closest date
            const todayDate = new Date(today);
            let closestIndex = 0;
            let closestDiff = Math.abs(new Date(this.allWorkoutDays[0].date) - todayDate);
            
            for (let i = 1; i < this.allWorkoutDays.length; i++) {
                const diff = Math.abs(new Date(this.allWorkoutDays[i].date) - todayDate);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestIndex = i;
                }
            }
            
            this.currentDayIndex = closestIndex;
            this.currentViewDate = this.allWorkoutDays[closestIndex].date;
        }
        
        this.updateWorkoutView();
        this.updateNavigationState();
    }
    
    static navigateWorkout(direction) {
        const newIndex = this.currentDayIndex + direction;
        
        if (newIndex >= 0 && newIndex < this.allWorkoutDays.length) {
            this.currentDayIndex = newIndex;
            this.currentViewDate = this.allWorkoutDays[newIndex].date;
            this.updateWorkoutView();
            this.updateNavigationState();
        }
    }
    
    static updateWorkoutView() {
        if (this.currentDayIndex === -1 || !this.allWorkoutDays[this.currentDayIndex]) return;
        
        const dayData = this.allWorkoutDays[this.currentDayIndex];
        const isToday = this.currentViewDate === getCurrentDate();
        
        // Add transition effect
        const workoutCard = document.querySelector('.workout-card');
        if (workoutCard) {
            workoutCard.classList.add('workout-content-transition');
            
            setTimeout(() => {
                this.populateWorkoutContent(dayData);
                workoutCard.classList.add('loaded');
                
                setTimeout(() => {
                    workoutCard.classList.remove('workout-content-transition', 'loaded');
                }, 300);
            }, 150);
        }
        
        // Show/hide viewing mode banner
        this.updateViewingModeBanner(isToday);
        
        // Update workout indicator
        this.updateWorkoutIndicator(dayData);
        
        // Update workout metadata
        this.updateWorkoutMeta(dayData);
        
        // Update day type styling
        this.updateDayTypeStyling(dayData);
    }
    
    static populateWorkoutContent(dayData) {
        // Update workout type
        const workoutTypeElement = document.querySelector('.workout-type');
        if (workoutTypeElement) {
            if (dayData.dayType === 'rest') {
                workoutTypeElement.textContent = 'Rest Day';
            } else {
                const workoutType = dayData.workout?.workoutType || 
                                  dayData.morning?.workoutType || 
                                  'Daily Workout';
                workoutTypeElement.textContent = workoutType;
            }
        }
        
        // Populate exercises
        this.populateExercises(dayData);
    }
    
    static populateExercises(dayData) {
        const exerciseList = document.querySelector('.exercise-list');
        if (!exerciseList) return;
        
        if (dayData.dayType === 'rest') {
            exerciseList.innerHTML = `
                <div class="rest-day-content">
                    <div class="rest-message">
                        <span class="rest-icon">😴</span>
                        <h3>Rest Day</h3>
                        <p>${dayData.notes || 'Focus on recovery and preparation for tomorrow'}</p>
                    </div>
                </div>
            `;
            return;
        }
        
        exerciseList.innerHTML = '';
        
        // Handle different workout structures
        let exercises = [];
        if (dayData.workout?.exercises) {
            exercises = dayData.workout.exercises;
        } else if (dayData.morning?.exercises) {
            exercises = dayData.morning.exercises;
        }
        
        exercises.forEach((exercise, index) => {
            const exerciseElement = createExerciseElement(exercise, `workout-${index}`);
            exerciseList.appendChild(exerciseElement);
        });
        
        // Reset progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
    }
    
    static updateViewingModeBanner(isToday) {
        const banner = document.getElementById('viewingModeBanner');
        const viewedDate = document.querySelector('.viewed-date');
        
        if (banner && viewedDate) {
            if (isToday) {
                banner.style.display = 'none';
            } else {
                const dayData = this.allWorkoutDays[this.currentDayIndex];
                viewedDate.textContent = `${dayData.dayName}, ${formatDate(this.currentViewDate)}`;
                banner.style.display = 'block';
            }
        }
    }
    
    static updateWorkoutIndicator(dayData) {
        const dateIndicator = document.querySelector('.workout-date-indicator');
        const dayIndicator = document.querySelector('.workout-day-indicator');
        
        if (dateIndicator) {
            dateIndicator.textContent = formatDate(this.currentViewDate).split(',')[0];
        }
        
        if (dayIndicator) {
            const dayNumber = this.currentDayIndex + 1;
            dayIndicator.textContent = `Day ${dayNumber} • Week ${dayData.weekNumber}`;
        }
    }
    
    static updateWorkoutMeta(dayData) {
        const dayNumberEl = document.getElementById('workoutDayNumber');
        const weekNumberEl = document.getElementById('workoutWeekNumber');
        const specialNoteEl = document.getElementById('workoutSpecialNote');
        const specialNoteText = document.getElementById('specialNoteText');
        
        if (dayNumberEl) {
            dayNumberEl.textContent = `${this.currentDayIndex + 1}`;
        }
        
        if (weekNumberEl) {
            weekNumberEl.textContent = `${dayData.weekNumber}`;
        }
        
        if (specialNoteEl && specialNoteText) {
            if (dayData.specialNote) {
                specialNoteText.textContent = dayData.specialNote;
                specialNoteEl.style.display = 'flex';
            } else {
                specialNoteEl.style.display = 'none';
            }
        }
    }
    
    static updateDayTypeStyling(dayData) {
        const workoutCard = document.querySelector('.workout-card');
        if (workoutCard) {
            // Remove all day type classes
            workoutCard.classList.remove('day-type-rest', 'day-type-light', 'day-type-recovery', 'day-type-transition');
            
            // Add current day type class
            if (dayData.dayType) {
                workoutCard.classList.add(`day-type-${dayData.dayType}`);
            }
        }
    }
    
    static updateNavigationState() {
        const prevBtn = document.getElementById('prevWorkoutBtn');
        const nextBtn = document.getElementById('nextWorkoutBtn');
        
        if (prevBtn) {
            prevBtn.disabled = this.currentDayIndex <= 0;
            if (this.currentDayIndex > 0) {
                const prevDay = this.allWorkoutDays[this.currentDayIndex - 1];
                prevBtn.title = `Previous: ${prevDay.dayName}`;
            }
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentDayIndex >= this.allWorkoutDays.length - 1;
            if (this.currentDayIndex < this.allWorkoutDays.length - 1) {
                const nextDay = this.allWorkoutDays[this.currentDayIndex + 1];
                nextBtn.title = `Next: ${nextDay.dayName}`;
            }
        }
    }
    
    static getCurrentViewingDay() {
        return this.allWorkoutDays[this.currentDayIndex] || null;
    }
    
    static isViewingToday() {
        return this.currentViewDate === getCurrentDate();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    TodayNavigation.init();
});