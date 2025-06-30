// ===== js/core/utils.js =====
export async function loadJSON(filepath) {
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

export function getCurrentDate() {
    return new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
}

export function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

export function getTodaysDayNumber(activePlans) {
    const today = getCurrentDate();
    const planStart = activePlans.activePlans?.workout?.startDate;
    
    if (!planStart) return 1;
    
    const startDate = new Date(planStart + 'T00:00:00');
    const currentDate = new Date(today + 'T00:00:00');
    const diffTime = currentDate - startDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    return Math.max(1, diffDays);
}

export function findTodaysDayData(currentWorkoutPlan) {
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

export function getWeekAndDay(dayNumber) {
    const weekNumber = Math.ceil(dayNumber / 7);
    const dayInWeek = ((dayNumber - 1) % 7) + 1;
    return { week: weekNumber, day: dayInWeek };
}