const player = document.getElementById("player");
const progressBar = document.getElementById("progressBar");

let tracks = [
    "Disclaimer.mp3", 
    "Train.mp3", 
    "High-Street.mp3", 
    "Forum.mp3", 
    "Chapel.mp3", 
    "Spring.mp3", 
	"Pantiles.mp3", 
    "Band-Stand.mp3", 
];

window.onload = function() {
        updateImage('band-stand.png');
    };

let currentTrackIndex = 0; // Ensure the initial index is set to 0

player.addEventListener("timeupdate", updateProgressBar, false);
player.addEventListener("ended", skip);
progressBar.addEventListener("input", seek);

function togglePlayPause() {
    const playPauseBtn = document.getElementById("playPauseBtn");
    if (player.paused) {
        player.play();
        playPauseBtn.textContent = "||";
        playPauseBtn.style.fontWeight = "bold";
    } else {
        player.pause();
        playPauseBtn.textContent = "▶";
    }
}

function rewind() {
    player.currentTime -= 20;
}

function forward() {
    player.currentTime += 20;
}

function skip() {
    currentTrackIndex++;
    if (currentTrackIndex >= tracks.length) currentTrackIndex = 0;
    player.src = tracks[currentTrackIndex];
    player.play();
    updateActiveTrack();
    updateTrackImage();
    updateActiveEvent();
}

function previousTrack() {
    currentTrackIndex--;
    if (currentTrackIndex < 0) currentTrackIndex = tracks.length - 1;
    player.src = tracks[currentTrackIndex];
    player.play();
    updateActiveTrack();
    updateTrackImage();
    updateActiveEvent(); // Update the highlighted event
}

function updateActiveTrack() {
    let trackButtons = document.querySelectorAll('#trackList button');
    trackButtons.forEach(btn => {
        btn.classList.remove('active-track');
    });
    // Highlight the current track button if it exists
    if (trackButtons[currentTrackIndex]) {
        trackButtons[currentTrackIndex].classList.add('active-track');
    }
}

function changeTrack(track) {
    player.src = track;
    progressBar.value = 0;
    player.play();
    currentTrackIndex = tracks.indexOf(track);
    updateActiveTrack();
    updateTrackImage();
    updateActiveEvent(); // Update the highlighted event
}

function updateProgressBar() {
    let percentage = Math.floor((100 / player.duration) * player.currentTime);
    progressBar.value = percentage;

    const timePassed = document.querySelector('.player-container .time-passed');
    const timeLeft = document.querySelector('.player-container .time-left');

    timePassed.innerText = formatTime(player.currentTime);
    timeLeft.innerText = formatTime(player.duration - player.currentTime);
}

function formatTime(seconds) {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec < 10 ? '0' + sec : sec}`;
}

function updateImage(imgSrc) {
    document.getElementById('dynamicImage').src = imgSrc;
}

function updateTrackImage() {
    let trackName = tracks[currentTrackIndex];
    let imagePath = trackImageMapping[trackName];
    updateImage(imagePath);
}

function seek(event) {
    let percent = progressBar.value / 100; 
    player.currentTime = percent * player.duration;
}

let trackImageMapping = {
    "Band-Stand.mp3": "Band-Stand.png",
    "Chapel.mp3": "Chapel.png",
    "Disclaimer.mp3": "Disclaimer.png",
    "Forum.mp3": "Forum.png",
    "High-Street.mp3": "High-Street.png",
    "Pantiles.mp3": "Pantiles.png",
    "Spring.mp3": "Spring.png",
    "Train.mp3": "Train.png"
};

let event_to_track_mapping = {
    "Introduction": "Disclaimer.mp3",
    "Tunbridge Wells Train Station": "Train.mp3",
    "The High Street": "High-Street.mp3",
    "The Forum": "Forum.mp3",
    "Church Of King Charles the Martyr": "Chapel.mp3",
    "Chalebeate Spring": "Spring.mp3",
    "The Pantiles": "Pantiles.mp3",
    "Jazz Stand": "Band-Stand.mp3"
};

let event_to_image_mapping = {
    "Introduction": "Disclaimer.png",
    "Tunbridge Wells Train Station": "Train.png",
    "The High Street": "High-Street.png",
    "The Forum": "Forum.png",
    "Church Of King Charles the Martyr": "Chapel.png",
    "Chalebeate Spring": "Spring.png",
    "The Pantiles": "Pantiles.png",
    "Jazz Stand": "Band-Stand.png"
};



function updateActiveEvent() {
    let currentTrack = tracks[currentTrackIndex];
    let activeEventText = Object.keys(event_to_track_mapping).find(key => event_to_track_mapping[key] === currentTrack);
    
    if (activeEventText) {
        let activeEvent = Array.from(events).find(event => {
            let eventText = event.querySelector('.details').childNodes[0].textContent.trim();
            return eventText === activeEventText;
        });
        
        if (activeEvent) {
            events.forEach(el => el.querySelector('.details').classList.remove('active'));
            activeEvent.querySelector('.details').classList.add('active');
            
            let index = Array.from(events).indexOf(activeEvent);
            let height = 0;
            for (let i = 0; i <= index; i++) {
                height += events[i].offsetHeight;
                if (i != index) {
                    // No need for margin since it's 0
                } else {
                    height -= (events[i].offsetHeight / 2);
                }
            }
            progressBarTimeline.style.height = height + 'px';
        }
    }
}

document.addEventListener('DOMContentLoaded', (event) => {
    // No initial track or event is highlighted
});

const events = document.querySelectorAll('.event');
const progressBarTimeline = document.querySelector('.progress');

events.forEach((event, index) => {
    event.addEventListener('click', () => {
        events.forEach(el => el.querySelector('.details').classList.remove('active'));
        event.querySelector('.details').classList.add('active');
        
        let height = 0;
        for (let i = 0; i <= index; i++) {
            height += events[i].offsetHeight;
            if (i != index) {
                // No need for margin since it's 0
            } else {
                height -= (events[i].offsetHeight / 2);
            }
        }
        progressBarTimeline.style.height = height + 'px';

        // Extract the main text of the event, excluding <small> content
        let detailsNode = event.querySelector('.details');
        let eventText = Array.from(detailsNode.childNodes)
            .filter(node => node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '')
            .map(node => node.textContent.trim())
            .join(' ');

        let trackToPlay = event_to_track_mapping[eventText];
        if (trackToPlay) {
            changeTrack(trackToPlay);
        }
    });
});
