export const AuthManager = {
    USERS_KEY: 'dfa_simulator_users',
    SESSION_KEY: 'dfa_simulator_session',

    register(username, password) {
        const users = this.getUsers();
        if (users[username]) {
            return { success: false, message: 'Username already exists' };
        }
        users[username] = { username, password, createdAt: new Date().toISOString() };
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
        return { success: true };
    },

    login(username, password) {
        const users = this.getUsers();
        const user = users[username];
        if (user && user.password === password) {
            localStorage.setItem(this.SESSION_KEY, JSON.stringify({ username }));
            return { success: true, user: { username } };
        }
        return { success: false, message: 'Invalid username or password' };
    },

    logout() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    getCurrentUser() {
        const session = localStorage.getItem(this.SESSION_KEY);
        return session ? JSON.parse(session) : null;
    },

    getUsers() {
        const users = localStorage.getItem(this.USERS_KEY);
        return users ? JSON.parse(users) : {};
    }
};
