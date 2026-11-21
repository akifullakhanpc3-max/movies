
/* =====================================================
   MOVIE WEBSITE - COMPLETE JAVASCRIPT
   OMDb API + Movie Details + TV Series + Player
===================================================== */

// IMPORTANT: Insert your activated OMDb API key.
const OMDB_API_KEY = "b9b1f1ed";

const OMDB_BASE = "https://www.omdbapi.com/";

// Configure an authorized streaming provider.
// This must be a provider endpoint that you are authorized to use.
const PLAYER_BASE_URL = "";

// URL parameters
const pageParams = new URLSearchParams(window.location.search);
const imdbID = pageParams.get("imdb");

// Global state
let currentType = "movie";
let currentSeason = null;
let currentEpisode = null;
let totalSeasons = 0;
let currentMovieData = null;


/* =====================================================
   DOM HELPERS
===================================================== */

function getElement(id) {
    return document.getElementById(id);
}

function showMessage(element, message, type = "error") {
    if (!element) return;

    element.textContent = message;
    element.className = type;
}

function clearElement(element) {
    if (element) {
        element.replaceChildren();
    }
}


/* =====================================================
   OMDb API
===================================================== */

async function fetchOMDb(query) {

    if (
        !OMDB_API_KEY ||
        OMDB_API_KEY === "YOUR_OMDB_API_KEY"
    ) {
        throw new Error(
            "OMDb API key is missing. Add your activated API key."
        );
    }

    const url = new URL(OMDB_BASE);

    url.searchParams.set("apikey", OMDB_API_KEY);

    Object.entries(query).forEach(([key, value]) => {
        url.searchParams.set(key, value);
    });

    const response = await fetch(url);

    let data;

    try {
        data = await response.json();
    } catch {
        throw new Error("Invalid response from OMDb.");
    }

    if (response.status === 401) {
        throw new Error(
            "Invalid API key. Check your OMDb key and email activation."
        );
    }

    if (!response.ok) {
        throw new Error("OMDb server error: " + response.status);
    }

    if (data.Response === "False") {
        throw new Error(data.Error || "Content not found.");
    }

    return data;
}


/* =====================================================
   INITIALIZATION
===================================================== */

document.addEventListener("DOMContentLoaded", () => {

    if (!imdbID) {
        showError("Movie not found. Missing IMDb ID.");
        return;
    }

    loadDetails(imdbID);

});


/* =====================================================
   ERROR HANDLING
===================================================== */

function showError(message) {

    const details = getElement("movie-details");

    if (!details) return;

    details.replaceChildren();

    const error = document.createElement("h2");

    error.textContent = message;
    error.style.padding = "30px";
    error.style.color = "#ff5555";

    details.appendChild(error);
}


/* =====================================================
   LOAD MOVIE DETAILS
===================================================== */

async function loadDetails(id) {

    const details = getElement("movie-details");

    if (details) {
        details.textContent = "Loading movie details...";
    }

    try {

        const data = await fetchOMDb({
            i: id,
            plot: "full"
        });

        currentMovieData = data;

        currentType =
            data.Type === "series" ? "series" : "movie";

        renderMovieDetails(data);

        if (currentType === "series") {

            totalSeasons = Number(data.totalSeasons) || 0;

            setupSeries(totalSeasons);

        } else {

            hideSeriesControls();
            loadMoviePlayer(id);

        }

        if (data.Genre && data.Genre !== "N/A") {
            loadSuggestions(data.Genre);
        }

    } catch (error) {

        showError(error.message);
        console.error("Movie loading error:", error);

    }

}


/* =====================================================
   RENDER MOVIE DETAILS
===================================================== */

function renderMovieDetails(data) {

    const container = getElement("movie-details");

    if (!container) return;

    container.replaceChildren();

    const poster = document.createElement("img");

    poster.src =
        data.Poster && data.Poster !== "N/A"
            ? data.Poster
            : "https://placehold.co/300x450?text=No+Poster";

    poster.alt = data.Title || "Movie poster";
    poster.loading = "lazy";

    const info = document.createElement("div");

    info.className = "movie-info";

    function addInfo(tag, value, className = "") {

        const element = document.createElement(tag);

        element.textContent = value || "N/A";

        if (className) {
            element.className = className;
        }

        info.appendChild(element);

    }

    addInfo(
        "h1",
        `${data.Title} (${data.Year})`
    );

    addInfo(
        "span",
        `⭐ ${data.imdbRating || "N/A"}`,
        "rating"
    );

    addInfo("p", `Genre: ${data.Genre}`);
    addInfo("p", `Director: ${data.Director}`);
    addInfo("p", `Cast: ${data.Actors}`);
    addInfo("p", `Runtime: ${data.Runtime}`);
    addInfo("p", `Released: ${data.Released}`);
    addInfo("p", `Language: ${data.Language}`);
    addInfo("p", `Plot: ${data.Plot}`);

    container.append(poster, info);

}


/* =====================================================
   PLAYER URL BUILDER
===================================================== */

function buildPlayerURL(type, id, season, episode) {

    if (!PLAYER_BASE_URL) {
        throw new Error(
            "Please configure your authorized streaming provider."
        );
    }

    const url = new URL(PLAYER_BASE_URL);

    url.searchParams.set("imdb", id);
    url.searchParams.set("type", type);

    if (type === "series") {

        url.searchParams.set("season", season);
        url.searchParams.set("episode", episode);

    }

    return url.toString();

}


/* =====================================================
   PLAYER
===================================================== */

function setPlayer(url) {

    const iframe = getElement("player-frame");

    const wrapper =
        document.querySelector(".player-wrapper");

    if (!iframe) return;

    iframe.src = url;

    if (wrapper) {
        wrapper.classList.add("playing");
    }

}


function loadMoviePlayer(id) {

    try {

        const url = buildPlayerURL("movie", id);

        setPlayer(url);

    } catch (error) {

        console.warn(error.message);

    }

}


function playMovie() {

    if (currentType !== "movie") return;

    const iframe = getElement("player-frame");

    if (!iframe || !iframe.src) {

        loadMoviePlayer(imdbID);
        return;

    }

    document
        .querySelector(".player-wrapper")
        ?.classList.add("playing");

}


/* =====================================================
   TV SERIES CONTROLS
===================================================== */

function setupSeries(seasons) {

    const controls = getElement("series-controls");
    const seasonSelect = getElement("seasonSelect");
    const episodeSelect = getElement("episodeSelect");

    if (!controls || !seasonSelect) return;

    controls.style.display = "flex";

    seasonSelect.replaceChildren();

    const defaultOption =
        document.createElement("option");

    defaultOption.value = "";
    defaultOption.textContent = "Select Season";

    seasonSelect.appendChild(defaultOption);

    for (let i = 1; i <= seasons; i++) {

        const option =
            document.createElement("option");

        option.value = String(i);
        option.textContent = `Season ${i}`;

        seasonSelect.appendChild(option);

    }

    if (episodeSelect) {
        episodeSelect.replaceChildren();
    }

    seasonSelect.onchange = loadEpisodes;

}


function hideSeriesControls() {

    const controls = getElement("series-controls");

    if (controls) {
        controls.style.display = "none";
    }

}


/* =====================================================
   LOAD EPISODES
===================================================== */

async function loadEpisodes() {

    const seasonSelect = getElement("seasonSelect");
    const episodeSelect = getElement("episodeSelect");

    if (!seasonSelect || !episodeSelect) return;

    currentSeason = seasonSelect.value;
    currentEpisode = null;

    episodeSelect.replaceChildren();

    if (!currentSeason) return;

    const loading = document.createElement("option");

    loading.textContent = "Loading episodes...";

    episodeSelect.appendChild(loading);

    try {

        const data = await fetchOMDb({
            i: imdbID,
            Season: currentSeason
        });

        episodeSelect.replaceChildren();

        const defaultOption =
            document.createElement("option");

        defaultOption.value = "";
        defaultOption.textContent = "Select Episode";

        episodeSelect.appendChild(defaultOption);

        (data.Episodes || []).forEach(ep => {

            const option =
                document.createElement("option");

            option.value = ep.Episode;

            option.textContent =
                `Ep ${ep.Episode} - ${ep.Title}`;

            episodeSelect.appendChild(option);

        });

        episodeSelect.onchange = () => {

            currentEpisode =
                episodeSelect.value || null;

        };

    } catch (error) {

        episodeSelect.replaceChildren();

        const option =
            document.createElement("option");

        option.textContent = error.message;

        episodeSelect.appendChild(option);

        console.error("Episode error:", error);

    }

}


/* =====================================================
   PLAY TV EPISODE
===================================================== */

function playEpisode() {

    if (!currentSeason || !currentEpisode) {

        alert("Please select a season and episode.");

        return;

    }

    try {

        const url = buildPlayerURL(
            "series",
            imdbID,
            currentSeason,
            currentEpisode
        );

        setPlayer(url);

    } catch (error) {

        alert(error.message);

    }

}


/* =====================================================
   AUDIO SETTINGS
===================================================== */

function changeAudio(language) {

    if (!language) return;

    reloadPlayer({
        audio: language
    });

}


/* =====================================================
   VIDEO QUALITY
===================================================== */

function changeQuality(quality) {

    if (!quality) return;

    reloadPlayer({
        quality: quality
    });

}


/* =====================================================
   RELOAD PLAYER
===================================================== */

function reloadPlayer(options = {}) {

    try {

        let url;

        if (currentType === "series") {

            if (!currentSeason || !currentEpisode) {
                return;
            }

            url = buildPlayerURL(
                "series",
                imdbID,
                currentSeason,
                currentEpisode
            );

        } else {

            url = buildPlayerURL(
                "movie",
                imdbID
            );

        }

        const playerURL = new URL(url);

        if (options.audio) {

            playerURL.searchParams.set(
                "audio",
                options.audio
            );

        }

        if (options.quality) {

            playerURL.searchParams.set(
                "quality",
                options.quality
            );

        }

        setPlayer(playerURL.toString());

    } catch (error) {

        console.error("Player settings:", error.message);

    }

}


/* =====================================================
   MOVIE SUGGESTIONS
===================================================== */

async function loadSuggestions(genre) {

    if (!genre || genre === "N/A") return;

    const keyword = genre.split(",")[0].trim();

    try {

        const data = await fetchOMDb({
            s: keyword,
            type: "movie"
        });

        const container = getElement("suggestions");

        if (!container) return;

        container.replaceChildren();

        data.Search.slice(0, 6).forEach(item => {

            const card =
                document.createElement("div");

            card.className = "movie-card";

            const poster =
                document.createElement("img");

            poster.src =
                item.Poster !== "N/A"
                    ? item.Poster
                    : "https://placehold.co/200x300?text=No+Poster";

            poster.alt = item.Title;
            poster.loading = "lazy";

            const title =
                document.createElement("h3");

            title.textContent = item.Title;

            card.append(poster, title);

            card.addEventListener("click", () => {

                openMovie(item.imdbID);

            });

            container.appendChild(card);

        });

    } catch (error) {

        console.error(
            "Suggestions loading error:",
            error.message
        );

    }

}


/* =====================================================
   NAVIGATION
===================================================== */

function openMovie(id) {

    if (!id) return;

    window.location.href =
        `movie.html?imdb=${encodeURIComponent(id)}`;

}


/* =====================================================
   DOWNLOAD
===================================================== */

function downloadMovie() {

    alert(
        "Downloads must be provided through an authorized download service."
    );

}
