class PresenceManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.userId = null;
        this.isOnline = false;
        this.idleTimeout = 15 * 60 * 1000; // 15 minutes
        this.idleTimer = null;
        this.warningTimer = null;
        this.userStatusRef = null;
        
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
                // User logged out - clean up presence
                this.setUserOffline();
                this.cleanup();
            }
        });
    }

    setUserOnline() {
        if (!this.userId) return;
        
        this.userStatusRef = this.authManager.rtdb.ref('status/' + this.userId);
        
        // Set user online with current timestamp
        this.userStatusRef.set({
            online: true,
            lastActive: Date.now(),
            userId: this.userId,
            lastUpdated: Date.now()
        }).then(() => {
            console.log('User set online:', this.userId);
        }).catch((error) => {
            console.error('Error setting user online:', error);
        });

        // Setup onDisconnect to mark user as offline when they close the tab/browser
        this.userStatusRef.onDisconnect().set({
            online: false,
            lastActive: Date.now(),
            userId: this.userId,
            lastUpdated: Date.now()
        });

        this.isOnline = true;
        this.resetIdleTimer();
    }

    setUserOffline() {
        if (!this.userId) return;
        
        console.log('Setting user offline:', this.userId);
        
        // Cancel the onDisconnect handler first
        if (this.userStatusRef) {
            this.userStatusRef.onDisconnect().cancel();
        }
        
        // Then set user offline
        const offlineRef = this.authManager.rtdb.ref('status/' + this.userId);
        offlineRef.set({
            online: false,
            lastActive: Date.now(),
            userId: this.userId,
            lastUpdated: Date.now()
        }).then(() => {
            console.log('User successfully set offline:', this.userId);
        }).catch((error) => {
            console.error('Error setting user offline:', error);
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
                const currentTime = Date.now();
                Object.values(users).forEach(user => {
                    // Consider user online if they were active in the last 2 minutes AND marked as online
                    if (user.online === true && currentTime - user.lastActive < 120000) {
                        onlineCount++;
                    }
                });
            }

            console.log('Online users count:', onlineCount);
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

        // Also update activity periodically (every 30 seconds) to handle background tabs
        this.activityInterval = setInterval(() => {
            this.updateLastActive();
        }, 30000);
    }

    handleUserActivity() {
        this.resetIdleTimer();
        this.updateLastActive();
    }

    updateLastActive() {
        if (this.userId && this.isOnline && this.userStatusRef) {
            this.userStatusRef.update({
                lastActive: Date.now(),
                lastUpdated: Date.now()
            }).catch((error) => {
                console.error('Error updating last active:', error);
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
        this.setUserOffline(); // Ensure user is marked offline
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
        
        // Clear activity interval
        if (this.activityInterval) {
            clearInterval(this.activityInterval);
            this.activityInterval = null;
        }
        
        this.userId = null;
        this.isOnline = false;
        this.userStatusRef = null;
    }

    // Method to manually trigger cleanup (called from auth manager during logout)
    forceCleanup() {
        this.setUserOffline();
        this.cleanup();
    }
}