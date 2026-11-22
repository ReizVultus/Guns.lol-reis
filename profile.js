const audio = document.querySelector("#audio");
const play = document.querySelector("#play");
const seek = document.querySelector("#seek");
const elapsed = document.querySelector("#elapsed");
const duration = document.querySelector("#duration");
const trackTitle = document.querySelector("#track-title");
const cover = document.querySelector(".track-cover");
const playerMessage = document.querySelector("#player-message");
const tracks = [
  { title: "Vultus", audio: "./assets/audio/vultus.mp3", cover: "./assets/images/vultus-cover.webp" },
  { title: "Low Cortisol", audio: "./assets/audio/low-cortisol.mp3", cover: "./assets/images/low-cortisol-cover.jpg" },
];
let trackIndex = 0;

function formatTime(seconds) {
  const wholeSeconds = Math.floor(seconds);
  const minutes = Math.floor(wholeSeconds / 60);
  return `${minutes}:${String(wholeSeconds % 60).padStart(2, "0")}`;
}

function updateTimeline() {
  const hasDuration = Number.isFinite(audio.duration) && audio.duration > 0;
  seek.disabled = !hasDuration;
  seek.max = hasDuration ? audio.duration : 1;
  seek.value = audio.currentTime;
  elapsed.textContent = formatTime(audio.currentTime);
  duration.textContent = hasDuration ? formatTime(audio.duration) : "–:––";
  seek.style.setProperty("--progress", hasDuration ? `${100 * audio.currentTime / audio.duration}%` : "0%");
  seek.setAttribute("aria-valuetext", `${elapsed.textContent} de ${duration.textContent}`);
}

function updatePlayButton() {
  const isPlaying = !audio.paused && !audio.ended;
  play.classList.toggle("playing", isPlaying);
  play.setAttribute("aria-label", `${isPlaying ? "Pausar" : "Reproduzir"} ${tracks[trackIndex].title}`);
}

function showPlayerMessage(message) {
  playerMessage.textContent = message;
  playerMessage.hidden = !message;
}

async function playTrack() {
  showPlayerMessage("");
  try {
    await audio.play();
  } catch (error) {
    if (error.name !== "AbortError") {
      showPlayerMessage("Não foi possível reproduzir esta faixa.");
    }
  }
}

play.addEventListener("click", () => {
  if (audio.paused || audio.ended) {
    void playTrack();
  } else {
    audio.pause();
  }
});

seek.addEventListener("input", () => {
  audio.currentTime = Number(seek.value);
});

function changeTrack(step) {
  const shouldKeepPlaying = !audio.paused && !audio.ended;
  trackIndex = (trackIndex + step + tracks.length) % tracks.length;
  const track = tracks[trackIndex];
  trackTitle.textContent = track.title;
  cover.src = track.cover;
  audio.src = track.audio;
  showPlayerMessage("");
  updateTimeline();
  updatePlayButton();
  if (shouldKeepPlaying) void playTrack();
}

document.querySelector("#previous").addEventListener("click", () => changeTrack(-1));
document.querySelector("#next").addEventListener("click", () => changeTrack(1));

for (const event of ["timeupdate", "loadedmetadata", "durationchange", "emptied"]) {
  audio.addEventListener(event, updateTimeline);
}
for (const event of ["play", "pause", "ended", "emptied"]) {
  audio.addEventListener(event, updatePlayButton);
}
audio.addEventListener("error", () => showPlayerMessage("Esta faixa está indisponível."));

document.querySelector(".player-controls").hidden = false;
document.querySelector(".transport").hidden = false;
audio.hidden = true;
updateTimeline();
updatePlayButton();

const share = document.querySelector("#share");
const shareStatus = document.querySelector("#share-status");
const shareUrl = () => new URL("./", location.href).href;

if (location.protocol.startsWith("http") && (navigator.share || navigator.clipboard?.writeText)) {
  share.hidden = false;
}

share.addEventListener("click", async () => {
  shareStatus.textContent = "";
  const url = shareUrl();
  if (navigator.share) {
    try {
      await navigator.share({ title: "Reiz", url });
      return;
    } catch (error) {
      if (error.name === "AbortError") return;
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    shareStatus.textContent = "Link copiado.";
  } catch {
    shareStatus.textContent = "Copie o link na barra de endereço.";
  }
});
