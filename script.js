document.addEventListener('DOMContentLoaded', () => {
    // Add staggered animation delay to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.animation = `fadeIn 0.5s ease-out forwards ${0.5 + (index * 0.1)}s`;
    });

    // 3D Tilt Effect for cards
    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = ((y - centerY) / centerY) * -5; // Max rotation deg
            const rotateY = ((x - centerX) / centerX) * 5;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        });
    });

    // GitHub API Integration
    const username = 'marcosgonzalezhidalgo'; // Replace with your GitHub username
    const reposContainer = document.getElementById('github-repos');

    // Lista de nombres de repositorios que quieres fijar (tal cual aparecen en la URL de GitHub)
    // Ejemplo: ['mi-proyecto-1', 'portfolio', 'otro-repo']
    // Si dejas esto vacío [], se mostrarán los últimos actualizados.
    const pinnedRepoNames = ['repo.pruebas', '25-26-EDA1', 'BaseDeDatos1-25-26'];

    async function fetchGitHubRepos() {
        try {
            reposContainer.innerHTML = '<div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i> Cargando repositorios...</div>';

            let repos = [];

            if (pinnedRepoNames.length > 0) {
                // Fetch specific pinned repos
                const promises = pinnedRepoNames.map(name =>
                    fetch(`https://api.github.com/repos/${username}/${name}`).then(res => {
                        if (!res.ok) return null;
                        return res.json();
                    })
                );
                const results = await Promise.all(promises);
                repos = results.filter(repo => repo !== null);
            } else {
                // Fetch latest updated repos
                const response = await fetch(`https://api.github.com/users/${username}/repos?sort=updated&per_page=3`);
                if (!response.ok) throw new Error('GitHub API error');
                repos = await response.json();
            }

            reposContainer.innerHTML = ''; // Clear loading spinner

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

    // Quick Notes Functionality
    const notesArea = document.getElementById('quick-notes-area');
    if (notesArea) {
        // Load saved notes
        const savedNotes = localStorage.getItem('quickNotes');
        if (savedNotes) {
            notesArea.value = savedNotes;
        }

        // Save notes on input
        notesArea.addEventListener('input', () => {
            localStorage.setItem('quickNotes', notesArea.value);
        });
    }

    // Chatbox Logic
    const chatToggle = document.getElementById('chat-toggle');
    const chatWindow = document.getElementById('chat-window');
    const chatClose = document.getElementById('chat-close');
    const chatInput = document.getElementById('chat-input');
    const chatSend = document.getElementById('chat-send');
    const chatMessages = document.getElementById('chat-messages');

    function toggleChat() {
        chatWindow.classList.toggle('active');
        const icon = chatToggle.querySelector('i');
        if (chatWindow.classList.contains('active')) {
            icon.classList.remove('fa-sparkles');
            icon.classList.add('fa-chevron-down');
        } else {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-sparkles');
        }
    }

    chatToggle.addEventListener('click', toggleChat);
    chatClose.addEventListener('click', toggleChat);

    async function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;

        // Add user message
        addMessage(message, 'user');
        chatInput.value = '';
        chatInput.disabled = true;

        // Loading state
        const loadingId = addMessage('Escribiendo...', 'bot', true);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message })
            });

            const data = await response.json();

            // Remove loading message
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
