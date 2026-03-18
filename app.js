// Hardcoded questions for the Vercel deployed form
// You can modify these directly to change the form questions!
const questions = [
    {
        id: 'welcome_1',
        type: 'statement',
        title: 'Welcome to our feedback form',
        desc: 'We are about to ask you a few quick questions.',
        buttonText: 'Let\'s start',
        required: false
    },
    {
        id: 'name_2',
        type: 'text',
        title: 'What\'s your name?',
        desc: 'We like to keep things personal.',
        placeholder: 'Type your answer here...',
        required: true
    },
    {
        id: 'email_3',
        type: 'email',
        title: 'What\'s your email address?',
        desc: 'We will send you a confirmation.',
        placeholder: 'name@example.com',
        required: true
    },
    {
        id: 'satisfaction_4',
        type: 'choice',
        title: 'How satisfied are you with our service?',
        desc: 'Pick one option using your mouse or keyboard (A-D).',
        required: true,
        options: [
            { key: 'A', value: 'Very Satisfied', label: 'Very Satisfied' },
            { key: 'B', value: 'Satisfied', label: 'Satisfied' },
            { key: 'C', value: 'Neutral', label: 'Neutral' },
            { key: 'D', value: 'Unsatisfied', label: 'Unsatisfied' }
        ]
    },
    {
        id: 'summary_5',
        type: 'summary',
        title: 'All done!',
        desc: 'Thanks for your time. Review your answers below.',
        buttonText: 'Submit to Vercel',
        required: false
    }
];

let currentIndex = 0;
const answers = {};

// --- INITIALIZATION ---
function initApp() {
    initForm();
}

// --- FORM LOGIC ---
const container = document.getElementById('question-container');
const progressBar = document.getElementById('progress-bar');
const btnUp = document.getElementById('btn-up');
const btnDown = document.getElementById('btn-down');
let isTransitioning = false;

function initForm() {
    renderQuestion(currentIndex, 'initial');
    updateProgress();
    
    window.addEventListener('keydown', handleKeyDown);
    
    if(btnUp) btnUp.addEventListener('click', () => navigate(-1));
    if(btnDown) btnDown.addEventListener('click', () => navigate(1));
}

function updateProgress() {
    if(!progressBar) return;
    let progress = 0;
    if (currentIndex > 0) {
        const total = questions.length > 2 ? questions.length - 2 : 1;
        progress = ((currentIndex) / total) * 100;
        if(currentIndex === questions.length - 1) progress = 100;
        if(progress > 100) progress = 100;
    }
    progressBar.style.width = `${progress}%`;
    
    if(btnUp) btnUp.disabled = currentIndex === 0;
    if(btnDown) btnDown.disabled = currentIndex === questions.length - 1;
}

function renderQuestion(index, direction = 'forward') {
    const q = questions[index];
    if(!q) return;
    
    const block = document.createElement('div');
    block.className = 'question-block';
    if(direction === 'initial') {
        block.classList.add('active');
    }
    
    let html = '';
    
    if (q.type !== 'statement' && q.type !== 'summary') {
        html += `<div class="question-number"><span>${index + 1}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></div>`;
    }
    
    html += `<h1 class="question-title">${q.title}</h1>`;
    if (q.desc) {
        html += `<p class="question-desc">${q.desc}</p>`;
    }
    
    html += `<div class="error-msg" id="error-${q.id}">Please enter a valid answer.</div>`;
    
    if (q.type === 'text' || q.type === 'email') {
        const value = answers[q.id] || '';
        const inputType = q.type === 'email' ? 'email' : 'text';
        html += `
            <div class="input-wrapper">
                <input type="${inputType}" id="input-${q.id}" class="input-text" placeholder="${q.placeholder || ''}" value="${value}" autocomplete="off">
            </div>
        `;
    } else if (q.type === 'choice') {
        html += `<div class="options-list">`;
        (q.options || []).forEach(opt => {
            const isSelected = answers[q.id] === opt.value ? 'selected' : '';
            html += `
                <div class="option-item ${isSelected}" data-value="${opt.value}" onclick="handleOptionSelect('${q.id}', '${opt.value.replace(/'/g, "\\'")}')">
                    <span class="option-key">${opt.key}</span>
                    <span class="option-label">${opt.label}</span>
                </div>
            `;
        });
        html += `</div>`;
    } else if (q.type === 'statement') {
        html += `<button class="btn-primary" onclick="navigate(1)">${q.buttonText || 'Continue'}</button>`;
    } else if (q.type === 'summary') {
        html += `<div class="summary-container">`;
        questions.forEach(originQ => {
            if(originQ.type !== 'statement' && originQ.type !== 'summary') {
                html += `
                    <div class="summary-item">
                        <div class="summary-question">${originQ.title}</div>
                        <div class="summary-answer">${answers[originQ.id] || '<span style="color:var(--text-muted)">Skipped</span>'}</div>
                    </div>
                `;
            }
        });
        html += `</div>`;
        html += `<button class="btn-primary" onclick="submitForm()">${q.buttonText || 'Submit'}</button>`;
    }
    
    block.innerHTML = html;
    
    if (direction === 'forward' || direction === 'backward') {
        const currentBlock = container.querySelector('.question-block.active');
        if (currentBlock) {
            currentBlock.classList.remove('active');
            currentBlock.classList.add('exiting');
            if(direction === 'backward') {
                currentBlock.style.transform = 'translateY(30px)';
            }
            setTimeout(() => {
                if(currentBlock.parentNode) {
                    currentBlock.parentNode.removeChild(currentBlock);
                }
            }, 600);
        }
        
        container.appendChild(block);
        
        void block.offsetWidth;
        if(direction === 'backward') {
            block.style.transform = 'translateY(-30px)';
            void block.offsetWidth;
        }
        block.classList.add('active');
        
    } else {
        container.innerHTML = '';
        container.appendChild(block);
    }
    
    setTimeout(() => {
        const input = document.getElementById(`input-${q.id}`);
        if(input) input.focus();
    }, 100);
}

function validateCurrent() {
    const q = questions[currentIndex];
    if(!q) return true;
    const errorEl = document.getElementById(`error-${q.id}`);
    
    if (q.type === 'text' || q.type === 'email') {
        const input = document.getElementById(`input-${q.id}`);
        const val = input ? input.value.trim() : '';
        
        if (q.required && !val) {
            showError(errorEl, 'This field is required.');
            return false;
        }
        
        if (q.type === 'email' && val) {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            if (!emailRegex.test(val)) {
                showError(errorEl, 'Please enter a valid email address.');
                return false;
            }
        }
        
        answers[q.id] = val;
        hideError(errorEl);
        return true;
    }
    
    if (q.type === 'choice') {
        if(q.required && !answers[q.id]) {
            showError(errorEl, 'Please select an option.');
            return false;
        }
        hideError(errorEl);
        return true;
    }
    
    return true;
}

function showError(el, msg) {
    if(el) {
        el.textContent = msg;
        el.style.display = 'block';
    }
}

function hideError(el) {
    if(el) {
        el.style.display = 'none';
    }
}

function navigate(dir) {
    if(isTransitioning) return;
    
    if (dir > 0) {
        if (!validateCurrent()) return;
    }
    
    const newIndex = currentIndex + dir;
    if (newIndex >= 0 && newIndex < questions.length) {
        isTransitioning = true;
        currentIndex = newIndex;
        renderQuestion(currentIndex, dir > 0 ? 'forward' : 'backward');
        updateProgress();
        
        setTimeout(() => {
            isTransitioning = false;
        }, 650);
    }
}

window.handleOptionSelect = function(questionId, value) {
    answers[questionId] = value;
    
    const items = document.querySelectorAll('.option-item');
    items.forEach(item => {
        if(item.dataset.value === value) item.classList.add('selected');
        else item.classList.remove('selected');
    });
    
    setTimeout(() => {
       navigate(1);
    }, 400);
}

function handleKeyDown(e) {
    if (e.key === 'Enter') {
        const q = questions[currentIndex];
        if (q && (q.type === 'text' || q.type === 'email' || q.type === 'statement' || q.type === 'summary')) {
            e.preventDefault();
            if(q.type === 'summary') {
                submitForm();
            } else {
                navigate(1);
            }
        }
    }
    
    if (e.key === 'ArrowUp') {
        e.preventDefault();
        navigate(-1);
    }
    
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        navigate(1);
    }
    
    const q = questions[currentIndex];
    if (q && q.type === 'choice') {
        const key = e.key.toUpperCase();
        const option = (q.options || []).find(opt => opt.key === key);
        if (option) {
            handleOptionSelect(q.id, option.value);
        }
    }
}

async function submitForm() {
    const qBlock = document.querySelector('.question-block');
    if(!qBlock) return;
    
    qBlock.innerHTML = `
        <h1 class="question-title" style="text-align: center;">Saving your answers...</h1>
        <p class="question-desc" style="text-align: center;">Processing via Vercel Backend...</p>
    `;

    try {
        // Post data to Vercel Serverless Function
        const response = await fetch('/api/submit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(answers)
        });
        
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        
        qBlock.innerHTML = `
            <h1 class="question-title" style="color: var(--accent); text-align: center;">Success!</h1>
            <p class="question-desc" style="text-align: center;">Your answers have been processed securely.</p>
        `;
        console.log('Successfully saved to API:', data);
        
    } catch (error) {
        console.error('Error saving data:', error);
        qBlock.innerHTML = `
            <h1 class="question-title" style="color: var(--error); text-align: center;">Oops! Something went wrong.</h1>
            <p class="question-desc" style="text-align: center;">We couldn't reach the backend. If you are running locally without a dev server, fetch requests to /api won't work.</p>
        `;
    }
}

// Start
document.addEventListener('DOMContentLoaded', initApp);
