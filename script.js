/* ================= CONFIG ================= */

const OMDB_API_KEY = 'b9b1f1ed';
const OMDB_BASE = 'https://www.omdbapi.com/';

/* ================= EVENTS ================= */

document.getElementById('search-button').addEventListener('click', searchMovies);

document.getElementById('search-input').addEventListener('keypress', e => {
    if (e.key === 'Enter') searchMovies();
});

window.addEventListener('load', loadTrendingMovies);

/* ================= LOAD TRENDING ================= */

function loadTrendingMovies() {
    fetch(`${OMDB_BASE}?s=films&apikey=${OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response === 'True') {
                displayMovies(data.Search);
            } else {
                showMessage('No movies found.');
            }
        });
}

/* ================= SEARCH ================= */

function searchMovies() {
    const query = document.getElementById('search-input').value.trim();
    if (!query) return;

    fetch(`${OMDB_BASE}?s=${query}&apikey=${OMDB_API_KEY}`)
        .then(res => res.json())
        .then(data => {
            if (data.Response === 'True') {
                displayMovies(data.Search);
            } else {
                showMessage('No movies found.');
            }
        });
}

/* ================= DISPLAY ================= */

function displayMovies(movies) {
    const results = document.getElementById('results');
    results.innerHTML = '';

    movies.forEach(movie => {
        results.innerHTML += `
            <div class="movie-card" onclick="openMovie('${movie.imdbID}')">
                <img src="${movie.Poster}">
                <h3>${movie.Title}</h3>
                <p>${movie.Year}</p>
            </div>
        `;
    });
}

/* ================= OPEN DETAILS PAGE ================= */

function openMovie(imdbID) {
    window.location.href = `movie.html?imdb=${imdbID}`;
}

function showMessage(msg) {
    document.getElementById('results').innerHTML = `<p>${msg}</p>`;
}
