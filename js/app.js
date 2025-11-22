let authManager, questionManager, commentManager, presenceManager;

document.addEventListener('DOMContentLoaded', function() {
    authManager = new AuthManager();
    questionManager = new QuestionManager(authManager);
    commentManager = new CommentManager(authManager, questionManager);
    presenceManager = new PresenceManager(authManager);

    document.getElementById('logout').addEventListener('click', () => authManager.logout());

    document.querySelectorAll('textarea').forEach(textarea => {
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                const form = textarea.closest('form');
                if (form) {
                    const submitBtn = form.querySelector('button[type="submit"]');
                    if (submitBtn) {
                        submitBtn.click();
                    }
                }
            }
        });
    });

    authManager.setupAuthListener((user) => {
        Utils.testBackendConnection().then(success => {
            if (success) {
                questionManager.setupQuestionsListener();
            } else {
                Utils.showNotification('Backend server is not running. Please start the backend server.', 'error');
            }
        });
    });
});