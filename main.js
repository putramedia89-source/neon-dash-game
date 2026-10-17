
(() => {
  const $ = id => document.getElementById(id);

  // Elemen tampilan
  const scoreEl = $("score");
  const bestEl = $("bestScore");
  const bestBar = $("bestBar");

  const overlay = $("gameOverlay");
  const title = $("overlayTitle");
  const description = $("overlayText");

  const startBtn = $("startBtn");
  const restartBtn = $("restartBtn");
  const soundToggle = $("soundToggle");

  // Pastikan elemen penting tersedia
  if (
    !scoreEl ||
    !bestEl ||
    !bestBar ||
    !overlay ||
    !startBtn ||
    !restartBtn
  ) {
    console.error(
      "Elemen HTML game tidak ditemukan. Periksa ID di index.html."
    );
    return;
  }

  // Ambil best score dari penyimpanan browser
  let best = Number(
    localStorage.getItem("neonDashBest") || 0
  );

  const pad = number =>
    String(number).padStart(5, "0");

  bestEl.textContent = pad(best);

  // Memperbarui status game
  function setStatus(state, label) {
    const runState = $("runState");
    const statusPill = $("statusPill");
    const statusText = $("statusText");

    if (runState) {
      runState.innerHTML = "<i></i> " + label;
    }

    if (statusPill) {
      statusPill.textContent = state;
    }

    if (statusText) {
      if (state === "PLAYING") {
        statusText.textContent = "Game sedang berjalan";
      } else if (state === "FINISHED") {
        statusText.textContent = "Permainan selesai";
      } else {
        statusText.textContent = "Menunggu pemain";
      }
    }
  }

  // Memperbarui indikator tingkat kesulitan
  function updateDifficulty(score) {
    const difficulty = $("difficulty");

    if (!difficulty) return;

    difficulty.textContent =
      score < 100 ? "EASY" :
      score < 300 ? "MEDIUM" : "HARD";
  }

  // Memperbarui skor dan rekor terbaik
  function updateScore(score) {
    score = Number(score) || 0;

    scoreEl.textContent = pad(score);

    updateDifficulty(score);

    // Perbarui best score saat skor baru lebih tinggi
    if (score > best) {
      best = score;

      localStorage.setItem("neonDashBest", String(best));

      bestEl.textContent = pad(best);
    }

    // Progress bar berdasarkan skor saat ini
    bestBar.style.width =
      Math.min(
        100,
        score / Math.max(best, 100) * 100
      ) + "%";

    // Bunyi bonus setiap 50 poin
    if (score > 0 && score % 50 === 0) {
      if (window.GameAudio) {
        GameAudio.score();
      }
    }
  }

  // Memulai permainan
  function startGame() {
    if (!window.NeonGame) {
      console.error("NeonGame belum tersedia. Periksa game.js.");
      return;
    }

    if (window.GameAudio) {
      GameAudio.init();
      GameAudio.click();
    }

    overlay.classList.add("hidden");

    setStatus("PLAYING", "RUN IN PROGRESS");

    NeonGame.start();
  }

  // Ketika karakter kalah
  function gameOver(score) {
    overlay.classList.remove("hidden");

    if (title) {
      title.textContent = "GAME OVER";
    }

    if (description) {
      description.textContent =
        "Skor kamu " + pad(score) +
        ". Coba lagi dan pecahkan rekor terbaikmu!";
    }

    startBtn.innerHTML = 'MAIN LAGI <span>↻</span>';

    setStatus("FINISHED", "RUN COMPLETE");

    // Pastikan rekor tersimpan
    if (score > best) {
      best = score;

      localStorage.setItem("neonDashBest", String(best));

      bestEl.textContent = pad(best);
    }

    updateScore(score);
  }

  // HUBUNGKAN CALLBACK DENGAN GAME.JS
  // game.js harus memiliki setter onScore dan onOver.
  if (window.NeonGame) {
    NeonGame.onScore = updateScore;
    NeonGame.onOver = gameOver;
  } else {
    console.error(
      "NeonGame tidak ditemukan. Pastikan game.js dimuat sebelum main.js."
    );
  }

  // Tombol mulai
  startBtn.addEventListener("click", startGame);

  // Tombol restart
  restartBtn.addEventListener("click", () => {
    if (window.GameAudio) {
      GameAudio.init();
      GameAudio.click();
    }

    if (window.NeonGame) {
      NeonGame.reset();
    }

    scoreEl.textContent = "00000";

    if (title) {
      title.textContent = "SIAP BERGERAK?";
    }

    if (description) {
      description.textContent =
        "Klik mulai atau tekan spasi untuk memulai permainan.";
    }

    startBtn.innerHTML = 'MULAI GAME <span>↗</span>';

    overlay.classList.remove("hidden");

    setStatus("IDLE", "READY TO PLAY");

    updateDifficulty(0);

    bestBar.style.width = "0%";
  });

  // Klik canvas untuk melompat
  const canvas = $("gameCanvas");

  if (canvas) {
    canvas.addEventListener("pointerdown", () => {
      if (
        window.NeonGame &&
        NeonGame.isRunning()
      ) {
        if (window.GameAudio) {
          GameAudio.init();
        }

        NeonGame.jump();
      }
    });
  }

  // Keyboard: Space, Arrow Up, dan W
  document.addEventListener("keydown", event => {
    if (
      !["Space", "ArrowUp", "KeyW"].includes(event.code)
    ) {
      return;
    }

    event.preventDefault();

    if (event.repeat) return;

    if (window.GameAudio) {
      GameAudio.init();
    }

    if (!window.NeonGame) return;

    if (
      !NeonGame.isRunning() &&
      !overlay.classList.contains("hidden")
    ) {
      startGame();
    } else {
      NeonGame.jump();
    }
  });

  // Tombol audio ON/OFF
  if (soundToggle && window.GameAudio) {
    soundToggle.addEventListener("click", () => {
      GameAudio.init();

      const enabled = GameAudio.toggle();
      const soundState = $("soundState");

      if (soundState) {
        soundState.textContent =
          enabled ? "SOUND ON" : "SOUND OFF";
      }

      soundToggle.style.color =
        enabled ? "#dfe5ff" : "#ff8aa9";

      if (enabled) {
        GameAudio.click();
      }
    });
  }

  // Tampilkan skor awal
  updateScore(0);
  setStatus("IDLE", "READY TO PLAY");
})();
