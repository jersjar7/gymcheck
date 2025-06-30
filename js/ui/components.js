// ===== js/ui/components.js =====
export function createExerciseElement(exercise, id) {
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

export function createDayCard(dayData, dayKey) {
    const today = new Date().toISOString().split('T')[0];
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
                <div class="day-date">${dayData.date}</div>
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