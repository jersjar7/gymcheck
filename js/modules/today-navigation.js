import { AppState } from '../core/state.js';
import { formatDate, getCurrentDate, loadJSON } from '../core/utils.js';
import { createExerciseElement } from '../ui/components.js';

export class TodayNavigation {
    static currentViewDate = null;
    static allWorkoutDays = [];
    static currentDayIndex = -1;
    static loadedPlans = new Map(); // Cache for loaded plans

    static async init() {
        this.setupEventListeners();
        await this.loadAllWorkoutDays();
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

    static async loadAllWorkoutDays() {
        this.allWorkoutDays = [];
        this.loadedPlans.clear();

        // Get all available plans from active plans config
        const availablePlans = this.getAvailablePlans();

        // Load days from all available plans
        for (const planInfo of availablePlans) {
            try {
                const planData = await this.loadPlan(planInfo.fullPath);
                this.loadedPlans.set(planInfo.fullPath, planData);
                this.addDaysFromPlan(planData, planInfo);
            } catch (error) {
                console.warn(`Failed to load plan: ${planInfo.fullPath}`, error);
            }
        }

        // Sort all days by date
        this.allWorkoutDays.sort((a, b) => new Date(a.date) - new Date(b.date));

        console.log(`Loaded ${this.allWorkoutDays.length} workout days from ${availablePlans.length} plans`);
    }

    static getAvailablePlans() {
        const plans = [];

        // Add current active plan
        if (AppState.activePlans.activePlans?.workout) {
            plans.push(AppState.activePlans.activePlans.workout);
        }

        // Add upcoming plan
        if (AppState.activePlans.upcomingPlans?.workout) {
            plans.push(AppState.activePlans.upcomingPlans.workout);
        }

        // Add plans from plan history
        if (AppState.activePlans.planHistory) {
            AppState.activePlans.planHistory.forEach(plan => {
                if (plan.workout || plan.fullPath) {
                    plans.push({
                        fileName: plan.workout || plan.fileName,
                        fullPath: plan.fullPath || `plans/2025/workouts/${plan.workout || plan.fileName}`,
                        startDate: plan.startDate,
                        endDate: plan.endDate,
                        planType: plan.planType || 'workout',
                        part: plan.part
                    });
                }
            });
        }

        // Add some common plans based on the current date and structure
        const currentDate = getCurrentDate();
        const currentYear = currentDate.split('-')[0];
        const currentMonth = parseInt(currentDate.split('-')[1]);

        // Add June plan if we're in late June or early July
        if (currentMonth === 6 || (currentMonth === 7 && parseInt(currentDate.split('-')[2]) <= 5)) {
            const junePlan = {
                fileName: 'june-2025.json',
                fullPath: 'plans/2025/workouts/june-2025.json',
                startDate: '2025-06-23',
                endDate: '2025-06-30',
                planType: 'workout'
            };
            if (!plans.some(p => p.fullPath === junePlan.fullPath)) {
                plans.push(junePlan);
            }
        }

        // Add July plans
        if (currentMonth === 7 || (currentMonth === 6 && parseInt(currentDate.split('-')[2]) >= 25)) {
            const julyPart1 = {
                fileName: 'july-2025-part1.json',
                fullPath: 'plans/2025/workouts/july-2025-part1.json',
                startDate: '2025-07-01',
                endDate: '2025-07-15',
                planType: 'half-month',
                part: 1
            };
            const julyPart2 = {
                fileName: 'july-2025-part2.json',
                fullPath: 'plans/2025/workouts/july-2025-part2.json',
                startDate: '2025-07-16',
                endDate: '2025-07-31',
                planType: 'half-month',
                part: 2
            };

            if (!plans.some(p => p.fullPath === julyPart1.fullPath)) {
                plans.push(julyPart1);
            }
            if (!plans.some(p => p.fullPath === julyPart2.fullPath)) {
                plans.push(julyPart2);
            }
        }

        return plans;
    }

    static async loadPlan(fullPath) {
        // Check cache first
        if (this.loadedPlans.has(fullPath)) {
            return this.loadedPlans.get(fullPath);
        }

        // Load from file
        try {
            const planData = await loadJSON(fullPath);
            return planData;
        } catch (error) {
            console.error(`Failed to load plan from ${fullPath}:`, error);
            throw error;
        }
    }

    static addDaysFromPlan(planData, planInfo) {
        if (!planData.weeks) return;

        // Extract days from this plan
        for (const weekKey in planData.weeks) {
            const weekData = planData.weeks[weekKey];
            if (weekData.days) {
                for (const dayKey in weekData.days) {
                    const dayData = weekData.days[dayKey];
                    this.allWorkoutDays.push({
                        ...dayData,
                        weekKey,
                        dayKey,
                        weekNumber: weekData.weekNumber || parseInt(weekKey.replace('week', '')),
                        planInfo: planInfo, // Store plan info with each day
                        planData: planData // Store plan data for context
                    });
                }
            }
        }
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
            let closestDiff = Math.abs(new Date(this.allWorkoutDays[0]?.date || today) - todayDate);

            for (let i = 1; i < this.allWorkoutDays.length; i++) {
                const diff = Math.abs(new Date(this.allWorkoutDays[i].date) - todayDate);
                if (diff < closestDiff) {
                    closestDiff = diff;
                    closestIndex = i;
                }
            }

            this.currentDayIndex = closestIndex;
            if (this.allWorkoutDays[closestIndex]) {
                this.currentViewDate = this.allWorkoutDays[closestIndex].date;
            }
        }

        this.updateWorkoutView();
        this.updateNavigationState();
    }

    static async navigateWorkout(direction) {
        const newIndex = this.currentDayIndex + direction;

        if (newIndex >= 0 && newIndex < this.allWorkoutDays.length) {
            this.currentDayIndex = newIndex;
            this.currentViewDate = this.allWorkoutDays[newIndex].date;

            // Check if we need to update the active plan in AppState
            const newDay = this.allWorkoutDays[newIndex];
            const currentPlanPath = AppState.currentWorkoutPlan.planInfo?.fileName;
            const newPlanPath = newDay.planInfo?.fileName;

            if (currentPlanPath !== newPlanPath) {
                // Switch to the new plan in AppState
                AppState.setState('currentWorkoutPlan', newDay.planData);
                console.log(`Switched to plan: ${newPlanPath}`);
            }

            this.updateWorkoutView();
            this.updateNavigationState();
        }
    }

    static updateWorkoutView() {
        if (this.currentDayIndex === -1 || !this.allWorkoutDays[this.currentDayIndex]) {
            console.warn('No workout data available for current index:', this.currentDayIndex);
            return;
        }

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

        // Fix: Pass both parameters to updateViewingModeBanner
        this.updateViewingModeBanner(isToday, dayData);

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
                        <p>${dayData.notes || dayData.activity || 'Focus on recovery and preparation for tomorrow'}</p>
                    </div>
                </div>
            `;
            return;
        }

        // Show loading state
        exerciseList.innerHTML = '<div class="loading-exercises">Loading exercises...</div>';

        // Handle different workout structures
        let exercises = [];
        if (dayData.workout?.exercises) {
            exercises = dayData.workout.exercises;
        } else if (dayData.morning?.exercises) {
            exercises = dayData.morning.exercises;
        }

        // Clear loading and show content
        exerciseList.innerHTML = '';

        if (exercises.length === 0) {
            exerciseList.innerHTML = `
                <div class="no-exercises">
                    <p>No exercises planned for this day.</p>
                    <p><small>Plan: ${dayData.planInfo?.fileName || 'Unknown'}</small></p>
                </div>
            `;
            return;
        }

        exercises.forEach((exercise, index) => {
            const exerciseElement = createExerciseElement(exercise, `workout-${this.currentViewDate}-${index}`);
            exerciseList.appendChild(exerciseElement);
        });

        // Reset progress bar
        const progressFill = document.querySelector('.progress-fill');
        if (progressFill) {
            progressFill.style.width = '0%';
        }
    }

    static updateViewingModeBanner(isToday, dayData) {
        const banner = document.getElementById('viewingModeBanner');
        const viewedDate = document.querySelector('.viewed-date');

        if (banner && viewedDate) {
            if (isToday) {
                banner.style.display = 'none';
                console.log('👁️ Hidden viewing mode banner (viewing today)');
            } else {
                // Format date without duplicate day name
                const date = new Date(this.currentViewDate + 'T00:00:00');
                const formattedDate = date.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });

                const planInfo = dayData && dayData.planInfo ? ` (${dayData.planInfo.fileName})` : '';
                const dayName = dayData && dayData.dayName ? dayData.dayName : 'Unknown Day';

                viewedDate.innerHTML = `${dayName}, ${formattedDate}${planInfo}`;
                banner.style.display = 'block';
                console.log('👁️ Showed viewing mode banner:', viewedDate.innerHTML);
            }
        }
    }

    static updateWorkoutIndicator(dayData) {
    const dateIndicator = document.querySelector('.workout-date-indicator');
    const dayIndicator = document.querySelector('.workout-day-indicator');
    
    if (dateIndicator) {
        // Show day of week only (e.g., "Tuesday")
        const date = new Date(this.currentViewDate + 'T00:00:00');
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });
        dateIndicator.textContent = dayOfWeek;
    }
    
    if (dayIndicator) {
        // KEEP the full useful info: Day X • Week Y • Part Z
        const dayNumberWithinPlan = this.calculateDayNumberWithinPlan(dayData);
        const planName = dayData.planInfo?.part ? `Part ${dayData.planInfo.part}` : 
                       (dayData.planInfo?.fileName?.replace('.json', '') || 'Plan');
        dayIndicator.textContent = `Day ${dayNumberWithinPlan} • Week ${dayData.weekNumber} • ${planName}`;
    }
}

    static calculateDayNumberWithinPlan(dayData) {
        if (!dayData?.planInfo?.startDate) {
            // Fallback to global index if no plan info
            return this.currentDayIndex + 1;
        }

        // Calculate days since the start of this specific plan
        const planStartDate = new Date(dayData.planInfo.startDate + 'T00:00:00');
        const currentViewDate = new Date(this.currentViewDate + 'T00:00:00');
        const diffTime = currentViewDate - planStartDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return Math.max(1, diffDays);
    }

    static updateWorkoutMeta(dayData) {
        const dayNumberEl = document.getElementById('workoutDayNumber');
        const weekNumberEl = document.getElementById('workoutWeekNumber');
        const specialNoteEl = document.getElementById('workoutSpecialNote');
        const specialNoteText = document.getElementById('specialNoteText');

        if (dayNumberEl) {
            // FIX: Use the same logic as the navigation indicator
            const dayNumberWithinPlan = this.calculateDayNumberWithinPlan(dayData);
            dayNumberEl.textContent = `${dayNumberWithinPlan}`;
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

    // Make sure this method exists (it should already be there from the previous fix)
    static calculateDayNumberWithinPlan(dayData) {
        if (!dayData?.planInfo?.startDate) {
            // Fallback to global index if no plan info
            return this.currentDayIndex + 1;
        }

        // Calculate days since the start of this specific plan
        const planStartDate = new Date(dayData.planInfo.startDate + 'T00:00:00');
        const currentViewDate = new Date(this.currentViewDate + 'T00:00:00');
        const diffTime = currentViewDate - planStartDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

        return Math.max(1, diffDays);
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
                prevBtn.title = `Previous: ${prevDay.dayName} (${prevDay.date})`;
            }
        }

        if (nextBtn) {
            nextBtn.disabled = this.currentDayIndex >= this.allWorkoutDays.length - 1;
            if (this.currentDayIndex < this.allWorkoutDays.length - 1) {
                const nextDay = this.allWorkoutDays[this.currentDayIndex + 1];
                nextBtn.title = `Next: ${nextDay.dayName} (${nextDay.date})`;
            }
        }
    }

    static getCurrentViewingDay() {
        return this.allWorkoutDays[this.currentDayIndex] || null;
    }

    static isViewingToday() {
        return this.currentViewDate === getCurrentDate();
    }

    // Method to refresh all plans (useful for admin panel)
    static async refreshPlans() {
        await this.loadAllWorkoutDays();
        this.setToday();
    }
}

// Note: Initialization is handled in main.js after data loading