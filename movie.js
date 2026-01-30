const OMDB_API_KEY = 'b9b1f1ed';
const OMDB_BASE = 'https://www.omdbapi.com/';

const params = new URLSearchParams(window.location.search);
const imdbID = params.get('imdb');

let currentType = 'movie'; // movie | series
let currentSeason = null;
let currentEpisode = null;

if (!imdbID) {
    document.body.innerHTML = '<h2 style="padding:40px">Content not found</h2>';
} else {
    loadDetails(imdbID);
}

/* ================= DETAILS ================= */

function loadDetails(id) {
    fetch(`${OMDB_BASE}?i=${id}&apikey=${OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {

            document.getElementById('movie-details').innerHTML = `
                <img src="${data.Poster !== 'N/A' ? data.Poster : 'https://via.placeholder.com/300x450'}">
                <div class="movie-info">
                    <h1>${data.Title} (${data.Year})</h1>
                    <span class="rating">⭐ ${data.imdbRating}</span>
                    <p><b>Genre:</b> ${data.Genre}</p>
                    <p><b>Director:</b> ${data.Director}</p>
                    <p><b>Cast:</b> ${data.Actors}</p>
                    <p><b>Plot:</b> ${data.Plot}</p>
                </div>
            `;

            if (data.Type === 'series') {
                currentType = 'series';
                setupSeries(id, data.totalSeasons);
            } else {
                currentType = 'movie';
                loadMoviePlayer(id);
            }

            loadSuggestions(data.Genre);
        });
}

/* ================= PLAYER ================= */

function loadMoviePlayer(id) {
    document.getElementById('player-frame').src =
        `https://vidsrc-embed.ru/embed/movie?imdb=${id}&autoplay=0`;
}

/* ================= SERIES ================= */

function setupSeries(imdbID, totalSeasons) {
    document.getElementById('series-controls').style.display = 'flex';

    const seasonSelect = document.getElementById('seasonSelect');
    seasonSelect.innerHTML = '<option value="">Select Season</option>';

    for (let i = 1; i <= totalSeasons; i++) {
        seasonSelect.innerHTML += `<option value="${i}">Season ${i}</option>`;
    }
}

function loadEpisodes() {
    currentSeason = document.getElementById('seasonSelect').value;
    if (!currentSeason) return;

    fetch(`${OMDB_BASE}?i=${imdbID}&Season=${currentSeason}&apikey=${OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            const episodeSelect = document.getElementById('episodeSelect');
            episodeSelect.innerHTML = '<option value="">Select Episode</option>';

            data.Episodes.forEach(ep => {
                episodeSelect.innerHTML += `
                    <option value="${ep.Episode}">
                        Ep ${ep.Episode} - ${ep.Title}
                    </option>
                `;
            });
        });
}

function playEpisode() {
    currentEpisode = document.getElementById('episodeSelect').value;
    if (!currentSeason || !currentEpisode) return;

    document.getElementById('player-frame').src =
        `https://vidsrc-embed.ru/embed/tv?imdb=${imdbID}&season=${currentSeason}&episode=${currentEpisode}&autoplay=1`;

    document.querySelector('.player-wrapper').classList.add('playing');
}

/* ================= PLAY BUTTON ================= */

function playMovie() {
    const wrapper = document.querySelector('.player-wrapper');
    const iframe = document.getElementById('player-frame');

    if (!wrapper.classList.contains('playing')) {
        wrapper.classList.add('playing');
        iframe.src = iframe.src.replace('autoplay=0', 'autoplay=1');
    }
}

/* ================= DOWNLOAD ================= */

function downloadMovie() {
    const link =
        currentType === 'series' && currentSeason && currentEpisode
            ? `https://vidsrc-embed.ru/embed/tv?imdb=${imdbID}&season=${currentSeason}&episode=${currentEpisode}`
            : `https://vidsrc-embed.ru/embed/movie?imdb=${imdbID}`;

    navigator.clipboard.writeText(link).then(() => {
        alert("Link copied!\nPaste it on SaveFrom to download.");
        window.open('https://en1.savefrom.net/16xF/', '_blank');
    });
}

/* ================= AUDIO ================= */

function changeAudio(lang) {
    if (!lang) return;
    reloadPlayer({ audio: lang });
}

/* ================= QUALITY ================= */

function changeQuality(quality) {
    if (!quality) return;
    reloadPlayer({ quality: quality });
}

/* ================= RELOAD PLAYER (SAFE) ================= */

function reloadPlayer(options = {}) {
    let baseUrl = '';

    if (currentType === 'series' && currentSeason && currentEpisode) {
        baseUrl = `https://vidsrc-embed.ru/embed/tv?imdb=${imdbID}&season=${currentSeason}&episode=${currentEpisode}`;
    } else {
        baseUrl = `https://vidsrc-embed.ru/embed/movie?imdb=${imdbID}`;
    }

    let params = ['autoplay=1'];

    if (options.audio) params.push(`lang=${options.audio}`);
    if (options.quality) params.push(`quality=${options.quality}`);

    document.getElementById('player-frame').src =
        baseUrl + '&' + params.join('&');

    document.querySelector('.player-wrapper').classList.add('playing');
}

/* ================= SUGGESTIONS ================= */

function loadSuggestions(genre) {
    const keyword = genre.split(',')[0];

    fetch(`${OMDB_BASE}?s=${keyword}&apikey=${OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response !== 'True') return;

            const box = document.getElementById('suggestions');
            box.innerHTML = '';

            data.Search.slice(0, 6).forEach(item => {
                box.innerHTML += `
                    <div class="movie-card" onclick="openMovie('${item.imdbID}')">
                        <img src="${item.Poster !== 'N/A' ? item.Poster : 'https://via.placeholder.com/200x300'}">
                        <h3>${item.Title}</h3>
                    </div>
                `;
            });
        });
}

/* ================= NAVIGATION ================= */

function openMovie(id) {
    window.location.href = `movie.html?imdb=${id}`;
}
function changeAudio(lang) {
    if (!lang) return;
    reloadPlayer({ audio: lang });
}
function changeQuality(quality) {
    if (!quality) return;
    reloadPlayer({ quality: quality });
}
function reloadPlayer(options = {}) {
    let baseUrl = '';
    let params = [];

    // Detect movie or series
    if (currentType === 'series' && currentSeason && currentEpisode) {
        baseUrl = `https://vidsrc-embed.ru/embed/tv?imdb=${imdbID}&season=${currentSeason}&episode=${currentEpisode}`;
    } else {
        baseUrl = `https://vidsrc-embed.ru/embed/movie?imdb=${imdbID}`;
    }

    params.push('autoplay=1');

    if (options.audio) {
        params.push(`lang=${options.audio}`);
    }

    if (options.quality) {
        params.push(`quality=${options.quality}`);
    }

    document.getElementById('player-frame').src =
        baseUrl + '&' + params.join('&');

    document.querySelector('.player-wrapper').classList.add('playing');
}
