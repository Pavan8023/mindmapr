const API_BASE_URL = 'https://mindmapr.onrender.com/api';

class Utils {
    static getCategoryColor(category) {
        const colors = {
            'web-development': 'bg-blue-500/20 text-blue-300',
            'data-structures': 'bg-purple-500/20 text-purple-300',
            'algorithms': 'bg-emerald-500/20 text-emerald-300',
            'database': 'bg-amber-500/20 text-amber-300',
            'college': 'bg-rose-500/20 text-rose-300',
            'other': 'bg-slate-500/20 text-slate-300'
        };
        return colors[category] || colors.other;
    }

    static getCategoryLabel(category) {
        const labels = {
            'web-development': 'Web Development',
            'data-structures': 'Data Structures',
            'algorithms': 'Algorithms',
            'database': 'Database',
            'college': 'College',
            'other': 'Other'
        };
        return labels[category] || 'Other';
    }

    static formatDate(date) {
        if (!date) return '';
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    }

    static formatTime(date) {
        if (!date) return '';
        return date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    }

    static escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    static showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-emerald-600 text-white' :
            type === 'error' ? 'bg-rose-600 text-white' :
            type === 'warning' ? 'bg-amber-600 text-white' :
            'bg-slate-700 text-white'
        }`;
        notification.textContent = message;

        document.body.appendChild(notification);

        // Longer timeout for warning messages
        const timeout = type === 'warning' ? 10000 : 3000;
        setTimeout(() => {
            notification.remove();
        }, timeout);
    }

    static async testBackendConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/test`);
            const data = await response.json();
            return true;
        } catch (error) {
            return false;
        }
    }
}