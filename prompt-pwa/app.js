if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

function loadPrompts() {
    return JSON.parse(localStorage.getItem('prompts') || '[]');
}

function savePrompts(prompts) {
    localStorage.setItem('prompts', JSON.stringify(prompts));
}

function renderPrompts() {
    const list = document.getElementById('prompt-list');
    list.innerHTML = '';
    loadPrompts().forEach((prompt, index) => {
        const li = document.createElement('li');
        li.textContent = prompt;

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

        li.append(' ', copyBtn, ' ', deleteBtn);
        list.appendChild(li);
    });
}

document.getElementById('prompt-form').addEventListener('submit', e => {
    e.preventDefault();
    const input = document.getElementById('prompt-input');
    const value = input.value.trim();
    if (value) {
        const prompts = loadPrompts();
        prompts.push(value);
        savePrompts(prompts);
        input.value = '';
        renderPrompts();
    }
});

renderPrompts();
