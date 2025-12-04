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

    
}