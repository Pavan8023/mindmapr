class AuthManager {
    constructor() {
        this.currentUser = null;
        this.pollInterval = null;
        this.initFirebase();
    }

    initFirebase() {
        const firebaseConfig = {
            apiKey: "AIzaSyB24FGLvbQTDNmAH_YO60V_r4ynEhpxIJs",
            authDomain: "mindmapr-638c1.firebaseapp.com",
            databaseURL: "https://mindmapr-638c1-default-rtdb.firebaseio.com",
            projectId: "mindmapr-638c1",
            storageBucket: "mindmapr-638c1.firebasestorage.app",
            messagingSenderId: "886840058208",
            appId: "1:886840058208:web:330a3433d1ab036c663e05",
            measurementId: "G-F9R3TQ3262"
        };

        firebase.initializeApp(firebaseConfig);
        this.auth = firebase.auth();
        this.db = firebase.firestore();
        this.rtdb = firebase.database();
        
        this.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
    }

    async loadUserData(user) {
        try {
            const userDoc = await this.db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                document.getElementById('user-name').textContent = userData.displayName || user.email;
                document.getElementById('user-avatar').src = userData.photoURL || 'https://via.placeholder.com/32?text=U';
            } else {
                document.getElementById('user-name').textContent = user.displayName || user.email;
                document.getElementById('user-avatar').src = user.photoURL || 'https://via.placeholder.com/32?text=U';
            }
        } catch (error) {
            document.getElementById('user-name').textContent = user.email;
            document.getElementById('user-avatar').src = 'https://via.placeholder.com/32?text=U';
        }
    }

    setupAuthListener(callback) {
        this.auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = "index.html";
            } else {
                this.currentUser = user;
                this.loadUserData(user);
                callback(user);
            }
        });
    }

    logout() {
        if (this.pollInterval) clearInterval(this.pollInterval);
        this.auth.signOut().then(() => {
            window.location.href = "index.html";
        });
    }

    getCurrentUser() {
        return this.currentUser;
    }
}