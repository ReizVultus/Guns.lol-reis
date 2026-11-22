const audio = document.querySelector("#audio");
const play = document.querySelector("#play");
const seek = document.querySelector("#seek");
const elapsed = document.querySelector("#elapsed");
const duration = document.querySelector("#duration");
const tracks = document.querySelector("#track-select");
const cover = document.querySelector(".track-cover");
const playerMessage = document.querySelector("#player-message");

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
  seek.setAttribute("aria-valuetext", `${elapsed.textContent} de ${duration.textContent}`);
}

function updatePlayButton() {
  const isPlaying = !audio.paused && !audio.ended;
  play.classList.toggle("playing", isPlaying);
  play.setAttribute("aria-label", `${isPlaying ? "Pausar" : "Reproduzir"} ${tracks.selectedOptions[0].textContent}`);
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

tracks.addEventListener("change", () => {
  const shouldKeepPlaying = !audio.paused && !audio.ended;
  cover.src = tracks.selectedOptions[0].dataset.cover;
  audio.src = tracks.value;
  showPlayerMessage("");
  updateTimeline();
  updatePlayButton();
  if (shouldKeepPlaying) void playTrack();
});

for (const event of ["timeupdate", "loadedmetadata", "durationchange", "emptied"]) {
  audio.addEventListener(event, updateTimeline);
}
for (const event of ["play", "pause", "ended", "emptied"]) {
  audio.addEventListener(event, updatePlayButton);
}
audio.addEventListener("error", () => showPlayerMessage("Esta faixa está indisponível."));

tracks.hidden = false;
play.hidden = false;
document.querySelector(".transport").hidden = false;
document.querySelector("#track-title").hidden = true;
audio.hidden = true;
updateTimeline();
updatePlayButton();

const avatar = document.querySelector("#avatar");
const motion = matchMedia("(prefers-reduced-motion: reduce)");

function updateAvatarMotion() {
  if (motion.matches || document.hidden) {
    avatar.pause();
    return;
  }
  if (!avatar.getAttribute("src")) avatar.src = avatar.dataset.src;
  avatar.play().catch(() => {});
}

avatar.addEventListener("loadeddata", () => avatar.classList.add("ready"));
avatar.addEventListener("error", () => avatar.classList.remove("ready"));
motion.addEventListener("change", updateAvatarMotion);
document.addEventListener("visibilitychange", updateAvatarMotion);
updateAvatarMotion();

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
      await navigator.share({ title: "Reis · @reiss", url });
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
