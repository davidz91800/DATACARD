if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

function loadPrompts() {
    try {
        return JSON.parse(localStorage.getItem('prompts')) || [];
    } catch {
        return [];
    }
}

function savePrompts(prompts) {
    localStorage.setItem('prompts', JSON.stringify(prompts));
}

function renderPrompts() {
    const list = document.getElementById('prompt-list');
    list.innerHTML = '';
    loadPrompts().forEach((prompt, index) => {
        const li = document.createElement('li');
        li.className = 'prompt-item';

        const text = document.createElement('span');
        text.className = 'prompt-text';
        text.textContent = prompt;
        text.addEventListener('click', () => navigator.clipboard.writeText(prompt));

        const actions = document.createElement('span');
        actions.className = 'prompt-actions';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copier';
        copyBtn.addEventListener('click', () => navigator.clipboard.writeText(prompt));

        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Supprimer';
        deleteBtn.addEventListener('click', () => {
            const prompts = loadPrompts();
            prompts.splice(index, 1);
            savePrompts(prompts);
            renderPrompts();
        });

        actions.append(copyBtn, deleteBtn);
        li.append(text, actions);
        list.appendChild(li);
    });
}

document.getElementById('prompt-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('prompt-input');
    const value = input.value.trim();
    if (value) {
        const prompts = loadPrompts();
        prompts.unshift(value);
        savePrompts(prompts);
        input.value = '';
        renderPrompts();
    }
});

renderPrompts();
