let currentSong = new Audio();
let songs;
let currFolder;

// Utility: Convert seconds to mm:ss
function secondsToMinuteSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Display all albums
async function displayAlbums() {
    let res = await fetch(`/songs/`);
    let text = await res.text();
    let div = document.createElement("div");
    div.innerHTML = text;
    let anchors = div.getElementsByTagName("a");
    let cardContainer = document.querySelector(".cardContainer");

    for (let a of anchors) {
        let folder = a.href.split("/").filter(Boolean).pop();
        if (folder.includes(".")) continue; // Skip files

        let info = await fetch(`/songs/${folder}/info.json`);
        let response = await info.json();

        cardContainer.innerHTML += `<div data-folder="${folder}" class="card">
            <div class="play"><img src="/img/play.svg" alt=""></div>
            <img src="/songs/${folder}/cover.jpg" alt="">
            <h2>${response.title}</h2>
            <p>${response.description}</p>
        </div>`;
    }

    // Add click event to album cards
    Array.from(document.getElementsByClassName("card")).forEach(card => {
        card.addEventListener("click", async () => {
            await getSongs(card.dataset.folder);
        });
    });
}

// Load songs from selected album
async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`/songs/${folder}/info.json`);
    let response = await a.json();
    songs = response.songs;

    let songUl = document.querySelector(".songlist");
    songUl.innerHTML = "";
    for (let song of songs) {
        songUl.innerHTML += `<li>
            <img src="img/music.svg" class="invert" alt="">
            <div class="info">
                <div>${song}</div>
                <div>Subhasish Nath</div>
            </div>
            <div class="playnow">
                <span>Play Now</span>
                <img src="img/play.svg" class="invert" alt="">
            </div>
        </li>`;
    }

    // Attach click to all songs
    Array.from(document.querySelectorAll(".songlist li")).forEach(e => {
        e.addEventListener("click", () => {
            playMusic(e.querySelector(".info div").innerText.trim());
        });
    });

    playMusic(songs[0]); // Auto play first song
}

// Play selected song
async function playMusic(track, pause = false) {
    currentSong.src = `/songs/${currFolder}/${track}`;
    document.querySelector(".songinfo").innerText = decodeURIComponent(track);
    document.querySelector(".songtime").innerText = "00:00 / 00:00";

    if (!pause) {
        try {
            await currentSong.play();
        } catch (e) {
            console.error("Audio play error:", e);
        }
        play.src = "img/pause.svg";
    }

    // Highlight playing song in list
    Array.from(document.querySelectorAll(".songlist li")).forEach(li => {
        li.style.border = li.querySelector(".info div").innerText.trim() === track ? "2px solid #1db954" : "";
    });
}

// Setup seek bar and time updates
currentSong.addEventListener("timeupdate", () => {
    document.querySelector(".songtime").innerText =
        `${secondsToMinuteSeconds(currentSong.currentTime)} / ${secondsToMinuteSeconds(currentSong.duration)}`;

    document.querySelector(".circle").style.left = `${(currentSong.currentTime / currentSong.duration) * 100}%`;
});

// Seek bar dragging
document.querySelector(".seekbar").addEventListener("click", e => {
    const percent = (e.offsetX / e.target.getBoundingClientRect().width);
    currentSong.currentTime = percent * currentSong.duration;
});

// Volume control
document.querySelector(".range input").addEventListener("input", e => {
    currentSong.volume = e.target.value / 100;
});

// Play/Pause toggle
const play = document.getElementById("play");
play.addEventListener("click", () => {
    if (currentSong.paused) {
        currentSong.play();
        play.src = "img/pause.svg";
    } else {
        currentSong.pause();
        play.src = "img/play.svg";
    }
});

// Next button
const next = document.getElementById("next");
next.addEventListener("click", () => {
    let idx = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
    if (idx !== -1 && idx < songs.length - 1) {
        playMusic(songs[idx + 1]);
    }
});

// Previous button
const previous = document.getElementById("previous");
previous.addEventListener("click", () => {
    let idx = songs.indexOf(decodeURIComponent(currentSong.src.split("/").pop()));
    if (idx > 0) {
        playMusic(songs[idx - 1]);
    }
});

// Init
async function main() {
    await getSongs("cs"); // Load default album
    displayAlbums();
}
main();
