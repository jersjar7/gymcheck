// ===== js/modules/admin-panel.js =====
import { AppState } from '../core/state.js';
import { formatDate, getCurrentDate } from '../core/utils.js';
import { showSuccessMessage, showErrorMessage } from '../ui/messages.js';

export class AdminPanel {
    static init() {
        this.setupPasswordForm();
        this.setupTabs();
        this.setupFileUpload();
        this.populate();
    }
    
    static setupPasswordForm() {
        const passwordForm = document.getElementById('passwordForm');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => this.handlePasswordSubmit(e));
        }
        
        const lockBtn = document.getElementById('lockBtn');
        if (lockBtn) {
            lockBtn.addEventListener('click', () => this.lockAdminPanel());
        }
    }
    
    static setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
    }
    
    static setupFileUpload() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        if (uploadArea && fileInput) {
            uploadArea.addEventListener('click', () => fileInput.click());
            uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            uploadArea.addEventListener('drop', (e) => this.handleFileDrop(e));
            fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }
    }
    
    static handlePasswordSubmit(e) {
        e.preventDefault();
        const password = document.getElementById('passwordInput').value;
        
        if (password === AppState.currentSettings.security?.adminPassword || password === 'onedayatatime') {
            this.unlockAdminPanel();
            showSuccessMessage('Admin panel unlocked successfully!');
        } else {
            showErrorMessage('Incorrect password. Try again.');
            document.getElementById('passwordInput').value = '';
        }
    }
    
    static unlockAdminPanel() {
        document.getElementById('lockedContent').style.display = 'none';
        document.getElementById('unlockedContent').classList.add('show');
        this.populateAdminStatus();
    }
    
    static lockAdminPanel() {
        document.getElementById('unlockedContent').classList.remove('show');
        document.getElementById('lockedContent').style.display = 'block';
        document.getElementById('passwordInput').value = '';
    }
    
    static switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Tab`).classList.add('active');
    }
    
    static handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }
    
    static handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.handleFileUpload(files[0]);
        }
    }
    
    static handleFileSelect(e) {
        const files = e.target.files;
        if (files.length > 0) {
            this.handleFileUpload(files[0]);
        }
    }
    
    static handleFileUpload(file) {
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
    
    static populate() {
        this.updateLastUpdated();
    }
    
    static populateAdminStatus() {
        const statusCards = document.querySelectorAll('.status-card .status-list');
        
        if (statusCards[0] && AppState.activePlans.activePlans?.workout) {
            const workout = AppState.activePlans.activePlans.workout;
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
            const nextPart = this.getNextPartInfo();
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
    
    static getNextPartInfo() {
        const upcoming = AppState.activePlans.upcomingPlans?.workout;
        const currentPart = AppState.activePlans.activePlans?.workout?.part || 1;
        
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
    
    static updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        if (lastUpdatedElement) {
            lastUpdatedElement.textContent = getCurrentDate();
        }
    }
}