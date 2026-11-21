/* ================= CONFIG ================= */

const CONFIG = {
    OMDB_API_KEY: 'b9b1f1ed',
    OMDB_BASE: 'https://www.omdbapi.com/',
    PLACEHOLDER_POSTER: 'https://via.placeholder.com/300x450',
    VIDSRC_BASE: 'https://vidsrc.mov/embed',
    PROVIDER: {
        name: 'vidsrc',
        authorized: true,
        supportsAudio: false,
        supportsQuality: false
    }
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

/* ================= URL PARAM ================= */

const params = new URLSearchParams(window.location.search);
const imdbID = params.get('imdb');

/* ================= STATE ================= */

let currentType = 'movie'; // movie | series
let currentSeason = null;
let currentEpisode = null;
let currentServer = 1;

/* ================= INIT ================= */

const audioControls = document.getElementById('audio-controls');
if (audioControls) {
    audioControls.style.display = CONFIG.PROVIDER.supportsAudio ? 'flex' : 'none';
}

if (!imdbID) {
    document.body.innerHTML = '<h2 style="padding:40px">Content not found</h2>';
} else {
    loadDetails(imdbID);
}

/* ================= LOAD DETAILS ================= */

function loadDetails(id) {
    const container = document.getElementById('movie-details');
    showLoading(container);

    fetch(`${CONFIG.OMDB_BASE}?i=${encodeURIComponent(id)}&apikey=${CONFIG.OMDB_API_KEY}`)
        .then(res => {
            if (!res.ok) throw new Error('API request failed');
            return res.json();
        })
        .then(data => {
            if (data.Response !== 'True') {
                const msg = data.Error || 'Content not found.';
                if (isApiKeyError(msg)) {
                    showError(container, 'Invalid OMDb API key. Please configure a valid API key on the backend.');
                } else {
                    showError(container, msg);
                }
                return;
            }

            currentType = data.Type === 'series' ? 'series' : 'movie';
            const totalSeasons = data.Type === 'series'
                ? parseInt(data.totalSeasons, 10) || 0
                : 0;

            renderDetails(data);

            if (currentType === 'series') {
                setupSeries(id, totalSeasons);
            } else {
                loadMoviePlayer(id);
            }

            loadSuggestions(data.Genre || '');
        })
        .catch(err => {
            showError(container, 'Failed to load movie details. Please try again later.');
            console.error(err);
        });
}

function renderDetails(data) {
    const container = document.getElementById('movie-details');
    const poster = getPoster(data.Poster);

    container.innerHTML = `
        <img src="${escapeHtml(poster)}" alt="${escapeHtml(data.Title)} poster">
        <div class="movie-info">
            <h1>${escapeHtml(data.Title)} (${escapeHtml(data.Year)})</h1>
            <span class="rating">⭐ ${escapeHtml(data.imdbRating === 'N/A' ? 'N/A' : data.imdbRating)}</span>
            <p><b>Type:</b> ${escapeHtml(data.Type === 'N/A' ? 'N/A' : data.Type)}</p>
            <p><b>Released:</b> ${escapeHtml(data.Released === 'N/A' ? 'N/A' : data.Released)}</p>
            <p><b>Runtime:</b> ${escapeHtml(data.Runtime === 'N/A' ? 'N/A' : data.Runtime)}</p>
            <p><b>Language:</b> ${escapeHtml(data.Language === 'N/A' ? 'N/A' : data.Language)}</p>
            <p><b>Genre:</b> ${escapeHtml(data.Genre === 'N/A' ? 'N/A' : data.Genre)}</p>
            <p><b>Director:</b> ${escapeHtml(data.Director === 'N/A' ? 'N/A' : data.Director)}</p>
            <p><b>Cast:</b> ${escapeHtml(data.Actors === 'N/A' ? 'N/A' : data.Actors)}</p>
            <p><b>Plot:</b> ${escapeHtml(data.Plot === 'N/A' ? 'No plot available.' : data.Plot)}</p>
        </div>
    `;
}

/* ================= PLAYER ================= */

function buildPlayerUrl(type, id, season, episode) {
    if (!CONFIG.PROVIDER.authorized) {
        return null;
    }
    if (type === 'series' && season && episode) {
        return `${CONFIG.VIDSRC_BASE}/tv/${id}/${season}/${episode}`;
    }
    return `${CONFIG.VIDSRC_BASE}/movie/${id}`;
}

function loadMoviePlayer(id) {
    const url = buildPlayerUrl('movie', id);
    if (!url) return;
    document.getElementById('player-frame').src = url;
}

/* ================= SERIES ================= */

function setupSeries(imdbID, totalSeasons) {
    const seriesControls = document.getElementById('series-controls');
    const seasonSelect = document.getElementById('seasonSelect');
    seriesControls.style.display = 'flex';
    seasonSelect.innerHTML = '<option value="">Select Season</option>';

    for (let i = 1; i <= totalSeasons; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = `Season ${i}`;
        seasonSelect.appendChild(option);
    }
}

function loadEpisodes() {
    currentSeason = document.getElementById('seasonSelect').value;
    currentEpisode = null;
    const episodeSelect = document.getElementById('episodeSelect');
    episodeSelect.innerHTML = '<option value="">Select Episode</option>';

    if (!currentSeason) return;

    fetch(`${CONFIG.OMDB_BASE}?i=${encodeURIComponent(imdbID)}&Season=${encodeURIComponent(currentSeason)}&apikey=${CONFIG.OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response !== 'True' || !data.Episodes) return;
            data.Episodes.forEach(ep => {
                const option = document.createElement('option');
                option.value = ep.Episode;
                option.textContent = `Ep ${ep.Episode} - ${escapeHtml(ep.Title)}`;
                episodeSelect.appendChild(option);
            });
        })
        .catch(() => {});
}

function playEpisode() {
    currentEpisode = document.getElementById('episodeSelect').value;
    if (!currentSeason || !currentEpisode) return;
    reloadPlayer();
}

/* ================= PLAY ================= */

function playMovie() {
    document.querySelector('.player-wrapper').classList.add('playing');
    reloadPlayer();
}

/* ================= AUDIO (SERVER SWITCH) ================= */

function changeAudio(serverNumber) {
    if (!CONFIG.PROVIDER.supportsAudio) return;
    if (!serverNumber) return;
    currentServer = serverNumber;
    reloadPlayer();
}

/* ================= RELOAD PLAYER ================= */

function reloadPlayer() {
    const frame = document.getElementById('player-frame');
    const url = buildPlayerUrl(currentType, imdbID, currentSeason, currentEpisode);
    if (!url) {
        frame.src = '';
        return;
    }
    frame.src = url;
    document.querySelector('.player-wrapper').classList.add('playing');
}

/* ================= SUGGESTIONS ================= */

function loadSuggestions(genre) {
    const box = document.getElementById('suggestions');
    const keyword = genre.split(',')[0].trim();

    if (!keyword || keyword === 'N/A') {
        box.innerHTML = '';
        return;
    }

    box.innerHTML = '<p class="loading">Loading recommendations...</p>';

    fetch(`${CONFIG.OMDB_BASE}?s=${encodeURIComponent(keyword)}&apikey=${CONFIG.OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            box.innerHTML = '';
            if (data.Response !== 'True' || !data.Search) return;

            data.Search.slice(0, 6).forEach(item => {
                const card = document.createElement('div');
                card.className = 'movie-card';
                card.addEventListener('click', () => openMovie(item.imdbID));
                const poster = getPoster(item.Poster);
                card.innerHTML = `
                    <img src="${escapeHtml(poster)}" alt="${escapeHtml(item.Title)}">
                    <h3>${escapeHtml(item.Title)}</h3>
                    <p>${escapeHtml(item.Year)}</p>
                `;
                box.appendChild(card);
            });
        })
        .catch(() => {
            box.innerHTML = '';
        });
}

/* ================= NAVIGATION ================= */

function openMovie(id) {
    window.location.href = `movie.html?imdb=${encodeURIComponent(id)}`;
}
