// GalPal Medical App - Main Application Controller
class GalPal {
    constructor() {
        this.currentRoute = '';
        this.sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
        this.consentGiven = localStorage.getItem('consentGiven') === 'true';
        
        this.init();
    }

    async init() {
        await this.setupDatabase();
        this.setupEventListeners();
        this.setupRouting();
        this.setupSidebar();
        this.updateConnectionStatus();
        this.loadInitialRoute();
        
        // Check for first-time setup
        if (!localStorage.getItem('setupComplete')) {
            this.showWelcome();
        }
    }

    async setupDatabase() {
        try {
            await DB.init();
            console.log('Database initialized successfully');
        } catch (error) {
            console.error('Database initialization failed:', error);
            this.showToast('Database Error', 'Failed to initialize local database', 'danger');
        }
    }

    setupEventListeners() {
        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // Sidebar close button
        const sidebarClose = document.getElementById('sidebarClose');
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // Sidebar backdrop
        const backdrop = document.getElementById('sidebarBackdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => {
                this.closeSidebar();
            });
        }

        // ESC key to close sidebar
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const sidebar = document.getElementById('sidebar');
                if (sidebar.classList.contains('show')) {
                    this.closeSidebar();
                }
            }
        });

        // Navigation links
        document.querySelectorAll('[data-route]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const route = e.target.closest('[data-route]').dataset.route;
                this.navigate(route);
            });
        });

        // Consent modal
        document.getElementById('consentCheckbox').addEventListener('change', (e) => {
            document.getElementById('consentAgree').disabled = !e.target.checked;
        });

        document.getElementById('consentAgree').addEventListener('click', () => {
            this.giveConsent();
        });

        // Window resize handler
        window.addEventListener('resize', () => {
            this.handleResize();
        });

        // Online/offline status
        window.addEventListener('online', () => this.updateConnectionStatus());
        window.addEventListener('offline', () => this.updateConnectionStatus());

        // Hash change for routing
        window.addEventListener('hashchange', () => {
            this.loadInitialRoute();
        });
    }

    setupRouting() {
        this.routes = {
            'home': () => this.loadHome(),
            'analysis': () => this.loadAnalysis(),
            'profiles': () => this.loadProfiles(),
            'history': () => this.loadHistory(),
            'wiki': () => this.loadWiki(),
            'consult': () => this.loadConsult(),
            'device': () => this.loadDevice(),
            'settings': () => this.loadSettings()
        };
    }

    setupSidebar() {
        const sidebar = document.getElementById('sidebar');
        // Sidebar is closed by default in the new design
        sidebar.classList.remove('show');
    }

    loadInitialRoute() {
        const hash = window.location.hash.slice(2) || 'home';
        this.navigate(hash);
    }

    navigate(route) {
        if (this.currentRoute === route) return;
        
        this.currentRoute = route;
        window.location.hash = '#/' + route;
        
        // Update active navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        
        const activeLink = document.querySelector(`[data-route="${route}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }

        // Load route content
        if (this.routes[route]) {
            this.routes[route]();
        } else {
            this.loadHome();
        }

        // Close sidebar after navigation (for all devices now)
        this.closeSidebar();
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');
        const isOpen = sidebar.classList.contains('show');

        if (isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');

        sidebar.classList.add('show');
        backdrop.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const backdrop = document.getElementById('sidebarBackdrop');

        sidebar.classList.remove('show');
        backdrop.classList.remove('show');
        document.body.style.overflow = '';
    }

    handleResize() {
        // Close sidebar when resizing to prevent layout issues
        this.closeSidebar();
    }

    updateConnectionStatus() {
        const statusIcon = document.getElementById('connectionStatus');
        const lastSync = document.getElementById('lastSync');
        const footerLastSync = document.getElementById('footerLastSync');

        const now = new Date().toLocaleTimeString();

        if (navigator.onLine) {
            statusIcon.className = 'bi bi-wifi status-online';
            statusIcon.title = 'Online';
            if (lastSync) lastSync.textContent = `Synced ${now}`;
            if (footerLastSync) footerLastSync.textContent = now;
        } else {
            statusIcon.className = 'bi bi-wifi-off status-offline';
            statusIcon.title = 'Offline';
            lastSync.textContent = 'Offline mode';
            footerLastSync.textContent = 'offline';
        }
    }

    showToast(title, message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');
        const toastId = 'toast_' + Date.now();
        
        const toastHTML = `
            <div class="toast" role="alert" aria-live="assertive" aria-atomic="true" id="${toastId}">
                <div class="toast-header">
                    <i class="bi bi-${this.getToastIcon(type)} text-${type} me-2"></i>
                    <strong class="me-auto">${title}</strong>
                    <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
                <div class="toast-body">
                    ${message}
                </div>
            </div>
        `;
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, { delay: duration });
        toast.show();
        
        // Remove from DOM after hiding
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    getToastIcon(type) {
        const icons = {
            'info': 'info-circle',
            'success': 'check-circle',
            'warning': 'exclamation-triangle',
            'danger': 'x-circle'
        };
        return icons[type] || 'info-circle';
    }

    showConsentModal() {
        const modal = new bootstrap.Modal(document.getElementById('consentModal'));
        modal.show();
    }

    giveConsent() {
        this.consentGiven = true;
        localStorage.setItem('consentGiven', 'true');
        localStorage.setItem('consentTimestamp', new Date().toISOString());
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('consentModal'));
        modal.hide();
        
        this.showToast('Consent Recorded', 'Your consent has been recorded. You can revoke this at any time in Settings.', 'success');
    }

    async loadHome() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="welcome-hero">
                <h1><i class="bi bi-heart-pulse me-3"></i>Welcome to GalPal</h1>
                <p class="text-emphasized">AI-powered medical analysis for informed health decisions</p>
            </div>

            <div class="info-box">
                <div class="info-box-icon">
                    <i class="bi bi-shield-check"></i>
                </div>
                <div class="info-box-content">
                    <h6>For Informational Use Only</h6>
                    <p>This tool assists with understanding health data. <span class="text-highlight">Always consult licensed healthcare providers</span> for medical decisions.</p>
                </div>
            </div>

            <div class="section-divider">
                <span>Get Started</span>
            </div>

            <div class="steps-container mb-5">
                <a href="#/profiles" class="step-item text-decoration-none">
                    <div class="step-number">1</div>
                    <div class="step-content">
                        <h6>Create Profile</h6>
                        <p>Set up patient information</p>
                    </div>
                </a>
                <a href="#/analysis" class="step-item text-decoration-none">
                    <div class="step-number">2</div>
                    <div class="step-content">
                        <h6>Enter Results</h6>
                        <p>Input test data for analysis</p>
                    </div>
                </a>
                <div class="step-item">
                    <div class="step-number">3</div>
                    <div class="step-content">
                        <h6>Review Insights</h6>
                        <p>Get AI-powered interpretation</p>
                    </div>
                </div>
                <a href="#/consult" class="step-item text-decoration-none">
                    <div class="step-number">4</div>
                    <div class="step-content">
                        <h6>Consult Provider</h6>
                        <p>Share with healthcare professionals</p>
                    </div>
                </a>
            </div>

            <div class="section-divider">
                <span>Features</span>
            </div>

            <div class="feature-grid mb-5">
                <a href="#/analysis" class="feature-item text-decoration-none">
                    <div class="feature-icon">
                        <i class="bi bi-clipboard-data"></i>
                    </div>
                    <h5>Analysis</h5>
                    <p>AI insights for blood, urine & saliva tests</p>
                    <button class="btn btn-primary btn-sm">Start Analysis</button>
                </a>

                <a href="#/consult" class="feature-item text-decoration-none">
                    <div class="feature-icon">
                        <i class="bi bi-camera-video"></i>
                    </div>
                    <h5>Consultations</h5>
                    <p>Connect with healthcare providers</p>
                    <button class="btn btn-outline-primary btn-sm">Book Now</button>
                </a>

                <a href="#/wiki" class="feature-item text-decoration-none">
                    <div class="feature-icon">
                        <i class="bi bi-book"></i>
                    </div>
                    <h5>Health Wiki</h5>
                    <p>Trusted medical information</p>
                    <button class="btn btn-outline-primary btn-sm">Explore</button>
                </a>
            </div>

            <div class="section-divider">
                <span>Latest Updates</span>
            </div>

            <div class="card">
                <div class="card-body">
                    <div id="researchUpdates">
                        <div class="skeleton skeleton-text"></div>
                        <div class="skeleton skeleton-text" style="width: 80%;"></div>
                        <div class="skeleton skeleton-text" style="width: 60%;"></div>
                    </div>
                </div>
            </div>
        `;

        this.loadResearchUpdates();
    }

    async loadResearchUpdates() {
        try {
            const response = await fetch('./assets/data/research-updates.json');
            const updates = await response.json();

            const container = document.getElementById('researchUpdates');
            container.innerHTML = updates.slice(0, 3).map(update => `
                <div class="mb-3 pb-3 border-bottom last:border-0">
                    <h6 class="mb-2"><a href="${update.link}" target="_blank" class="text-decoration-none text-highlight">${update.title}</a></h6>
                    <p class="text-subtle mb-2">${update.summary}</p>
                    <div class="d-flex gap-3 text-subtle">
                        <span><i class="bi bi-calendar me-1"></i>${update.date}</span>
                        <span><i class="bi bi-building me-1"></i>${update.source}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            const container = document.getElementById('researchUpdates');
            container.innerHTML = '<div class="empty-state"><p>Unable to load updates</p></div>';
        }
    }

    loadAnalysis() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h2 mb-1"><i class="bi bi-clipboard-data me-2 text-highlight"></i>Medical Analysis</h1>
                    <p class="text-subtle mb-0">AI-powered insights for lab results</p>
                </div>
            </div>

            <!-- Profile Selection Section -->
            <div class="card mb-4">
                <div class="card-body">
                    <h5 class="mb-3"><i class="bi bi-person-circle me-2"></i>Select or Create Profile</h5>
                    <div class="row align-items-end">
                        <div class="col-md-8">
                            <label for="profileSelect" class="form-label">Patient Profile</label>
                            <select class="form-select" id="profileSelect">
                                <option value="">Loading profiles...</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <button type="button" class="btn btn-outline-primary w-100" id="createNewProfile">
                                <i class="bi bi-person-plus me-2"></i>Create New Profile
                            </button>
                        </div>
                    </div>
                    <div id="selectedProfileInfo" class="mt-3" style="display: none;">
                        <div class="info-box">
                            <div class="info-box-icon">
                                <i class="bi bi-person-check"></i>
                            </div>
                            <div class="info-box-content">
                                <h6 id="profileInfoName"></h6>
                                <p id="profileInfoDetails" class="mb-0"></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-body">
                    <form id="analysisForm">
                        <div class="section-divider">
                            <span>Test Information</span>
                        </div>

                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label class="form-label">Fluid Type *</label>
                                    <div class="btn-group d-flex" role="group" aria-label="Fluid type selection">
                                        <input type="radio" class="btn-check" name="fluidType" id="blood" value="blood" autocomplete="off" required>
                                        <label class="btn btn-outline-primary" for="blood">
                                            <i class="bi bi-droplet me-2"></i>Blood
                                        </label>

                                        <input type="radio" class="btn-check" name="fluidType" id="urine" value="urine" autocomplete="off" required>
                                        <label class="btn btn-outline-primary" for="urine">
                                            <i class="bi bi-droplet-half me-2"></i>Urine
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="testDate" class="form-label">Test Date *</label>
                                    <input type="date" class="form-control" id="testDate" value="${new Date().toISOString().split('T')[0]}" required>
                                </div>
                            </div>
                        </div>

                        <!-- Dynamic input panels will be inserted here -->
                        <div id="fluidInputPanels"></div>

                        <div class="mb-4">
                            <label for="notes" class="form-label">Notes & Symptoms</label>
                            <textarea class="form-control" id="notes" rows="3" placeholder="Any additional symptoms, medications, or relevant information..."></textarea>
                        </div>

                        <!-- Consent Section -->
                        <div class="card bg-light">
                            <div class="card-body">
                                <h6><i class="bi bi-shield-check me-2"></i>Consent Required</h6>
                                <div class="form-check">
                                    <input class="form-check-input" type="checkbox" id="analysisConsent" required>
                                    <label class="form-check-label" for="analysisConsent">
                                        I consent to AI-assisted interpretation and understand this is not medical advice
                                    </label>
                                </div>
                                <small class="text-muted">
                                    <a href="#" id="viewConsentDetails">View detailed consent information</a>
                                </small>
                            </div>
                        </div>

                        <div class="d-grid gap-2 d-md-flex justify-content-md-end mt-4">
                            <button type="button" class="btn btn-secondary" id="saveDraft">Save Draft</button>
                            <button type="submit" class="btn btn-primary" id="runAnalysis">
                                <i class="bi bi-cpu me-2"></i>Run AI Analysis
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <!-- Results Panel (initially hidden) -->
            <div id="resultsPanel" class="card mt-4" style="display: none;">
                <div class="card-header">
                    <h5><i class="bi bi-graph-up me-2"></i>Analysis Results</h5>
                </div>
                <div class="card-body" id="resultsContent">
                    <!-- Results will be populated here -->
                </div>
            </div>
        `;

        this.setupAnalysisForm();
    }

    setupAnalysisForm() {
        // Load profiles into dropdown
        this.loadProfilesDropdown();

        // Profile selection handler
        document.getElementById('profileSelect').addEventListener('change', (e) => {
            this.handleProfileSelection(e.target.value);
        });

        // Create new profile handler
        document.getElementById('createNewProfile').addEventListener('click', () => {
            this.showAddPatientModal();
        });

        // Fluid type change handler
        document.querySelectorAll('input[name="fluidType"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.updateFluidInputPanel(e.target.value);
            });
        });

        // Consent details link
        const consentLink = document.getElementById('viewConsentDetails');
        if (consentLink) {
            consentLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.showConsentModal();
            });
        }

        // Form submission
        document.getElementById('analysisForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.runAnalysis();
        });

        // Save draft
        const saveDraftBtn = document.getElementById('saveDraft');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => {
                this.saveDraft();
            });
        }
    }

    async loadProfilesDropdown() {
        try {
            const patients = await DB.getPatients();
            const select = document.getElementById('profileSelect');

            if (patients.length === 0) {
                select.innerHTML = '<option value="">No profiles found - Create one below</option>';
            } else {
                select.innerHTML = '<option value="">Select a patient profile...</option>' +
                    patients.map(patient => `
                        <option value="${patient.id}">${patient.name} - ${patient.age}y, ${patient.sex}</option>
                    `).join('');
            }
        } catch (error) {
            console.error('Error loading profiles:', error);
            document.getElementById('profileSelect').innerHTML = '<option value="">Error loading profiles</option>';
        }
    }

    async handleProfileSelection(profileId) {
        const infoSection = document.getElementById('selectedProfileInfo');

        if (!profileId) {
            infoSection.style.display = 'none';
            this.currentSelectedProfile = null;
            return;
        }

        try {
            const patients = await DB.getPatients();
            const patient = patients.find(p => p.id == profileId);

            if (patient) {
                this.currentSelectedProfile = patient;
                document.getElementById('profileInfoName').textContent = patient.name;
                document.getElementById('profileInfoDetails').innerHTML = `
                    <span class="text-highlight">${patient.age} years</span> •
                    <span class="text-highlight">${patient.sex}</span>${patient.mrn ? ` • MRN: ${patient.mrn}` : ''}
                `;
                infoSection.style.display = 'block';
            }
        } catch (error) {
            console.error('Error loading profile details:', error);
            this.showToast('Error', 'Failed to load profile details', 'danger');
        }
    }

    updateFluidInputPanel(fluidType) {
        const container = document.getElementById('fluidInputPanels');
        
        const panels = {
            blood: `
                <div class="card mt-3" style="background: linear-gradient(to bottom, #fff, #fef5f5);">
                    <div class="card-header" style="background: linear-gradient(135deg, #dc3545, #c82333);">
                        <h6 class="text-white mb-0">🩸 Blood Test Results</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">Glucose & Diabetes Markers</h6>
                                <div class="mb-3">
                                    <label for="glucose" class="form-label">Glucose (mg/dL) <i class="bi bi-info-circle text-muted" title="Normal: 70-100 mg/dL fasting"></i></label>
                                    <input type="number" class="form-control" id="glucose" step="0.1" placeholder="70-100 normal">
                                </div>
                                <div class="mb-3">
                                    <label for="hba1c" class="form-label">HbA1c (%) <i class="bi bi-info-circle text-muted" title="Normal: < 5.7%"></i></label>
                                    <input type="number" class="form-control" id="hba1c" step="0.1" placeholder="< 5.7 normal">
                                </div>

                                <h6 class="text-muted mb-3 mt-4">Anemia Indicators</h6>
                                <div class="mb-3">
                                    <label for="hemoglobin" class="form-label">Hemoglobin (g/dL) <i class="bi bi-info-circle text-muted" title="Normal: 13.5-17.5 (M), 12.0-15.5 (F)"></i></label>
                                    <input type="number" class="form-control" id="hemoglobin" step="0.1" placeholder="13.5-17.5 (M), 12.0-15.5 (F)">
                                </div>
                                <div class="mb-3">
                                    <label for="hematocrit" class="form-label">Hematocrit (%) <i class="bi bi-info-circle text-muted" title="Normal: 38.8-50.0 (M), 34.9-44.5 (F)"></i></label>
                                    <input type="number" class="form-control" id="hematocrit" step="0.1" placeholder="38.8-50.0 (M), 34.9-44.5 (F)">
                                </div>
                                <div class="mb-3">
                                    <label for="rbcCount" class="form-label">RBC Count (x10⁶/μL) <i class="bi bi-info-circle text-muted" title="Normal: 4.5-5.9 (M), 4.0-5.2 (F)"></i></label>
                                    <input type="number" class="form-control" id="rbcCount" step="0.01" placeholder="4.5-5.9 (M), 4.0-5.2 (F)">
                                </div>
                            </div>
                            <div class="col-md-6">
                                <h6 class="text-muted mb-3">White Blood Cells</h6>
                                <div class="mb-3">
                                    <label for="wbcCount" class="form-label">WBC Count (x10³/μL) <i class="bi bi-info-circle text-muted" title="Normal: 4.5-11.0"></i></label>
                                    <input type="number" class="form-control" id="wbcCount" step="0.1" placeholder="4.5-11.0 normal">
                                </div>
                                <div class="mb-3">
                                    <label for="plateletCount" class="form-label">Platelet Count (x10³/μL) <i class="bi bi-info-circle text-muted" title="Normal: 150-400"></i></label>
                                    <input type="number" class="form-control" id="plateletCount" step="1" placeholder="150-400 normal">
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            urine: `
                <div class="card mt-3" style="background: linear-gradient(to bottom, #fff, #fffbf0);">
                    <div class="card-header" style="background: linear-gradient(135deg, #ffc107, #ff9800);">
                        <h6 class="text-dark mb-0">💧 Urine Test Results</h6>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="ph" class="form-label">pH <i class="bi bi-info-circle text-muted" title="Normal: 4.5-8.0"></i></label>
                                    <input type="number" class="form-control" id="ph" step="0.1" min="0" max="14" placeholder="4.5-8.0 normal">
                                </div>
                                <div class="mb-3">
                                    <label for="proteinLevel" class="form-label">Protein Level</label>
                                    <select class="form-select" id="proteinLevel">
                                        <option value="">Select...</option>
                                        <option value="negative">Negative</option>
                                        <option value="trace">Trace</option>
                                        <option value="1+">1+</option>
                                        <option value="2+">2+</option>
                                        <option value="3+">3+</option>
                                        <option value="4+">4+</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="proteinMg" class="form-label">Protein (mg/dL) <i class="bi bi-info-circle text-muted" title="For eGFR calculation. ≥3+ indicates possible CKD"></i></label>
                                    <input type="number" class="form-control" id="proteinMg" step="0.1" placeholder="Enter value for CKD assessment">
                                </div>
                                <div class="mb-3">
                                    <label for="creatinine" class="form-label">Creatinine (mg/dL) <i class="bi bi-info-circle text-muted" title="Required for eGFR calculation"></i></label>
                                    <input type="number" class="form-control" id="creatinine" step="0.01" placeholder="0.5-1.2 normal" onchange="app.calculateEGFR()">
                                </div>
                                <div class="mb-3">
                                    <label for="eGFR" class="form-label">eGFR (computed) <i class="bi bi-info-circle text-muted" title="Estimated Glomerular Filtration Rate"></i></label>
                                    <input type="text" class="form-control" id="eGFR" readonly style="background-color: #f8f9fa; font-weight: bold;" placeholder="Auto-calculated">
                                    <small class="text-muted">Requires: age, sex, and creatinine</small>
                                </div>
                                <div class="mb-3">
                                    <label for="urineGlucose" class="form-label">Glucose</label>
                                    <select class="form-select" id="urineGlucose">
                                        <option value="">Select...</option>
                                        <option value="negative">Negative</option>
                                        <option value="trace">Trace</option>
                                        <option value="1+">1+</option>
                                        <option value="2+">2+</option>
                                        <option value="3+">3+</option>
                                        <option value="4+">4+</option>
                                    </select>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <div class="mb-3">
                                    <label for="ketones" class="form-label">Ketones</label>
                                    <select class="form-select" id="ketones">
                                        <option value="">Select...</option>
                                        <option value="negative">Negative</option>
                                        <option value="trace">Trace</option>
                                        <option value="small">Small</option>
                                        <option value="moderate">Moderate</option>
                                        <option value="large">Large</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="specificGravity" class="form-label">Specific Gravity</label>
                                    <input type="number" class="form-control" id="specificGravity" step="0.001" min="1.000" max="1.050" placeholder="1.005-1.030 normal">
                                </div>
                                <div class="mb-3">
                                    <label for="nitrite" class="form-label">Nitrite <i class="bi bi-info-circle text-muted" title="UTI indicator"></i></label>
                                    <select class="form-select" id="nitrite">
                                        <option value="">Select...</option>
                                        <option value="negative">Negative</option>
                                        <option value="positive">Positive</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label for="leukocytes" class="form-label">Leukocytes <i class="bi bi-info-circle text-muted" title="UTI indicator"></i></label>
                                    <select class="form-select" id="leukocytes">
                                        <option value="">Select...</option>
                                        <option value="negative">Negative</option>
                                        <option value="trace">Trace</option>
                                        <option value="1+">1+</option>
                                        <option value="2+">2+</option>
                                        <option value="3+">3+</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
        };

        container.innerHTML = panels[fluidType] || '';

        // Set up eGFR calculation listener for urine tests
        if (fluidType === 'urine') {
            setTimeout(() => {
                const creatinineInput = document.getElementById('creatinine');
                const ageInput = document.getElementById('patientAge');
                const sexSelect = document.getElementById('patientSex');

                if (creatinineInput) {
                    creatinineInput.addEventListener('input', () => this.calculateEGFR());
                }
                if (ageInput) {
                    ageInput.addEventListener('input', () => this.calculateEGFR());
                }
                if (sexSelect) {
                    sexSelect.addEventListener('change', () => this.calculateEGFR());
                }
            }, 100);
        }
    }

    async runAnalysis() {
        const consentCheckbox = document.getElementById('analysisConsent');
        if (consentCheckbox && !this.consentGiven && !consentCheckbox.checked) {
            this.showToast('Consent Required', 'Please provide consent before running analysis', 'warning');
            return;
        }

        const formData = this.collectFormData();
        if (!formData) return;

        // Show loading state
        const submitBtn = document.getElementById('runAnalysis');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Analyzing...';
        submitBtn.disabled = true;

        try {
            // Check if MedAI is available
            if (!window.MedAI) {
                throw new Error('Medical AI module not loaded');
            }

            console.log('Starting AI analysis with data:', formData);

            // Run AI analysis
            const analysis = await window.MedAI.analyze(formData);

            console.log('AI analysis completed:', analysis);

            // Detect conditions based on metrics
            const detectedConditions = this.detectConditions(formData.metrics, formData.fluidType, formData.patient);

            console.log('Detected conditions:', detectedConditions);

            // Wait for DB to be initialized
            if (!window.DB || !window.DB.initialized) {
                console.warn('Database not initialized, waiting...');
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Save to database
            const analysisRecord = await window.DB.addAnalysis({
                patientId: formData.patient.id,
                fluidType: formData.fluidType,
                testDate: formData.testDate,
                metrics: formData.metrics,
                aiSummary: analysis.summary,
                aiInterpretation: analysis.interpretation || analysis.summary,
                detectedConditions: detectedConditions,
                riskFactors: analysis.risks || [],
                recommendations: analysis.recommendations || 'Consult with healthcare provider for detailed interpretation.',
                notes: formData.notes
            });

            console.log('Analysis saved to database:', analysisRecord);

            // Display results
            this.displayAnalysisResults(analysis, formData);

            this.showToast('Success', 'Analysis completed and saved successfully', 'success');

        } catch (error) {
            console.error('Analysis failed:', error);
            console.error('Error details:', error.stack);
            this.showToast('Analysis Error', error.message || 'Failed to complete analysis. Please try again.', 'danger');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    collectFormData() {
        const fluidType = document.querySelector('input[name="fluidType"]:checked');
        if (!fluidType) {
            this.showToast('Missing Information', 'Please select a fluid type', 'warning');
            return null;
        }

        // Check if profile is selected
        if (!this.currentSelectedProfile) {
            this.showToast('Missing Profile', 'Please select or create a patient profile', 'warning');
            return null;
        }

        const data = {
            patient: {
                name: this.currentSelectedProfile.name,
                age: this.currentSelectedProfile.age,
                sex: this.currentSelectedProfile.sex,
                mrn: this.currentSelectedProfile.mrn || '',
                id: this.currentSelectedProfile.id
            },
            fluidType: fluidType.value,
            testDate: document.getElementById('testDate').value,
            notes: document.getElementById('notes')?.value || '',
            metrics: {}
        };

        // Collect fluid-specific metrics
        if (fluidType.value === 'blood') {
            data.metrics = {
                glucose: parseFloat(document.getElementById('glucose').value) || null,
                hba1c: parseFloat(document.getElementById('hba1c').value) || null,
                hemoglobin: parseFloat(document.getElementById('hemoglobin').value) || null,
                hematocrit: parseFloat(document.getElementById('hematocrit').value) || null,
                rbcCount: parseFloat(document.getElementById('rbcCount').value) || null,
                wbcCount: parseFloat(document.getElementById('wbcCount')?.value) || null,
                plateletCount: parseFloat(document.getElementById('plateletCount')?.value) || null
            };
        } else if (fluidType.value === 'urine') {
            data.metrics = {
                ph: parseFloat(document.getElementById('ph').value) || null,
                proteinLevel: document.getElementById('proteinLevel').value,
                proteinMg: parseFloat(document.getElementById('proteinMg').value) || null,
                creatinine: parseFloat(document.getElementById('creatinine').value) || null,
                eGFR: window.computedValues?.eGFR || null,
                glucose: document.getElementById('urineGlucose').value,
                ketones: document.getElementById('ketones').value,
                specificGravity: parseFloat(document.getElementById('specificGravity').value) || null,
                nitrite: document.getElementById('nitrite').value,
                leukocytes: document.getElementById('leukocytes').value
            };
        }

        return data;
    }

    displayAnalysisResults(analysis, formData) {
        const resultsPanel = document.getElementById('resultsPanel');
        const resultsContent = document.getElementById('resultsContent');

        // Detect conditions based on metrics
        const detectedConditions = this.detectConditions(formData.metrics, formData.fluidType, formData.patient);

        // Check if we need to show risk alert
        const hasModerateOrHighRisk = detectedConditions.some(c => c.riskLevel === 'Moderate' || c.riskLevel === 'High');

        resultsContent.innerHTML = `
            <div class="row">
                <div class="col-12">
                    <div class="mb-4" style="background: linear-gradient(135deg, #f8f6ff, #fff); padding: 20px; border-radius: 10px; border-left: 5px solid #6a4c93;">
                        <h6><i class="bi bi-lightbulb me-2"></i>AI Summary</h6>
                        <p class="lead mb-0">${analysis.summary}</p>
                    </div>
                </div>
            </div>

            ${detectedConditions.length > 0 ? `
            <div class="row">
                <div class="col-12">
                    <div class="mb-4">
                        <h6><i class="bi bi-clipboard2-pulse me-2"></i>AI-Detected Conditions</h6>
                        <div class="row">
                            ${detectedConditions.map(condition => `
                                <div class="col-md-6 col-lg-4 mb-3">
                                    <div class="card h-100" style="border-left: 5px solid ${this.getConditionColor(condition.riskLevel)};">
                                        <div class="card-body">
                                            <h6 class="card-title">${condition.name}</h6>
                                            <span class="badge mb-2" style="background-color: ${this.getConditionColor(condition.riskLevel)};">${condition.riskLevel} Risk</span>
                                            <p class="card-text small">${condition.explanation}</p>
                                            <small class="text-muted"><i class="bi bi-info-circle me-1"></i>${condition.source}</small>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="row">
                <div class="col-md-8">
                    <div class="mb-4">
                        <h6><i class="bi bi-flag me-2"></i>Risk Assessment</h6>
                        <div class="d-flex flex-wrap gap-2">
                            ${analysis.risks.map(risk => `
                                <span class="badge risk-${risk.level.toLowerCase()} fs-6">
                                    ${risk.level}: ${risk.description}
                                </span>
                            `).join('')}
                        </div>
                    </div>

                    <div class="mb-4">
                        <h6><i class="bi bi-info-circle me-2"></i>Recommendations</h6>
                        <ul class="list-unstyled">
                            ${analysis.advisories.map(advisory => `
                                <li class="mb-2">
                                    <i class="bi bi-arrow-right text-primary me-2"></i>
                                    ${advisory}
                                </li>
                            `).join('')}
                        </ul>
                    </div>

                    <div class="mb-4">
                        <h6><i class="bi bi-journal-medical me-2"></i>Clinical References</h6>
                        <small class="text-muted">
                            ${analysis.citations.map(citation => `
                                <div class="mb-1">${citation}</div>
                            `).join('')}
                        </small>
                    </div>
                </div>

                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-file-earmark-pdf me-2"></i>Generate Report</h6>
                        </div>
                        <div class="card-body text-center">
                            <button class="btn btn-primary mb-2" id="generatePdf" onclick="app.generatePDF()">
                                <i class="bi bi-download me-2"></i>Download PDF
                            </button>
                            <button class="btn btn-outline-secondary mb-2" id="printReport" onclick="window.print()">
                                <i class="bi bi-printer me-2"></i>Print Report
                            </button>
                            <button class="btn btn-outline-info" id="shareReport" onclick="app.navigate('consult')">
                                <i class="bi bi-share me-2"></i>Share with Clinician
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            ${detectedConditions.length > 0 ? `
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card" style="background: linear-gradient(to bottom, #fff, #f0f8ff);">
                        <div class="card-header" style="background: linear-gradient(135deg, #17a2b8, #138496);">
                            <h6 class="text-white mb-0"><i class="bi bi-book me-2"></i>Educational Insights</h6>
                        </div>
                        <div class="card-body">
                            <div id="educationalContent">
                                ${this.getEducationalContent(detectedConditions)}
                            </div>
                            <div class="mt-3">
                                <h6>Recommended Videos</h6>
                                <div id="videoRecommendations">
                                    ${this.getVideoRecommendations(detectedConditions)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            ` : ''}

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h6><i class="bi bi-graph-up me-2"></i>Trend Analysis</h6>
                        </div>
                        <div class="card-body">
                            <div id="chartLoadingSkeleton" style="display: block;">
                                <div class="skeleton skeleton-chart" style="height: 300px; border-radius: 8px;"></div>
                            </div>
                            <canvas id="trendChart" style="display: none;"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resultsPanel.style.display = 'block';
        resultsPanel.scrollIntoView({ behavior: 'smooth' });

        // Store data for later use
        this.currentAnalysisData = formData;
        this.currentAnalysisResults = analysis;
        this.currentDetectedConditions = detectedConditions;

        // Initialize trend chart after a brief delay to ensure Chart.js is loaded
        setTimeout(() => {
            if (typeof Chart !== 'undefined') {
                this.initTrendChart(formData, detectedConditions);
            } else {
                document.getElementById('chartLoadingSkeleton').innerHTML = '<p class="text-muted text-center">Charts unavailable - Chart.js not loaded</p>';
            }
        }, 500);

        // Show risk alert if needed
        if (hasModerateOrHighRisk) {
            setTimeout(() => this.showRiskAlert(detectedConditions), 1000);
        }
    }

    detectConditions(metrics, fluidType, patient) {
        const conditions = [];

        if (fluidType === 'blood') {
            // Diabetes detection
            if (metrics.glucose && metrics.hba1c) {
                if (metrics.glucose > 125 && metrics.hba1c >= 6.5) {
                    conditions.push({
                        name: 'Diabetes',
                        riskLevel: 'High',
                        explanation: 'Both fasting glucose and HbA1c levels indicate diabetes. These sustained high blood sugar levels require immediate medical attention and management.',
                        source: 'American Diabetes Association (ADA) 2023'
                    });
                }
            } else if (metrics.glucose) {
                // Hyperglycemia
                if (metrics.glucose > 125) {
                    conditions.push({
                        name: 'Hyperglycemia',
                        riskLevel: 'High',
                        explanation: 'Elevated blood glucose levels detected. This may indicate diabetes or prediabetes and requires medical evaluation.',
                        source: 'WHO Diagnostic Criteria'
                    });
                } else if (metrics.glucose < 70) {
                    // Hypoglycemia
                    conditions.push({
                        name: 'Hypoglycemia',
                        riskLevel: 'High',
                        explanation: 'Low blood glucose detected. Immediate consumption of fast-acting carbohydrates recommended. If symptoms persist, seek medical attention.',
                        source: 'Endocrine Society Guidelines'
                    });
                }
            }

            // Anemia detection
            const sex = patient?.sex;
            let anemiaDetected = false;
            const anemiaReasons = [];

            if (metrics.hemoglobin) {
                const hemoglobinLow = (sex === 'male' && metrics.hemoglobin < 13.5) ||
                                     (sex === 'female' && metrics.hemoglobin < 12.0);
                if (hemoglobinLow) {
                    anemiaDetected = true;
                    anemiaReasons.push('low hemoglobin');
                }
            }

            if (metrics.hematocrit) {
                const hematocritLow = (sex === 'male' && metrics.hematocrit < 38.8) ||
                                     (sex === 'female' && metrics.hematocrit < 34.9);
                if (hematocritLow) {
                    anemiaDetected = true;
                    anemiaReasons.push('low hematocrit');
                }
            }

            if (metrics.rbcCount) {
                const rbcLow = (sex === 'male' && metrics.rbcCount < 4.5) ||
                              (sex === 'female' && metrics.rbcCount < 4.0);
                if (rbcLow) {
                    anemiaDetected = true;
                    anemiaReasons.push('low RBC count');
                }
            }

            if (anemiaDetected) {
                conditions.push({
                    name: 'Anemia',
                    riskLevel: 'Moderate',
                    explanation: `Indicators suggest possible anemia (${anemiaReasons.join(', ')}). This condition may cause fatigue and weakness. Consult a physician for iron studies and further evaluation.`,
                    source: 'WHO Anemia Guidelines'
                });
            }
        }

        if (fluidType === 'urine') {
            // CKD detection
            if (metrics.eGFR && metrics.eGFR < 60) {
                conditions.push({
                    name: 'Chronic Kidney Disease (CKD)',
                    riskLevel: 'High',
                    explanation: `eGFR below 60 mL/min/1.73m² indicates reduced kidney function. This requires immediate medical evaluation and monitoring.`,
                    source: 'KDIGO Clinical Practice Guidelines'
                });
            } else if (metrics.proteinMg && metrics.proteinMg >= 300) {
                conditions.push({
                    name: 'Possible CKD',
                    riskLevel: 'Moderate',
                    explanation: 'Significant protein in urine (proteinuria) may indicate kidney damage. Follow-up testing and medical consultation recommended.',
                    source: 'National Kidney Foundation'
                });
            }

            // UTI detection
            const hasNitrite = metrics.nitrite === 'positive';
            const hasLeukocytes = metrics.leukocytes && ['1+', '2+', '3+'].includes(metrics.leukocytes);

            if (hasNitrite || hasLeukocytes) {
                conditions.push({
                    name: 'Urinary Tract Infection (UTI)',
                    riskLevel: hasNitrite && hasLeukocytes ? 'High' : 'Moderate',
                    explanation: hasNitrite && hasLeukocytes ?
                        'Both nitrite and leukocytes positive strongly suggest bacterial UTI. Medical evaluation and antibiotic treatment recommended.' :
                        'Infection markers detected in urine. Consider medical evaluation and urine culture for confirmation.',
                    source: 'European Association of Urology'
                });
            }
        }

        return conditions;
    }

    getConditionColor(riskLevel) {
        const colors = {
            'Low': '#28a745',
            'Moderate': '#ffc107',
            'High': '#dc3545'
        };
        return colors[riskLevel] || '#6c757d';
    }

    showRiskAlert(conditions) {
        const moderateOrHigh = conditions.filter(c => c.riskLevel === 'Moderate' || c.riskLevel === 'High');
        if (moderateOrHigh.length === 0) return;

        const modalHTML = `
            <div class="modal fade" id="riskAlertModal" tabindex="-1">
                <div class="modal-dialog modal-dialog-centered">
                    <div class="modal-content">
                        <div class="modal-header bg-warning">
                            <h5 class="modal-title">
                                <i class="bi bi-exclamation-triangle me-2"></i>
                                Potential Risk Detected
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <p class="lead">Your results suggest possible abnormalities:</p>
                            <ul>
                                ${moderateOrHigh.map(c => `<li><strong>${c.name}</strong> (${c.riskLevel} Risk)</li>`).join('')}
                            </ul>
                            <div class="alert alert-info mt-3">
                                <i class="bi bi-info-circle me-2"></i>
                                We recommend scheduling a consultation with a healthcare provider to discuss these findings.
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="app.navigate('consult'); bootstrap.Modal.getInstance(document.getElementById('riskAlertModal')).hide();">
                                <i class="bi bi-calendar-plus me-2"></i>Go to Consultations
                            </button>
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                                Save & Continue
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if present
        const existingModal = document.getElementById('riskAlertModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', modalHTML);
        const modal = new bootstrap.Modal(document.getElementById('riskAlertModal'));
        modal.show();
    }

    getEducationalContent(conditions) {
        if (conditions.length === 0) return '<p class="text-muted">No specific educational content available.</p>';

        const contentMap = {
            'Diabetes': 'Diabetes is a chronic condition affecting blood sugar regulation. Key management strategies include monitoring blood glucose, maintaining a balanced diet, regular physical activity, and medication as prescribed. Regular HbA1c testing helps track long-term control.',
            'Hyperglycemia': 'High blood sugar can result from insufficient insulin, stress, illness, or dietary factors. Short-term effects include increased thirst and frequent urination. Long-term hyperglycemia can lead to complications affecting eyes, kidneys, nerves, and cardiovascular system.',
            'Hypoglycemia': 'Low blood sugar requires immediate treatment with 15-20g of fast-acting carbohydrates (juice, glucose tablets). Symptoms include shakiness, sweating, confusion, and dizziness. Always recheck blood sugar after 15 minutes.',
            'Anemia': 'Anemia occurs when blood lacks sufficient healthy red blood cells to carry oxygen. Common causes include iron deficiency, vitamin B12 deficiency, chronic disease, or blood loss. Treatment depends on the underlying cause and may include dietary changes or supplements.',
            'Chronic Kidney Disease (CKD)': 'CKD involves gradual loss of kidney function over time. Management includes blood pressure control, blood sugar management (if diabetic), dietary modifications (reduced sodium and protein), and regular monitoring of kidney function.',
            'Possible CKD': 'Proteinuria can be an early sign of kidney damage. Causes include diabetes, hypertension, infections, or autoimmune diseases. Early detection and treatment can slow progression of kidney disease.',
            'Urinary Tract Infection (UTI)': 'UTIs are bacterial infections of the urinary system. Symptoms include burning during urination, frequent urination, and cloudy urine. Treatment typically involves antibiotics. Increased fluid intake and proper hygiene help prevent recurrence.'
        };

        let content = '<div class="row">';
        conditions.forEach(condition => {
            if (contentMap[condition.name]) {
                content += `
                    <div class="col-md-6 mb-3">
                        <div class="p-3 bg-light rounded">
                            <h6 class="text-primary">${condition.name}</h6>
                            <p class="small mb-0">${contentMap[condition.name]}</p>
                        </div>
                    </div>
                `;
            }
        });
        content += '</div>';

        return content;
    }

    getVideoRecommendations(conditions) {
        if (conditions.length === 0) return '<p class="text-muted">No video recommendations available.</p>';

        const videoMap = {
            'Diabetes': { title: 'Understanding Type 2 Diabetes', query: 'type 2 diabetes management' },
            'Hyperglycemia': { title: 'Managing High Blood Sugar', query: 'hyperglycemia management' },
            'Hypoglycemia': { title: 'Treating Low Blood Sugar', query: 'hypoglycemia treatment' },
            'Anemia': { title: 'Understanding Anemia', query: 'anemia causes and treatment' },
            'Chronic Kidney Disease (CKD)': { title: 'Living with CKD', query: 'chronic kidney disease management' },
            'Possible CKD': { title: 'Kidney Health Basics', query: 'kidney disease prevention' },
            'Urinary Tract Infection (UTI)': { title: 'UTI Prevention and Treatment', query: 'urinary tract infection' }
        };

        let videos = '<div class="row">';
        conditions.slice(0, 3).forEach(condition => {
            if (videoMap[condition.name]) {
                const video = videoMap[condition.name];
                const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(video.query)}`;
                videos += `
                    <div class="col-md-4 mb-3">
                        <div class="card">
                            <div class="card-body">
                                <h6 class="card-title">${video.title}</h6>
                                <p class="card-text small text-muted">Educational video about ${condition.name}</p>
                                <a href="${youtubeSearchUrl}" target="_blank" class="btn btn-sm btn-outline-danger">
                                    <i class="bi bi-youtube me-1"></i>Search YouTube
                                </a>
                            </div>
                        </div>
                    </div>
                `;
            }
        });
        videos += '</div>';

        return videos;
    }

    initTrendChart(currentData, conditions) {
        const canvas = document.getElementById('trendChart');
        const skeleton = document.getElementById('chartLoadingSkeleton');

        if (!canvas) return;

        try {
            const ctx = canvas.getContext('2d');

            // Mock historical data for demonstration grouped by condition
            const datasets = this.generateTrendDatasets(currentData, conditions);

            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: this.generateDateLabels(30),
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        title: {
                            display: true,
                            text: 'Historical Trend Analysis (Last 30 Days)',
                            font: { size: 16 }
                        },
                        legend: {
                            display: true,
                            position: 'bottom'
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            title: {
                                display: true,
                                text: 'Values'
                            }
                        },
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        }
                    }
                }
            });

            // Show chart, hide skeleton
            canvas.style.display = 'block';
            canvas.style.height = '300px';
            if (skeleton) skeleton.style.display = 'none';

        } catch (error) {
            console.error('Chart initialization failed:', error);
            if (skeleton) {
                skeleton.innerHTML = '<p class="text-danger text-center">Failed to load chart</p>';
            }
        }
    }

    generateDateLabels(days) {
        const labels = [];
        for (let i = days; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }
        return labels;
    }

    generateTrendDatasets(currentData, conditions) {
        const datasets = [];
        const metrics = currentData.metrics;

        if (currentData.fluidType === 'blood') {
            if (metrics.glucose !== null) {
                datasets.push({
                    label: 'Glucose (mg/dL)',
                    data: this.generateMockTimeSeries(metrics.glucose, 31, 10),
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.1)',
                    tension: 0.3
                });
            }
            if (metrics.hba1c !== null) {
                datasets.push({
                    label: 'HbA1c (%)',
                    data: this.generateMockTimeSeries(metrics.hba1c, 31, 0.3),
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.1)',
                    tension: 0.3
                });
            }
            if (metrics.hemoglobin !== null) {
                datasets.push({
                    label: 'Hemoglobin (g/dL)',
                    data: this.generateMockTimeSeries(metrics.hemoglobin, 31, 0.5),
                    borderColor: 'rgb(255, 159, 64)',
                    backgroundColor: 'rgba(255, 159, 64, 0.1)',
                    tension: 0.3
                });
            }
        }

        if (currentData.fluidType === 'urine') {
            if (metrics.eGFR !== null) {
                datasets.push({
                    label: 'eGFR (mL/min/1.73m²)',
                    data: this.generateMockTimeSeries(metrics.eGFR, 31, 3),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.1)',
                    tension: 0.3
                });
            }
        }

        // If no datasets, create a placeholder
        if (datasets.length === 0) {
            datasets.push({
                label: 'No data available',
                data: Array(31).fill(0),
                borderColor: 'rgb(200, 200, 200)',
                backgroundColor: 'rgba(200, 200, 200, 0.1)'
            });
        }

        return datasets;
    }

    generateMockTimeSeries(currentValue, points, variance) {
        const data = [];
        for (let i = 0; i < points; i++) {
            const randomOffset = (Math.random() - 0.5) * variance * 2;
            data.push(Math.max(0, currentValue + randomOffset));
        }
        // Ensure last value is the current value
        data[data.length - 1] = currentValue;
        return data;
    }

    generateMockTrendData(currentData) {
        // This would typically fetch from database
        const dates = [];
        const values = [];
        
        for (let i = 30; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            dates.push(date.toLocaleDateString());
            
            // Generate mock values around current reading
            if (currentData.fluidType === 'blood' && currentData.metrics.glucose) {
                values.push(currentData.metrics.glucose + (Math.random() - 0.5) * 20);
            } else {
                values.push(Math.random() * 100);
            }
        }

        return {
            labels: dates,
            datasets: [{
                label: 'Primary Metric',
                data: values,
                borderColor: 'rgb(106, 76, 147)',
                backgroundColor: 'rgba(106, 76, 147, 0.1)',
                tension: 0.1
            }]
        };
    }

    async generatePDF() {
        try {
            const pdfData = {
                patient: this.currentAnalysisData?.patient,
                analysis: this.currentAnalysisResults,
                timestamp: new Date().toISOString()
            };
            
            await PDFGenerator.generateReport(pdfData);
            this.showToast('PDF Generated', 'Report has been downloaded successfully', 'success');
        } catch (error) {
            console.error('PDF generation failed:', error);
            this.showToast('PDF Error', 'Failed to generate PDF report', 'danger');
        }
    }

    calculateEGFR() {
        const creatinine = parseFloat(document.getElementById('creatinine')?.value);
        const age = parseInt(document.getElementById('patientAge')?.value);
        const sex = document.getElementById('patientSex')?.value;
        const eGFRField = document.getElementById('eGFR');

        if (!eGFRField) return;

        if (!creatinine || !age || !sex || sex === '') {
            eGFRField.value = 'Missing data';
            eGFRField.style.color = '#6c757d';
            return;
        }

        // CKD-EPI formula (2021)
        const k = sex === 'female' ? 0.7 : 0.9;
        const alpha = sex === 'female' ? -0.241 : -0.302;
        const sexFactor = sex === 'female' ? 1.012 : 1.0;

        const minRatio = Math.min(creatinine / k, 1);
        const maxRatio = Math.max(creatinine / k, 1);

        const eGFR = 142 * Math.pow(minRatio, alpha) * Math.pow(maxRatio, -1.200) * Math.pow(0.9938, age) * sexFactor;

        const roundedEGFR = Math.round(eGFR * 100) / 100;

        eGFRField.value = `${roundedEGFR} mL/min/1.73m²`;

        if (roundedEGFR < 60) {
            eGFRField.style.color = '#dc3545';
            eGFRField.style.fontWeight = 'bold';
        } else if (roundedEGFR < 90) {
            eGFRField.style.color = '#ffc107';
            eGFRField.style.fontWeight = 'bold';
        } else {
            eGFRField.style.color = '#28a745';
            eGFRField.style.fontWeight = 'bold';
        }

        // Store computed eGFR for later use
        if (!window.computedValues) window.computedValues = {};
        window.computedValues.eGFR = roundedEGFR;
    }

    saveDraft() {
        const formData = this.collectFormData();
        if (formData) {
            localStorage.setItem('analysisDraft', JSON.stringify(formData));
            this.showToast('Draft Saved', 'Your analysis has been saved as a draft', 'success');
        }
    }

    loadProfiles() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="bi bi-person-lines-fill me-2"></i>Patient Profiles</h1>
                <div class="btn-group">
                    <button type="button" class="btn btn-primary" id="addPatient">
                        <i class="bi bi-person-plus me-2"></i>Add Patient
                    </button>
                    <button type="button" class="btn btn-outline-secondary" id="importData">
                        <i class="bi bi-upload me-2"></i>Import
                    </button>
                    <button type="button" class="btn btn-outline-secondary" id="exportData">
                        <i class="bi bi-download me-2"></i>Export
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Patient List</h5>
                                <input type="search" class="form-control" style="max-width: 300px;" placeholder="Search patients..." id="patientSearch">
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="patientsList">
                                <div class="text-center py-5">
                                    <div class="skeleton skeleton-header mx-auto"></div>
                                    <div class="skeleton skeleton-text"></div>
                                    <div class="skeleton skeleton-text" style="width: 60%;"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadPatientsList();
        this.setupProfilesHandlers();
    }

    async loadPatientsList() {
        try {
            const patients = await DB.getPatients();
            const container = document.getElementById('patientsList');

            if (patients.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="bi bi-person-plus"></i>
                        </div>
                        <h5>No Patients Found</h5>
                        <p>Add your first patient to get started</p>
                        <button class="btn btn-primary" onclick="app.showAddPatientModal()">
                            <i class="bi bi-person-plus me-2"></i>Add Patient
                        </button>
                    </div>
                `;
                return;
            }

            this.displayPatientsList(patients);
        } catch (error) {
            console.error('Failed to load patients:', error);
            document.getElementById('patientsList').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to load patient data. Please try again.
                </div>
            `;
        }
    }

    setupProfilesHandlers() {
        document.getElementById('addPatient').addEventListener('click', () => {
            this.showAddPatientModal();
        });

        document.getElementById('importData').addEventListener('click', () => {
            this.showImportDialog();
        });

        document.getElementById('exportData').addEventListener('click', () => {
            this.exportPatientData();
        });

        document.getElementById('patientSearch').addEventListener('input', (e) => {
            this.filterPatients(e.target.value);
        });
    }

    showAddPatientModal() {
        const modalHTML = `
            <div class="modal fade" id="addPatientModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-person-plus me-2"></i>Add New Patient</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="addPatientForm">
                                <div class="mb-3">
                                    <label for="modalPatientName" class="form-label">Full Name *</label>
                                    <input type="text" class="form-control" id="modalPatientName" required>
                                </div>
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="modalPatientAge" class="form-label">Age *</label>
                                            <input type="number" class="form-control" id="modalPatientAge" min="0" max="150" required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="mb-3">
                                            <label for="modalPatientSex" class="form-label">Sex *</label>
                                            <select class="form-select" id="modalPatientSex" required>
                                                <option value="">Select...</option>
                                                <option value="male">Male</option>
                                                <option value="female">Female</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <div class="mb-3">
                                    <label for="modalPatientMRN" class="form-label">Medical Record Number</label>
                                    <input type="text" class="form-control" id="modalPatientMRN">
                                </div>
                                <div class="mb-3">
                                    <label for="modalPatientEmail" class="form-label">Email</label>
                                    <input type="email" class="form-control" id="modalPatientEmail">
                                </div>
                                <div class="mb-3">
                                    <label for="modalPatientPhone" class="form-label">Phone</label>
                                    <input type="tel" class="form-control" id="modalPatientPhone">
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="savePatientBtn">Save Patient</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('addPatientModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('addPatientModal'));
        modal.show();

        // Handle save
        document.getElementById('savePatientBtn').addEventListener('click', async () => {
            await this.saveNewPatient();
            modal.hide();
        });
    }

    async saveNewPatient() {
        const name = document.getElementById('modalPatientName').value.trim();
        const age = parseInt(document.getElementById('modalPatientAge').value);
        const sex = document.getElementById('modalPatientSex').value;
        const mrn = document.getElementById('modalPatientMRN').value.trim();
        const email = document.getElementById('modalPatientEmail').value.trim();
        const phone = document.getElementById('modalPatientPhone').value.trim();

        if (!name || !age || !sex) {
            this.showToast('Missing Information', 'Please fill in all required fields', 'warning');
            return;
        }

        try {
            const patient = await DB.addPatient({
                name,
                age,
                sex,
                mrn,
                email,
                phone
            });

            this.showToast('Success', 'Patient profile created successfully', 'success');

            // Reload profiles list if on profiles page
            if (document.getElementById('patientsList')) {
                this.loadPatientsList();
            }

            // Reload profile dropdown if on analysis page
            if (document.getElementById('profileSelect')) {
                await this.loadProfilesDropdown();
                // Auto-select the newly created profile
                document.getElementById('profileSelect').value = patient.id;
                await this.handleProfileSelection(patient.id);
            }
        } catch (error) {
            console.error('Error saving patient:', error);
            this.showToast('Error', 'Failed to save patient profile', 'danger');
        }
    }

    async filterPatients(searchTerm) {
        if (!searchTerm.trim()) {
            this.loadPatientsList();
            return;
        }

        try {
            const patients = await DB.searchPatients(searchTerm);
            this.displayPatientsList(patients);
        } catch (error) {
            console.error('Error filtering patients:', error);
        }
    }

    displayPatientsList(patients) {
        const container = document.getElementById('patientsList');

        if (patients.length === 0) {
            container.innerHTML = `
                <div class="text-center py-5">
                    <i class="bi bi-search text-muted" style="font-size: 3rem;"></i>
                    <h5 class="text-muted mt-3">No patients found</h5>
                    <p class="text-muted">Try a different search term</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="table-responsive">
                <table class="table table-hover">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Age</th>
                            <th>Sex</th>
                            <th>MRN</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${patients.map(patient => `
                            <tr>
                                <td><strong>${patient.name}</strong></td>
                                <td>${patient.age}</td>
                                <td>${this.capitalize(patient.sex)}</td>
                                <td>${patient.mrn || '-'}</td>
                                <td>
                                    <button class="btn btn-sm btn-outline-primary" onclick="app.editPatient('${patient.id}')">
                                        <i class="bi bi-pencil"></i>
                                    </button>
                                    <button class="btn btn-sm btn-outline-danger" onclick="app.deletePatientConfirm('${patient.id}')">
                                        <i class="bi bi-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
    }

    async editPatient(id) {
        // To be implemented - similar to showAddPatientModal but with edit mode
        this.showToast('Info', 'Edit functionality coming soon', 'info');
    }

    async deletePatientConfirm(id) {
        if (confirm('Are you sure you want to delete this patient profile? This action cannot be undone.')) {
            try {
                await DB.deletePatient(id);
                this.showToast('Success', 'Patient profile deleted', 'success');
                this.loadPatientsList();
            } catch (error) {
                console.error('Error deleting patient:', error);
                this.showToast('Error', 'Failed to delete patient profile', 'danger');
            }
        }
    }

    async exportPatientData() {
        try {
            const data = await DB.exportData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `galpal-data-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            this.showToast('Success', 'Data exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error', 'Failed to export data', 'danger');
        }
    }

    showImportDialog() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    const text = await file.text();
                    const data = JSON.parse(text);
                    const results = await DB.importData(data);

                    let message = `Imported ${results.patients} patients and ${results.analyses} analyses.`;
                    if (results.errors.length > 0) {
                        message += ` ${results.errors.length} errors occurred.`;
                    }

                    this.showToast('Import Complete', message, results.errors.length > 0 ? 'warning' : 'success');
                    this.loadPatientsList();
                } catch (error) {
                    console.error('Error importing data:', error);
                    this.showToast('Error', 'Failed to import data. Please check the file format.', 'danger');
                }
            }
        };
        input.click();
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    async loadHistory() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="bi bi-clock-history me-2"></i>Analysis History</h1>
                <div class="btn-group">
                    <button type="button" class="btn btn-outline-secondary" id="filterHistory">
                        <i class="bi bi-funnel me-2"></i>Filter
                    </button>
                    <button type="button" class="btn btn-outline-secondary" id="exportHistory">
                        <i class="bi bi-download me-2"></i>Export
                    </button>
                </div>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <div class="d-flex justify-content-between align-items-center">
                                <h5 class="mb-0">Past Analyses</h5>
                                <input type="search" class="form-control" style="max-width: 300px;" placeholder="Search analyses..." id="historySearch">
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="historyList">
                                <div class="text-center py-5">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Loading...</span>
                                    </div>
                                    <p class="mt-3 text-muted">Loading history...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        await this.loadAnalysesHistory();
        this.setupHistoryHandlers();
    }

    async loadAnalysesHistory() {
        try {
            const analyses = await window.DB.getAllAnalyses();
            const patients = await window.DB.getPatients();

            const container = document.getElementById('historyList');

            if (analyses.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="bi bi-clock-history"></i>
                        </div>
                        <h5>No Analysis History</h5>
                        <p>Run your first analysis to see results here</p>
                        <a href="#/analysis" class="btn btn-primary">
                            <i class="bi bi-clipboard-data me-2"></i>Start Analysis
                        </a>
                    </div>
                `;
                return;
            }

            // Create a patient lookup map
            const patientMap = {};
            patients.forEach(p => {
                patientMap[p.id] = p;
            });

            // Sort analyses by date (newest first)
            analyses.sort((a, b) => new Date(b.test_date || b.created_at) - new Date(a.test_date || a.created_at));

            container.innerHTML = analyses.map(analysis => {
                const patient = patientMap[analysis.patient_id];
                const patientName = patient ? patient.name : 'Unknown Patient';
                const testDate = new Date(analysis.test_date || analysis.created_at);
                const fluidType = this.capitalize(analysis.fluid_type || 'unknown');

                // Get risk level from analysis
                let riskLevel = 'LOW';
                let riskClass = 'success';
                if (analysis.risk_factors && analysis.risk_factors.length > 0) {
                    const highRisks = analysis.risk_factors.filter(r => r.level === 'HIGH');
                    const moderateRisks = analysis.risk_factors.filter(r => r.level === 'MODERATE');

                    if (highRisks.length > 0) {
                        riskLevel = 'HIGH';
                        riskClass = 'danger';
                    } else if (moderateRisks.length > 0) {
                        riskLevel = 'MODERATE';
                        riskClass = 'warning';
                    }
                }

                return `
                    <div class="card mb-3 history-item" data-analysis-id="${analysis.id}">
                        <div class="card-body">
                            <div class="d-flex justify-content-between align-items-start">
                                <div class="flex-grow-1">
                                    <h5 class="mb-2">
                                        <i class="bi bi-person me-2"></i>${patientName}
                                        <span class="badge bg-${riskClass} ms-2">${riskLevel} RISK</span>
                                    </h5>
                                    <div class="text-muted mb-2">
                                        <i class="bi bi-droplet me-1"></i>${fluidType} Analysis
                                        <span class="ms-3"><i class="bi bi-calendar me-1"></i>${testDate.toLocaleDateString()}</span>
                                        <span class="ms-3"><i class="bi bi-clock me-1"></i>${testDate.toLocaleTimeString()}</span>
                                    </div>
                                    ${analysis.ai_summary ? `
                                        <p class="mb-2">${analysis.ai_summary.substring(0, 200)}${analysis.ai_summary.length > 200 ? '...' : ''}</p>
                                    ` : ''}
                                    ${analysis.detected_conditions && analysis.detected_conditions.length > 0 ? `
                                        <div class="mb-2">
                                            <strong>Detected Conditions:</strong>
                                            ${analysis.detected_conditions.map(c => `<span class="badge bg-info me-1">${c.name || c}</span>`).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                                <div class="ms-3">
                                    <button class="btn btn-outline-primary btn-sm view-analysis-btn" data-id="${analysis.id}">
                                        <i class="bi bi-eye me-1"></i>View Details
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            // Add click handlers for view buttons
            document.querySelectorAll('.view-analysis-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.closest('.view-analysis-btn').dataset.id;
                    this.viewAnalysisDetails(id);
                });
            });

        } catch (error) {
            console.error('Failed to load analysis history:', error);
            document.getElementById('historyList').innerHTML = `
                <div class="alert alert-danger">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Failed to load analysis history. Please try again.
                </div>
            `;
        }
    }

    setupHistoryHandlers() {
        const filterBtn = document.getElementById('filterHistory');
        if (filterBtn) {
            filterBtn.addEventListener('click', () => {
                this.showToast('Coming Soon', 'Filter functionality will be available in the next update', 'info');
            });
        }

        const exportBtn = document.getElementById('exportHistory');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportAnalysisHistory();
            });
        }

        const searchInput = document.getElementById('historySearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterHistoryBySearch(e.target.value);
            });
        }
    }

    filterHistoryBySearch(query) {
        const items = document.querySelectorAll('.history-item');
        const lowerQuery = query.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            if (text.includes(lowerQuery)) {
                item.style.display = '';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async viewAnalysisDetails(analysisId) {
        try {
            const analysis = await window.DB.getAnalysis(analysisId);
            if (!analysis) {
                this.showToast('Error', 'Analysis not found', 'danger');
                return;
            }

            const patient = await window.DB.getPatient(analysis.patient_id);

            // Display detailed view in modal
            const modalHTML = `
                <div class="modal fade" id="analysisDetailModal" tabindex="-1">
                    <div class="modal-dialog modal-xl">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="bi bi-clipboard-data me-2"></i>Analysis Details
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <h6>Patient Information</h6>
                                <p><strong>Name:</strong> ${patient ? patient.name : 'Unknown'}<br>
                                   <strong>Date:</strong> ${new Date(analysis.test_date || analysis.created_at).toLocaleString()}<br>
                                   <strong>Fluid Type:</strong> ${this.capitalize(analysis.fluid_type)}</p>

                                <hr>

                                <h6>AI Summary</h6>
                                <p>${analysis.ai_summary || 'No summary available'}</p>

                                ${analysis.ai_interpretation ? `
                                    <hr>
                                    <h6>Interpretation</h6>
                                    <p>${analysis.ai_interpretation}</p>
                                ` : ''}

                                ${analysis.detected_conditions && analysis.detected_conditions.length > 0 ? `
                                    <hr>
                                    <h6>Detected Conditions</h6>
                                    <ul>
                                        ${analysis.detected_conditions.map(c => `<li>${typeof c === 'string' ? c : c.name}</li>`).join('')}
                                    </ul>
                                ` : ''}

                                ${analysis.risk_factors && analysis.risk_factors.length > 0 ? `
                                    <hr>
                                    <h6>Risk Factors</h6>
                                    <ul>
                                        ${analysis.risk_factors.map(r => `<li><strong>${r.level}:</strong> ${r.description}</li>`).join('')}
                                    </ul>
                                ` : ''}

                                ${analysis.recommendations ? `
                                    <hr>
                                    <h6>Recommendations</h6>
                                    <p>${analysis.recommendations}</p>
                                ` : ''}

                                ${analysis.notes ? `
                                    <hr>
                                    <h6>Notes</h6>
                                    <p>${analysis.notes}</p>
                                ` : ''}
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                                <button type="button" class="btn btn-primary" onclick="app.exportAnalysisPDF('${analysisId}')">
                                    <i class="bi bi-file-pdf me-2"></i>Export PDF
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.body.insertAdjacentHTML('beforeend', modalHTML);
            const modal = new bootstrap.Modal(document.getElementById('analysisDetailModal'));
            modal.show();

            document.getElementById('analysisDetailModal').addEventListener('hidden.bs.modal', function() {
                this.remove();
            });

        } catch (error) {
            console.error('Error viewing analysis details:', error);
            this.showToast('Error', 'Failed to load analysis details', 'danger');
        }
    }

    async exportAnalysisHistory() {
        try {
            const analyses = await window.DB.getAllAnalyses();
            const patients = await window.DB.getPatients();

            const data = {
                exportDate: new Date().toISOString(),
                analyses: analyses,
                patients: patients
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `galpal-history-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);

            this.showToast('Success', 'Analysis history exported successfully', 'success');
        } catch (error) {
            console.error('Error exporting history:', error);
            this.showToast('Error', 'Failed to export analysis history', 'danger');
        }
    }

    loadWiki() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="bi bi-book me-2"></i>Health Wiki</h1>
            </div>

            <div class="row">
                <div class="col-12">
                    <div class="card mb-4">
                        <div class="card-body">
                            <div class="input-group">
                                <span class="input-group-text"><i class="bi bi-search"></i></span>
                                <input type="text" class="form-control form-control-lg" id="wikiSearch" 
                                       placeholder="Search health topics, symptoms, or conditions...">
                                <button class="btn btn-primary" id="searchBtn">Search</button>
                            </div>
                        </div>
                    </div>

                    <div id="wikiResults">
                        <div class="row">
                            <div class="col-12">
                                <h5>Popular Topics</h5>
                                <div class="row" id="popularTopics">
                                    <!-- Popular topics will be loaded here -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupWikiHandlers();
        this.loadPopularTopics();
    }

    setupWikiHandlers() {
        document.getElementById('searchBtn').addEventListener('click', () => {
            this.performWikiSearch();
        });

        document.getElementById('wikiSearch').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.performWikiSearch();
            }
        });
    }

    async loadPopularTopics() {
        try {
            const response = await fetch('./assets/data/wiki-topics.json');
            const topics = await response.json();
            
            const container = document.getElementById('popularTopics');
            container.innerHTML = topics.map(topic => `
                <div class="col-md-4 mb-3">
                    <div class="card h-100">
                        <div class="card-body">
                            <h6 class="card-title">${topic.title}</h6>
                            <p class="card-text small text-muted">${topic.summary}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">${topic.source}</small>
                                <a href="${topic.link}" target="_blank" class="btn btn-sm btn-outline-primary">
                                    Learn More
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            document.getElementById('popularTopics').innerHTML = `
                <div class="col-12">
                    <div class="alert alert-info">
                        <i class="bi bi-wifi-off me-2"></i>
                        Unable to load popular topics. Please check your connection or try searching.
                    </div>
                </div>
            `;
        }
    }

    async performWikiSearch() {
        const query = document.getElementById('wikiSearch').value.trim();
        if (!query) return;

        const resultsContainer = document.getElementById('wikiResults');
        
        // Show loading state
        resultsContainer.innerHTML = `
            <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Searching...</span>
                </div>
                <p class="mt-3">Searching health information...</p>
            </div>
        `;

        try {
            const results = await WikiService.search(query);
            this.displayWikiResults(results);
        } catch (error) {
            resultsContainer.innerHTML = `
                <div class="alert alert-warning">
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Search failed. Please try again or check your connection.
                </div>
            `;
        }
    }

    displayWikiResults(results) {
        const container = document.getElementById('wikiResults');
        
        if (results.length === 0) {
            container.innerHTML = `
                <div class="alert alert-info">
                    <i class="bi bi-info-circle me-2"></i>
                    No results found. Try different search terms.
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <div class="row">
                ${results.map(result => `
                    <div class="col-lg-6 mb-4">
                        <div class="card h-100">
                            <div class="card-header d-flex justify-content-between align-items-start">
                                <h6 class="mb-0">${result.title}</h6>
                                <span class="badge bg-secondary">${result.source}</span>
                            </div>
                            <div class="card-body">
                                <p class="card-text">${result.summary}</p>
                                
                                ${result.redFlags ? `
                                    <div class="alert alert-warning small">
                                        <strong>⚠️ When to Seek Medical Attention:</strong><br>
                                        ${result.redFlags}
                                    </div>
                                ` : ''}
                                
                                ${result.normalValues ? `
                                    <div class="alert alert-info small">
                                        <strong>Normal Values:</strong><br>
                                        ${result.normalValues}
                                    </div>
                                ` : ''}
                            </div>
                            <div class="card-footer">
                                <div class="d-flex justify-content-between align-items-center">
                                    <small class="text-muted">
                                        <i class="bi bi-clock me-1"></i>
                                        Cached ${new Date(result.cachedAt).toLocaleDateString()}
                                    </small>
                                    <a href="${result.sourceUrl}" target="_blank" class="btn btn-sm btn-primary">
                                        <i class="bi bi-box-arrow-up-right me-1"></i>
                                        Source
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    loadConsult() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 class="h2 mb-1"><i class="bi bi-camera-video me-2 text-highlight"></i>Consultations</h1>
                    <p class="text-subtle mb-0">Connect with healthcare providers</p>
                </div>
                <button type="button" class="btn btn-primary" id="bookConsult">
                    <i class="bi bi-calendar-plus me-2"></i>Book Now
                </button>
            </div>

            <div class="section-divider">
                <span>Quick Actions</span>
            </div>

            <div class="card-grid mb-5">
                <a class="action-card" id="nowServingBtn">
                    <div class="action-card-icon">
                        <i class="bi bi-globe"></i>
                    </div>
                    <div class="action-card-content">
                        <h6>NowServing Portal</h6>
                        <p>Book appointments online</p>
                    </div>
                    <i class="bi bi-arrow-right action-card-arrow"></i>
                </a>

                <a class="action-card" id="testCallBtn">
                    <div class="action-card-icon">
                        <i class="bi bi-camera-video"></i>
                    </div>
                    <div class="action-card-content">
                        <h6>Test Video Call</h6>
                        <p>Check camera & microphone</p>
                    </div>
                    <i class="bi bi-arrow-right action-card-arrow"></i>
                </a>

                <a class="action-card" id="emergencyBtn">
                    <div class="action-card-icon" style="background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);">
                        <i class="bi bi-telephone"></i>
                    </div>
                    <div class="action-card-content">
                        <h6>Emergency</h6>
                        <p>Get immediate help</p>
                    </div>
                    <i class="bi bi-arrow-right action-card-arrow"></i>
                </a>
            </div>

            <div class="section-divider">
                <span>Upcoming</span>
            </div>

            <div class="card mb-4">
                <div class="card-body" id="upcomingConsults">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="bi bi-calendar-check"></i>
                        </div>
                        <h5>No Upcoming Consultations</h5>
                        <p>Book a consultation to get started</p>
                        <button class="btn btn-primary" onclick="document.getElementById('bookConsult').click()">
                            <i class="bi bi-calendar-plus me-2"></i>Schedule Now
                        </button>
                    </div>
                </div>
            </div>

            <div class="section-divider">
                <span>Available Providers</span>
            </div>

            <div class="card-grid mb-5" id="doctorsList">
                <div class="skeleton" style="height: 200px;"></div>
                <div class="skeleton" style="height: 200px;"></div>
                <div class="skeleton" style="height: 200px;"></div>
            </div>

            <div class="section-divider">
                <span>History</span>
            </div>

            <div class="card">
                <div class="card-body" id="consultHistory">
                    <div class="empty-state">
                        <div class="empty-state-icon">
                            <i class="bi bi-clock-history"></i>
                        </div>
                        <h5>No Consultation History</h5>
                        <p>Your past consultations will appear here</p>
                    </div>
                </div>
            </div>

            <!-- Video Call Modal -->
            <div class="modal fade" id="videoCallModal" tabindex="-1">
                <div class="modal-dialog modal-xl">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="bi bi-camera-video me-2"></i>
                                Video Consultation
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body p-0">
                            <div id="videoCallContainer" style="height: 500px; background: #1F2937; display: flex; align-items: center; justify-content: center;">
                                <div class="text-center text-white">
                                    <i class="bi bi-camera-video" style="font-size: 3rem;"></i>
                                    <p class="mt-3">Initializing video call...</p>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" id="toggleMute">
                                <i class="bi bi-mic me-2"></i>Mute
                            </button>
                            <button type="button" class="btn btn-secondary" id="toggleVideo">
                                <i class="bi bi-camera-video me-2"></i>Video
                            </button>
                            <button type="button" class="btn btn-danger" id="endCall">
                                <i class="bi bi-telephone-x me-2"></i>End Call
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupConsultHandlers();
        this.loadConsultData();
    }

    setupConsultHandlers() {
        document.getElementById('bookConsult').addEventListener('click', () => {
            this.showBookConsultModal();
        });

        document.getElementById('nowServingBtn').addEventListener('click', () => {
            this.openNowServingPortal();
        });

        document.getElementById('testCallBtn').addEventListener('click', () => {
            this.startTestCall();
        });

        document.getElementById('emergencyBtn').addEventListener('click', () => {
            this.handleEmergency();
        });
    }

    async loadConsultData() {
        try {
            const response = await fetch('./assets/data/doctors.json');
            const doctors = await response.json();

            const doctorsContainer = document.getElementById('doctorsList');
            doctorsContainer.innerHTML = doctors.map(doctor => `
                <div class="card doctor-card">
                    <div class="card-body">
                        <div class="d-flex align-items-start gap-3 mb-3">
                            <div class="doctor-avatar">
                                <i class="bi bi-person"></i>
                            </div>
                            <div class="flex-grow-1">
                                <h6 class="mb-1">${doctor.name}</h6>
                                <p class="text-highlight mb-1" style="font-size: 0.875rem;">${doctor.specialty}</p>
                                <p class="text-subtle mb-2" style="font-size: 0.8125rem;">
                                    <i class="bi bi-hospital me-1"></i>${doctor.hospital}
                                </p>
                                <span class="status-badge ${doctor.available ? 'online' : 'offline'}">
                                    <span class="status-dot"></span>
                                    ${doctor.available ? 'Available' : 'Offline'}
                                </span>
                            </div>
                        </div>
                        <div class="visual-divider" style="margin: 1rem 0;"></div>
                        <button class="btn btn-primary w-100" onclick="app.bookWithDoctor('${doctor.id}')">
                            <i class="bi bi-calendar-plus me-2"></i>Book Appointment
                        </button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            document.getElementById('doctorsList').innerHTML = `
                <div class="card col-span-full">
                    <div class="card-body">
                        <div class="empty-state">
                            <div class="empty-state-icon">
                                <i class="bi bi-person-x"></i>
                            </div>
                            <p>Unable to load providers</p>
                        </div>
                    </div>
                </div>
            `;
        }
    }

    openNowServingPortal() {
        // This would typically open the configured NowServing PH URL
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        const nowServingUrl = settings.nowServingUrl || 'https://nowserving.ph';
        
        window.open(nowServingUrl, '_blank');
        this.showToast('External Link', 'Opening NowServing PH in new window', 'info');
    }

    async startTestCall() {
        try {
            await window.webRTCService.initializeCall();
            const modal = new bootstrap.Modal(document.getElementById('videoCallModal'));
            modal.show();
        } catch (error) {
            this.showToast('Call Error', 'Failed to start video call. Please check your camera and microphone permissions.', 'danger');
        }
    }

    handleEmergency() {
        const emergencyModal = document.createElement('div');
        emergencyModal.className = 'modal fade';
        emergencyModal.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content border-danger">
                    <div class="modal-header bg-danger text-white">
                        <h5 class="modal-title">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i>
                            Emergency Services
                        </h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                    </div>
                    <div class="modal-body">
                        <div class="alert alert-danger">
                            <strong>If this is a life-threatening emergency, call 911 immediately!</strong>
                        </div>

                        <h6 class="mb-3">Emergency Contacts:</h6>
                        <div class="list-group mb-3">
                            <a href="tel:911" class="list-group-item list-group-item-action">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-telephone-fill text-danger fs-4 me-3"></i>
                                    <div>
                                        <h6 class="mb-0">Emergency Services</h6>
                                        <small class="text-muted">911</small>
                                    </div>
                                </div>
                            </a>
                            <a href="tel:988" class="list-group-item list-group-item-action">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-heart-fill text-primary fs-4 me-3"></i>
                                    <div>
                                        <h6 class="mb-0">Suicide & Crisis Lifeline</h6>
                                        <small class="text-muted">988</small>
                                    </div>
                                </div>
                            </a>
                            <a href="tel:1-800-222-1222" class="list-group-item list-group-item-action">
                                <div class="d-flex align-items-center">
                                    <i class="bi bi-capsule-pill text-warning fs-4 me-3"></i>
                                    <div>
                                        <h6 class="mb-0">Poison Control</h6>
                                        <small class="text-muted">1-800-222-1222</small>
                                    </div>
                                </div>
                            </a>
                        </div>

                        <h6 class="mb-3">Quick Actions:</h6>
                        <div class="d-grid gap-2">
                            <button class="btn btn-outline-primary" onclick="app.showNearestHospital()">
                                <i class="bi bi-hospital me-2"></i>Find Nearest Hospital
                            </button>
                            <button class="btn btn-outline-success" onclick="app.contactProvider()">
                                <i class="bi bi-person-video3 me-2"></i>Contact Healthcare Provider
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(emergencyModal);
        const modal = new bootstrap.Modal(emergencyModal);
        modal.show();

        emergencyModal.addEventListener('hidden.bs.modal', () => {
            emergencyModal.remove();
        });
    }

    showNearestHospital() {
        this.showToast('Finding Hospitals', 'Opening map to show nearest emergency facilities...', 'info');
        setTimeout(() => {
            window.open('https://www.google.com/maps/search/emergency+hospital+near+me', '_blank');
        }, 500);
    }

    contactProvider() {
        this.showToast('Contacting Provider', 'Connecting you to on-call healthcare provider...', 'info');
        setTimeout(() => {
            this.navigateTo('consult');
        }, 500);
    }

    showBookConsultModal() {
        const modalHTML = `
            <div class="modal fade" id="bookConsultModal" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title"><i class="bi bi-calendar-plus me-2"></i>Book Consultation</h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <form id="bookConsultForm">
                                <div class="mb-3">
                                    <label class="form-label">Select Patient *</label>
                                    <select class="form-select" id="consultPatientSelect" required>
                                        <option value="">Loading patients...</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Select Doctor *</label>
                                    <select class="form-select" id="consultDoctorSelect" required>
                                        <option value="">Loading doctors...</option>
                                    </select>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Preferred Date *</label>
                                    <input type="date" class="form-control" id="consultDate" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Preferred Time *</label>
                                    <input type="time" class="form-control" id="consultTime" required>
                                </div>
                                <div class="mb-3">
                                    <label class="form-label">Reason for Consultation</label>
                                    <textarea class="form-control" id="consultReason" rows="3"></textarea>
                                </div>
                            </form>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                            <button type="button" class="btn btn-primary" id="confirmBookingBtn">Book Appointment</button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Remove existing modal if any
        const existingModal = document.getElementById('bookConsultModal');
        if (existingModal) existingModal.remove();

        // Add modal to DOM
        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Load data
        this.loadBookingFormData();

        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('bookConsultModal'));
        modal.show();

        // Handle booking
        document.getElementById('confirmBookingBtn').addEventListener('click', async () => {
            await this.confirmBooking();
            modal.hide();
        });
    }

    async loadBookingFormData() {
        // Load patients
        try {
            const patients = await DB.getPatients();
            const patientSelect = document.getElementById('consultPatientSelect');
            patientSelect.innerHTML = '<option value="">Select a patient...</option>' +
                patients.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
        } catch (error) {
            console.error('Error loading patients:', error);
        }

        // Load doctors
        try {
            const response = await fetch('./assets/data/doctors.json');
            const doctors = await response.json();
            const doctorSelect = document.getElementById('consultDoctorSelect');
            doctorSelect.innerHTML = '<option value="">Select a doctor...</option>' +
                doctors.map(d => `<option value="${d.id}">${d.name} - ${d.specialty}</option>`).join('');
        } catch (error) {
            console.error('Error loading doctors:', error);
        }

        // Set min date to today
        const dateInput = document.getElementById('consultDate');
        dateInput.min = new Date().toISOString().split('T')[0];
    }

    async confirmBooking() {
        const patientId = document.getElementById('consultPatientSelect').value;
        const doctorId = document.getElementById('consultDoctorSelect').value;
        const date = document.getElementById('consultDate').value;
        const time = document.getElementById('consultTime').value;
        const reason = document.getElementById('consultReason').value;

        if (!patientId || !doctorId || !date || !time) {
            this.showToast('Missing Information', 'Please fill in all required fields', 'warning');
            return;
        }

        // In a real application, this would save to database
        const booking = {
            patientId,
            doctorId,
            date,
            time,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        // Save to localStorage for demo
        const bookings = JSON.parse(localStorage.getItem('consultBookings') || '[]');
        bookings.push(booking);
        localStorage.setItem('consultBookings', JSON.stringify(bookings));

        this.showToast('Success', 'Consultation booked successfully! You will receive a confirmation email.', 'success');
    }

    bookWithDoctor(doctorId) {
        this.showBookConsultModal();
        // After modal loads, pre-select the doctor
        setTimeout(() => {
            const doctorSelect = document.getElementById('consultDoctorSelect');
            if (doctorSelect) {
                doctorSelect.value = doctorId;
            }
        }, 500);
    }

    loadDevice() {
        const content = document.getElementById('app-content');
        content.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="bi bi-cpu me-2"></i>Device Status</h1>
                <button type="button" class="btn btn-outline-secondary" id="refreshStatus">
                    <i class="bi bi-arrow-clockwise me-2"></i>Refresh
                </button>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="bi bi-speedometer2 me-2"></i>System Health</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-6">
                                    <div class="text-center">
                                        <div class="h3 text-primary" id="cpuTemp">--°C</div>
                                        <small class="text-muted">CPU Temperature</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center">
                                        <div class="h3 text-info" id="memUsage">--%</div>
                                        <small class="text-muted">Memory Usage</small>
                                    </div>
                                </div>
                            </div>
                            
                            <hr>
                            
                            <div class="row">
                                <div class="col-6">
                                    <div class="text-center">
                                        <div class="h3 text-success" id="diskUsage">--%</div>
                                        <small class="text-muted">Disk Usage</small>
                                    </div>
                                </div>
                                <div class="col-6">
                                    <div class="text-center">
                                        <div class="h3" id="uptime">--:--</div>
                                        <small class="text-muted">Uptime</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-wifi me-2"></i>Network Information</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-2">
                                <strong>IP Address:</strong> <span id="ipAddress">Loading...</span>
                            </div>
                            <div class="mb-2">
                                <strong>Connection:</strong> 
                                <span id="connectionType" class="badge bg-success">Online</span>
                            </div>
                            <div class="mb-2">
                                <strong>Data Usage:</strong> <span id="dataUsage">-- MB</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="bi bi-gear me-2"></i>Services Status</h5>
                        </div>
                        <div class="card-body">
                            <div class="list-group list-group-flush">
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    Database Service
                                    <span class="badge bg-success">Running</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    AI Analysis Module
                                    <span class="badge bg-success">Ready</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    PDF Generator
                                    <span class="badge bg-success">Available</span>
                                </div>
                                <div class="list-group-item d-flex justify-content-between align-items-center">
                                    WebRTC Service
                                    <span class="badge bg-warning">Limited</span>
                                </div>
                            </div>
                            
                            <div class="mt-3">
                                <button class="btn btn-outline-warning btn-sm me-2" id="restartServices">
                                    <i class="bi bi-arrow-clockwise me-1"></i>Restart Services
                                </button>
                                <button class="btn btn-outline-info btn-sm" id="runDiagnostics">
                                    <i class="bi bi-clipboard-check me-1"></i>Run Diagnostics
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-journal-text me-2"></i>System Logs</h5>
                        </div>
                        <div class="card-body">
                            <div id="systemLogs" style="height: 300px; overflow-y: auto; font-family: monospace; font-size: 0.8rem;">
                                <div class="text-success">[${new Date().toLocaleString()}] System initialized successfully</div>
                                <div class="text-info">[${new Date().toLocaleString()}] Database connection established</div>
                                <div class="text-info">[${new Date().toLocaleString()}] AI module loaded</div>
                                <div class="text-warning">[${new Date().toLocaleString()}] WebRTC permissions limited</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.loadDeviceStatus();
        this.setupDeviceHandlers();
    }

    setupDeviceHandlers() {
        document.getElementById('refreshStatus').addEventListener('click', () => {
            this.loadDeviceStatus();
        });

        document.getElementById('restartServices').addEventListener('click', () => {
            this.restartServices();
        });

        document.getElementById('runDiagnostics').addEventListener('click', () => {
            this.runDiagnostics();
        });
    }

    loadDeviceStatus() {
        // Simulate system metrics (in real implementation, this would query actual system)
        document.getElementById('cpuTemp').textContent = Math.floor(Math.random() * 20 + 45) + '°C';
        document.getElementById('memUsage').textContent = Math.floor(Math.random() * 30 + 40) + '%';
        document.getElementById('diskUsage').textContent = Math.floor(Math.random() * 20 + 30) + '%';
        
        // Calculate uptime
        const uptime = new Date() - new Date(sessionStorage.getItem('sessionStart') || Date.now());
        const hours = Math.floor(uptime / (1000 * 60 * 60));
        const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
        document.getElementById('uptime').textContent = `${hours}:${minutes.toString().padStart(2, '0')}`;

        // Network info
        document.getElementById('ipAddress').textContent = 'localhost';
        document.getElementById('connectionType').className = navigator.onLine ? 'badge bg-success' : 'badge bg-danger';
        document.getElementById('connectionType').textContent = navigator.onLine ? 'Online' : 'Offline';
        document.getElementById('dataUsage').textContent = Math.floor(Math.random() * 500 + 100) + ' MB';
    }

    restartServices() {
        this.showToast('Services Restarting', 'System services are being restarted...', 'info');
        
        // Simulate service restart
        setTimeout(() => {
            this.showToast('Services Restarted', 'All services have been successfully restarted', 'success');
        }, 2000);
    }

    runDiagnostics() {
        this.showToast('Running Diagnostics', 'System diagnostics in progress...', 'info');
        
        // Simulate diagnostics
        setTimeout(() => {
            const logs = document.getElementById('systemLogs');
            const newLog = document.createElement('div');
            newLog.className = 'text-info';
            newLog.textContent = `[${new Date().toLocaleString()}] Diagnostics completed - All systems operational`;
            logs.appendChild(newLog);
            logs.scrollTop = logs.scrollHeight;
            
            this.showToast('Diagnostics Complete', 'System is operating normally', 'success');
        }, 3000);
    }

    loadSettings() {
        const content = document.getElementById('app-content');
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        
        content.innerHTML = `
            <div class="d-flex justify-content-between flex-wrap flex-md-nowrap align-items-center pt-3 pb-2 mb-3 border-bottom">
                <h1 class="h2"><i class="bi bi-gear me-2"></i>Settings</h1>
                <button type="button" class="btn btn-success" id="saveSettings">
                    <i class="bi bi-check-lg me-2"></i>Save Changes
                </button>
            </div>

            <div class="row">
                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="bi bi-palette me-2"></i>Appearance</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="theme" class="form-label">Theme</label>
                                <select class="form-select" id="theme">
                                    <option value="light" ${settings.theme === 'light' ? 'selected' : ''}>Light</option>
                                    <option value="dark" ${settings.theme === 'dark' ? 'selected' : ''}>Dark</option>
                                    <option value="high-contrast" ${settings.theme === 'high-contrast' ? 'selected' : ''}>High Contrast</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="language" class="form-label">Language</label>
                                <select class="form-select" id="language">
                                    <option value="en-PH" ${settings.language === 'en-PH' ? 'selected' : ''}>English (Philippines)</option>
                                    <option value="fil-PH" ${settings.language === 'fil-PH' ? 'selected' : ''}>Filipino</option>
                                    <option value="en-US" ${settings.language === 'en-US' ? 'selected' : ''}>English (US)</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="units" class="form-label">Measurement Units</label>
                                <select class="form-select" id="units">
                                    <option value="metric" ${settings.units === 'metric' ? 'selected' : ''}>Metric (mg/dL)</option>
                                    <option value="imperial" ${settings.units === 'imperial' ? 'selected' : ''}>Imperial (mmol/L)</option>
                                </select>
                            </div>
                            
                            <div class="mb-3">
                                <label for="timezone" class="form-label">Time Zone</label>
                                <select class="form-select" id="timezone">
                                    <option value="Asia/Manila" ${settings.timezone === 'Asia/Manila' ? 'selected' : ''}>Philippines (GMT+8)</option>
                                    <option value="UTC" ${settings.timezone === 'UTC' ? 'selected' : ''}>UTC</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-shield-lock me-2"></i>Privacy & Security</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="dataEncryption" 
                                           ${settings.dataEncryption ? 'checked' : ''}>
                                    <label class="form-check-label" for="dataEncryption">
                                        Enable data encryption
                                    </label>
                                </div>
                                <small class="text-muted">Encrypt sensitive patient data stored locally</small>
                            </div>
                            
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="requirePIN" 
                                           ${settings.requirePIN ? 'checked' : ''}>
                                    <label class="form-check-label" for="requirePIN">
                                        Require PIN for report sharing
                                    </label>
                                </div>
                                <small class="text-muted">Add extra security for sharing medical reports</small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="dataRetention" class="form-label">Data Retention (days)</label>
                                <input type="number" class="form-control" id="dataRetention" 
                                       value="${settings.dataRetention || 365}" min="30" max="3650">
                                <small class="text-muted">Automatically delete old records after this period</small>
                            </div>
                            
                            <hr>
                            
                            <div class="mb-3">
                                <button class="btn btn-outline-warning" id="changePassword">
                                    <i class="bi bi-key me-2"></i>Change Password
                                </button>
                                <button class="btn btn-outline-danger ms-2" id="clearAllData">
                                    <i class="bi bi-trash me-2"></i>Clear All Data
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="col-md-6">
                    <div class="card mb-4">
                        <div class="card-header">
                            <h5><i class="bi bi-link me-2"></i>Integrations</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <label for="nowServingUrl" class="form-label">NowServing PH URL</label>
                                <input type="url" class="form-control" id="nowServingUrl" 
                                       value="${settings.nowServingUrl || 'https://nowserving.ph'}"
                                       placeholder="https://nowserving.ph">
                                <small class="text-muted">Default URL for consultation bookings</small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="hospitalList" class="form-label">Hospital Network</label>
                                <textarea class="form-control" id="hospitalList" rows="3" 
                                          placeholder="Enter hospital names, one per line">${(settings.hospitals || []).join('\n')}</textarea>
                                <small class="text-muted">Hospitals in your network for consultations</small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="smtpSettings" class="form-label">Email Notifications (SMTP)</label>
                                <input type="email" class="form-control mb-2" placeholder="Email address" 
                                       id="notificationEmail" value="${settings.notificationEmail || ''}">
                                <input type="text" class="form-control" placeholder="SMTP server (optional)" 
                                       id="smtpServer" value="${settings.smtpServer || ''}">
                                <small class="text-muted">For sending report notifications</small>
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-cloud-download me-2"></i>Backup & Data</h5>
                        </div>
                        <div class="card-body">
                            <div class="mb-3">
                                <div class="form-check form-switch">
                                    <input class="form-check-input" type="checkbox" id="autoBackup" 
                                           ${settings.autoBackup ? 'checked' : ''}>
                                    <label class="form-check-label" for="autoBackup">
                                        Enable automatic backups
                                    </label>
                                </div>
                                <small class="text-muted">Daily backup of patient data</small>
                            </div>
                            
                            <div class="mb-3">
                                <label for="backupLocation" class="form-label">Backup Location</label>
                                <input type="text" class="form-control" id="backupLocation" 
                                       value="${settings.backupLocation || '/home/pi/galpal-backups'}"
                                       placeholder="/home/pi/galpal-backups">
                            </div>
                            
                            <hr>
                            
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary" id="exportAllData">
                                    <i class="bi bi-download me-2"></i>Export All Data
                                </button>
                                <button class="btn btn-outline-secondary" id="importData">
                                    <i class="bi bi-upload me-2"></i>Import Data
                                </button>
                                <button class="btn btn-outline-info" id="createBackup">
                                    <i class="bi bi-shield-check me-2"></i>Create Backup Now
                                </button>
                            </div>
                            
                            <small class="text-muted mt-2 d-block">
                                Last backup: ${settings.lastBackup || 'Never'}
                            </small>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Consent Management -->
            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header">
                            <h5><i class="bi bi-file-text me-2"></i>Consent Management</h5>
                        </div>
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-6">
                                    <p><strong>Current Consent Status:</strong></p>
                                    <div class="mb-3">
                                        <span class="badge ${this.consentGiven ? 'bg-success' : 'bg-warning'}">
                                            ${this.consentGiven ? 'Consent Given' : 'No Consent'}
                                        </span>
                                        ${this.consentGiven ? `
                                            <small class="text-muted d-block">
                                                Given on: ${new Date(localStorage.getItem('consentTimestamp')).toLocaleDateString()}
                                            </small>
                                        ` : ''}
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="d-grid gap-2">
                                        <button class="btn btn-outline-primary" id="reviewConsent">
                                            <i class="bi bi-eye me-2"></i>Review Consent Details
                                        </button>
                                        ${this.consentGiven ? `
                                            <button class="btn btn-outline-warning" id="revokeConsent">
                                                <i class="bi bi-x-circle me-2"></i>Revoke Consent
                                            </button>
                                        ` : `
                                            <button class="btn btn-outline-success" id="giveConsent">
                                                <i class="bi bi-check-circle me-2"></i>Give Consent
                                            </button>
                                        `}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.setupSettingsHandlers();
    }

    setupSettingsHandlers() {
        // Save settings
        document.getElementById('saveSettings').addEventListener('click', () => {
            this.saveSettings();
        });

        // Theme change
        document.getElementById('theme').addEventListener('change', (e) => {
            this.applyTheme(e.target.value);
        });

        // Consent management
        document.getElementById('reviewConsent')?.addEventListener('click', () => {
            this.showConsentModal();
        });

        document.getElementById('revokeConsent')?.addEventListener('click', () => {
            this.revokeConsent();
        });

        document.getElementById('giveConsent')?.addEventListener('click', () => {
            this.showConsentModal();
        });

        // Data management
        document.getElementById('exportAllData').addEventListener('click', () => {
            this.exportAllData();
        });

        document.getElementById('createBackup').addEventListener('click', () => {
            this.createBackup();
        });

        document.getElementById('clearAllData').addEventListener('click', () => {
            this.confirmClearData();
        });
    }

    saveSettings() {
        const settings = {
            theme: document.getElementById('theme').value,
            language: document.getElementById('language').value,
            units: document.getElementById('units').value,
            timezone: document.getElementById('timezone').value,
            dataEncryption: document.getElementById('dataEncryption').checked,
            requirePIN: document.getElementById('requirePIN').checked,
            dataRetention: parseInt(document.getElementById('dataRetention').value),
            nowServingUrl: document.getElementById('nowServingUrl').value,
            hospitals: document.getElementById('hospitalList').value.split('\n').filter(h => h.trim()),
            notificationEmail: document.getElementById('notificationEmail').value,
            smtpServer: document.getElementById('smtpServer').value,
            autoBackup: document.getElementById('autoBackup').checked,
            backupLocation: document.getElementById('backupLocation').value
        };

        localStorage.setItem('settings', JSON.stringify(settings));
        this.applyTheme(settings.theme);
        
        this.showToast('Settings Saved', 'Your preferences have been saved successfully', 'success');
    }

    applyTheme(theme) {
        const body = document.body;
        body.classList.remove('high-contrast', 'dark-theme');
        
        if (theme === 'high-contrast') {
            body.classList.add('high-contrast');
        } else if (theme === 'dark') {
            body.classList.add('dark-theme');
        }
    }

    revokeConsent() {
        if (confirm('Are you sure you want to revoke your consent? This will disable AI analysis features.')) {
            this.consentGiven = false;
            localStorage.removeItem('consentGiven');
            localStorage.removeItem('consentTimestamp');
            
            this.showToast('Consent Revoked', 'Your consent has been revoked. AI features are now disabled.', 'warning');
            this.loadSettings(); // Reload to update UI
        }
    }

    async exportAllData() {
        try {
            const allData = await DB.exportAllData();
            const dataStr = JSON.stringify(allData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `galpal-export-${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            
            this.showToast('Export Complete', 'All data has been exported successfully', 'success');
        } catch (error) {
            this.showToast('Export Failed', 'Failed to export data', 'danger');
        }
    }

    createBackup() {
        this.exportAllData();
        
        const settings = JSON.parse(localStorage.getItem('settings') || '{}');
        settings.lastBackup = new Date().toISOString();
        localStorage.setItem('settings', JSON.stringify(settings));
    }

    confirmClearData() {
        if (confirm('This will permanently delete ALL patient data, reports, and settings. This cannot be undone. Are you sure?')) {
            if (confirm('This is your final warning. All data will be lost. Continue?')) {
                this.clearAllData();
            }
        }
    }

    async clearAllData() {
        try {
            await DB.clearAllData();
            localStorage.clear();
            sessionStorage.clear();
            
            this.showToast('Data Cleared', 'All data has been permanently deleted', 'warning');
            
            // Reload the page to reset everything
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            this.showToast('Clear Failed', 'Failed to clear all data', 'danger');
        }
    }

    showWelcome() {
        // Show welcome modal for first-time users
        const welcomeModal = `
            <div class="modal fade" id="welcomeModal" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header bg-primary text-white">
                            <h5 class="modal-title">
                                <i class="bi bi-heart-pulse me-2"></i>
                                Welcome to GalPal
                            </h5>
                        </div>
                        <div class="modal-body">
                            <div class="text-center mb-4">
                                <i class="bi bi-clipboard-data text-primary" style="font-size: 4rem;"></i>
                                <h4 class="mt-3">Your Medical Analysis Assistant</h4>
                            </div>
                            
                            <div class="alert alert-info">
                                <h6><i class="bi bi-info-circle me-2"></i>Quick Setup Guide</h6>
                                <ol class="mb-0">
                                    <li>Review and accept the consent agreement</li>
                                    <li>Configure your preferences in Settings</li>
                                    <li>Add patient profiles</li>
                                    <li>Start analyzing medical data</li>
                                </ol>
                            </div>
                            
                            <div class="alert alert-warning">
                                <h6><i class="bi bi-exclamation-triangle me-2"></i>Important Reminder</h6>
                                <p class="mb-0">
                                    GalPal is an assistive tool that provides educational information and basic analysis. 
                                    It is not intended to replace professional medical advice, diagnosis, or treatment. 
                                    Always consult with qualified healthcare providers for medical decisions.
                                </p>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-primary" onclick="app.completeSetup()">
                                <i class="bi bi-check-lg me-2"></i>I Understand, Let's Begin
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', welcomeModal);
        const modal = new bootstrap.Modal(document.getElementById('welcomeModal'), {
            backdrop: 'static',
            keyboard: false
        });
        modal.show();
    }

    completeSetup() {
        localStorage.setItem('setupComplete', 'true');
        sessionStorage.setItem('sessionStart', Date.now().toString());
        
        const modal = bootstrap.Modal.getInstance(document.getElementById('welcomeModal'));
        modal.hide();
        
        document.getElementById('welcomeModal').remove();
        
        this.showToast('Setup Complete', 'Welcome to GalPal! Start by adding a patient profile.', 'success');
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GalPal();
});

// Handle browser back/forward navigation
window.addEventListener('popstate', () => {
    if (window.app) {
        window.app.loadInitialRoute();
    }
});