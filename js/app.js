// ===== GLOBAL VARIABLES =====
let currentSettings = {};
let activePlans = {};
let currentWorkoutPlan = {};
let currentNutritionPlan = {};
let currentSection = 'today';
let progressData = {};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initializeApp();
        setupEventListeners();
        updateCurrentDateTime();
        setInterval(updateCurrentDateTime, 60000); // Update every minute
    } catch (error) {
        console.error('Failed to initialize app:', error);
        showErrorMessage('Failed to load application data. Please refresh the page.');
    }
});

async function initializeApp() {
    try {
        // Load configuration files
        currentSettings = await loadJSON('config/settings.json');
        activePlans = await loadJSON('config/active-plans.json');
        
        // Load active workout and nutrition plans
        if (activePlans.activePlans?.workout?.fullPath) {
            currentWorkoutPlan = await loadJSON(activePlans.activePlans.workout.fullPath);
        }
        if (activePlans.activePlans?.nutrition?.fullPath) {
            currentNutritionPlan = await loadJSON(activePlans.activePlans.nutrition.fullPath);
        }
        
        // Try to load progress data
        try {
            progressData = await loadJSON('progress/monthly-progress-2025.json');
        } catch (error) {
            // Progress data doesn't exist yet, that's okay
            progressData = initializeProgressData();
        }
        
        // Populate all sections with data
        populateTodaySection();
        populateWeekViewSection();
        populateNutritionSection();
        populateProgressSection();
        populateAdminSection();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        throw error;
    }
}

// ===== UTILITY FUNCTIONS =====
async function loadJSON(filepath) {
    try {
        const response = await fetch(filepath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error loading ${filepath}:`, error);
        throw error;
    }
}

function getCurrentDate() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function getTodaysDayNumber() {
    const today = getCurrentDate();
    const planStart = activePlans.activePlans?.workout?.startDate;
    
    if (!planStart) return 1;
    
    const startDate = new Date(planStart + 'T00:00:00');
    const currentDate = new Date(today + 'T00:00:00');
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(1, diffDays);
}

function getWeekAndDay(dayNumber) {
    const weekNumber = Math.ceil(dayNumber / 7);
    const dayInWeek = ((dayNumber - 1) % 7) + 1;
    return { week: weekNumber, day: dayInWeek };
}

function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.insertBefore(successDiv, document.body.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}

// ===== NAVIGATION =====
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.dataset.section;
            switchSection(section);
        });
    });
    
    // Admin functionality
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', handlePasswordSubmit);
    }
    
    const lockBtn = document.getElementById('lockBtn');
    if (lockBtn) {
        lockBtn.addEventListener('click', lockAdminPanel);
    }
    
    // Tab switching in admin
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;
            switchAdminTab(tabName);
        });
    });
    
    // File upload
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('drop', handleFileDrop);
        fileInput.addEventListener('change', handleFileSelect);
    }
    
    // Water tracking - FIXED: Changed from setupWaterTracking to setupHydrationTracking
    setupHydrationTracking();
    
    // Notes saving
    const saveNotesBtn = document.querySelector('.save-notes-btn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', saveNotes);
    }
    
    // Exercise checkboxes
    setupExerciseTracking();
}

function switchSection(sectionName) {
    // Update navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
    
    // Update sections
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionName).classList.add('active');
    
    currentSection = sectionName;
}

function updateCurrentDateTime() {
    const now = new Date();
    const dateElement = document.querySelector('.current-date');
    const weekInfoElement = document.querySelector('.week-info');
    
    if (dateElement) {
        dateElement.textContent = formatDate(getCurrentDate());
    }
    
    if (weekInfoElement && currentWorkoutPlan.planInfo) {
        const dayNumber = getTodaysDayNumber();
        const { week, day } = getWeekAndDay(dayNumber);
        weekInfoElement.textContent = `Week ${week}, Day ${day}`;
    }
}

// ===== TODAY SECTION =====
function populateTodaySection() {
    populateTodaysWorkout();
    populateTodaysNutrition();
    loadTodaysNotes();
}

function populateTodaysWorkout() {
    if (!currentWorkoutPlan.weeks) return;
    
    const dayNumber = getTodaysDayNumber();
    const { week, day } = getWeekAndDay(dayNumber);
    
    // Find today's workout
    const weekKey = `week${week}`;
    const dayKey = `day${dayNumber}`;
    
    const weekData = currentWorkoutPlan.weeks[weekKey];
    const dayData = weekData?.days?.[dayKey];
    
    if (!dayData) return;
    
    // Update workout type
    const workoutTypeElement = document.querySelector('.workout-type');
    if (workoutTypeElement) {
        if (dayData.dayType === 'rest') {
            workoutTypeElement.textContent = 'Rest Day';
        } else if (dayData.morning?.workoutType) {
            workoutTypeElement.textContent = dayData.morning.workoutType;
        }
    }
    
    // Populate exercises
    const exerciseList = document.querySelector('.exercise-list');
    if (exerciseList && dayData.dayType === 'workout') {
        exerciseList.innerHTML = '';
        
        // Morning exercises
        if (dayData.morning?.exercises) {
            const morningHeader = document.createElement('div');
            morningHeader.className = 'exercise-section-header';
            morningHeader.innerHTML = '<h3>🌅 Morning Session</h3>';
            exerciseList.appendChild(morningHeader);
            
            dayData.morning.exercises.forEach((exercise, index) => {
                const exerciseElement = createExerciseElement(exercise, `morning-${index}`);
                exerciseList.appendChild(exerciseElement);
            });
        }
        
        // Afternoon exercises (for twice-daily)
        if (dayData.afternoon?.primaryExercise) {
            const afternoonHeader = document.createElement('div');
            afternoonHeader.className = 'exercise-section-header';
            afternoonHeader.innerHTML = '<h3>🌅 Afternoon Session</h3>';
            exerciseList.appendChild(afternoonHeader);
            
            const cardioElement = document.createElement('div');
            cardioElement.className = 'exercise-item';
            cardioElement.innerHTML = `
                <input type="checkbox" class="exercise-checkbox" data-exercise="afternoon-cardio">
                <div class="exercise-details">
                    <div class="exercise-name">${dayData.afternoon.primaryExercise}</div>
                    <div class="exercise-specs">${dayData.afternoon.duration} - ${dayData.afternoon.intensity}</div>
                </div>
            `;
            exerciseList.appendChild(cardioElement);
        }
        
        // Single workout (for once-daily)
        if (dayData.workout?.exercises) {
            dayData.workout.exercises.forEach((exercise, index) => {
                const exerciseElement = createExerciseElement(exercise, `main-${index}`);
                exerciseList.appendChild(exerciseElement);
            });
            
            // Add cardio portion if exists
            if (dayData.workout.cardioPortion) {
                const cardioElement = document.createElement('div');
                cardioElement.className = 'exercise-item';
                cardioElement.innerHTML = `
                    <input type="checkbox" class="exercise-checkbox" data-exercise="cardio">
                    <div class="exercise-details">
                        <div class="exercise-name">${dayData.workout.cardioPortion.type}</div>
                        <div class="exercise-specs">${dayData.workout.cardioPortion.duration} - ${dayData.workout.cardioPortion.exercise}</div>
                    </div>
                `;
                exerciseList.appendChild(cardioElement);
            }
        }
        
        // Rest day content
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
        }
    }
    
    updateWorkoutProgress();
}

function createExerciseElement(exercise, id) {
    const exerciseElement = document.createElement('div');
    exerciseElement.className = 'exercise-item';
    exerciseElement.innerHTML = `
        <input type="checkbox" class="exercise-checkbox" data-exercise="${id}">
        <div class="exercise-details">
            <div class="exercise-name">${exercise.name}</div>
            <div class="exercise-specs">${exercise.sets} sets × ${exercise.reps}</div>
        </div>
    `;
    return exerciseElement;
}

function populateTodaysNutrition() {
    if (!currentNutritionPlan.dailyTargets) return;
    
    const targets = currentNutritionPlan.dailyTargets;
    const nutritionTargets = document.querySelector('.nutrition-targets');
    
    if (nutritionTargets) {
        nutritionTargets.innerHTML = `
            <div class="nutrition-item">
                <div class="nutrition-label">Daily Calories</div>
                <div class="nutrition-value">${targets.calories?.total || 0} kcal</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-label">Protein</div>
                <div class="nutrition-value">${targets.macronutrients?.protein?.grams || 0}g</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-label">Carbohydrates</div>
                <div class="nutrition-value">${targets.macronutrients?.carbohydrates?.grams || 0}g</div>
            </div>
            <div class="nutrition-item">
                <div class="nutrition-label">Fats</div>
                <div class="nutrition-value">${targets.macronutrients?.fats?.grams || 0}g</div>
            </div>
        `;
    }
    
    // Hydration goal
    const hydrationTarget = document.querySelector('.hydration-target');
    if (hydrationTarget && targets.hydration?.dailyGoal) {
        hydrationTarget.textContent = targets.hydration.dailyGoal;
    }
    
    setupHydrationTracking();
}

function setupHydrationTracking() {
    const waterGlasses = document.querySelector('.water-glasses');
    if (!waterGlasses) return;
    
    const dailyGoal = parseFloat(currentNutritionPlan.dailyTargets?.hydration?.dailyGoal || 3.5);
    const glassSize = dailyGoal / 8; // 8 glasses total
    
    waterGlasses.innerHTML = '';
    
    for (let i = 0; i < 8; i++) {
        const glass = document.createElement('div');
        glass.className = 'water-glass';
        glass.dataset.glassNumber = i;
        glass.addEventListener('click', toggleWaterGlass);
        waterGlasses.appendChild(glass);
    }
    
    loadWaterProgress();
}

function toggleWaterGlass(e) {
    const glass = e.target;
    const glassNumber = parseInt(glass.dataset.glassNumber);
    
    // Toggle this glass and all previous ones
    document.querySelectorAll('.water-glass').forEach((g, index) => {
        if (index <= glassNumber) {
            g.classList.add('filled');
        } else {
            g.classList.remove('filled');
        }
    });
    
    saveWaterProgress();
}

function loadWaterProgress() {
    const today = getCurrentDate();
    const savedProgress = localStorage.getItem(`water-${today}`);
    
    if (savedProgress) {
        const glassCount = parseInt(savedProgress);
        document.querySelectorAll('.water-glass').forEach((glass, index) => {
            if (index < glassCount) {
                glass.classList.add('filled');
            }
        });
    }
}

function saveWaterProgress() {
    const today = getCurrentDate();
    const filledGlasses = document.querySelectorAll('.water-glass.filled').length;
    localStorage.setItem(`water-${today}`, filledGlasses.toString());
}

// ===== WEEK VIEW SECTION =====
function populateWeekViewSection() {
    if (!currentWorkoutPlan.weeks) return;
    
    populateWeekHeader();
    populateWeekProgress();
    populateWeekDays();
}

function populateWeekHeader() {
    const weekDates = document.querySelector('.week-dates');
    if (weekDates && activePlans.activePlans?.workout) {
        const startDate = activePlans.activePlans.workout.startDate;
        const endDate = activePlans.activePlans.workout.endDate;
        weekDates.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
}

function populateWeekProgress() {
    // This will be enhanced when we add progress tracking
    document.getElementById('workoutsCompleted').textContent = '4/5';
    document.getElementById('nutritionAdherence').textContent = '85%';
    document.getElementById('avgCalories').textContent = '2,250';
    document.getElementById('avgSleep').textContent = '7.2h';
}

function populateWeekDays() {
    const daysGrid = document.querySelector('.days-grid');
    if (!daysGrid || !currentWorkoutPlan.weeks) return;
    
    daysGrid.innerHTML = '';
    
    const currentWeek = Math.ceil(getTodaysDayNumber() / 7);
    const weekKey = `week${currentWeek}`;
    const weekData = currentWorkoutPlan.weeks[weekKey];
    
    if (!weekData?.days) return;
    
    Object.entries(weekData.days).forEach(([dayKey, dayData]) => {
        const dayCard = createDayCard(dayData, dayKey);
        daysGrid.appendChild(dayCard);
    });
}

function createDayCard(dayData, dayKey) {
    const today = getCurrentDate();
    const dayDate = dayData.date;
    
    let cardClass = 'day-card';
    let badgeClass = 'upcoming-badge';
    let badgeText = 'Upcoming';
    
    if (dayData.dayType === 'rest') {
        cardClass += ' rest-day';
        badgeClass = 'rest-badge';
        badgeText = 'Rest Day';
    } else if (dayDate === today) {
        cardClass += ' today';
        badgeClass = 'today-badge';
        badgeText = 'Today';
    } else if (new Date(dayDate) < new Date(today)) {
        cardClass += ' completed';
        badgeClass = 'completed-badge';
        badgeText = '✓ Completed';
    }
    
    const workoutType = dayData.dayType === 'rest' ? 'Rest Day' : 
                       (dayData.morning?.workoutType || dayData.workout?.workoutType || 'Workout');
    
    const card = document.createElement('div');
    card.className = cardClass;
    card.innerHTML = `
        <div class="day-header">
            <div>
                <div class="day-name">${dayData.dayName}</div>
                <div class="day-date">${formatDate(dayDate).split(',')[0]}</div>
            </div>
            <div class="completion-badge ${badgeClass}">${badgeText}</div>
        </div>
        <div class="workout-type">${workoutType}</div>
        <div class="workout-summary">
            ${createWorkoutSummary(dayData)}
        </div>
    `;
    
    return card;
}

function createWorkoutSummary(dayData) {
    if (dayData.dayType === 'rest') {
        return '<em>Focus on recovery and meal prep</em>';
    }
    
    let summary = '';
    
    if (dayData.morning?.exercises) {
        const exerciseCount = dayData.morning.exercises.length;
        summary += `Morning: ${exerciseCount} exercises`;
    }
    
    if (dayData.afternoon?.primaryExercise) {
        if (summary) summary += '<br>';
        summary += `Afternoon: ${dayData.afternoon.primaryExercise}`;
    }
    
    if (dayData.workout?.exercises) {
        const exerciseCount = dayData.workout.exercises.length;
        summary += `${exerciseCount} exercises`;
        if (dayData.workout.cardioPortion) {
            summary += ` + ${dayData.workout.cardioPortion.type}`;
        }
    }
    
    return summary || 'Workout planned';
}

// ===== NUTRITION SECTION =====
function populateNutritionSection() {
    if (!currentNutritionPlan.planInfo) return;
    
    populateNutritionHeader();
    populateNutritionMacros();
    populateNutritionMeals();
    populateNutritionSupplements();
    populateNutritionGuidelines();
}

function populateNutritionHeader() {
    const planName = document.querySelector('.plan-name');
    const planDetails = document.querySelector('.plan-details');
    
    if (planName && currentNutritionPlan.planInfo) {
        planName.textContent = currentNutritionPlan.planInfo.planType;
    }
    
    if (planDetails && currentNutritionPlan.planInfo) {
        const startDate = formatDate(currentNutritionPlan.planInfo.startDate);
        const endDate = formatDate(currentNutritionPlan.planInfo.endDate);
        planDetails.textContent = `Active: ${startDate} - ${endDate}`;
    }
}

function populateNutritionMacros() {
    const macroList = document.querySelector('.macro-list');
    if (!macroList || !currentNutritionPlan.dailyTargets) return;
    
    const targets = currentNutritionPlan.dailyTargets;
    
    macroList.innerHTML = `
        <div class="macro-item">
            <div class="macro-info">
                <div class="macro-name">Calories</div>
                <div class="macro-target">${targets.calories?.total || 0} kcal daily</div>
            </div>
        </div>
        <div class="macro-item">
            <div class="macro-info">
                <div class="macro-name">Protein</div>
                <div class="macro-target">${targets.macronutrients?.protein?.grams || 0}g (${targets.macronutrients?.protein?.percentage || 0}%)</div>
            </div>
        </div>
        <div class="macro-item">
            <div class="macro-info">
                <div class="macro-name">Carbohydrates</div>
                <div class="macro-target">${targets.macronutrients?.carbohydrates?.grams || 0}g (${targets.macronutrients?.carbohydrates?.percentage || 0}%)</div>
            </div>
        </div>
        <div class="macro-item">
            <div class="macro-info">
                <div class="macro-name">Fats</div>
                <div class="macro-target">${targets.macronutrients?.fats?.grams || 0}g (${targets.macronutrients?.fats?.percentage || 0}%)</div>
            </div>
        </div>
        <div class="macro-item">
            <div class="macro-info">
                <div class="macro-name">Fiber</div>
                <div class="macro-target">${targets.micronutrients?.fiber || 'N/A'}</div>
            </div>
        </div>
    `;
}

function populateNutritionMeals() {
    const mealList = document.querySelector('.meal-list');
    if (!mealList || !currentNutritionPlan.mealPlanning) return;
    
    mealList.innerHTML = '';
    
    // Get the appropriate meal structure
    const mealStructure = currentNutritionPlan.mealPlanning.twiceDailyStructure || 
                         currentNutritionPlan.mealPlanning.workoutDayStructure ||
                         currentNutritionPlan.mealPlanning.refinedStructure;
    
    if (!mealStructure) return;
    
    Object.entries(mealStructure).forEach(([mealKey, mealData]) => {
        const mealElement = document.createElement('div');
        mealElement.className = 'meal-item';
        mealElement.innerHTML = `
            <div class="meal-header">
                <div class="meal-name">${mealData.name}</div>
                <div class="meal-time">${mealData.time}</div>
            </div>
            <div class="meal-description">
                ${mealData.purpose}
            </div>
            <div class="meal-macros">
                <span>${mealData.calories} kcal</span>
                <span>${mealData.macros?.protein || 'N/A'} protein</span>
                <span>${mealData.macros?.carbs || 'N/A'} carbs</span>
                <span>${mealData.macros?.fats || 'N/A'} fats</span>
            </div>
        `;
        mealList.appendChild(mealElement);
    });
}

function populateNutritionSupplements() {
    const supplementsGrid = document.querySelector('.supplements-grid');
    if (!supplementsGrid || !currentNutritionPlan.supplements?.daily) return;
    
    supplementsGrid.innerHTML = '';
    
    currentNutritionPlan.supplements.daily.forEach(supplement => {
        const supplementElement = document.createElement('div');
        supplementElement.className = 'supplement-item';
        supplementElement.innerHTML = `
            <div class="supplement-name">${supplement.name}</div>
            <div class="supplement-dose">${supplement.dose}</div>
            <div class="supplement-time">${supplement.timing}</div>
        `;
        supplementsGrid.appendChild(supplementElement);
    });
}

function populateNutritionGuidelines() {
    const notesContent = document.querySelector('.nutrition-notes .notes-content');
    if (!notesContent || !currentNutritionPlan.nutritionGuidelines) return;
    
    const guidelines = currentNutritionPlan.nutritionGuidelines;
    notesContent.innerHTML = guidelines.map(guideline => `• ${guideline}`).join('<br>');
}

// ===== PROGRESS SECTION =====
function populateProgressSection() {
    populateProgressOverview();
    populateGoals();
    populateMeasurements();
    populateProgressPhotos();
}

function populateProgressOverview() {
    // Placeholder data - will be enhanced with real progress tracking
    document.getElementById('currentWeight').textContent = '178.2';
    document.getElementById('weightChange').textContent = '+2.8 lbs this month';
    document.getElementById('weightChange').className = 'stat-change positive';
    
    document.getElementById('benchMax').textContent = '205';
    document.getElementById('strengthChange').textContent = '+15 lbs this month';
    document.getElementById('strengthChange').className = 'stat-change positive';
    
    document.getElementById('workoutAdherence').textContent = '89%';
    document.getElementById('consistencyChange').textContent = '+12% vs last month';
    document.getElementById('consistencyChange').className = 'stat-change positive';
    
    document.getElementById('nutritionGoals').textContent = '83%';
    document.getElementById('nutritionChange').textContent = 'Steady this month';
    document.getElementById('nutritionChange').className = 'stat-change neutral';
}

function populateGoals() {
    const goalsList = document.querySelector('.goals-list');
    if (!goalsList) return;
    
    // Extract goals from current workout plan
    const goals = currentWorkoutPlan.planInfo?.monthlyGoals?.specificTargets || [];
    
    goalsList.innerHTML = '';
    
    goals.forEach((goal, index) => {
        const progress = Math.random() * 100; // Placeholder - will be real data
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

function populateMeasurements() {
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
                <div class="measurement-name">Bench Press</div>
                <div class="measurement-value">205 lbs (+15)</div>
            </div>
            <div class="measurement-item">
                <div class="measurement-name">Leg Press</div>
                <div class="measurement-value">385 lbs (+25)</div>
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

function populateProgressPhotos() {
    const photosGrid = document.querySelector('.photos-grid');
    if (!photosGrid) return;
    
    photosGrid.innerHTML = `
        <div class="photo-placeholder">
            <div>📷</div>
            <div>Front View</div>
            <div class="photo-date">June 23, 2025</div>
        </div>
        <div class="photo-placeholder">
            <div>📷</div>
            <div>Side View</div>
            <div class="photo-date">June 23, 2025</div>
        </div>
        <div class="photo-placeholder">
            <div>📷</div>
            <div>Back View</div>
            <div class="photo-date">June 23, 2025</div>
        </div>
        <div class="photo-placeholder">
            <div>📷</div>
            <div>+ Add Latest</div>
            <div class="photo-date">Take new photo</div>
        </div>
    `;
}

// ===== ADMIN SECTION =====
function populateAdminSection() {
    updateAdminStatus();
    updateLastUpdated();
}

function updateAdminStatus() {
    // Populate current plan status
    const currentStatusList = document.querySelector('#unlockedContent .status-card .status-list');
    // Populate next plan info
    // This will be filled when admin is unlocked
}

function updateLastUpdated() {
    const lastUpdatedElement = document.getElementById('lastUpdated');
    if (lastUpdatedElement) {
        lastUpdatedElement.textContent = getCurrentDate();
    }
}

function handlePasswordSubmit(e) {
    e.preventDefault();
    const password = document.getElementById('passwordInput').value;
    
    if (password === currentSettings.security?.adminPassword || password === 'onedayatatime') {
        unlockAdminPanel();
        showSuccessMessage('Admin panel unlocked successfully!');
    } else {
        showErrorMessage('Incorrect password. Try again.');
        document.getElementById('passwordInput').value = '';
    }
}

function unlockAdminPanel() {
    document.getElementById('lockedContent').style.display = 'none';
    document.getElementById('unlockedContent').classList.add('show');
    populateAdminStatus();
}

function lockAdminPanel() {
    document.getElementById('unlockedContent').classList.remove('show');
    document.getElementById('lockedContent').style.display = 'block';
    document.getElementById('passwordInput').value = '';
}

function populateAdminStatus() {
    // Populate current plan status in admin panel
    const statusCards = document.querySelectorAll('.status-card .status-list');
    
    if (statusCards[0] && activePlans.activePlans?.workout) {
        const workout = activePlans.activePlans.workout;
        statusCards[0].innerHTML = `
            <div class="status-item">
                <div class="status-label">Active Plan:</div>
                <div class="status-value status-active">${workout.fileName}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Plan Type:</div>
                <div class="status-value">${workout.planType}</div>
            </div>
            <div class="status-item">
                <div class="status-label">End Date:</div>
                <div class="status-value">${formatDate(workout.endDate)}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Status:</div>
                <div class="status-value status-active">Active</div>
            </div>
        `;
    }
    
    if (statusCards[1] && activePlans.upcomingPlans?.workout) {
        const upcoming = activePlans.upcomingPlans.workout;
        statusCards[1].innerHTML = `
            <div class="status-item">
                <div class="status-label">Next Plan:</div>
                <div class="status-value status-warning">${upcoming.fileName}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Plan Type:</div>
                <div class="status-value">${upcoming.planType}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Start Date:</div>
                <div class="status-value">${formatDate(upcoming.startDate)}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Status:</div>
                <div class="status-value status-warning">Scheduled</div>
            </div>
        `;
    }
}

function switchAdminTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');
}

function handleDragOver(e) {
    e.preventDefault();
    e.currentTarget.classList.add('dragover');
}

function handleFileDrop(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
}

function handleFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleFileUpload(files[0]);
    }
}

function handleFileUpload(file) {
    if (file.type === 'application/json') {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const jsonData = JSON.parse(e.target.result);
                document.getElementById('jsonTextarea').value = JSON.stringify(jsonData, null, 2);
                showSuccessMessage('JSON file loaded successfully!');
            } catch (error) {
                showErrorMessage('Invalid JSON file format.');
            }
        };
        reader.readAsText(file);
    } else {
        showErrorMessage('Please upload a JSON file.');
    }
}

// ===== EXERCISE AND NOTES TRACKING =====
function setupExerciseTracking() {
    // This will be called when exercises are populated
    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('exercise-checkbox')) {
            updateWorkoutProgress();
            saveExerciseProgress();
        }
    });
    
    loadExerciseProgress();
}

function updateWorkoutProgress() {
    const checkboxes = document.querySelectorAll('.exercise-checkbox');
    const checkedBoxes = document.querySelectorAll('.exercise-checkbox:checked');
    
    if (checkboxes.length === 0) return;
    
    const progress = (checkedBoxes.length / checkboxes.length) * 100;
    const progressFill = document.querySelector('.progress-fill');
    
    if (progressFill) {
        progressFill.style.width = `${progress}%`;
    }
}

function saveExerciseProgress() {
    const today = getCurrentDate();
    const checkboxes = document.querySelectorAll('.exercise-checkbox');
    const progress = {};
    
    checkboxes.forEach(checkbox => {
        progress[checkbox.dataset.exercise] = checkbox.checked;
    });
    
    localStorage.setItem(`exercise-${today}`, JSON.stringify(progress));
}

function loadExerciseProgress() {
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
        updateWorkoutProgress();
    }
}

function saveNotes() {
    const notesInput = document.querySelector('.notes-input');
    if (!notesInput) return;
    
    const today = getCurrentDate();
    const notes = notesInput.value;
    
    localStorage.setItem(`notes-${today}`, notes);
    showSuccessMessage('Notes saved successfully!');
}

function loadTodaysNotes() {
    const today = getCurrentDate();
    const savedNotes = localStorage.getItem(`notes-${today}`);
    const notesInput = document.querySelector('.notes-input');
    
    if (savedNotes && notesInput) {
        notesInput.value = savedNotes;
    }
}

function initializeProgressData() {
    return {
        year: new Date().getFullYear(),
        months: {},
        lastUpdated: getCurrentDate()
    };
}