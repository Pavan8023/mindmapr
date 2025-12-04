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

    
}
