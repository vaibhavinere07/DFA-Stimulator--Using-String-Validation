import { DFA } from './dfa_core.js';
import { UIManager } from './ui_manager.js';
import { StorageManager, Templates } from './storage_manager.js';
import { AuthManager } from './auth_manager.js';

class App {
    constructor() {
        this.currentDFA = null;
        this.simulationData = {
            string: '',
            currentIndex: -1,
            isPlaying: false,
            interval: null
        };
        
        this.init();
    }

    init() {
        UIManager.init(AuthManager, StorageManager);
        this.attachEventListeners();
        this.loadSavedDFA();
        
        // Initial setup for config page
        UIManager.generateFinalStateCheckboxes(2);
        UIManager.generateTransitionTable(['0', '1'], 2);
    }

    attachEventListeners() {
        // Navigation
        document.getElementById('start-btn').addEventListener('click', () => {
            const user = AuthManager.getCurrentUser();
            if (!user) {
                UIManager.showModal('signin-modal');
                return;
            }
            UIManager.switchView('setup-page');
        });

        // Config Page
        document.getElementById('generate-table-btn').addEventListener('click', () => {
            this.updateConfigPreview();
        });

        document.getElementById('save-dfa-btn').addEventListener('click', () => {
            this.saveAndContinue();
        });

        document.getElementById('template-btn').addEventListener('click', () => {
            UIManager.showModal('template-modal');
        });

        // Templates
        document.querySelectorAll('.template-item').forEach(item => {
            item.addEventListener('click', () => {
                this.loadTemplate(item.dataset.template);
                UIManager.hideModal('template-modal');
            });
        });

        // Simulation Page
        document.getElementById('run-simulation-btn').addEventListener('click', () => {
            this.startSimulation();
        });

        document.getElementById('play-pause-btn').addEventListener('click', () => {
            this.togglePlayback();
        });

        document.getElementById('next-step-btn').addEventListener('click', () => {
            this.nextStep();
        });

        document.getElementById('prev-step-btn').addEventListener('click', () => {
            this.resetSimulation(); // Simplification: just reset for now
        });

        document.getElementById('reset-sim-btn').addEventListener('click', () => {
            this.resetSimulation();
        });

        document.getElementById('restart-sim-btn').addEventListener('click', () => {
            this.resetSimulation();
            document.getElementById('test-string').focus();
        });

        // Back buttons logic
        document.querySelectorAll('.back-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.stopPlayback();
            });
        });
    }

    updateConfigPreview() {
        const alphabetInput = UIManager.alphabetInput.value.trim();
        const alphabet = alphabetInput.split(',').map(s => s.trim()).filter(s => s !== '');
        const statesCount = parseInt(UIManager.statesCountInput.value);
        
        if (alphabet.length === 0 || isNaN(statesCount)) {
            alert('Please provide valid alphabet and number of states.');
            return;
        }

        UIManager.generateFinalStateCheckboxes(statesCount);
        UIManager.generateTransitionTable(alphabet, statesCount);
    }

    saveAndContinue() {
        const alphabetInput = UIManager.alphabetInput.value.trim();
        const alphabet = alphabetInput.split(',').map(s => s.trim()).filter(s => s !== '');
        const statesCount = parseInt(UIManager.statesCountInput.value);
        const finalStates = UIManager.getFinalStates();
        const transitions = UIManager.getTransitionData();

        if (finalStates.length === 0) {
            alert('Please select at least one final state.');
            return;
        }

        const states = Array.from({length: statesCount}, (_, i) => `q${i}`);
        
        // Save to storage
        StorageManager.saveDFA({
            alphabet, statesCount, finalStates, transitions
        });

        this.currentDFA = new DFA(states, alphabet, transitions, 'q0', finalStates);
        
        UIManager.switchView('simulation-page');
        this.resetSimulation();
        this.generateTestCases();
    }

    generateTestCases() {
        if (!this.currentDFA) return;
        
        const alphabet = this.currentDFA.alphabet;
        const testStrings = ["", alphabet[0] || "0", alphabet[1] || "1"];
        
        // Add some more complex strings
        if (alphabet.length >= 2) {
            testStrings.push(alphabet[0] + alphabet[1]);
            testStrings.push(alphabet[1] + alphabet[0]);
            testStrings.push(alphabet[0] + alphabet[0] + alphabet[1]);
        }

        const testCases = testStrings.map(str => {
            const result = this.currentDFA.processString(str);
            return {
                string: str,
                expected: result.accepted
            };
        });

        UIManager.renderTestCases(testCases);
    }

    loadSavedDFA() {
        const user = AuthManager.getCurrentUser();
        const dfas = StorageManager.getUserDFAs(user ? user.username : 'guest');
        
        // Load the most recent one if available
        const saved = dfas.length > 0 ? dfas[dfas.length - 1] : null;
        
        if (saved) {
            UIManager.loadDFAToUI(saved);
            const states = Array.from({length: saved.statesCount}, (_, i) => `q${i}`);
            this.currentDFA = new DFA(states, saved.alphabet, saved.transitions, 'q0', saved.finalStates);
            this.generateTestCases();
        }
    }

    loadTemplate(key) {
        const tpl = Templates[key];
        if (!tpl) return;

        UIManager.alphabetInput.value = tpl.alphabet.join(',');
        UIManager.statesCountInput.value = tpl.statesCount;
        UIManager.generateFinalStateCheckboxes(tpl.statesCount);
        
        const checkboxes = UIManager.finalStatesContainer.querySelectorAll('input');
        checkboxes.forEach(cb => {
            if (tpl.finalStates.includes(cb.value)) {
                cb.checked = true;
                cb.parentElement.classList.add('selected');
            }
        });

        UIManager.generateTransitionTable(tpl.alphabet, tpl.statesCount);
        
        const selects = UIManager.transitionTable.querySelectorAll('.transition-select');
        selects.forEach(select => {
            const state = select.dataset.state;
            const symbol = select.dataset.symbol;
            if (tpl.transitions[state] && tpl.transitions[state][symbol]) {
                select.value = tpl.transitions[state][symbol];
            }
        });

        const states = Array.from({length: tpl.statesCount}, (_, i) => `q${i}`);
        this.currentDFA = new DFA(states, tpl.alphabet, tpl.transitions, 'q0', tpl.finalStates);
        this.generateTestCases();
    }


    startSimulation() {
        const testStr = document.getElementById('test-string').value.trim();
        
        // Validate characters
        for (const char of testStr) {
            if (!this.currentDFA.alphabet.includes(char)) {
                alert(`Invalid character "${char}" for this alphabet {${this.currentDFA.alphabet.join(', ')}}.`);
                return;
            }
        }

        this.simulationData.string = testStr;
        this.resetSimulation();
        document.getElementById('playback-controls').classList.remove('hidden');
        
        UIManager.addLog(`Starting simulation for string: "${testStr || '(empty)'}"`);
        
        if (testStr === "") {
            setTimeout(() => this.finishSimulation(), 500);
        } else {
            this.nextStep(); // Start with the first symbol
        }
    }

    resetSimulation() {
        this.stopPlayback();
        this.simulationData.currentIndex = -1;
        this.currentDFA.reset();
        
        UIManager.clearLog();
        UIManager.hideConclusion();
        UIManager.renderVisualizer(this.currentDFA.states, this.currentDFA.startState, this.currentDFA.finalStates, this.currentDFA.transitions);
        UIManager.renderStringDisplay(this.simulationData.string, -1);
        UIManager.resultBanner.classList.add('hidden');
        
        document.getElementById('play-pause-btn').textContent = '▶️';
    }

    nextStep() {
        const { string, currentIndex } = this.simulationData;
        
        if (currentIndex + 1 >= string.length) {
            this.finishSimulation();
            return;
        }

        try {
            this.simulationData.currentIndex++;
            const symbol = string[this.simulationData.currentIndex];
            const from = this.currentDFA.currentState;
            const to = this.currentDFA.step(symbol);

            UIManager.addLog(`Step ${this.simulationData.currentIndex + 1}: ${from} ──${symbol}──> ${to}`);
            UIManager.renderVisualizer(this.currentDFA.states, to, this.currentDFA.finalStates, this.currentDFA.transitions);
            UIManager.renderStringDisplay(string, this.simulationData.currentIndex);
            
            if (this.simulationData.currentIndex === string.length - 1) {
                // Last symbol processed
                setTimeout(() => this.finishSimulation(), 500);
            }
        } catch (error) {
            this.stopPlayback();
            UIManager.addLog(`Error: ${error.message}`, 'error');
            this.finishSimulation(true, error.message);
        }
    }

    finishSimulation(errorOccurred = false, errorMessage = '') {
        this.stopPlayback();
        
        const result = {
            accepted: this.currentDFA.finalStates.has(this.currentDFA.currentState),
            finalState: this.currentDFA.currentState,
            steps: this.currentDFA.history,
            interrupted: errorOccurred,
            error: errorMessage
        };

        UIManager.showResult(result.accepted, result.finalState);
        UIManager.showConclusion(result, this.simulationData.string);
        UIManager.addLog(`Simulation finished. Result: ${result.accepted ? 'ACCEPTED' : 'REJECTED'}`, result.accepted ? 'success' : 'error');
    }

    togglePlayback() {
        if (this.simulationData.isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }
    }

    startPlayback() {
        this.simulationData.isPlaying = true;
        document.getElementById('play-pause-btn').textContent = '⏸️';
        this.simulationData.interval = setInterval(() => {
            this.nextStep();
        }, 1000);
    }

    stopPlayback() {
        this.simulationData.isPlaying = false;
        document.getElementById('play-pause-btn').textContent = '▶️';
        if (this.simulationData.interval) {
            clearInterval(this.simulationData.interval);
            this.simulationData.interval = null;
        }
    }
}

// Initialize App
window.addEventListener('DOMContentLoaded', () => {
    new App();
});
