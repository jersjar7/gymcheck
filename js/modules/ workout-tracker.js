// ===== js/modules/workout-tracker.js =====
import { getCurrentDate } from '../core/utils.js';

export class WorkoutTracker {
    static init() {
        this.setupWorkoutTracking();
        this.setupCardioTracking();
    }
    
    static setupWorkoutTracking() {
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('exercise-checkbox')) {
                this.updateWorkoutProgress();
                this.saveExerciseProgress();
            }
        });
        
        this.loadExerciseProgress();
    }
    
    static setupCardioTracking() {
        const cardioCheckbox = document.getElementById('dailyCardio');
        if (cardioCheckbox) {
            cardioCheckbox.addEventListener('change', () => this.saveCardioProgress());
            this.loadCardioProgress();
        }
    }
    
    static updateWorkoutProgress() {
        const checkboxes = document.querySelectorAll('.exercise-checkbox');
        const checkedBoxes = document.querySelectorAll('.exercise-checkbox:checked');
        
        if (checkboxes.length === 0) return;
        
        const progress = (checkedBoxes.length / checkboxes.length) * 100;
        const progressFill = document.querySelector('.progress-fill');
        
        if (progressFill) {
            progressFill.style.width = `${progress}%`;
        }
    }
    
    static saveExerciseProgress() {
        const today = getCurrentDate();
        const checkboxes = document.querySelectorAll('.exercise-checkbox');
        const progress = {};
        
        checkboxes.forEach(checkbox => {
            progress[checkbox.dataset.exercise] = checkbox.checked;
        });
        
        localStorage.setItem(`exercise-${today}`, JSON.stringify(progress));
    }
    
    static loadExerciseProgress() {
        const today = getCurrentDate();
        const savedProgress = localStorage.getItem(`exercise-${today}`);
        
        if (savedProgress) {
            const progress = JSON.parse(savedProgress);
            Object.entries(progress).forEach(([exerciseId, isChecked]) => {
                const checkbox = document.querySelector(`[data-exercise="${exerciseId}"]`);
                if (checkbox) {
                    checkbox.checked = isChecked;
                }
            });
            this.updateWorkoutProgress();
        }
    }
    
    static saveCardioProgress() {
        const today = getCurrentDate();
        const cardioCheckbox = document.getElementById('dailyCardio');
        
        if (cardioCheckbox) {
            localStorage.setItem(`cardio-${today}`, cardioCheckbox.checked.toString());
        }
    }
    
    static loadCardioProgress() {
        const today = getCurrentDate();
        const savedProgress = localStorage.getItem(`cardio-${today}`);
        const cardioCheckbox = document.getElementById('dailyCardio');
        
        if (savedProgress && cardioCheckbox) {
            cardioCheckbox.checked = savedProgress === 'true';
        }
    }
}