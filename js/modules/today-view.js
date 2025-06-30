// ===== js/modules/today-view.js =====
import { AppState } from '../core/state.js';
import { findTodaysDayData } from '../core/utils.js';
import { createExerciseElement } from '../ui/components.js';

export class TodayView {
    static init() {
        // Listen for state changes to update the view
        AppState.onStateChange('currentWorkoutPlan', () => this.populate());
        this.populate();
    }
    
    static populate() {
        this.populateTodaysWorkout();
    }
    
    static populateTodaysWorkout() {
        if (!AppState.currentWorkoutPlan.weeks) return;
        
        const todayData = findTodaysDayData(AppState.currentWorkoutPlan);
        
        if (!todayData) {
            console.log('No workout data found for today');
            return;
        }
        
        const dayData = todayData.dayData;
        
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
            
            // Add special note if it exists
            if (dayData.specialNote) {
                workoutTypeElement.textContent += ` - ${dayData.specialNote}`;
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
                        <p>Focus on recovery and preparation for tomorrow</p>
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
    }
}
