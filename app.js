// Golfr Pro - Enhanced Fantasy Golf League Application
// Version 2.0 with Firebase, AI, Analytics, and Social Features

// ============================================================================
// CONFIGURATION & INITIALIZATION
// ============================================================================

const CONFIG = {
    DRAFT_TIMER_SECONDS: 90,
    SYNC_INTERVAL_MS: 2000,
    API_ENDPOINTS: {
        pga: 'https://site.api.espn.com/apis/site/v2/sports/golf/pga/scoreboard',
        owgr: 'https://www.owgr.com/api/ranking'
    },
    STORAGE_KEYS: {
        theme: 'golfr_theme',
        tournaments: 'golfr_tournaments',
        currentTournament: 'golfr_current',
        history: 'golfr_history',
        settings: 'golfr_settings'
    }
};

// Firebase Configuration (User should add their own config)
const firebaseConfig = {
    // Add your Firebase config here
    // For now, using localStorage as fallback
    enabled: false
};

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

class AppState {
    constructor() {
        this.tournament = null;
        this.currentTab = 'setup';
        this.draftTimer = null;
        this.syncTimer = null;
        this.theme = 'light';
        this.user = null;
    }

    loadFromStorage() {
        const theme = localStorage.getItem(CONFIG.STORAGE_KEYS.theme);
        if (theme) {
            this.theme = theme;
            document.documentElement.setAttribute('data-theme', theme);
        }

        const current = localStorage.getItem(CONFIG.STORAGE_KEYS.currentTournament);
        if (current) {
            this.tournament = JSON.parse(current);
        }
    }

    saveTournament() {
        if (this.tournament) {
            localStorage.setItem(CONFIG.STORAGE_KEYS.currentTournament, JSON.stringify(this.tournament));
            
            // Save to history
            const history = this.getHistory();
            const existing = history.findIndex(t => t.id === this.tournament.id);
            if (existing >= 0) {
                history[existing] = this.tournament;
            } else {
                history.push(this.tournament);
            }
            localStorage.setItem(CONFIG.STORAGE_KEYS.history, JSON.stringify(history));
        }
    }

    getHistory() {
        const history = localStorage.getItem(CONFIG.STORAGE_KEYS.history);
        return history ? JSON.parse(history) : [];
    }
}

const appState = new AppState();

// ============================================================================
// PGA DATA SERVICE
// ============================================================================

class PGADataService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    async fetchTournaments() {
        // Mock 2026 PGA Tour Schedule
        return [
            { id: 'sentry2026', name: 'The Sentry', date: 'Jan 2-5, 2026', venue: 'Kapalua, HI' },
            { id: 'sony2026', name: 'Sony Open', date: 'Jan 9-12, 2026', venue: 'Honolulu, HI' },
            { id: 'amex2026', name: 'The American Express', date: 'Jan 16-19, 2026', venue: 'La Quinta, CA' },
            { id: 'farmers2026', name: 'Farmers Insurance Open', date: 'Jan 23-26, 2026', venue: 'San Diego, CA' },
            { id: 'waste2026', name: 'WM Phoenix Open', date: 'Feb 6-9, 2026', venue: 'Scottsdale, AZ' },
            { id: 'pebble2026', name: 'AT&T Pebble Beach', date: 'Feb 13-16, 2026', venue: 'Pebble Beach, CA' },
            { id: 'genesis2026', name: 'Genesis Invitational', date: 'Feb 20-23, 2026', venue: 'Los Angeles, CA' },
            { id: 'honda2026', name: 'The Honda Classic', date: 'Feb 27-Mar 2, 2026', venue: 'Palm Beach, FL' },
            { id: 'players2026', name: 'THE PLAYERS Championship', date: 'Mar 12-15, 2026', venue: 'Ponte Vedra, FL' },
            { id: 'valspar2026', name: 'Valspar Championship', date: 'Mar 19-22, 2026', venue: 'Palm Harbor, FL' },
            { id: 'matchplay2026', name: 'WGC-Dell Match Play', date: 'Mar 26-29, 2026', venue: 'Austin, TX' },
            { id: 'masters2026', name: 'The Masters', date: 'Apr 9-12, 2026', venue: 'Augusta, GA', major: true },
            { id: 'rbc2026', name: 'RBC Heritage', date: 'Apr 16-19, 2026', venue: 'Hilton Head, SC' },
            { id: 'wells2026', name: 'Wells Fargo Championship', date: 'May 7-10, 2026', venue: 'Charlotte, NC' },
            { id: 'pga2026', name: 'PGA Championship', date: 'May 14-17, 2026', venue: 'TBD', major: true },
            { id: 'memorial2026', name: 'Memorial Tournament', date: 'Jun 4-7, 2026', venue: 'Dublin, OH' },
            { id: 'usopen2026', name: 'U.S. Open', date: 'Jun 18-21, 2026', venue: 'TBD', major: true },
            { id: 'travelers2026', name: 'Travelers Championship', date: 'Jun 25-28, 2026', venue: 'Cromwell, CT' },
            { id: 'open2026', name: 'The Open Championship', date: 'Jul 16-19, 2026', venue: 'TBD', major: true },
            { id: 'fedex1_2026', name: 'FedEx St. Jude Championship', date: 'Aug 13-16, 2026', venue: 'Memphis, TN' },
            { id: 'fedex2_2026', name: 'BMW Championship', date: 'Aug 20-23, 2026', venue: 'TBD' },
            { id: 'tour2026', name: 'Tour Championship', date: 'Aug 28-31, 2026', venue: 'Atlanta, GA' }
        ];
    }

    async fetchGolferRankings() {
        // Mock top 100 golfers with realistic stats
        const golfers = [];
        const firstNames = ['Scottie', 'Rory', 'Jon', 'Viktor', 'Xander', 'Collin', 'Patrick', 'Wyndham', 'Max', 'Tony', 
                           'Jordan', 'Tommy', 'Justin', 'Brooks', 'Sam', 'Hideki', 'Cameron', 'Tyrrell', 'Matt', 'Jason',
                           'Dustin', 'Bryson', 'Shane', 'Rickie', 'Webb', 'Gary', 'Adam', 'Si Woo', 'Russell', 'Sungjae'];
        const lastNames = ['Scheffler', 'McIlroy', 'Rahm', 'Hovland', 'Schauffele', 'Morikawa', 'Cantlay', 'Clark', 'Homa', 'Finau',
                          'Spieth', 'Fleetwood', 'Thomas', 'Koepka', 'Burns', 'Matsuyama', 'Smith', 'Hatton', 'Fitzpatrick', 'Day',
                          'Johnson', 'DeChambeau', 'Lowry', 'Fowler', 'Simpson', 'Woodland', 'Scott', 'Kim', 'Henley', 'Im'];
        
        for (let i = 0; i < 100; i++) {
            const firstName = firstNames[i % firstNames.length];
            const lastName = lastNames[i % lastNames.length];
            const adjustedIndex = i < lastNames.length ? i : (i % lastNames.length) + Math.floor(i / lastNames.length) * 100;
            
            golfers.push({
                id: `golfer_${i + 1}`,
                rank: i + 1,
                name: `${firstName} ${lastName} ${i >= lastNames.length ? 'Jr.' : ''}`.trim(),
                country: ['USA', 'NIR', 'ESP', 'NOR', 'AUS', 'ENG', 'JPN', 'KOR'][i % 8],
                avgScore: (68 + Math.random() * 4).toFixed(2),
                drivingDist: (280 + Math.random() * 40).toFixed(0),
                greensInReg: (60 + Math.random() * 20).toFixed(1),
                putting: (1.70 + Math.random() * 0.2).toFixed(2),
                recentForm: Math.random() > 0.5 ? '📈' : '📉',
                odds: `${(5 + i * 2)}:1`,
                veteran: i > 50
            });
        }
        
        return golfers;
    }

    async fetchLiveScores(tournamentId) {
        // Mock live scores - in production, fetch from ESPN API
        const scores = {};
        const golfers = await this.fetchGolferRankings();
        
        golfers.forEach(golfer => {
            scores[golfer.id] = {
                today: Math.floor(Math.random() * 9) - 4, // -4 to +4
                total: Math.floor(Math.random() * 17) - 8, // -8 to +8
                thru: Math.floor(Math.random() * 18) + 1,
                round: Math.floor(Math.random() * 4) + 1
            };
        });
        
        return scores;
    }
}

const pgaData = new PGADataService();

// ============================================================================
// AI ASSISTANT
// ============================================================================

class AIAssistant {
    constructor() {
        this.model = 'claude-sonnet-4-20250514';
    }

    async getDraftSuggestions(availableGolfers, currentPick, playerTeam, scoringMode) {
        // AI-powered draft recommendations
        const topRanked = availableGolfers
            .filter(g => !g.picked)
            .sort((a, b) => a.rank - b.rank)
            .slice(0, 5);

        const suggestions = [];
        
        // Best available by rank
        if (topRanked.length > 0) {
            suggestions.push({
                type: 'best_available',
                golfer: topRanked[0],
                reason: `#${topRanked[0].rank} ranked player available - consistent performer`
            });
        }

        // Value pick (good rank but might be overlooked)
        const valuePick = availableGolfers
            .filter(g => !g.picked && g.rank >= 15 && g.rank <= 30)
            .sort((a, b) => parseFloat(a.avgScore) - parseFloat(b.avgScore))[0];
        
        if (valuePick) {
            suggestions.push({
                type: 'value',
                golfer: valuePick,
                reason: `Strong average score (${valuePick.avgScore}) at good value`
            });
        }

        // Hot hand (recent form)
        const hotPick = availableGolfers
            .filter(g => !g.picked && g.recentForm === '📈')
            .sort((a, b) => a.rank - b.rank)[0];
        
        if (hotPick) {
            suggestions.push({
                type: 'hot_hand',
                golfer: hotPick,
                reason: 'Trending up with strong recent performances'
            });
        }

        return suggestions;
    }

    async predictWinner(teams, liveScores) {
        // AI prediction based on current scores and player performance
        const predictions = teams.map(team => {
            let projectedScore = 0;
            let confidence = 0;
            
            team.golfers.forEach(golferId => {
                const score = liveScores[golferId];
                if (score) {
                    projectedScore += score.total;
                    confidence += 0.1;
                }
            });
            
            return {
                player: team.player,
                projectedScore,
                confidence: Math.min(confidence, 1.0),
                winProbability: Math.random() // Mock probability
            };
        });
        
        predictions.sort((a, b) => a.projectedScore - b.projectedScore);
        return predictions;
    }
}

const aiAssistant = new AIAssistant();

// ============================================================================
// ANALYTICS SERVICE
// ============================================================================

class AnalyticsService {
    constructor() {
        this.stats = this.loadStats();
    }

    loadStats() {
        const history = appState.getHistory();
        return {
            totalTournaments: history.length,
            wins: history.filter(t => t.winner === 'You').length,
            avgFinish: this.calculateAvgFinish(history),
            bestScore: this.findBestScore(history),
            topGolfers: this.getTopGolfers(history),
            performanceByMonth: this.getPerformanceByMonth(history)
        };
    }

    calculateAvgFinish(history) {
        if (history.length === 0) return 0;
        const sum = history.reduce((acc, t) => acc + (t.yourRank || 0), 0);
        return (sum / history.length).toFixed(1);
    }

    findBestScore(history) {
        if (history.length === 0) return null;
        return Math.min(...history.map(t => t.yourScore || 0));
    }

    getTopGolfers(history) {
        const golferCounts = {};
        history.forEach(tournament => {
            if (tournament.yourTeam) {
                tournament.yourTeam.forEach(golfer => {
                    golferCounts[golfer] = (golferCounts[golfer] || 0) + 1;
                });
            }
        });
        
        return Object.entries(golferCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }

    getPerformanceByMonth(history) {
        const byMonth = {};
        history.forEach(t => {
            const month = new Date(t.date).toLocaleString('default', { month: 'short' });
            if (!byMonth[month]) byMonth[month] = [];
            byMonth[month].push(t.yourScore || 0);
        });
        return byMonth;
    }

    trackEvent(eventName, data) {
        console.log('Analytics Event:', eventName, data);
        // In production: send to analytics service
    }
}

const analytics = new AnalyticsService();

// ============================================================================
// UI CONTROLLER
// ============================================================================

class UIController {
    constructor() {
        this.initializeEventListeners();
        this.loadInitialData();
    }

    initializeEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());

        // Tab navigation
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Tournament selection
        document.getElementById('tournamentSelect').addEventListener('change', (e) => this.selectTournament(e.target.value));

        // Setup form
        document.getElementById('numPlayers').addEventListener('input', (e) => this.updatePlayerInputs(e.target.value));
        document.getElementById('startDraftBtn').addEventListener('click', () => this.startDraft());

        // Draft controls
        document.getElementById('golferSearch').addEventListener('input', (e) => this.filterGolfers(e.target.value));

        // Chat
        document.getElementById('sendChatBtn').addEventListener('click', () => this.sendChatMessage());
        document.getElementById('chatInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendChatMessage();
        });

        // Leaderboard
        document.getElementById('refreshScoresBtn').addEventListener('click', () => this.refreshScores());

        // PWA Install
        this.setupPWAInstall();
    }

    async loadInitialData() {
        appState.loadFromStorage();
        
        // Load tournaments
        const tournaments = await pgaData.fetchTournaments();
        const select = document.getElementById('tournamentSelect');
        tournaments.forEach(t => {
            const option = document.createElement('option');
            option.value = t.id;
            option.textContent = `${t.name} - ${t.date}${t.major ? ' 🏆 MAJOR' : ''}`;
            select.appendChild(option);
        });

        // Load golfers
        this.golfers = await pgaData.fetchGolferRankings();
        
        // Initialize player inputs
        this.updatePlayerInputs(4);

        // Show notification
        this.showNotification('Welcome to Golfr Pro! 🏌️', 'success');
    }

    toggleTheme() {
        appState.theme = appState.theme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', appState.theme);
        localStorage.setItem(CONFIG.STORAGE_KEYS.theme, appState.theme);
        
        const icon = document.getElementById('themeIcon');
        icon.textContent = appState.theme === 'light' ? '🌙' : '☀️';
        
        analytics.trackEvent('theme_toggle', { theme: appState.theme });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Show corresponding content
        document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
        document.getElementById(tabName).classList.add('active');

        appState.currentTab = tabName;
        analytics.trackEvent('tab_switch', { tab: tabName });

        // Load tab-specific content
        if (tabName === 'analytics') {
            this.renderAnalytics();
        } else if (tabName === 'history') {
            this.renderHistory();
        }
    }

    updatePlayerInputs(numPlayers) {
        const container = document.getElementById('playersInputContainer');
        container.innerHTML = '';
        
        for (let i = 0; i < numPlayers; i++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'form-input';
            input.placeholder = `Player ${i + 1} Name`;
            input.id = `player${i + 1}Name`;
            container.appendChild(input);
        }
    }

    async startDraft() {
        const tournamentName = document.getElementById('tournamentName').value;
        const numPlayers = parseInt(document.getElementById('numPlayers').value);
        const scoringMode = document.querySelector('input[name="scoringMode"]:checked').value;
        
        // Get player names
        const players = [];
        for (let i = 0; i < numPlayers; i++) {
            const name = document.getElementById(`player${i + 1}Name`).value || `Player ${i + 1}`;
            players.push(name);
        }

        // Create tournament
        appState.tournament = {
            id: Date.now().toString(),
            name: tournamentName || 'Unnamed Tournament',
            scoringMode,
            players,
            currentPick: 0,
            picks: {},
            started: Date.now()
        };

        // Initialize picks for each player
        players.forEach(player => {
            appState.tournament.picks[player] = [];
        });

        appState.saveTournament();
        
        // Switch to draft tab
        this.switchTab('draft');
        this.setupDraft();
        
        analytics.trackEvent('draft_started', {
            numPlayers,
            scoringMode
        });
    }

    setupDraft() {
        if (!appState.tournament) return;

        const { players, currentPick } = appState.tournament;
        
        // Render draft order
        this.renderDraftOrder();
        
        // Render available golfers
        this.renderGolferGrid();
        
        // Start draft timer
        this.startDraftTimer();
        
        // Get AI suggestions
        this.updateAISuggestions();
    }

    renderDraftOrder() {
        const container = document.getElementById('draftOrderList');
        const { players, currentPick } = appState.tournament;
        
        container.innerHTML = players.map((player, index) => {
            const picks = appState.tournament.picks[player].length;
            const isActive = index === (currentPick % players.length);
            
            return `
                <div class="player-item ${isActive ? 'active' : ''}">
                    <div style="font-weight: 600;">${player}</div>
                    <div style="font-size: 0.85rem; color: var(--text-secondary);">
                        ${picks}/7 picks
                    </div>
                </div>
            `;
        }).join('');
        
        // Update current picker
        const currentPlayer = players[currentPick % players.length];
        document.getElementById('currentPicker').textContent = currentPlayer;
    }

    renderGolferGrid() {
        const container = document.getElementById('golferGrid');
        const pickedGolfers = new Set();
        
        Object.values(appState.tournament.picks).forEach(picks => {
            picks.forEach(golferId => pickedGolfers.add(golferId));
        });
        
        container.innerHTML = this.golfers.map(golfer => {
            const isPicked = pickedGolfers.has(golfer.id);
            
            return `
                <div class="golfer-card ${isPicked ? 'picked' : ''}" 
                     data-golfer-id="${golfer.id}"
                     onclick="ui.selectGolfer('${golfer.id}')">
                    <div class="golfer-header">
                        <div class="golfer-name">${golfer.name}</div>
                        <div class="golfer-rank">#${golfer.rank}</div>
                    </div>
                    <div class="golfer-stats">
                        <div class="stat-item">
                            <span class="stat-label">Avg Score:</span>
                            <span class="stat-value">${golfer.avgScore}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Form:</span>
                            <span class="stat-value">${golfer.recentForm}</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">Drive:</span>
                            <span class="stat-value">${golfer.drivingDist}y</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-label">GIR:</span>
                            <span class="stat-value">${golfer.greensInReg}%</span>
                        </div>
                    </div>
                    ${isPicked ? '<div style="margin-top: 0.5rem; color: var(--error); font-weight: 600; font-size: 0.85rem;">✓ Drafted</div>' : ''}
                </div>
            `;
        }).join('');
    }

    selectGolfer(golferId) {
        const { players, currentPick, picks } = appState.tournament;
        const currentPlayer = players[currentPick % players.length];
        
        // Check if golfer is already picked
        const isPicked = Object.values(picks).some(playerPicks => 
            playerPicks.includes(golferId)
        );
        
        if (isPicked) {
            this.showNotification('This golfer has already been drafted!', 'error');
            return;
        }
        
        // Check if player has room
        if (picks[currentPlayer].length >= 7) {
            this.showNotification('Team is full!', 'error');
            return;
        }
        
        // Add pick
        picks[currentPlayer].push(golferId);
        appState.tournament.currentPick++;
        appState.saveTournament();
        
        const golfer = this.golfers.find(g => g.id === golferId);
        this.showNotification(`${currentPlayer} selected ${golfer.name}!`, 'success');
        
        // Update UI
        this.renderDraftOrder();
        this.renderGolferGrid();
        this.resetDraftTimer();
        this.updateAISuggestions();
        
        analytics.trackEvent('golfer_picked', {
            golfer: golfer.name,
            rank: golfer.rank,
            pick: currentPick + 1
        });
    }

    startDraftTimer() {
        let timeLeft = CONFIG.DRAFT_TIMER_SECONDS;
        
        const updateTimer = () => {
            const minutes = Math.floor(timeLeft / 60);
            const seconds = timeLeft % 60;
            document.getElementById('timerDisplay').textContent = 
                `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            timeLeft--;
            
            if (timeLeft < 0) {
                this.showNotification('Time expired! Auto-selecting...', 'warning');
                this.autoSelect();
            }
        };
        
        updateTimer();
        appState.draftTimer = setInterval(updateTimer, 1000);
    }

    resetDraftTimer() {
        if (appState.draftTimer) {
            clearInterval(appState.draftTimer);
        }
        this.startDraftTimer();
    }

    autoSelect() {
        // Auto-select best available golfer
        const available = this.golfers.filter(g => {
            return !Object.values(appState.tournament.picks).some(picks => 
                picks.includes(g.id)
            );
        });
        
        if (available.length > 0) {
            this.selectGolfer(available[0].id);
        }
    }

    async updateAISuggestions() {
        const { players, currentPick, picks } = appState.tournament;
        const currentPlayer = players[currentPick % players.length];
        const playerTeam = picks[currentPlayer];
        
        const suggestions = await aiAssistant.getDraftSuggestions(
            this.golfers,
            currentPick,
            playerTeam,
            appState.tournament.scoringMode
        );
        
        const container = document.getElementById('aiSuggestions');
        container.innerHTML = suggestions.map(s => `
            <div class="ai-suggestion">
                <div style="font-weight: 700; margin-bottom: 0.5rem;">
                    ${s.type === 'best_available' ? '🎯 Best Available' : 
                      s.type === 'value' ? '💎 Value Pick' : '🔥 Hot Hand'}
                </div>
                <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem;">
                    ${s.golfer.name} (#${s.golfer.rank})
                </div>
                <div style="font-size: 0.9rem; opacity: 0.9;">
                    ${s.reason}
                </div>
            </div>
        `).join('');
    }

    filterGolfers(searchTerm) {
        const cards = document.querySelectorAll('.golfer-card');
        const term = searchTerm.toLowerCase();
        
        cards.forEach(card => {
            const name = card.querySelector('.golfer-name').textContent.toLowerCase();
            card.style.display = name.includes(term) ? 'block' : 'none';
        });
    }

    async refreshScores() {
        if (!appState.tournament) {
            this.showNotification('No active tournament', 'error');
            return;
        }
        
        document.getElementById('refreshScoresBtn').innerHTML = 
            '<span class="loading"><span class="spinner"></span> Updating...</span>';
        
        const scores = await pgaData.fetchLiveScores(appState.tournament.id);
        
        // Calculate team scores
        const teamScores = Object.entries(appState.tournament.picks).map(([player, golfers]) => {
            let totalScore = 0;
            let todayScore = 0;
            
            golfers.forEach(golferId => {
                if (scores[golferId]) {
                    totalScore += scores[golferId].total;
                    todayScore += scores[golferId].today;
                }
            });
            
            return { player, totalScore, todayScore, golfers };
        });
        
        teamScores.sort((a, b) => a.totalScore - b.totalScore);
        
        // Render leaderboard
        const tbody = document.getElementById('leaderboardBody');
        tbody.innerHTML = teamScores.map((team, index) => {
            const scoreClass = team.totalScore < 0 ? 'score-negative' : 
                              team.totalScore > 0 ? 'score-positive' : 'score-even';
            const rankClass = index === 0 ? 'rank-1' : index === 1 ? 'rank-2' : index === 2 ? 'rank-3' : '';
            
            return `
                <tr>
                    <td class="rank-cell ${rankClass}">${index + 1}</td>
                    <td class="player-name-cell">${team.player}</td>
                    <td class="score-cell ${scoreClass}">${team.totalScore > 0 ? '+' : ''}${team.totalScore}</td>
                    <td>${team.golfers.length} golfers</td>
                    <td class="${team.todayScore < 0 ? 'score-negative' : 'score-positive'}">
                        ${team.todayScore > 0 ? '+' : ''}${team.todayScore}
                    </td>
                </tr>
            `;
        }).join('');
        
        document.getElementById('refreshScoresBtn').innerHTML = '🔄 Refresh Scores';
        this.showNotification('Scores updated!', 'success');
    }

    renderAnalytics() {
        const stats = analytics.stats;
        
        document.getElementById('statsTotal').textContent = stats.totalTournaments;
        document.getElementById('statsWins').textContent = stats.wins;
        document.getElementById('statsAvgFinish').textContent = stats.avgFinish || '-';
        document.getElementById('statsBestScore').textContent = stats.bestScore || '-';
        
        // In production: render charts using Chart.js
        this.showNotification('Analytics loaded', 'info');
    }

    renderHistory() {
        const history = appState.getHistory();
        const container = document.getElementById('historyList');
        
        if (history.length === 0) {
            container.innerHTML = '<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No tournament history yet.</p>';
            return;
        }
        
        container.innerHTML = history.map(t => `
            <div class="card" style="margin-bottom: 1rem;">
                <h3 style="margin-bottom: 0.5rem;">${t.name}</h3>
                <p style="color: var(--text-secondary); font-size: 0.9rem;">
                    ${new Date(t.started).toLocaleDateString()} • ${t.players.length} players
                </p>
            </div>
        `).join('');
    }

    sendChatMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        const messagesContainer = document.getElementById('chatMessages');
        const messageEl = document.createElement('div');
        messageEl.className = 'chat-message';
        messageEl.innerHTML = `
            <div class="chat-author">You</div>
            <div class="chat-text">${message}</div>
        `;
        
        messagesContainer.appendChild(messageEl);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        input.value = '';
        
        analytics.trackEvent('chat_message_sent', { length: message.length });
    }

    setupPWAInstall() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            document.getElementById('installPrompt').classList.add('show');
        });
        
        document.getElementById('installBtn').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                
                analytics.trackEvent('pwa_install', { outcome });
                
                document.getElementById('installPrompt').classList.remove('show');
                deferredPrompt = null;
            }
        });
        
        document.getElementById('dismissInstallBtn').addEventListener('click', () => {
            document.getElementById('installPrompt').classList.remove('show');
        });
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.borderLeftColor = type === 'success' ? 'var(--success)' : 
                                            type === 'error' ? 'var(--error)' : 
                                            type === 'warning' ? 'var(--warning)' : 'var(--info)';
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    selectTournament(tournamentId) {
        if (!tournamentId) return;
        
        analytics.trackEvent('tournament_selected', { tournamentId });
        this.showNotification('Tournament selected!', 'success');
    }
}

// ============================================================================
// INITIALIZE APPLICATION
// ============================================================================

const ui = new UIController();

// Export for global access
window.ui = ui;
window.appState = appState;
window.analytics = analytics;

console.log('🏌️ Golfr Pro v2.0 initialized!');
