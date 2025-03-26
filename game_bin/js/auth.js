export class Auth {
    constructor() {
        this.currentUser = localStorage.getItem("currentUser") || null;
        this.users = new Map(JSON.parse(localStorage.getItem("users")) || []);
    }
    
    saveData() {
        localStorage.setItem("users", JSON.stringify(Array.from(this.users.entries())));
        localStorage.setItem("currentUser", this.currentUser);
    }

    login(username, password) {
        const user = this.users.get(username);
        if (user && user.password === password) {
            this.currentUser = username;
            this.saveData();
            return true;
        }
        return false;
    }

    register(username, password) {
        if (this.users.has(username)) return false;
        this.users.set(username, { password: password });
        this.currentUser = username;
        this.saveData();
        return true;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem("currentUser");
        this.saveData();
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
}

