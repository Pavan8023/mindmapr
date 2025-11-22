class PresenceManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.userId = null;
        this.isOnline = false;
        this.idleTimeout = 15 * 60 * 1000; // 15 minutes
        this.idleTimer = null;
        this.warningTimer = null;
        
        this.setupPresenceSystem();
    }

    setupPresenceSystem() {
        this.authManager.auth.onAuthStateChanged((user) => {
            if (user) {
                this.userId = user.uid;
                this.setUserOnline();
                this.setupActivityListeners();
                this.setupOnlineUsersListener();
            } else {
                this.setUserOffline();
                this.cleanup();
            }
        });
    }

    setUserOnline() {
        if (!this.userId) return;
        
        const userStatusRef = this.authManager.rtdb.ref('status/' + this.userId);
        
        // Set user online
        userStatusRef.set({
            online: true,
            lastActive: Date.now(),
            userId: this.userId
        });

        // Remove user when they disconnect
        userStatusRef.onDisconnect().set({
            online: false,
            lastActive: Date.now(),
            userId: this.userId
        });

        this.isOnline = true;
        this.resetIdleTimer();
    }

    setUserOffline() {
        if (!this.userId) return;
        
        const userStatusRef = this.authManager.rtdb.ref('status/' + this.userId);
        userStatusRef.set({
            online: false,
            lastActive: Date.now(),
            userId: this.userId
        });

        this.isOnline = false;
        this.clearTimers();
    }

    setupOnlineUsersListener() {
        const onlineUsersRef = this.authManager.rtdb.ref('status');
        
        onlineUsersRef.on('value', (snapshot) => {
            const users = snapshot.val();
            let onlineCount = 0;

            if (users) {
                Object.values(users).forEach(user => {
                    // Consider user online if they were active in the last 2 minutes
                    if (user.online === true && Date.now() - user.lastActive < 120000) {
                        onlineCount++;
                    }
                });
            }

            this.updateOnlineCounter(onlineCount);
        });
    }

    updateOnlineCounter(count) {
        const onlineCountElement = document.getElementById('online-count');
        const liveUsersElement = document.getElementById('live-users');
        
        if (onlineCountElement) {
            onlineCountElement.textContent = count;
        }
        
        // Update visual indicator based on count
        if (liveUsersElement) {
            if (count === 0) {
                liveUsersElement.classList.remove('bg-green-600/20', 'border-green-500/30');
                liveUsersElement.classList.add('bg-slate-600/20', 'border-slate-500/30');
            } else {
                liveUsersElement.classList.remove('bg-slate-600/20', 'border-slate-500/30');
                liveUsersElement.classList.add('bg-green-600/20', 'border-green-500/30');
            }
        }
    }

    setupActivityListeners() {
        const activityEvents = ['mousemove', 'keypress', 'click', 'scroll', 'touchstart', 'mousedown'];
        
        activityEvents.forEach(event => {
            document.addEventListener(event, () => this.handleUserActivity(), { passive: true });
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.handleUserActivity();
            }
        });
    }

    handleUserActivity() {
        this.resetIdleTimer();
        this.updateLastActive();
    }

    updateLastActive() {
        if (this.userId && this.isOnline) {
            const userStatusRef = this.authManager.rtdb.ref('status/' + this.userId);
            userStatusRef.update({
                lastActive: Date.now()
            });
        }
    }

    resetIdleTimer() {
        this.clearTimers();
        
        if (this.isOnline) {
            // Set warning at 14 minutes (1 minute before logout)
            this.warningTimer = setTimeout(() => {
                this.showIdleWarning();
            }, this.idleTimeout - 60000);

            // Set logout at 15 minutes
            this.idleTimer = setTimeout(() => {
                this.handleIdleTimeout();
            }, this.idleTimeout);
        }
    }

    showIdleWarning() {
        Utils.showNotification('You will be logged out due to inactivity in 1 minute', 'warning');
    }

    handleIdleTimeout() {
        console.log('User idle for 15 minutes, logging out...');
        Utils.showNotification('You have been logged out due to inactivity', 'info');
        this.authManager.logout();
    }

    clearTimers() {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
    }

    cleanup() {
        this.clearTimers();
        this.userId = null;
        this.isOnline = false;
    }
}