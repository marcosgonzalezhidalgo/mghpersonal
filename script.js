document.addEventListener('DOMContentLoaded', () => {
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeIn 0.5s ease-out forwards ${0.5 + (index * 0.1)}s`;
    });

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5;
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    const username = 'marcosgonzalezhidalgo';
    const reposContainer = document.getElementById('github-repos');
    const pinnedRepoNames = ['repo.pruebas', '25-26-EDA1', 'BaseDeDatos1-25-26'];

    async function fetchGitHubRepos() {
        try {
            reposContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando repositorios...</div>';

            let repos = [];

            if (pinnedRepoNames.length > 0) {
                const promises = pinnedRepoNames.map(name =>
                    fetch(`https://api.github.com/repos/${username}/${name}`).then(res => {
                        if (!res.ok) return null;
                        return res.json();
                    })
                );
                const results = await Promise.all(promises);
                repos = results.filter(repo => repo !== null);
            } else {
                const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=3`);
                if (!response.ok) throw new Error('GitHub API error');
                repos = await response.json();
            }

            reposContainer.innerHTML = '';

            if (repos.length === 0) {
                reposContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No se encontraron repositorios.</p>';
                return;
            }

            repos.forEach(repo => {
                const repoEl = document.createElement('a');
                repoEl.className = 'repo-item';
                repoEl.href = repo.html_url;
                repoEl.target = '_blank';
                repoEl.innerHTML = `
                    <div class="repo-name">
                        <i class="fas fa-book-bookmark"></i> ${repo.name}
                    </div>
                    <div class="repo-desc">${repo.description || 'Sin descripción'}</div>
                    <div class="repo-stats">
                        <span><i class="fas fa-star"></i> ${repo.stargazers_count}</span>
                        <span><i class="fas fa-code-branch"></i> ${repo.forks_count}</span>
                        <span><i class="fas fa-circle" style="font-size: 0.6rem;"></i> ${repo.language || 'N/A'}</span>
                    </div>
                `;
                reposContainer.appendChild(repoEl);
            });
        } catch (error) {
            console.error('Error fetching repos:', error);
            reposContainer.innerHTML = '<p style="color: var(--text-secondary); font-size: 0.9rem;">No se pudieron cargar los repositorios.</p>';
        }
    }

    fetchGitHubRepos();

    const notesArea = document.getElementById('quick-notes-area');
    if (notesArea) {
        const savedNotes = localStorage.getItem('quickNotes');
        if (savedNotes) {
            notesArea.value = savedNotes;
        }

        notesArea.addEventListener('input', () => {
            localStorage.setItem('quickNotes', notesArea.value);
        });
    }

    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    function toggleChat() {
        chatWindow.classList.toggle('active');
        const img = chatToggle.querySelector('img');

        if (chatWindow.classList.contains('active')) {
            // Change to close icon (or just hide image and show icon if preferred, but let's swap src or use a class)
            // Simpler approach: Rotate the button or change opacity
            chatToggle.style.transform = 'rotate(45deg)';
        } else {
            chatToggle.style.transform = 'rotate(0deg)';
        }
    }

    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', toggleChat);

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;

        const loadingId = addMessage('Escribiendo...', 'bot', true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            removeMessage(loadingId);

            if (response.ok) {
                addMessage(data.reply, 'bot');
            } else {
                addMessage('Lo siento, hubo un error al conectar con Gemini.', 'bot');
                console.error(data.error);
            }
        } catch (error) {
            removeMessage(loadingId);
            addMessage('Error de conexión.', 'bot');
            console.error(error);
        } finally {
            chatInput.disabled = false;
            chatInput.focus();
        }
    }

    function addMessage(text, sender, isLoading = false) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${sender}`;
        msgDiv.textContent = text;
        if (isLoading) msgDiv.id = 'loading-msg';
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return msgDiv.id;
    }

    function removeMessage(id) {
        const msg = document.getElementById('loading-msg');
        if (msg) msg.remove();
    }

    chatSend.addEventListener('click', sendMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
});
