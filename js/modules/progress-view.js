// ===== js/modules/progress-view.js =====
import { AppState } from '../core/state.js';

export class ProgressView {
    static init() {
        AppState.onStateChange('progressData', () => this.populate());
        this.setupAddDataButton();
        this.populate();
    }
    
    static setupAddDataButton() {
        const addDataBtn = document.querySelector('.add-data-btn');
        if (addDataBtn) {
            addDataBtn.addEventListener('click', () => this.showAddDataModal());
        }
    }
    
    static showAddDataModal() {
        // Implementation for adding progress data
        console.log('Show add data modal');
    }
    
    static populate() {
        this.populateProgressOverview();
        this.populateGoals();
        this.populateMeasurements();
        this.populateProgressPhotos();
    }
    
    static populateProgressOverview() {
        // Update with actual data from AppState.progressData
        document.getElementById('currentWeight').textContent = '178.2';
        document.getElementById('weightChange').textContent = '+2.8 lbs this month';
        document.getElementById('weightChange').className = 'stat-change positive';
        
        document.getElementById('benchMax').textContent = '205';
        document.getElementById('strengthChange').textContent = '+15 lbs this month';
        document.getElementById('strengthChange').className = 'stat-change positive';
        
        document.getElementById('workoutAdherence').textContent = '89%';
        document.getElementById('consistencyChange').textContent = '+12% vs last month';
        document.getElementById('consistencyChange').className = 'stat-change positive';
        
        document.getElementById('cardioStreak').textContent = '12';
        document.getElementById('cardioChange').textContent = '+5 days vs last month';
        document.getElementById('cardioChange').className = 'stat-change positive';
    }
    
    static populateGoals() {
        const goalsList = document.querySelector('.goals-list');
        if (!goalsList) return;
        
        const goals = AppState.currentWorkoutPlan.planInfo?.monthlyGoals?.specificTargets || [];
        
        goalsList.innerHTML = '';
        
        goals.forEach((goal, index) => {
            const progress = Math.random() * 100; // Would be real progress data
            const goalElement = document.createElement('div');
            goalElement.className = 'goal-item';
            goalElement.innerHTML = `
                <div class="goal-info">
                    <div class="goal-name">${goal}</div>
                    <div class="goal-progress-text">${Math.round(progress)}% complete</div>
                </div>
                <div class="goal-progress-bar">
                    <div class="goal-progress-fill" style="width: ${progress}%;"></div>
                </div>
            `;
            goalsList.appendChild(goalElement);
        });
    }
    
    static populateMeasurements() {
        // Implementation for measurements display
        const measurementsList = document.querySelector('.measurements-list');
        const recordsList = document.querySelector('.records-list');
        
        if (measurementsList) {
            measurementsList.innerHTML = `
                <div class="measurement-item">
                    <div class="measurement-name">Chest</div>
                    <div class="measurement-value">42.5" (+0.8")</div>
                </div>
                <div class="measurement-item">
                    <div class="measurement-name">Arms</div>
                    <div class="measurement-value">15.2" (+0.4")</div>
                </div>
                <div class="measurement-item">
                    <div class="measurement-name">Waist</div>
                    <div class="measurement-value">32.8" (+0.2")</div>
                </div>
                <div class="measurement-item">
                    <div class="measurement-name">Body Fat %</div>
                    <div class="measurement-value">14.2% (-0.8%)</div>
                </div>
            `;
        }
        
        if (recordsList) {
            recordsList.innerHTML = `
                <div class="measurement-item">
                    <div class="measurement-name">Leg Press</div>
                    <div class="measurement-value">385 lbs (+25)</div>
                </div>
                <div class="measurement-item">
                    <div class="measurement-name">Chest Press</div>
                    <div class="measurement-value">205 lbs (+15)</div>
                </div>
                <div class="measurement-item">
                    <div class="measurement-name">Lat Pulldown</div>
                    <div class="measurement-value">165 lbs (+10)</div>
                </div>
                <div class="measurement-item">
                    <div class="measurement-name">Shoulder Press</div>
                    <div class="measurement-value">135 lbs (+10)</div>
                </div>
            `;
        }
    }
    
    static populateProgressPhotos() {
        const photosGrid = document.querySelector('.photos-grid');
        if (!photosGrid) return;
        
        const currentPart = AppState.activePlans.activePlans?.workout?.part || 1;
        
        photosGrid.innerHTML = `
            <div class="photo-placeholder">
                <div>📷</div>
                <div>Front View</div>
                <div class="photo-date">July Part ${currentPart} Start</div>
            </div>
            <div class="photo-placeholder">
                <div>📷</div>
                <div>Side View</div>
                <div class="photo-date">July Part ${currentPart} Start</div>
            </div>
            <div class="photo-placeholder">
                <div>📷</div>
                <div>Back View</div>
                <div class="photo-date">July Part ${currentPart} Start</div>
            </div>
            <div class="photo-placeholder">
                <div>📷</div>
                <div>+ Add Latest</div>
                <div class="photo-date">Take new photo</div>
            </div>
        `;
    }
}