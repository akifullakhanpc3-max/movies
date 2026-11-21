
const OMDB_API_KEY = "YOUR_OMDB_API_KEY";
const OMDB_BASE = "https://www.omdbapi.com/";

// Configure an authorized streaming provider.
const PLAYER_BASE_URL = ""; 

const params = new URLSearchParams(window.location.search);
const imdbID = params.get("imdb");

let currentType = "movie";
let currentSeason = null;
let currentEpisode = null;
let totalSeasons = 0;

/* ================= UTILITIES ================= */

const getElement = (id) => document.getElementById(id);

async function fetchOMDb(query) {
    const url = `${OMDB_BASE}?${new URLSearchParams({
        ...query,
        apikey: OMDB_API_KEY
    })}`;

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Unable to connect to OMDb.");
    }

    const data = await response.json();

    if (data.Response === "False") {
        throw new Error(data.Error || "Content not found.");
    }

    return data;
}

function showError(message) {
    const details = getElement("movie-details");

    if (details) {
        details.textContent = message;
    }
}

function addTextElement(parent, tag, text, className = "") {
    const element = document.createElement(tag);
    element.textContent = text || "N/A";

    if (className) {
        element.className = className;
    }

    parent.appendChild(element);
    return element;
}

/* ================= INITIALIZATION ================= */

document.addEventListener("DOMContentLoaded", () => {
    if (!imdbID) {
        showError("Content not found. Please provide an IMDb ID.");
        return;
    }

    loadDetails(imdbID);
});

/* ================= MOVIE DETAILS ================= */

async function loadDetails(id) {
    try {
        const data = await fetchOMDb({
            i: id,
            plot: "full"
        });

        renderMovieDetails(data);

        currentType = data.Type === "series" ? "series" : "movie";

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
    }
}

/* ================= DETAILS UI ================= */

function renderMovieDetails(data) {
    const container = getElement("movie-details");

    if (!container) return;

    container.replaceChildren();

    const poster = document.createElement("img");

    poster.src = data.Poster !== "N/A"
        ? data.Poster
        : "https://placehold.co/300x450?text=No+Poster";

    poster.alt = data.Title || "Movie poster";
    poster.loading = "lazy";

    const info = document.createElement("div");
    info.className = "movie-info";

    addTextElement(
        info,
        "h1",
        `${data.Title} (${data.Year})`
    );

    addTextElement(
        info,
        "span",
        `⭐ ${data.imdbRating || "N/A"}`,
        "rating"
    );

    addTextElement(info, "p", `Genre: ${data.Genre}`);
    addTextElement(info, "p", `Director: ${data.Director}`);
    addTextElement(info, "p", `Cast: ${data.Actors}`);
    addTextElement(info, "p", `Plot: ${data.Plot}`);

    container.append(poster, info);
}

/* ================= PLAYER ================= */

function buildPlayerURL(type, id, season, episode) {
    if (!PLAYER_BASE_URL) {
        throw new Error(
            "Configure an authorized streaming provider first."
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

function setPlayer(url) {
    const iframe = getElement("player-frame");
    const wrapper = document.querySelector(".player-wrapper");

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

    document.querySelector(".player-wrapper")
        ?.classList.add("playing");
}

/* ================= SERIES ================= */

function setupSeries(seasons) {
    const controls = getElement("series-controls");
    const seasonSelect = getElement("seasonSelect");
    const episodeSelect = getElement("episodeSelect");

    if (!controls || !seasonSelect) return;

    controls.style.display = "flex";

    seasonSelect.replaceChildren();

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Select Season";
    seasonSelect.appendChild(defaultOption);

    for (let i = 1; i <= seasons; i++) {
        const option = document.createElement("option");

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

/* ================= EPISODES ================= */

async function loadEpisodes() {
    const seasonSelect = getElement("seasonSelect");
    const episodeSelect = getElement("episodeSelect");

    if (!seasonSelect || !episodeSelect) return;

    currentSeason = seasonSelect.value;
    currentEpisode = null;

    episodeSelect.replaceChildren();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Loading episodes...";

    episodeSelect.appendChild(placeholder);

    if (!currentSeason) return;

    try {
        const data = await fetchOMDb({
            i: imdbID,
            Season: currentSeason
        });

        episodeSelect.replaceChildren();

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.textContent = "Select Episode";

        episodeSelect.appendChild(defaultOption);

        (data.Episodes || []).forEach(ep => {
            const option = document.createElement("option");

            option.value = ep.Episode;
            option.textContent =
                `Ep ${ep.Episode} - ${ep.Title}`;

            episodeSelect.appendChild(option);
        });

        episodeSelect.onchange = () => {
            currentEpisode = episodeSelect.value || null;
        };

    } catch (error) {
        episodeSelect.replaceChildren();

        const option = document.createElement("option");
        option.textContent = error.message;

        episodeSelect.appendChild(option);
    }
}

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

/* ================= PLAYER SETTINGS ================= */

// These options require explicit support from your provider.

function changeAudio(language) {
    if (!language) return;

    reloadPlayer({ audio: language });
}

function changeQuality(quality) {
    if (!quality) return;

    reloadPlayer({ quality });
}

function reloadPlayer(options = {}) {
    try {
        let url;

        if (currentType === "series") {
            if (!currentSeason || !currentEpisode) return;

            url = buildPlayerURL(
                "series",
                imdbID,
                currentSeason,
                currentEpisode
            );
        } else {
            url = buildPlayerURL("movie", imdbID);
        }

        const playerURL = new URL(url);

        if (options.audio) {
            playerURL.searchParams.set("audio", options.audio);
        }

        if (options.quality) {
            playerURL.searchParams.set("quality", options.quality);
        }

        setPlayer(playerURL.toString());

    } catch (error) {
        console.error(error.message);
    }
}

/* ================= SUGGESTIONS ================= */

async function loadSuggestions(genre) {
    if (!genre || genre === "N/A") return;

    const keyword = genre.split(",")[0].trim();

    if (!keyword) return;

    try {
        const data = await fetchOMDb({
            s: keyword,
            type: "movie"
        });

        const container = getElement("suggestions");

        if (!container) return;

        container.replaceChildren();

        data.Search.slice(0, 6).forEach(item => {
            const card = document.createElement("div");
            card.className = "movie-card";

            const poster = document.createElement("img");

            poster.src = item.Poster !== "N/A"
                ? item.Poster
                : "https://placehold.co/200x300?text=No+Poster";

            poster.alt = item.Title;
            poster.loading = "lazy";

            const title = document.createElement("h3");
            title.textContent = item.Title;

            card.append(poster, title);

            card.addEventListener("click", () => {
                openMovie(item.imdbID);
            });

            container.appendChild(card);
        });

    } catch (error) {
        console.error("Suggestions:", error.message);
    }
}

/* ================= NAVIGATION ================= */

function openMovie(id) {
    if (!id) return;

    window.location.href =
        `movie.html?imdb=${encodeURIComponent(id)}`;
}

/* ================= DOWNLOAD ================= */

// Only provide download links from a provider that
// explicitly authorizes downloadable content.

function downloadMovie() {
    alert(
        "Downloads are available only through an authorized download provider."
    );
}
