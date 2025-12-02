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

    

    async loadComments(questionId) {
        try {
            const response = await fetch(`${API_BASE_URL}/comments/${questionId}`);
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to load comments');
            }
            
            const comments = await response.json();
            document.getElementById('comments-container').innerHTML = '';
            
            if (comments.length === 0) {
                document.getElementById('no-comments').classList.remove('hidden');
                return;
            }
            
            document.getElementById('no-comments').classList.add('hidden');
            comments.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            
            comments.forEach((comment) => {
                this.displayComment(comment._id, comment);
            });
            
            document.getElementById('comments-container').scrollTop = document.getElementById('comments-container').scrollHeight;
        } catch (error) {
            document.getElementById('no-comments').classList.remove('hidden');
            Utils.showNotification('Error loading comments: ' + error.message, 'error');
        }
    }

    displayComment(id, comment) {
        const commentDate = comment.createdAt ? new Date(comment.createdAt) : new Date();
        const commentElement = document.createElement('div');
        commentElement.className = 'comment-enter bg-slate-700/30 rounded-lg p-4 border border-slate-600';
        commentElement.setAttribute('data-comment-id', id);
        
        const currentUser = this.authManager.getCurrentUser();
        const isCurrentUserComment = comment.userId === currentUser.uid;
        
        commentElement.innerHTML = this.getCommentHTML(id, comment, commentDate, isCurrentUserComment);
        document.getElementById('comments-container').appendChild(commentElement);
    }

    getCommentHTML(id, comment, commentDate, isCurrentUserComment) {
        return `
            <div class="flex items-start gap-3">
                <img src="${comment.userPhotoURL || 'https://via.placeholder.com/32?text=U'}" 
                     class="w-8 h-8 rounded-full border border-slate-500" alt="User">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-1">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-sm text-white mobile-text-sm">${comment.userName || comment.userEmail}</span>
                            <span class="text-xs text-slate-400 mobile-hidden">${Utils.formatTime(commentDate)}</span>
                        </div>
                        ${isCurrentUserComment ? `
                            <div class="flex gap-2">
                                <button onclick="commentManager.startEditComment('${id}')" class="text-slate-400 hover:text-emerald-400 transition text-xs">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                                    </svg>
                                </button>
                                <button onclick="commentManager.deleteComment('${id}')" class="text-slate-400 hover:text-rose-400 transition text-xs">
                                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                </button>
                            </div>
                        ` : ''}
                    </div>
                    <p class="text-slate-200 text-sm mobile-text-sm">${comment.text}</p>
                </div>
            </div>
        `;
    }

    async startEditComment(commentId) {
        try {
            const commentElement = document.querySelector(`[data-comment-id="${commentId}"]`);
            if (!commentElement) return;
            
            const currentText = commentElement.querySelector('p').textContent;
            const currentUser = this.authManager.getCurrentUser();
            
            commentElement.innerHTML = this.getEditCommentHTML(commentId, currentText, currentUser);
            this.editingCommentId = commentId;
            
            const textarea = document.getElementById(`edit-comment-text-${commentId}`);
            textarea.focus();
            
        } catch (error) {
            Utils.showNotification('Error starting comment edit', 'error');
        }
    }

    getEditCommentHTML(commentId, currentText, currentUser) {
        return `
            <div class="flex items-start gap-3">
                <img src="${currentUser.photoURL || 'https://via.placeholder.com/32?text=U'}" 
                     class="w-8 h-8 rounded-full border border-slate-500" alt="User">
                <div class="flex-1">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <span class="font-medium text-sm text-white mobile-text-sm">${currentUser.displayName || currentUser.email}</span>
                            <span class="text-xs text-slate-400 mobile-hidden">Editing...</span>
                        </div>
                        <div class="flex gap-2">
                            <button onclick="commentManager.saveCommentEdit('${commentId}')" class="text-emerald-400 hover:text-emerald-300 transition text-xs">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                                </svg>
                            </button>
                            <button onclick="commentManager.cancelCommentEdit('${commentId}')" class="text-slate-400 hover:text-white transition text-xs">
                                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <textarea id="edit-comment-text-${commentId}" 
                              class="w-full bg-slate-600 border border-slate-500 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                              rows="3">${currentText}</textarea>
                </div>
            </div>
        `;
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