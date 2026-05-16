export const UIManager = {
    init(authManager, storageManager) {
        this.auth = authManager;
        this.storage = storageManager;
        
        // Initialize DOM Elements
        this.views = document.querySelectorAll('.view');
        this.themeToggle = document.getElementById('theme-toggle');
        this.alphabetInput = document.getElementById('alphabet-input');
        this.statesCountInput = document.getElementById('states-count');
        this.finalStatesContainer = document.getElementById('final-states-container');
        this.transitionTable = document.getElementById('transition-table');
        this.visualizerCanvas = document.getElementById('visualizer-canvas');
        this.stringDisplay = document.getElementById('string-display');
        this.stepLog = document.getElementById('step-log');
        this.resultBanner = document.getElementById('result-banner');
        this.resultText = document.getElementById('result-text');

        this.setupTheme();
        this.setupNavigation();
        this.setupAuthListeners();
        this.setupModalListeners();
        this.setupDropdownListeners();
        this.updateAuthUI();
    },

    setupTheme() {
        this.themeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode');
        });
    },

    setupNavigation() {
        document.querySelectorAll('[data-target]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchView(btn.getAttribute('data-target'));
            });
        });
    },

    switchView(viewId) {
        this.views.forEach(view => {
            view.classList.remove('active');
            if (view.id === viewId) {
                view.classList.add('active');
            }
        });
        window.scrollTo(0, 0);
    },

    generateFinalStateCheckboxes(count) {
        this.finalStatesContainer.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const stateId = `q${i}`;
            const label = document.createElement('label');
            label.className = 'checkbox-item';
            label.innerHTML = `
                <input type="checkbox" value="${stateId}" class="hidden">
                <span>${stateId}</span>
            `;
            label.addEventListener('click', () => {
                label.classList.toggle('selected');
                const checkbox = label.querySelector('input');
                checkbox.checked = !checkbox.checked;
            });
            this.finalStatesContainer.appendChild(label);
        }
    },

    generateTransitionTable(alphabet, statesCount) {
        const thead = this.transitionTable.querySelector('thead');
        const tbody = this.transitionTable.querySelector('tbody');
        
        // Header
        let headerHtml = `<tr><th>State</th>`;
        alphabet.forEach(symbol => {
            headerHtml += `<th>Symbol: ${symbol}</th>`;
        });
        headerHtml += `</tr>`;
        thead.innerHTML = headerHtml;

        // Body
        tbody.innerHTML = '';
        for (let i = 0; i < statesCount; i++) {
            const state = `q${i}`;
            const row = document.createElement('tr');
            let rowHtml = `<td><strong>${state}</strong></td>`;
            
            alphabet.forEach(symbol => {
                rowHtml += `
                    <td>
                        <select class="transition-select" data-state="${state}" data-symbol="${symbol}">
                            ${this.generateStateOptions(statesCount)}
                        </select>
                    </td>
                `;
            });
            row.innerHTML = rowHtml;
            tbody.appendChild(row);
        }
    },

    generateStateOptions(count) {
        let options = '';
        for (let i = 0; i < count; i++) {
            options += `<option value="q${i}">q${i}</option>`;
        }
        return options;
    },

    getTransitionData() {
        const transitions = {};
        const selects = this.transitionTable.querySelectorAll('.transition-select');
        selects.forEach(select => {
            const state = select.dataset.state;
            const symbol = select.dataset.symbol;
            if (!transitions[state]) transitions[state] = {};
            transitions[state][symbol] = select.value;
        });
        return transitions;
    },

    getFinalStates() {
        return Array.from(this.finalStatesContainer.querySelectorAll('input:checked'))
            .map(input => input.value);
    },

    renderVisualizer(states, currentActiveState, finalStates, transitions = {}) {
        this.visualizerCanvas.innerHTML = '';
        const radius = 100;
        const centerX = this.visualizerCanvas.offsetWidth / 2;
        const centerY = this.visualizerCanvas.offsetHeight / 2;

        const positions = {};

        // Calculate positions first
        states.forEach((state, i) => {
            const angle = (i / states.length) * 2 * Math.PI - Math.PI / 2;
            const x = centerX + radius * Math.cos(angle);
            const y = centerY + radius * Math.sin(angle);
            positions[state] = { x, y };
        });

        // Create SVG for connections
        const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.setAttribute("width", "100%");
        svg.setAttribute("height", "100%");
        svg.style.position = "absolute";
        svg.style.top = "0";
        svg.style.left = "0";
        svg.style.pointerEvents = "none";
        
        // Marker for arrows
        const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
        const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
        marker.setAttribute("id", "arrowhead");
        marker.setAttribute("markerWidth", "10");
        marker.setAttribute("markerHeight", "7");
        marker.setAttribute("refX", "9");
        marker.setAttribute("refY", "3.5");
        marker.setAttribute("orient", "auto");
        const polygon = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
        polygon.setAttribute("points", "0 0, 10 3.5, 0 7");
        polygon.setAttribute("fill", "var(--accent-color)");
        marker.appendChild(polygon);
        defs.appendChild(marker);
        svg.appendChild(defs);

        this.visualizerCanvas.appendChild(svg);

        // Draw connections
        Object.entries(transitions).forEach(([fromState, symbols]) => {
            Object.entries(symbols).forEach(([symbol, toState]) => {
                const start = positions[fromState];
                const end = positions[toState];
                
                if (fromState === toState) {
                    // Self transition loop
                    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                    const curve = `M ${start.x-10} ${start.y-30} C ${start.x-40} ${start.y-70}, ${start.x+40} ${start.y-70}, ${start.x+10} ${start.y-30}`;
                    path.setAttribute("d", curve);
                    path.setAttribute("stroke", "var(--accent-color)");
                    path.setAttribute("stroke-width", "2");
                    path.setAttribute("fill", "none");
                    path.setAttribute("marker-end", "url(#arrowhead)");
                    svg.appendChild(path);
                } else {
                    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
                    
                    // Adjust start and end to be at the edge of the circles (radius 30)
                    const dx = end.x - start.x;
                    const dy = end.y - start.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    const offsetX = (dx / dist) * 30;
                    const offsetY = (dy / dist) * 30;

                    line.setAttribute("x1", start.x + offsetX);
                    line.setAttribute("y1", start.y + offsetY);
                    line.setAttribute("x2", end.x - offsetX);
                    line.setAttribute("y2", end.y - offsetY);
                    line.setAttribute("stroke", "var(--accent-color)");
                    line.setAttribute("stroke-width", "2");
                    line.setAttribute("marker-end", "url(#arrowhead)");
                    svg.appendChild(line);
                }
            });
        });

        // Render nodes on top
        states.forEach((state) => {
            const { x, y } = positions[state];
            const node = document.createElement('div');
            node.className = `state-node ${state === currentActiveState ? 'active' : ''} ${finalStates.has(state) ? 'final' : ''}`;
            node.id = `node-${state}`;
            node.style.position = 'absolute';
            node.style.left = `${x - 30}px`;
            node.style.top = `${y - 30}px`;
            node.textContent = state;
            
            this.visualizerCanvas.appendChild(node);
        });
    },

    renderStringDisplay(str, currentIndex) {
        this.stringDisplay.innerHTML = '';
        str.split('').forEach((char, i) => {
            const box = document.createElement('div');
            box.className = `char-box ${i === currentIndex ? 'current' : ''}`;
            box.textContent = char;
            this.stringDisplay.appendChild(box);
        });
    },

    addLog(message, type = '') {
        const p = document.createElement('p');
        p.className = `log-entry ${type}`;
        p.textContent = message;
        this.stepLog.prepend(p);
        
        // Remove empty message if it exists
        const emptyMsg = this.stepLog.querySelector('.empty-msg');
        if (emptyMsg) emptyMsg.remove();
    },

    clearLog() {
        this.stepLog.innerHTML = '<p class="empty-msg">Run a simulation to see the logs...</p>';
    },

    showResult(accepted, finalState) {
        this.resultBanner.classList.remove('hidden', 'success', 'error');
        this.resultBanner.classList.add(accepted ? 'success' : 'error');
        this.resultText.textContent = accepted 
            ? `Accepted! Reached final state: ${finalState}` 
            : `Rejected! Ended in non-final state: ${finalState}`;
    },

    showConclusion(result, string) {
        const conclusionSection = document.getElementById('conclusion-section');
        const content = document.getElementById('conclusion-content');
        conclusionSection.classList.remove('hidden');
        
        let html = '';
        if (result.interrupted) {
            html = `
                <p><strong>Status:</strong> Processing Halted</p>
                <p>The simulation stopped because: ${result.error}</p>
            `;
        } else {
            html = `
                <p><strong>Input String:</strong> "${string || '(empty)'}"</p>
                <p><strong>Path Taken:</strong> ${string === "" ? 'None (Start state)' : result.steps.map(s => s.from).join(' → ') + ' → ' + result.finalState}</p>
                <p><strong>Final State:</strong> ${result.finalState}</p>
                <p><strong>Result:</strong> ${result.accepted ? '<span class="success">ACCEPTED</span>' : '<span class="error">REJECTED</span>'}</p>
                <p>${result.accepted 
                    ? `The string was accepted because the DFA ended in <strong>${result.finalState}</strong>, which is one of the designated final states.` 
                    : `The string was rejected because the DFA ended in <strong>${result.finalState}</strong>, which is NOT a final state.`}</p>
            `;
        }
        content.innerHTML = html;
    },

    hideConclusion() {
        document.getElementById('conclusion-section').classList.add('hidden');
    },

    renderTestCases(testCases) {
        const list = document.getElementById('test-cases-list');
        list.innerHTML = '';
        
        testCases.forEach(tc => {
            const item = document.createElement('div');
            item.className = 'test-case-item';
            item.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <strong>"${tc.string}"</strong>
                    <span class="${tc.expected ? 'success' : 'error'}">${tc.expected ? 'Accept' : 'Reject'}</span>
                </div>
                <small style="color: var(--text-secondary)">Click to test</small>
            `;
            item.addEventListener('click', () => {
                document.getElementById('test-string').value = tc.string;
                document.getElementById('run-simulation-btn').click();
            });
            list.appendChild(item);
        });
    },

    // Auth & Modal Logic
    setupAuthListeners() {
        const signinBtn = document.getElementById('signin-btn');
        const logoutBtn = document.getElementById('logout-btn');
        const signinForm = document.getElementById('signin-form');
        const signupForm = document.getElementById('signup-form');
        const showSignup = document.getElementById('show-signup');
        const showSignin = document.getElementById('show-signin');

        signinBtn.addEventListener('click', () => this.showModal('signin-modal'));
        logoutBtn.addEventListener('click', () => {
            this.auth.logout();
            this.updateAuthUI();
            this.switchView('landing-page');
            this.hideDropdown();
        });

        showSignup.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('signin-modal');
            this.showModal('signup-modal');
        });

        showSignin.addEventListener('click', (e) => {
            e.preventDefault();
            this.hideModal('signup-modal');
            this.showModal('signin-modal');
        });

        signinForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('signin-username').value;
            const pass = document.getElementById('signin-password').value;
            const res = this.auth.login(user, pass);
            if (res.success) {
                this.hideModal('signin-modal');
                this.updateAuthUI();
                signinForm.reset();
            } else {
                alert(res.message);
            }
        });

        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('signup-username').value;
            const pass = document.getElementById('signup-password').value;
            const res = this.auth.register(user, pass);
            if (res.success) {
                alert('Account created! Please sign in.');
                this.hideModal('signup-modal');
                this.showModal('signin-modal');
                signupForm.reset();
            } else {
                alert(res.message);
            }
        });

        document.getElementById('my-dfas-nav-btn').addEventListener('click', () => {
            this.renderSavedDFAs();
            this.switchView('my-dfas-page');
            this.hideDropdown();
        });

        document.getElementById('persist-dfa-btn').addEventListener('click', () => {
            const user = this.auth.getCurrentUser();
            if (!user) {
                alert('Please sign in to save DFAs to your account.');
                this.showModal('signin-modal');
                return;
            }
            this.showModal('save-modal');
        });

        document.getElementById('confirm-save-btn').addEventListener('click', () => {
            const name = document.getElementById('save-dfa-name').value;
            if (!name) {
                alert('Please provide a name for your DFA.');
                return;
            }
            
            const config = {
                name: name,
                alphabet: this.alphabetInput.value.split(',').map(s => s.trim()),
                statesCount: parseInt(this.statesCountInput.value),
                finalStates: this.getFinalStates(),
                transitions: this.getTransitionData()
            };

            const user = this.auth.getCurrentUser();
            if (this.storage.saveDFA(config, user.username)) {
                this.hideModal('save-modal');
                alert('DFA saved successfully!');
            }
        });
    },

    setupModalListeners() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.hideModal(modal.id);
            });
        });

        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const modal = btn.closest('.modal');
                this.hideModal(modal.id);
            });
        });
    },

    setupDropdownListeners() {
        const menuBtn = document.getElementById('user-menu-btn');
        const dropdown = document.getElementById('user-dropdown-content');

        menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!dropdown.classList.contains('hidden') && !dropdown.contains(e.target)) {
                this.hideDropdown();
            }
        });
    },

    hideDropdown() {
        const dropdown = document.getElementById('user-dropdown-content');
        if (dropdown) dropdown.classList.add('hidden');
    },

    showModal(id) {
        document.getElementById(id).classList.remove('hidden');
    },

    hideModal(id) {
        document.getElementById(id).classList.add('hidden');
    },

    updateAuthUI() {
        const user = this.auth.getCurrentUser();
        const authControls = document.getElementById('auth-controls');
        const userControls = document.getElementById('user-controls');
        const usernameDisplay = document.getElementById('username-display');

        if (user) {
            authControls.classList.add('hidden');
            userControls.classList.remove('hidden');
            usernameDisplay.textContent = user.username;
        } else {
            authControls.classList.remove('hidden');
            userControls.classList.add('hidden');
        }
    },

    renderSavedDFAs() {
        const container = document.getElementById('saved-dfas-list');
        const user = this.auth.getCurrentUser();
        if (!user) return;

        const dfas = this.storage.getUserDFAs(user.username);
        container.innerHTML = '';

        if (dfas.length === 0) {
            container.innerHTML = '<p class="empty-msg">You haven\'t saved any DFAs yet.</p>';
            return;
        }

        dfas.forEach(dfa => {
            const card = document.createElement('div');
            card.className = 'dfa-saved-card';
            card.innerHTML = `
                <button class="delete-dfa-btn" title="Delete">&times;</button>
                <h4>${dfa.name}</h4>
                <div class="card-meta">
                    <span>States: ${dfa.statesCount}</span> | 
                    <span>Alphabet: ${dfa.alphabet.join(',')}</span>
                </div>
                <div class="card-meta">Saved: ${new Date(dfa.createdAt).toLocaleDateString()}</div>
            `;

            card.querySelector('.delete-dfa-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Delete "${dfa.name}"?`)) {
                    this.storage.deleteDFA(dfa.id, user.username);
                    this.renderSavedDFAs();
                }
            });

            card.addEventListener('click', () => {
                this.loadDFAToUI(dfa);
                this.switchView('setup-page');
            });

            container.appendChild(card);
        });
    },

    loadDFAToUI(config) {
        this.alphabetInput.value = config.alphabet.join(',');
        this.statesCountInput.value = config.statesCount;
        
        // Regenerate table and checkboxes
        this.generateFinalStateCheckboxes(config.statesCount);
        this.generateTransitionTable(config.alphabet, config.statesCount);

        // Set final states
        config.finalStates.forEach(stateId => {
            const label = Array.from(this.finalStatesContainer.querySelectorAll('.checkbox-item'))
                .find(l => l.querySelector('input').value === stateId);
            if (label) {
                label.classList.add('selected');
                label.querySelector('input').checked = true;
            }
        });

        // Set transitions
        const selects = this.transitionTable.querySelectorAll('.transition-select');
        selects.forEach(select => {
            const state = select.dataset.state;
            const symbol = select.dataset.symbol;
            if (config.transitions[state] && config.transitions[state][symbol]) {
                select.value = config.transitions[state][symbol];
            }
        });
    }
};
