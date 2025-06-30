// ===== js/ui/messages.js =====
export function showErrorMessage(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.body.insertBefore(errorDiv, document.body.firstChild);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}

export function showSuccessMessage(message) {
    const successDiv = document.createElement('div');
    successDiv.className = 'success-message';
    successDiv.textContent = message;
    document.body.insertBefore(successDiv, document.body.firstChild);
    
    setTimeout(() => {
        successDiv.remove();
    }, 3000);
}
