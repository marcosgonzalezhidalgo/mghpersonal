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

    // Commits Dropdown Logic
    const commitsToggle = document.getElementById('commits-toggle');
    const commitsDropdown = document.getElementById('commits-dropdown');
    const commitsList = document.getElementById('commits-list');

    // -------------------------------------------------------------------------
    // CONFIGURACIÓN DE REPOSITORIOS (EDITAR AQUÍ)
    // -------------------------------------------------------------------------
    // Para añadir un nuevo repositorio, copia una línea y cambia los datos.
    // owner: El dueño del repositorio (usuario de GitHub)
    // repo: El nombre exacto del repositorio
    // color: El color con el que saldrá el nombre del repo (hex o nombre en inglés)
    const trackedRepos = [
        { owner: 'mmasias', repo: '25-26-EDA1', color: '#3b82f6' },          // Azul
        { owner: 'mmasias', repo: 'EDA1', color: '#10b981' },                // Verde
        { owner: 'LorenzoPerezUnea', repo: 'BaseDeDatos1-25-26', color: '#f59e0b' } // Naranja
    ];
    // -------------------------------------------------------------------------

    commitsToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        commitsDropdown.classList.toggle('active');
        const icon = commitsToggle.querySelector('.fa-chevron-down');
        if (commitsDropdown.classList.contains('active')) {
            icon.style.transform = 'rotate(180deg)';
            if (commitsList.children.length <= 1) {
                fetchCommits();
            }
        } else {
            icon.style.transform = 'rotate(0deg)';
        }
    });

    document.addEventListener('click', (e) => {
        if (!commitsDropdown.contains(e.target) && !commitsToggle.contains(e.target)) {
            commitsDropdown.classList.remove('active');
            const icon = commitsToggle.querySelector('.fa-chevron-down');
            if (icon) icon.style.transform = 'rotate(0deg)';
        }
    });

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " años";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " meses";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " días";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " horas";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutos";
        return Math.floor(seconds) + " segundos";
    }

    async function fetchCommits() {
        try {
            const promises = trackedRepos.map(config =>
                fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/commits?per_page=3`)
                    .then(res => res.ok ? res.json() : [])
                    .then(commits => commits.map(commit => ({
                        repo: config.repo,
                        owner: config.owner,
                        color: config.color,
                        message: commit.commit.message,
                        date: new Date(commit.commit.author.date),
                        url: commit.html_url
                    })))
            );

            const results = await Promise.all(promises);
            const allCommits = results.flat().sort((a, b) => b.date - a.date).slice(0, 10);

            commitsList.innerHTML = '';

            if (allCommits.length === 0) {
                commitsList.innerHTML = '<div style="padding:1rem; text-align:center; color:var(--text-secondary)">No se encontraron commits recientes.</div>';
                return;
            }

            allCommits.forEach(commit => {
                const timeString = timeAgo(commit.date);
                const item = document.createElement('a');
                item.href = commit.url;
                item.target = '_blank';
                item.className = 'commit-item';
                // Aplicamos el color específico al borde y al nombre del repo
                item.style.borderLeftColor = commit.color;

                item.innerHTML = `
                    <div class="commit-repo" style="color: ${commit.color}">${commit.repo}</div>
                    <div class="commit-message">${commit.message}</div>
                    <div class="commit-date"><i class="far fa-clock"></i> hace ${timeString}</div>
                `;
                commitsList.appendChild(item);
            });

        } catch (error) {
            console.error('Error fetching commits:', error);
            commitsList.innerHTML = '<div style="padding:1rem; text-align:center; color:#ef4444">Error al cargar commits.</div>';
        }
    }
});
