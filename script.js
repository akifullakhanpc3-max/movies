/* ================= CONFIG ================= */

const CONFIG = {
    OMDB_API_KEY: 'b9b1f1ed',
    OMDB_BASE: 'https://www.omdbapi.com/',
    PLACEHOLDER_POSTER: 'https://via.placeholder.com/200x300'
};

/* ================= HELPERS ================= */

function escapeHtml(text) {
    if (text == null) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

function showLoading(container) {
    if (!container) return;
    container.innerHTML = '<p class="loading">Loading...</p>';
}

function showError(container, msg) {
    if (!container) return;
    container.innerHTML = `<p class="error">${escapeHtml(msg)}</p>`;
}

function getPoster(poster) {
    return poster && poster !== 'N/A' ? poster : CONFIG.PLACEHOLDER_POSTER;
}

function isApiKeyError(msg) {
    return msg && /invalid api key|api key/i.test(String(msg));
}

/* ================= EVENTS ================= */

const searchButton = document.getElementById('search-button');
const searchInput = document.getElementById('search-input');

if (searchButton) {
    searchButton.addEventListener('click', searchMovies);
}

if (searchInput) {
    searchInput.addEventListener('keypress', e => {
        if (e.key === 'Enter') searchMovies();
    });
}

window.addEventListener('load', loadHindiMovies);

/* ================= LOAD HINDI MOVIES ================= */

function loadHindiMovies() {
    const results = document.getElementById('results');
    showLoading(results);
    fetch(`${CONFIG.OMDB_BASE}?s=hindi&apikey=${CONFIG.OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response === 'True') {
                displayMovies(data.Search);
            } else {
                const msg = data.Error || 'No Hindi movies found.';
                if (isApiKeyError(msg)) {
                    showError(results, 'Invalid OMDb API key. Please configure a valid API key on the backend.');
                } else {
                    showError(results, msg);
                }
            }
        })
        .catch(() => showError(results, 'Failed to load Hindi movies.'));
}

/* ================= SEARCH ================= */

function searchMovies() {
    const results = document.getElementById('results');
    const query = searchInput ? searchInput.value.trim() : '';
    if (!query) return;
    showLoading(results);
    fetch(`${CONFIG.OMDB_BASE}?s=${encodeURIComponent(query)}&apikey=${CONFIG.OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response === 'True') {
                displayMovies(data.Search);
            } else {
                const msg = data.Error || 'No movies found.';
                if (isApiKeyError(msg)) {
                    showError(results, 'Invalid OMDb API key. Please configure a valid API key on the backend.');
                } else {
                    showError(results, msg);
                }
            }
        })
        .catch(() => showError(results, 'Search failed.'));
}

/* ================= DISPLAY MOVIES ================= */

function displayMovies(movies) {
    const results = document.getElementById('results');
    results.innerHTML = '';
    if (!movies || movies.length === 0) {
        showError(results, 'No movies found.');
        return;
    }
    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.addEventListener('click', () => openMovie(movie.imdbID));
        const poster = getPoster(movie.Poster);
        card.innerHTML = `
            <img src="${escapeHtml(poster)}" alt="${escapeHtml(movie.Title)}">
            <h3>${escapeHtml(movie.Title)}</h3>
            <p>${escapeHtml(movie.Year)}</p>
        `;
        results.appendChild(card);
    });
}

/* ================= NAVIGATION ================= */

function openMovie(imdbID) {
    window.location.href = `movie.html?imdb=${encodeURIComponent(imdbID)}`;
}
