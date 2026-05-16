export class DFA {
    constructor(states, alphabet, transitions, startState, finalStates) {
        this.states = states; // Array of strings: ['q0', 'q1', ...]
        this.alphabet = alphabet; // Array of strings: ['0', '1']
        this.transitions = transitions; // Map: { state: { symbol: nextState } }
        this.startState = startState;
        this.finalStates = new Set(finalStates);
        this.currentState = startState;
        this.history = [];
    }

    reset() {
        this.currentState = this.startState;
        this.history = [];
    }

    /**
     * Process a single symbol and return the next state.
     */
    step(symbol) {
        if (!this.alphabet.includes(symbol)) {
            throw new Error(`Invalid symbol: "${symbol}" is not in the alphabet {${this.alphabet.join(', ')}}`);
        }

        const stateTransitions = this.transitions[this.currentState];
        if (!stateTransitions) {
            throw new Error(`State ${this.currentState} has no transitions defined.`);
        }

        const nextState = stateTransitions[symbol];
        if (!nextState) {
            throw new Error(`No transition defined for state ${this.currentState} on symbol "${symbol}"`);
        }

        const transition = {
            from: this.currentState,
            symbol: symbol,
            to: nextState
        };

        this.currentState = nextState;
        this.history.push(transition);
        
        return nextState;
    }

    /**
     * Process an entire string synchronously and return the result.
     * Useful for pre-calculating results for test cases.
     */
    processString(inputString) {
        this.reset();
        const steps = [];
        
        if (inputString === "") {
            return {
                accepted: this.finalStates.has(this.currentState),
                finalState: this.currentState,
                steps: []
            };
        }

        for (const symbol of inputString) {
            try {
                const from = this.currentState;
                const to = this.step(symbol);
                steps.push({ symbol, from, to });
            } catch (error) {
                return {
                    accepted: false,
                    error: error.message,
                    finalState: this.currentState,
                    steps,
                    interrupted: true
                };
            }
        }

        return {
            accepted: this.finalStates.has(this.currentState),
            finalState: this.currentState,
            steps
        };
    }

    /**
     * Static helper to validate DFA configuration completeness.
     */
    static validateConfig(states, alphabet, transitions) {
        const errors = [];
        
        for (const state of states) {
            if (!transitions[state]) {
                errors.push(`State ${state} has no transitions defined.`);
                continue;
            }
            
            for (const symbol of alphabet) {
                if (!transitions[state][symbol]) {
                    errors.push(`State ${state} is missing a transition for symbol '${symbol}'.`);
                }
            }
        }
        
        return errors;
    }
}
