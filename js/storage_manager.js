export const StorageManager = {
    SAVE_KEY: 'dfa_simulator_configs_v2', // Versioned key for new structure

    saveDFA(config, username = 'guest') {
        try {
            const allConfigs = this.getAllConfigs();
            if (!allConfigs[username]) allConfigs[username] = [];
            
            // Check if we are updating an existing one (by name)
            const index = allConfigs[username].findIndex(c => c.name === config.name);
            if (index !== -1) {
                allConfigs[username][index] = { ...config, updatedAt: new Date().toISOString() };
            } else {
                allConfigs[username].push({ ...config, id: Date.now(), createdAt: new Date().toISOString() });
            }

            localStorage.setItem(this.SAVE_KEY, JSON.stringify(allConfigs));
            return true;
        } catch (e) {
            console.error('Failed to save DFA:', e);
            return false;
        }
    },

    getUserDFAs(username = 'guest') {
        const allConfigs = this.getAllConfigs();
        return allConfigs[username] || [];
    },

    getAllConfigs() {
        const data = localStorage.getItem(this.SAVE_KEY);
        return data ? JSON.parse(data) : {};
    },

    deleteDFA(id, username = 'guest') {
        const allConfigs = this.getAllConfigs();
        if (allConfigs[username]) {
            allConfigs[username] = allConfigs[username].filter(c => c.id !== id);
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(allConfigs));
            return true;
        }
        return false;
    }
};

export const Templates = {
    'even-zeros': {
        alphabet: ['0', '1'],
        statesCount: 2,
        finalStates: ['q0'],
        transitions: {
            'q0': { '0': 'q1', '1': 'q0' },
            'q1': { '0': 'q0', '1': 'q1' }
        }
    },
    'ends-with-1': {
        alphabet: ['0', '1'],
        statesCount: 2,
        finalStates: ['q1'],
        transitions: {
            'q0': { '0': 'q0', '1': 'q1' },
            'q1': { '0': 'q0', '1': 'q1' }
        }
    },
    'divisible-by-3': {
        alphabet: ['0', '1'],
        statesCount: 3,
        finalStates: ['q0'],
        transitions: {
            'q0': { '0': 'q0', '1': 'q1' },
            'q1': { '0': 'q2', '1': 'q0' },
            'q2': { '0': 'q1', '1': 'q2' }
        }
    }
};
