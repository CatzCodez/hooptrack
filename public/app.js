// Home page - today's games
async function loadGames() {
    const todaysGames = document.getElementById('todaysGames');
    if (!todaysGames) return;

    try {
        const response = await fetch('/api/games');
        const data = await response.json();
        const games = data.data;

        if (!games || games.length === 0) {
            todaysGames.innerHTML = '<p class="no-games">No games today.</p>';
            return;
        }

        todaysGames.innerHTML = '';
        games.forEach(game => {
            const isLive = game.status !== 'Final' && game.status !== 'Halftime' && !game.status.includes('pm') && !game.status.includes('ET');
            const card = document.createElement('div');
            card.classList.add('game-card');
            card.innerHTML = `
                ${isLive ? '<div class="live-badge">● LIVE</div>' : ''}
                <div class="teams">${game.home_team.full_name} vs ${game.visitor_team.full_name}</div>
                <div class="score">${game.home_team_score} - ${game.visitor_team_score}</div>
                <div class="quarters">
                    <span class="${game.period === 1 ? 'active-quarter' : ''}">Q1: ${game.home_q1 || 0} - ${game.visitor_q1 || 0}</span>
                    <span class="${game.period === 2 ? 'active-quarter' : ''}">Q2: ${game.home_q2 || 0} - ${game.visitor_q2 || 0}</span>
                    <span class="${game.period === 3 ? 'active-quarter' : ''}">Q3: ${game.home_q3 || 0} - ${game.visitor_q3 || 0}</span>
                    <span class="${game.period === 4 ? 'active-quarter' : ''}">Q4: ${game.home_q4 || 0} - ${game.visitor_q4 || 0}</span>
                </div>
            `;
            todaysGames.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading games:', err);
        todaysGames.innerHTML = '<p class="no-games">Error loading games.</p>';
    }
}


// Home page - recent games
async function loadRecentGames() {
    const gamesGrid = document.getElementById('gamesGrid');
    if (!gamesGrid) return;

    try {
        const response = await fetch('/api/recent-games');
        const data = await response.json();
        const games = data.data;

        if (!games || games.length === 0) {
            gamesGrid.innerHTML = '<p class="no-games">No recent games.</p>';
            return;
        }

        gamesGrid.innerHTML = '';
        games.reverse().forEach(game => {
            const card = document.createElement('div');
            card.classList.add('game-card');
            card.innerHTML = `
                <div class="teams">${game.home_team.abbreviation} vs ${game.visitor_team.abbreviation}</div>
                <div class="score">${game.home_team_score} - ${game.visitor_team_score}</div>
                <div class="status">${game.status}</div>
            `;
            gamesGrid.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading recent games:', err);
        gamesGrid.innerHTML = '<p class="no-games">Error loading recent games.</p>';
    }
}


// Players page - search players
async function searchPlayers() {
    const search = document.getElementById('searchInput').value.trim();
    const playersGrid = document.getElementById('playersGrid');

    if (!search) {
        playersGrid.innerHTML = '';
        return;
    }

    playersGrid.innerHTML = '<p class="no-games">Searching...</p>';

    try {
        const response = await fetch(`/api/players?search=${search}`);
        const data = await response.json();
        const players = data.data;

        if (!players || players.length === 0) {
            playersGrid.innerHTML = '<p class="no-games">No players found.</p>';
            return;
        }

        playersGrid.innerHTML = '';
        players.forEach(player => {
            const card = document.createElement('div');
            card.classList.add('player-card');
            card.innerHTML = `
                <div class="player-info">
                    <h3>${player.first_name} ${player.last_name}</h3>
                    <p>${player.team ? player.team.full_name : 'No Team'} | Position: ${player.position || 'N/A'} | Height: ${player.height || 'N/A'}</p>
                </div>
                <div class="player-buttons">
                    <button class="favorite-btn" onclick="addFavorite(${player.id}, '${player.first_name} ${player.last_name}', '${player.team ? player.team.full_name : 'No Team'}', '${player.position || 'N/A'}', '${player.height || 'N/A'}', '${player.weight || '0'}')">
                        ★ Favorite
                    </button>
                    <button class="compare-btn" onclick="addToCompare(${player.id}, '${player.first_name} ${player.last_name}', '${player.height || '0-0'}', '${player.weight || 0}')">
                        ⇄ Compare
                    </button>
                </div>
            `;
            playersGrid.appendChild(card);
        });

    } catch (err) {
        console.error('Error searching players:', err);
        playersGrid.innerHTML = '<p class="no-games">Error searching players.</p>';
    }
}


// Players page - compare players
let comparePlayers = [];
let compareChartInstance = null;

function heightToInches(height) {
    if (!height || height === '0-0') return 0;
    const parts = height.split('-');
    return parseInt(parts[0]) * 12 + parseInt(parts[1]);
}

function addToCompare(id, name, height, weight) {
    if (comparePlayers.length >= 2) {
        alert('You can only compare 2 players at a time. Clear one first.');
        return;
    }

    if (comparePlayers.find(p => p.id === id)) {
        alert(`${name} is already in the compare list.`);
        return;
    }

    comparePlayers.push({ id, name, height, weight });
    updateCompareSlots();

    if (comparePlayers.length === 2) {
        renderCompareChart();
    }
}

function removeFromCompare(id) {
    comparePlayers = comparePlayers.filter(p => p.id !== id);
    updateCompareSlots();

    const container = document.getElementById('compareChartContainer');
    if (container) container.style.display = 'none';

    if (compareChartInstance) {
        compareChartInstance.destroy();
        compareChartInstance = null;
    }
}

function updateCompareSlots() {
    for (let i = 0; i < 2; i++) {
        const slot = document.getElementById(`slot${i + 1}`);
        if (!slot) continue;
        if (comparePlayers[i]) {
            slot.innerHTML = `
                <div class="compare-player">
                    <span>${comparePlayers[i].name}</span>
                    <button class="remove-btn" onclick="removeFromCompare(${comparePlayers[i].id})">✕</button>
                </div>
            `;
        } else {
            slot.innerHTML = '<p class="no-games">No player selected</p>';
        }
    }
}

function renderCompareChart() {
    const container = document.getElementById('compareChartContainer');
    if (container) container.style.display = 'block';

    if (compareChartInstance) {
        compareChartInstance.destroy();
    }

    const p1 = comparePlayers[0];
    const p2 = comparePlayers[1];

    const ctx = document.getElementById('compareChart').getContext('2d');
    compareChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Height (inches)', 'Weight (lbs)'],
            datasets: [
                {
                    label: p1.name,
                    data: [heightToInches(p1.height), parseInt(p1.weight) || 0],
                    backgroundColor: '#f5a623',
                },
                {
                    label: p2.name,
                    data: [heightToInches(p2.height), parseInt(p2.weight) || 0],
                    backgroundColor: '#4a90d9',
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    labels: { color: '#ffffff' }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.dataset.label;
                            const value = context.parsed.y;
                            if (context.dataIndex === 0) {
                                const feet = Math.floor(value / 12);
                                const inches = value % 12;
                                return `${label}: ${feet}-${inches} (${value} inches)`;
                            }
                            return `${label}: ${value} lbs`;
                        }
                    }
                }
            },
            scales: {
                x: { ticks: { color: '#ffffff' } },
                y: {
                    ticks: { color: '#ffffff' },
                    grid: { color: '#2a3f55' }
                }
            }
        }
    });
}


// Players page - add favorite
async function addFavorite(playerId, playerName, team, position, height, weight) {
    try {
        const response = await fetch('/api/favorites', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ player_id: playerId, player_name: playerName, team, position, height, weight })
        });
        const data = await response.json();
        if (data.message === 'Player already in favorites') {
            alert(`${playerName} is already in your favorites!`);
        } else {
            alert(`${playerName} added to favorites!`);
            loadFavorites();
        }
    } catch (err) {
        console.error('Error adding favorite:', err);
    }
}


// Players page - load favorites
async function loadFavorites() {
    const favoritesList = document.getElementById('favoritesList');
    if (!favoritesList) return;

    try {
        const response = await fetch('/api/favorites');
        const data = await response.json();

        if (!data || data.length === 0) {
            favoritesList.innerHTML = '<p class="no-games">No favorites yet.</p>';
            return;
        }

        favoritesList.innerHTML = '';
        data.forEach(player => {
            const card = document.createElement('div');
            card.classList.add('player-card');
            card.innerHTML = `
                <div class="player-info">
                    <h3>${player.player_name}</h3>
                    <p>${player.team} | Position: ${player.position || 'N/A'} | Height: ${player.height || 'N/A'}</p>
                </div>
                <div class="player-buttons">
                    <button class="compare-btn" onclick="addToCompare(${player.player_id}, '${player.player_name}', '${player.height || '0-0'}', '${player.weight || '0'}')">
                        ⇄ Compare
                    </button>
                    <button class="favorite-btn" onclick="removeFavorite(${player.id}, '${player.player_name}')">
                        ✕ Remove
                    </button>
                </div>
            `;
            favoritesList.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading favorites:', err);
    }
}


// Players page - remove favorite
async function removeFavorite(id, playerName) {
    try {
        await fetch(`/api/favorites/${id}`, { method: 'DELETE' });
        alert(`${playerName} removed from favorites!`);
        loadFavorites();
    } catch (err) {
        console.error('Error removing favorite:', err);
    }
}


// Run on page load
window.onload = function () {
    loadGames();
    loadRecentGames();
    loadFavorites();

    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            if (this.value.trim() === '') {
                document.getElementById('playersGrid').innerHTML = '';
            }
        });
    }
};