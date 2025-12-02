class CommentManager {
    constructor(authManager, questionManager) {
        this.authManager = authManager;
        this.questionManager = questionManager;
        this.currentQuestionId = null;
        this.editingCommentId = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('comment-form').addEventListener('submit', (e) => this.submitComment(e));
        document.getElementById('close-comment-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('comment-modal').addEventListener('click', (e) => {
            if (e.target === document.getElementById('comment-modal')) {
                this.closeModal();
            }
        });
    }

    async openComments(questionId) {
        try {
            this.currentQuestionId = questionId;
            document.getElementById('comment-question-id').value = questionId;
            this.editingCommentId = null;
            
            const response = await fetch(`${API_BASE_URL}/questions/${questionId}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load question');
            }
            
            const question = await response.json();
            document.getElementById('comment-question-content').innerHTML = this.getQuestionContentHTML(question);
            await this.loadComments(questionId);
            document.getElementById('comment-modal').classList.remove('hidden');
            document.getElementById('comment-text').focus();
        } catch (error) {
            Utils.showNotification('Error loading comments: ' + error.message, 'error');
        }
    }

    

    async saveCommentEdit(commentId) {
        try {
            const textarea = document.getElementById(`edit-comment-text-${commentId}`);
            const newText = textarea.value.trim();
            
            if (!newText) {
                Utils.showNotification('Comment cannot be empty', 'error');
                return;
            }
            
            const currentUser = this.authManager.getCurrentUser();
            const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: newText,
                    userId: currentUser.uid
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to update comment');
            }
            
            await this.loadComments(this.currentQuestionId);
            this.editingCommentId = null;
            Utils.showNotification('Comment updated successfully!', 'success');
            
        } catch (error) {
            Utils.showNotification('Error updating comment: ' + error.message, 'error');
        }
    }

    cancelCommentEdit() {
        this.editingCommentId = null;
        this.loadComments(this.currentQuestionId);
    }

    async deleteComment(commentId) {
        if (confirm('Are you sure you want to delete this comment?')) {
            try {
                const currentUser = this.authManager.getCurrentUser();
                const response = await fetch(`${API_BASE_URL}/comments/${commentId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ userId: currentUser.uid }),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to delete comment');
                }
                
                const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
                if (commentElement) {
                    commentElement.remove();
                }
                
                if (document.getElementById('comments-container').children.length === 0) {
                    document.getElementById('no-comments').classList.remove('hidden');
                }
                
                Utils.showNotification('Comment deleted successfully!', 'success');
                
            } catch (error) {
                Utils.showNotification('Error deleting comment: ' + error.message, 'error');
            }
        }
    }

    async submitComment(e) {
        e.preventDefault();
        
        const text = document.getElementById('comment-text').value.trim();
        if (!text) return;
        
        const submitBtn = document.querySelector('#comment-form button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        
        submitBtn.innerHTML = 'Sending...';
        submitBtn.disabled = true;

        try {
            const currentUser = this.authManager.getCurrentUser();
            const commentData = {
                text: text,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userEmail: currentUser.email,
                userPhotoURL: currentUser.photoURL || '',
                questionId: this.currentQuestionId
            };

            const response = await fetch(`${API_BASE_URL}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(commentData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit comment');
            }
            
            document.getElementById('comment-text').value = '';
            await this.loadComments(this.currentQuestionId);
            Utils.showNotification('Comment added successfully!', 'success');
            
        } catch (error) {
            Utils.showNotification('Error submitting comment: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    closeModal() {
        document.getElementById('comment-modal').classList.add('hidden');
        this.editingCommentId = null;
    }
}