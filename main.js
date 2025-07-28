let currentsong = new Audio();
let songs;
let currFolder;

// Convert seconds to MM:SS format
function secondsToMinuteSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) return "00:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

// ✅ Fetch song list using info.json
async function getSongs(folder) {
    currFolder = folder;

    let res = await fetch(`/songs/${folder}/info.json`);
    let data = await res.json();
    songs = data.songs;

    let songul = document.querySelector(".songlist ul");
    songul.innerHTML = "";

    for (const song of songs) {
        songul.innerHTML += `
            <li>
                <img class="invert" src="/img/music.svg" alt="">
                <div class="info">
                    <div>${song.replaceAll("%20", " ")}</div>
                    <div></div>
                </div>
                <div class="playnow">
                    <span>Play Now</span>
                    <img class="invert" src="/img/play.svg" alt="">
                </div>
            </li>`;
    }

    // Event listener to play clicked song
    Array.from(document.querySelectorAll(".songlist li")).forEach(e => {
        e.addEventListener("click", () => {
            const trackName = e.querySelector(".info div").innerText.trim();
            playMusic(trackName);
        });
    });

    return songs;
}

// ✅ Play music file
const playMusic = (track, pause = false) => {
    currentsong.src = `/songs/${currFolder}/${track}`;
    if (!pause) {
        currentsong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00";
};

// ✅ Display albums using known folder names
async function displayAlbums() {
    const albumFolders = ["cs", "arijit1", "guru"]; // Add more as needed
    let cardContainer = document.querySelector(".cardContainer");
    cardContainer.innerHTML = "";

    for (let folder of albumFolders) {
        try {
            let res = await fetch(`/songs/${folder}/info.json`);
            let meta = await res.json();

            cardContainer.innerHTML += `
                <div data-folder="${folder}" class="card">
                    <div class="play">
                        <img src="/img/play.svg" alt="">
                    </div>
                    <img src="/songs/${folder}/cover.jpg" alt="">
                    <h2>${meta.title}</h2>
                    <p>${meta.description}</p>
                </div>`;
        } catch (err) {
            console.error(`Error loading album ${folder}`, err);
        }
    }

    // Attach click events to album cards
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(item.currentTarget.dataset.folder);
            playMusic(songs[0]);
        });
    });
}

async function main() {
    await displayAlbums();
    await getSongs("cs");
    playMusic(songs[0], true);

    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play();
            play.src = "img/pause.svg";
        } else {
            currentsong.pause();
            play.src = "img/play-cir.svg";
        }
    });

    currentsong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${secondsToMinuteSeconds(currentsong.currentTime)} / ${secondsToMinuteSeconds(currentsong.duration)}`;
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    });

    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    });

    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    next.addEventListener("click", () => {
        let index = songs.indexOf(currentsong.src.split("/").pop());
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            currentsong.pause();
            play.src = "img/play-cir.svg";
        }
    });

    currentsong.addEventListener("ended", () => {
        let nextsong = currentsong.src.split("/").pop();
        let index = songs.indexOf(nextsong);
        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        } else {
            play.src = "img/play-cir.svg";
        }
    });

    document.querySelector(".volume input").addEventListener("change", (e) => {
        currentsong.volume = parseInt(e.target.value) / 100;
        if (currentsong.volume > 0) {
            document.querySelector(".volume > img").src = "img/volume.svg";
        }
    });

    document.querySelector(".volume > img").addEventListener("click", e => {
        if (e.target.src.includes("volume.svg")) {
            e.target.src = "img/mute.svg";
            currentsong.volume = 0;
            document.querySelector(".volume input").value = 0;
        } else {
            e.target.src = "img/volume.svg";
            currentsong.volume = 0.1;
            document.querySelector(".volume input").value = 10;
        }
    });

    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            cards.forEach(c => c.classList.remove("playing"));
            card.classList.add("playing");
        });
    });

    const cardContainer = document.querySelector(".cardContainer");
    cardContainer.addEventListener("click", (e) => {
        const clickedCard = e.target.closest(".card");
        if (!clickedCard || !cardContainer.contains(clickedCard)) return;
        cardContainer.prepend(clickedCard);
    });

    const togglebtn = document.querySelector(".modeChange");
    togglebtn.addEventListener("click", () => {
        const elements = document.querySelectorAll(".bg-grey, .light-mode");
        elements.forEach(element => {
            element.classList.toggle("bg-grey");
            element.classList.toggle("light-mode");
        });
        const isLight = elements[0].classList.contains("light-mode");
        togglebtn.src = isLight ? "img/dark.svg" : "img/light.svg";
    });

    document.querySelector(".srch").addEventListener("click", () => {
        const searchInput = document.getElementById("songSearch");
        searchInput.style.display = (searchInput.style.display === "none") ? "block" : "none";
        searchInput.focus();
        searchInput.value = "";
        filterSongs("");
    });

    document.getElementById("songSearch").addEventListener("input", function () {
        const query = this.value.toLowerCase();
        filterSongs(query);
    });

    function filterSongs(query) {
        const songItems = document.querySelectorAll(".songlist ul li");
        songItems.forEach(item => {
            const songName = item.querySelector(".info div").textContent.toLowerCase();
            item.style.display = songName.includes(query) ? "flex" : "none";
        });
    }
}

main();
