// ===== js/core/state.js =====
export const AppState = {
    currentSettings: {},
    activePlans: {},
    currentWorkoutPlan: {},
    currentSection: 'today',
    progressData: {},
    isHalfMonthSystem: false,
    
    // State management methods
    setState(key, value) {
        this[key] = value;
        this.notifyStateChange(key, value);
    },
    
    getState(key) {
        return this[key];
    },
    
    // Simple state change notification
    stateChangeListeners: new Map(),
    
    onStateChange(key, callback) {
        if (!this.stateChangeListeners.has(key)) {
            this.stateChangeListeners.set(key, []);
        }
        this.stateChangeListeners.get(key).push(callback);
    },
    
    notifyStateChange(key, value) {
        if (this.stateChangeListeners.has(key)) {
            this.stateChangeListeners.get(key).forEach(callback => callback(value));
        }
    }
};