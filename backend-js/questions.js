class QuestionManager {
    constructor(authManager) {
        this.authManager = authManager;
        this.pollInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('question-form').addEventListener('submit', (e) => this.submitQuestion(e));
        document.getElementById('edit-question-form').addEventListener('submit', (e) => this.updateQuestion(e));
        document.getElementById('cancel-edit').addEventListener('click', () => this.cancelEdit());
        document.getElementById('delete-question').addEventListener('click', () => this.deleteQuestionHandler());
        document.getElementById('clear-form').addEventListener('click', () => this.clearForm());
        document.getElementById('category-filter').addEventListener('change', () => this.fetchQuestions());
        document.getElementById('sort-questions').addEventListener('change', () => this.fetchQuestions());
    }

    setupQuestionsListener() {
        this.fetchQuestions();

        if (this.pollInterval) clearInterval(this.pollInterval);
        this.pollInterval = setInterval(() => this.fetchQuestions(), 3000);
    }

    async fetchQuestions() {
        try {
            const category = document.getElementById('category-filter').value;
            const sort = document.getElementById('sort-questions').value;

            const qsCategory = encodeURIComponent(category);
            const qsSort = encodeURIComponent(sort);

            const response = await fetch(
                `${API_BASE_URL}/questions?category=${qsCategory}&sort=${qsSort}`
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            let questions = await response.json();

            const loadingEl = document.getElementById('loading-questions');
            const containerEl = document.getElementById('questions-container');

            loadingEl.classList.add('hidden');
            containerEl.innerHTML = '';

            if (!questions || questions.length === 0) {
                containerEl.innerHTML = this.getEmptyStateHTML();
                return;
            }

            // client-side sorting fallback (in case server doesn’t sort)
            questions = this.sortQuestionsClientSide(questions, sort);

            questions.forEach((question) => {
                this.displayQuestion(question._id, question);
            });
        } catch (error) {
            console.error('Error fetching questions:', error);
            this.showErrorState();
        }
    }

    // respect dropdown sort option
    sortQuestionsClientSide(questions, sort) {
        if (!Array.isArray(questions)) return [];

        const safeDate = (q) => (q.createdAt ? new Date(q.createdAt) : new Date(0));

        if (sort === 'oldest') {
            return questions.sort(
                (a, b) => safeDate(a) - safeDate(b)
            );
        }

        if (sort === 'category') {
            return questions.sort((a, b) => {
                const catA = (a.category || '').toLowerCase();
                const catB = (b.category || '').toLowerCase();
                if (catA < catB) return -1;
                if (catA > catB) return 1;
                // if same category → newest first
                return safeDate(b) - safeDate(a);
            });
        }

        // default or "newest"
        return questions.sort(
            (a, b) => safeDate(b) - safeDate(a)
        );
    }

    displayQuestion(id, question) {
        const questionElement = document.createElement('div');
        questionElement.className = 'bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 transition';
        questionElement.setAttribute('data-question-id', id);

        const questionDate = question.createdAt ? new Date(question.createdAt) : new Date();
        const currentUser = this.authManager.getCurrentUser();

        questionElement.innerHTML = this.getQuestionHTML(id, question, questionDate, currentUser);
        document.getElementById('questions-container').appendChild(questionElement);
    }

    getQuestionHTML(id, question, questionDate, currentUser) {
        return `
            <div class="flex justify-between items-start mb-3">
                <div class="flex items-center gap-2">
                    <span class="inline-block px-2 py-1 text-xs font-medium rounded-full ${Utils.getCategoryColor(question.category)}">
                        ${Utils.getCategoryLabel(question.category)}
                    </span>
                    <div class="flex items-center gap-2 text-xs text-slate-400">
                        <img src="${question.userPhotoURL || 'https://via.placeholder.com/20?text=U'}" 
                             class="w-4 h-4 rounded-full" alt="User">
                        <span class="mobile-text-sm">${question.userName || question.userEmail}</span>
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="commentManager.openComments('${id}')" class="text-slate-400 hover:text-indigo-400 transition flex items-center gap-1 text-xs">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/>
                        </svg>
                        <span class="mobile-hidden">Comment</span>
                    </button>
                    ${question.userId === currentUser.uid ? `
                        <button onclick="questionManager.editQuestion('${id}')" class="text-slate-400 hover:text-emerald-400 transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                            </svg>
                        </button>
                        <button onclick="questionManager.deleteQuestion('${id}')" class="text-slate-400 hover:text-rose-400 transition">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
            <h3 class="font-semibold text-white mb-2 mobile-text-sm">${question.title}</h3>
            <p class="text-slate-300 text-sm mb-3 mobile-text-sm">${question.description}</p>
            ${question.code ? `
                <div class="bg-slate-900 rounded p-3 mb-3">
                    <pre class="text-sm text-emerald-400 font-mono overflow-x-auto"><code>${Utils.escapeHtml(question.code)}</code></pre>
                </div>
            ` : ''}
            <div class="text-xs text-slate-400 flex justify-between items-center">
                <span>${Utils.formatDate(questionDate)}</span>
                <span class="flex items-center gap-1 mobile-hidden">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    ${questionDate.toLocaleTimeString()}
                </span>
            </div>
        `;
    }

    async submitQuestion(e) {
        e.preventDefault();

        const submitBtn = document.getElementById('submit-question');
        const originalText = submitBtn.innerHTML;

        submitBtn.innerHTML = `
            <div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Submitting...
        `;
        submitBtn.disabled = true;

        try {
            const currentUser = this.authManager.getCurrentUser();
            const questionData = {
                title: document.getElementById('question-title').value,
                category: document.getElementById('question-category').value,
                description: document.getElementById('question-description').value,
                code: document.getElementById('question-code').value,
                userId: currentUser.uid,
                userName: currentUser.displayName || currentUser.email,
                userEmail: currentUser.email,
                userPhotoURL: currentUser.photoURL || ''
            };

            const response = await fetch(`${API_BASE_URL}/questions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(questionData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to submit question');
            }

            this.clearForm();
            Utils.showNotification('Question submitted successfully!', 'success');

            setTimeout(() => {
                this.fetchQuestions();
            }, 500);

        } catch (error) {
            Utils.showNotification(error.message || 'Error submitting question. Please try again.', 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    
}
