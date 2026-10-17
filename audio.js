
(() => {
  let audioContext = null;
  let masterGain = null;
  let muted = false;

  function init() {
    if (!audioContext) {
      audioContext = new (
        window.AudioContext ||
        window.webkitAudioContext
      )();

      masterGain = audioContext.createGain();
      masterGain.gain.value = muted ? 0 : 0.22;
      masterGain.connect(audioContext.destination);
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }
  }

  function tone(
    frequency,
    duration,
    type = "sine",
    volume = 0.3,
    slide = 0
  ) {
    init();

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, now);

    if (slide !== 0) {
      oscillator.frequency.exponentialRampToValueAtTime(
        Math.max(20, frequency + slide),
        now + duration
      );
    }

    gain.gain.setValueAtTime(0.001, now);

    gain.gain.exponentialRampToValueAtTime(
      Math.max(0.001, volume),
      now + 0.012
    );

    gain.gain.exponentialRampToValueAtTime(
      0.001,
      now + duration
    );

    oscillator.connect(gain);
    gain.connect(masterGain);

    oscillator.start(now);
    oscillator.stop(now + duration + 0.02);
  }

  function click() {
    tone(560, 0.07, "triangle", 0.18, 260);
  }

  function jump() {
    tone(360, 0.12, "sine", 0.24, 420);

    setTimeout(() => {
      tone(720, 0.08, "triangle", 0.11, -100);
    }, 45);
  }

  function score() {
    tone(880, 0.07, "sine", 0.12, 180);
  }

  function hit() {
    tone(190, 0.3, "sawtooth", 0.22, -130);

    setTimeout(() => {
      tone(95, 0.28, "triangle", 0.17, -35);
    }, 90);
  }

  function toggle() {
    muted = !muted;

    if (masterGain && audioContext) {
      masterGain.gain.setTargetAtTime(
        muted ? 0 : 0.22,
        audioContext.currentTime,
        0.03
      );
    }

    return !muted;
  }

  window.GameAudio = {
    init,
    click,
    jump,
    score,
    hit,
    toggle
  };
})();
