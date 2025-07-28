let currentsong = new Audio();
let songs;
let currFolder;
//function to convert time in minutes from seconds
function secondsToMinuteSeconds(seconds) {
    if (isNaN(seconds) || seconds < 0) {
        return "00:00";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(remainingSeconds).padStart(2, '0');

    return `${formattedMinutes}:${formattedSeconds}`;
}

async function getSongs(folder) {
    currFolder = folder;
    let a = await fetch(`songs/${folder}/`);
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let as = div.getElementsByTagName("a")
    songs = []
    for (let index = 0; index < as.length; index++) {
        const element = as[index];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${folder}/`)[1])
        }
    }
    //show all the songs in the playlist
    let songul = document.querySelector(".songlist").getElementsByTagName("ul")[0]
    songul.innerHTML = ""
    for (const song of songs) {
        songul.innerHTML = songul.innerHTML +
            `<li>
                                <img  class="invert" src="/img/music.svg" alt="">
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


    //attach an event listener to each song
    Array.from(document.querySelector(".songlist").getElementsByTagName("li")).forEach(e => {
        e.addEventListener("click", element => {
            console.log(e.querySelector(".info").firstElementChild.innerHTML)
            playMusic(e.querySelector(".info").firstElementChild.innerHTML.trim())
        })

    })
    return songs
}

const playMusic = (track, pause = false) => {
    currentsong.src = `/songs/${currFolder}/` + track
    if (!pause) {
        currentsong.play()
        play.src = "img/pause.svg"
    }

    document.querySelector(".songinfo").innerHTML = decodeURI(track)
    document.querySelector(".songtime").innerHTML = "00:00 / 00:00"
    
}


//dynamically add albums

async function displayAlbums() {
    let a = await fetch(`/songs}`)
    let response = await a.text();
    let div = document.createElement("div")
    div.innerHTML = response;
    let anchors = div.getElementsByTagName("a")
    let cardContainer = document.querySelector(".cardContainer")
    let array = Array.from(anchors)
    for(let index = 0; index < array.length; index++){
        const e = array[index];
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-1)[0]
            // get the metadata of the folder
            let a = await fetch(`/songs/${folder}/info.json`)
            let response = await a.json();
            console.log(response)
            cardContainer.innerHTML = cardContainer + `<div data-folder="${folder}" class="card">
                        <div class="play">
                            <img src="/img/play.svg" alt="">
                        </div>
                        <img src="/songs/${folder}/cover.jpg" alt="">
                        <h2>${response.tittle}</h2>
                        <p>${response.description}</p>
                    </div>`
        }
    }  
}



async function main() {

    // get the list of all songs
    await getSongs("songs/cs")
    playMusic(songs[0], true)

    //attach an event listener to play , next and previous
    play.addEventListener("click", () => {
        if (currentsong.paused) {
            currentsong.play()
            play.src = "img/pause.svg"
        }
        else {
            currentsong.pause()
            play.src = "img/play-cir.svg"
        }
    })
    //listen for time update event and updating seekbar as per song played
    currentsong.addEventListener("timeupdate", () => {
        // console.log(currentsong.currentTime, currentsong.duration)
        document.querySelector(".songtime").innerHTML = `${secondsToMinuteSeconds(currentsong.currentTime)}/${secondsToMinuteSeconds(currentsong.duration)}`
        document.querySelector(".circle").style.left = (currentsong.currentTime / currentsong.duration) * 100 + "%";
    })
    //add an event listener to seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let percent = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = percent + "%";
        currentsong.currentTime = ((currentsong.duration) * percent) / 100;
    })
    //add an event listener for hamburger
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0"
    })
    //add an event listener to close the hamburger
    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-130%"
    })

    //add an event listener to previous song
    previous.addEventListener("click", () => {
        console.log("previous clicked")
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1])
        }
    })
    //add an event listener to next song
    next.addEventListener("click", () => {
        console.log("Next clicked")
        // currentsong.pause()
        let index = songs.indexOf(currentsong.src.split("/").slice(-1)[0])
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1])
        }
        else if ((index + 1) >= songs.length) {
            currentsong.pause()
            play.src = "img/play-cir.svg"
        }
    })
    //add an event listener to play next song  automatically
    currentsong.addEventListener("ended", () => {
        let nextsong = currentsong.src.split("/").slice(-1)[0];
        let index = songs.indexOf(nextsong);

        if (index + 1 < songs.length) {
            playMusic(songs[index + 1]);
        }
        else {
            console.log("End of playlist.");
            play.src = "img/play-cir.svg"; // set play button to paused state
        }
    });

    // //add an event to volume
    document.querySelector(".volume").getElementsByTagName("input")[0].addEventListener("change", (e) => {
        console.log("setting volume to 0 to ", e.target.value, "/ 100")
        currentsong.volume = parseInt(e.target.value) / 100
        if(currentsong.volume > 0){
            document.querySelector(".volume > img").src = document.querySelector(".volume > img").src.replace("img/mute.svg", "img/volume.svg")
        }
    })
    //add an event listener to add mute the track
    document.querySelector(".volume > img").addEventListener("click", e => {
        if (e.target.src.includes("img/volume.svg")) {
            e.target.src = e.target.src.replace("img/volume.svg", "img/mute.svg")
            currentsong.volume = 0;
            document.querySelector(".volume").getElementsByTagName("input")[0].value = 0;
        }
        else {
            e.target.src = e.target.src.replace("img/mute.svg", "img/volume.svg")
            currentsong.volume = .10;
            document.querySelector(".volume").getElementsByTagName("input")[0].value = 20
        }
    });

    //Load the playlist whenever card is clicked
    Array.from(document.getElementsByClassName("card")).forEach(e => {
        e.addEventListener("click", async item => {
            console.log("Fetching songs")
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`)
            playMusic(songs[0])
        })
    })

    //add event to style current album which playing
    const cards = document.querySelectorAll(".card");
    cards.forEach(card => {
        card.addEventListener("click", () => {
            // Remove 'playing' class from all cards
            cards.forEach(c => c.classList.remove("playing"));
            // Add 'playing' class to the clicked one
            card.classList.add("playing");
        });
    });

    //add event to move album poition to first while playing
    const cardContainer = document.querySelector(".cardContainer");

    cardContainer.addEventListener("click", (e) => {
        const clickedCard = e.target.closest(".card");
        if (!clickedCard || !cardContainer.contains(clickedCard)) return;
        cardContainer.prepend(clickedCard);
    });
    


    //add an event listener to toggle light and dark mode
    const togglebtn = document.querySelector(".modeChange");

    togglebtn.addEventListener("click", () => {
        const elements = document.querySelectorAll(".bg-grey, .light-mode");
    
        elements.forEach(element => {
            if (element.classList.contains("bg-grey")) {
                element.classList.replace("bg-grey", "light-mode");
            } else {
                element.classList.replace("light-mode", "bg-grey");
            }
        });
    
        // Check if mode is light based on first element's class
        const isLight = elements[0].classList.contains("light-mode");
        togglebtn.src = isLight ? "img/dark.svg" : "img/light.svg";
    });

    //Implementing search functionality
    document.querySelector(".srch").addEventListener("click", () => {
        const searchInput = document.getElementById("songSearch");
        // Toggle visibility
        if (searchInput.style.display === "none") {
            searchInput.style.display = "block";
            searchInput.focus();
        } else {
            searchInput.style.display = "none";
            searchInput.value = ""; // clear input
            filterSongs(""); // reset filter
        }
    });
    document.getElementById("songSearch").addEventListener("input", function () {
        const query = this.value.toLowerCase();
        filterSongs(query);
    });
    
    function filterSongs(query) {
        const songItems = document.querySelectorAll(".songlist ul li");
    
        songItems.forEach((item) => {
            const songName = item.querySelector(".info div").textContent.toLowerCase();
            if (songName.includes(query)) {
                item.style.display = "flex";
            } else {
                item.style.display = "none";
            }
        });
    }
    

}

main()

