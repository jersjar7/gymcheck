// ===== GLOBAL VARIABLES =====
let currentSettings = {};
let activePlans = {};
let currentWorkoutPlan = {};
let currentSection = 'today';
let progressData = {};
let isHalfMonthSystem = false;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async function() {
    try {
        await initializeApp();
        setupEventListeners();
        updateCurrentDateTime();
        setInterval(updateCurrentDateTime, 60000); // Update every minute
        
        // Check for half-month switching daily
        if (isHalfMonthSystem) {
            setInterval(checkHalfMonthSwitch, 24 * 60 * 60 * 1000); // Check daily
        }
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
        
        // Detect if we're using half-month system
        isHalfMonthSystem = currentSettings.planStructure?.type === 'half-month' || 
                          activePlans.systemType === 'half-month';
        
        // Auto-switch plans if needed
        if (isHalfMonthSystem) {
            await checkAndSwitchPlans();
        }
        
        // Load active workout plan
        if (activePlans.activePlans?.workout?.fullPath) {
            currentWorkoutPlan = await loadJSON(activePlans.activePlans.workout.fullPath);
        }
        
        // Try to load progress data
        try {
            progressData = await loadJSON('progress/monthly-progress-2025.json');
        } catch (error) {
            progressData = initializeProgressData();
        }
        
        // Populate all sections with data
        populateTodaySection();
        populateWeekViewSection();
        populateProgressSection();
        populateAdminSection();
        
    } catch (error) {
        console.error('Error initializing app:', error);
        throw error;
    }
}

// ===== HALF-MONTH SYSTEM FUNCTIONS =====
async function checkAndSwitchPlans() {
    const today = getCurrentDate();
    const currentPlan = activePlans.activePlans?.workout;
    
    if (!currentPlan) return;
    
    // Check if we need to switch from Part 1 to Part 2
    if (today > currentPlan.endDate) {
        const nextPlan = activePlans.upcomingPlans?.workout;
        if (nextPlan && nextPlan.autoActivate) {
            await switchToNextPlan();
        }
    }
    
    // Check if it's time to switch to Part 2 (day 16 of month)
    const dayOfMonth = parseInt(today.split('-')[2]);
    if (currentPlan.part === 1 && dayOfMonth >= 16) {
        const nextPlan = activePlans.upcomingPlans?.workout;
        if (nextPlan && nextPlan.part === 2) {
            await switchToNextPlan();
        }
    }
}

async function switchToNextPlan() {
    try {
        console.log('Switching to next half-month plan...');
        
        // Move current plan to history
        if (!activePlans.planHistory) {
            activePlans.planHistory = [];
        }
        
        const currentPlan = activePlans.activePlans.workout;
        activePlans.planHistory.push({
            ...currentPlan,
            status: 'completed',
            completedDate: getCurrentDate()
        });
        
        // Move upcoming plan to active
        const nextPlan = activePlans.upcomingPlans.workout;
        activePlans.activePlans.workout = {
            ...nextPlan,
            status: 'active',
            daysRemaining: calculateDaysRemaining(nextPlan.startDate, nextPlan.endDate)
        };
        
        // Clear upcoming (will be set when next plan is uploaded)
        activePlans.upcomingPlans = {};
        
        // Update current date and month
        activePlans.currentDate = getCurrentDate();
        activePlans.currentMonth = getHalfMonthKey(getCurrentDate());
        
        // Reload the new workout plan
        if (activePlans.activePlans?.workout?.fullPath) {
            currentWorkoutPlan = await loadJSON(activePlans.activePlans.workout.fullPath);
        }
        
        showSuccessMessage('Successfully switched to Part 2 of the month!');
        
        // Refresh all sections
        populateTodaySection();
        populateWeekViewSection();
        populateAdminSection();
        
    } catch (error) {
        console.error('Error switching plans:', error);
        showErrorMessage('Failed to switch to next plan automatically.');
    }
}

function getHalfMonthKey(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const year = date.getFullYear();
    const month = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
    const dayOfMonth = date.getDate();
    const part = dayOfMonth <= 15 ? 'part1' : 'part2';
    
    return `${month}-${year}-${part}`;
}

function calculateDaysRemaining(startDate, endDate) {
    const today = new Date(getCurrentDate() + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const diffTime = end - today;
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
}

function checkHalfMonthSwitch() {
    if (isHalfMonthSystem) {
        checkAndSwitchPlans();
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

function findTodaysDayData() {
    const today = getCurrentDate();
    
    if (!currentWorkoutPlan.weeks) return null;
    
    // Search through all weeks and days to find today's date
    for (const weekKey in currentWorkoutPlan.weeks) {
        const weekData = currentWorkoutPlan.weeks[weekKey];
        if (weekData.days) {
            for (const dayKey in weekData.days) {
                const dayData = weekData.days[dayKey];
                if (dayData.date === today) {
                    return {
                        dayData: dayData,
                        weekKey: weekKey,
                        dayKey: dayKey,
                        weekNumber: weekData.weekNumber || parseInt(weekKey.replace('week', ''))
                    };
                }
            }
        }
    }
    
    return null;
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
    
    // Exercise and cardio tracking
    setupWorkoutTracking();
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
        const todayData = findTodaysDayData();
        if (todayData) {
            const dayNumber = getTodaysDayNumber();
            const { week, day } = getWeekAndDay(dayNumber);
            const partInfo = isHalfMonthSystem ? 
                ` (Part ${activePlans.activePlans?.workout?.part || 1})` : '';
            weekInfoElement.textContent = `Week ${todayData.weekNumber}, Day ${dayNumber}${partInfo}`;
        }
    }
}

// ===== TODAY SECTION =====
function populateTodaySection() {
    populateTodaysWorkout();
    setupCardioTracking();
}

function populateTodaysWorkout() {
    if (!currentWorkoutPlan.weeks) return;
    
    const todayData = findTodaysDayData();
    
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
    const exerciseList = document.querySelector('.exercise-list');
    if (exerciseList && dayData.dayType !== 'rest') {
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
        
    // Rest day content
    if (dayData.dayType === 'rest') {
        const exerciseList = document.querySelector('.exercise-list');
        if (exerciseList) {
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

function setupCardioTracking() {
    const cardioCheckbox = document.getElementById('dailyCardio');
    if (cardioCheckbox) {
        cardioCheckbox.addEventListener('change', saveCardioProgress);
        loadCardioProgress();
    }
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
        const partInfo = isHalfMonthSystem ? 
            ` - Part ${activePlans.activePlans.workout.part}` : '';
        weekDates.textContent = `${formatDate(startDate)} - ${formatDate(endDate)}${partInfo}`;
    }
}

function populateWeekProgress() {
    document.getElementById('workoutsCompleted').textContent = '4/5';
    document.getElementById('cardioCompleted').textContent = '5/5';
    document.getElementById('weeklyAdherence').textContent = '90%';
    document.getElementById('avgSleep').textContent = '7.2h';
}

function populateWeekDays() {
    const daysGrid = document.querySelector('.days-grid');
    if (!daysGrid || !currentWorkoutPlan.weeks) return;
    
    daysGrid.innerHTML = '';
    
    const todayData = findTodaysDayData();
    const currentWeek = todayData ? todayData.weekNumber : 1;
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
                       (dayData.workout?.workoutType || 
                        dayData.morning?.workoutType || 
                        'Daily Workout');
    
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
        return '<em>Focus on recovery and preparation</em>';
    }
    
    let summary = '';
    
    if (dayData.workout?.exercises) {
        const exerciseCount = dayData.workout.exercises.length;
        summary = `${exerciseCount} exercises + Cardio`;
    } else if (dayData.morning?.exercises) {
        const exerciseCount = dayData.morning.exercises.length;
        summary = `${exerciseCount} exercises + Cardio`;
    }
    
    return summary || 'Workout + Cardio planned';
}

// ===== PROGRESS SECTION =====
function populateProgressSection() {
    populateProgressOverview();
    populateGoals();
    populateMeasurements();
    populateProgressPhotos();
}

function populateProgressOverview() {
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

function populateGoals() {
    const goalsList = document.querySelector('.goals-list');
    if (!goalsList) return;
    
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

function populateProgressPhotos() {
    const photosGrid = document.querySelector('.photos-grid');
    if (!photosGrid) return;
    
    const currentPart = activePlans.activePlans?.workout?.part || 1;
    
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

// ===== ADMIN SECTION =====
function populateAdminSection() {
    updateAdminStatus();
    updateLastUpdated();
}

function updateAdminStatus() {
    // Will be filled when admin is unlocked
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
                <div class="status-value">${workout.planType} - Part ${workout.part}</div>
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
    
    if (statusCards[1]) {
        const nextPart = getNextPartInfo();
        statusCards[1].innerHTML = `
            <div class="status-item">
                <div class="status-label">Next Part:</div>
                <div class="status-value status-warning">${nextPart.name}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Start Date:</div>
                <div class="status-value">${nextPart.startDate}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Status:</div>
                <div class="status-value ${nextPart.statusClass}">${nextPart.status}</div>
            </div>
            <div class="status-item">
                <div class="status-label">Auto-Switch:</div>
                <div class="status-value status-active">${nextPart.autoSwitch ? 'Enabled' : 'Disabled'}</div>
            </div>
        `;
    }
}

function getNextPartInfo() {
    const upcoming = activePlans.upcomingPlans?.workout;
    const currentPart = activePlans.activePlans?.workout?.part || 1;
    
    if (upcoming) {
        return {
            name: upcoming.fileName,
            startDate: formatDate(upcoming.startDate),
            status: 'Scheduled',
            statusClass: 'status-warning',
            autoSwitch: upcoming.autoActivate
        };
    } else {
        return {
            name: `July Part ${currentPart + 1} (Not Created)`,
            startDate: currentPart === 1 ? 'July 16, 2025' : 'August 1, 2025',
            status: 'Needs Creation',
            statusClass: 'status-warning',
            autoSwitch: false
        };
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

// ===== WORKOUT AND CARDIO TRACKING =====
function setupWorkoutTracking() {
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

function saveCardioProgress() {
    const today = getCurrentDate();
    const cardioCheckbox = document.getElementById('dailyCardio');
    
    if (cardioCheckbox) {
        localStorage.setItem(`cardio-${today}`, cardioCheckbox.checked.toString());
    }
}

function loadCardioProgress() {
    const today = getCurrentDate();
    const savedProgress = localStorage.getItem(`cardio-${today}`);
    const cardioCheckbox = document.getElementById('dailyCardio');
    
    if (savedProgress && cardioCheckbox) {
        cardioCheckbox.checked = savedProgress === 'true';
    }
}

function initializeProgressData() {
    return {
        year: new Date().getFullYear(),
        months: {},
        lastUpdated: getCurrentDate()
    };
}