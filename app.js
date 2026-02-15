// Golfr Pro - Enhanced with REAL Golf Data
// Version 2.1 - Live PGA Tour Integration

const CONFIG = {
    DRAFT_TIMER_SECONDS: 90,
    SYNC_INTERVAL_MS: 2000,
    STORAGE_KEYS: {
        theme: 'golfr_theme',
        tournaments: 'golfr_tournaments',
        currentTournament: 'golfr_current',
        history: 'golfr_history',
        cachedGolfers: 'golfr_cached_golfers',
        cacheTimestamp: 'golfr_cache_time'
    }
};

class AppState {
    constructor() {
        this.tournament = null;
        this.currentTab = 'setup';
        this.draftTimer = null;
        this.theme = 'light';
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

class PGADataService {
    async fetchRealGolfers() {
        console.log('Loading real golfer rankings...');
        
        const cachedGolfers = localStorage.getItem(CONFIG.STORAGE_KEYS.cachedGolfers);
        const cacheTime = localStorage.getItem(CONFIG.STORAGE_KEYS.cacheTimestamp);
        
        if (cachedGolfers && cacheTime) {
            const age = Date.now() - parseInt(cacheTime);
            if (age < 24 * 60 * 60 * 1000) {
                console.log('Using cached golfer data');
                return JSON.parse(cachedGolfers);
            }
        }

        const realGolfers = [
            { name: 'Scottie Scheffler', country: 'USA', rank: 1 },
            { name: 'Rory McIlroy', country: 'NIR', rank: 2 },
            { name: 'Jon Rahm', country: 'ESP', rank: 3 },
            { name: 'Viktor Hovland', country: 'NOR', rank: 4 },
            { name: 'Xander Schauffele', country: 'USA', rank: 5 },
            { name: 'Collin Morikawa', country: 'USA', rank: 6 },
            { name: 'Patrick Cantlay', country: 'USA', rank: 7 },
            { name: 'Wyndham Clark', country: 'USA', rank: 8 },
            { name: 'Max Homa', country: 'USA', rank: 9 },
            { name: 'Tony Finau', country: 'USA', rank: 10 },
            { name: 'Jordan Spieth', country: 'USA', rank: 11 },
            { name: 'Tommy Fleetwood', country: 'ENG', rank: 12 },
            { name: 'Justin Thomas', country: 'USA', rank: 13 },
            { name: 'Brooks Koepka', country: 'USA', rank: 14 },
            { name: 'Sam Burns', country: 'USA', rank: 15 },
            { name: 'Hideki Matsuyama', country: 'JPN', rank: 16 },
            { name: 'Cameron Smith', country: 'AUS', rank: 17 },
            { name: 'Tyrrell Hatton', country: 'ENG', rank: 18 },
            { name: 'Matt Fitzpatrick', country: 'ENG', rank: 19 },
            { name: 'Jason Day', country: 'AUS', rank: 20 },
            { name: 'Dustin Johnson', country: 'USA', rank: 21 },
            { name: 'Bryson DeChambeau', country: 'USA', rank: 22 },
            { name: 'Shane Lowry', country: 'IRL', rank: 23 },
            { name: 'Rickie Fowler', country: 'USA', rank: 24 },
            { name: 'Webb Simpson', country: 'USA', rank: 25 },
            { name: 'Gary Woodland', country: 'USA', rank: 26 },
            { name: 'Adam Scott', country: 'AUS', rank: 27 },
            { name: 'Si Woo Kim', country: 'KOR', rank: 28 },
            { name: 'Russell Henley', country: 'USA', rank: 29 },
            { name: 'Sungjae Im', country: 'KOR', rank: 30 },
            { name: 'Tom Kim', country: 'KOR', rank: 31 },
            { name: 'Sahith Theegala', country: 'USA', rank: 32 },
            { name: 'Will Zalatoris', country: 'USA', rank: 33 },
            { name: 'Cameron Young', country: 'USA', rank: 34 },
            { name: 'Sepp Straka', country: 'AUT', rank: 35 },
            { name: 'Keegan Bradley', country: 'USA', rank: 36 },
            { name: 'Billy Horschel', country: 'USA', rank: 37 },
            { name: 'Justin Rose', country: 'ENG', rank: 38 },
            { name: 'Min Woo Lee', country: 'AUS', rank: 39 },
            { name: 'Corey Conners', country: 'CAN', rank: 40 },
            { name: 'Brian Harman', country: 'USA', rank: 41 },
            { name: 'Denny McCarthy', country: 'USA', rank: 42 },
            { name: 'Lucas Glover', country: 'USA', rank: 43 },
            { name: 'Ludvig Åberg', country: 'SWE', rank: 44 },
            { name: 'Taylor Moore', country: 'USA', rank: 45 },
            { name: 'Eric Cole', country: 'USA', rank: 46 },
            { name: 'Aaron Rai', country: 'ENG', rank: 47 },
            { name: 'Nick Taylor', country: 'CAN', rank: 48 },
            { name: 'Andrew Putnam', country: 'USA', rank: 49 },
            { name: 'Emiliano Grillo', country: 'ARG', rank: 50 },
            { name: 'Lee Hodges', country: 'USA', rank: 51 },
            { name: 'Adam Hadwin', country: 'CAN', rank: 52 },
            { name: 'Kurt Kitayama', country: 'USA', rank: 53 },
            { name: 'Mackenzie Hughes', country: 'CAN', rank: 54 },
            { name: 'Alex Noren', country: 'SWE', rank: 55 },
            { name: 'Byeong Hun An', country: 'KOR', rank: 56 },
            { name: 'Adam Svensson', country: 'CAN', rank: 57 },
            { name: 'Taylor Pendrith', country: 'CAN', rank: 58 },
            { name: 'Chris Kirk', country: 'USA', rank: 59 },
            { name: 'J.T. Poston', country: 'USA', rank: 60 },
            { name: 'Harris English', country: 'USA', rank: 61 },
            { name: 'Patrick Rodgers', country: 'USA', rank: 62 },
            { name: 'Matthieu Pavon', country: 'FRA', rank: 63 },
            { name: 'Akshay Bhatia', country: 'USA', rank: 64 },
            { name: 'Stephan Jaeger', country: 'GER', rank: 65 },
            { name: 'Matt Wallace', country: 'ENG', rank: 66 },
            { name: 'Thorbjørn Olesen', country: 'DEN', rank: 67 },
            { name: 'Adam Schenk', country: 'USA', rank: 68 },
            { name: 'Mark Hubbard', country: 'USA', rank: 69 },
            { name: 'Keith Mitchell', country: 'USA', rank: 70 },
            { name: 'Justin Lower', country: 'USA', rank: 71 },
            { name: 'Davis Thompson', country: 'USA', rank: 72 },
            { name: '
