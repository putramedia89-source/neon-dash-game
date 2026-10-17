
(() => {
  const canvas = document.getElementById("gameCanvas");

  if (!canvas) {
    console.error('Canvas dengan ID "gameCanvas" tidak ditemukan!');
    return;
  }

  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;
  const groundY = 405;

  const game = {
    running: false,
    over: false,
    score: 0,
    speed: 5,
    frame: 0,
    distance: 0,
    obstacles: [],
    particles: [],
    stars: [],
    onScore: null,
    onOver: null,
    lastTime: 0
  };

  const player = {
    x: 125,
    y: groundY - 34,
    w: 28,
    h: 34,
    vy: 0,
    grounded: true
  };

  const random = (min, max) =>
    Math.random() * (max - min) + min;

  // Membuat bintang latar
  for (let i = 0; i < 65; i++) {
    game.stars.push({
      x: Math.random() * W,
      y: Math.random() * groundY,
      r: random(0.3, 1.8),
      a: random(0.2, 0.8)
    });
  }

  // Menggambar kotak dengan sudut membulat
  function rect(x, y, w, h, r, fill, stroke) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);

    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }

    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.stroke();
    }
  }

  // Efek partikel neon
  function particles(x, y, amount, color) {
    for (let i = 0; i < amount; i++) {
      game.particles.push({
        x,
        y,
        vx: random(-2.5, 2.5),
        vy: random(-3, 0),
        life: random(15, 28),
        max: 28,
        size: random(1, 3),
        color
      });
    }
  }

  // Memperbarui tampilan skor
  function updateScore() {
    if (typeof game.onScore === "function") {
      game.onScore(game.score);
    }
  }

  // Reset game
  function reset() {
    game.running = false;
    game.over = false;
    game.score = 0;
    game.speed = 5;
    game.frame = 0;
    game.distance = 0;
    game.obstacles = [];
    game.particles = [];

    player.y = groundY - player.h;
    player.vy = 0;
    player.grounded = true;

    updateScore();
    draw();
  }

  // Memulai game
  function start() {
    if (game.running) return;

    if (game.over) {
      reset();
    }

    game.running = true;
    game.over = false;
    game.lastTime = performance.now();

    requestAnimationFrame(loop);
  }

  // Melompat
  function jump() {
    if (!game.running) {
      if (game.over) return;

      start();
    }

    if (player.grounded) {
      player.vy = -13.8;
      player.grounded = false;

      particles(
        player.x + 14,
        player.y + player.h,
        7,
        "#50f5e2"
      );

      if (window.GameAudio) {
        window.GameAudio.jump();
      }
    }
  }

  // Membuat rintangan
  function spawnObstacle() {
    const tall = Math.random() > 0.48;

    const h = tall ? random(35, 58) : random(24, 34);
    const w = tall ? random(20, 29) : random(30, 42);

    game.obstacles.push({
      x: W + 15,
      y: groundY - h,
      w,
      h,
      passed: false,
      glow: Math.random() > 0.5
        ? "#ff4fd8"
        : "#8b5cf6"
    });
  }

  // Memperbarui kondisi game
  function update(dt) {
    const scale = dt / 16.67;

    game.frame += scale;
    game.distance += game.speed * scale;

    // Kecepatan bertambah mengikuti skor
    game.speed = Math.min(10.5, 5 + game.score / 420);

    const spawnRate = Math.max(
      40,
      Math.floor(88 - game.speed * 3)
    );

    if (game.frame % spawnRate < scale) {
      spawnObstacle();
    }

    // Fisika karakter
    player.vy += 0.68 * scale;
    player.y += player.vy * scale;

    if (player.y + player.h >= groundY) {
      player.y = groundY - player.h;
      player.vy = 0;
      player.grounded = true;
    }

    // Pergerakan dan deteksi rintangan
    for (const o of game.obstacles) {
      o.x -= game.speed * scale;

      // SKOR BERTAMBAH SAAT RINTANGAN DILEWATI
      if (!o.passed && o.x + o.w < player.x) {
        o.passed = true;
        game.score += 10;

        // Memperbarui tampilan skor di main.js
        updateScore();

        // Efek partikel saat mendapat skor
        particles(o.x, o.y, 4, "#ff4fd8");
      }

      // Deteksi tabrakan
      const pad = 5;

      const hit =
        player.x + player.w - pad > o.x + 5 &&
        player.x + pad < o.x + o.w - 3 &&
        player.y + player.h - pad > o.y + 4;

      if (hit) {
        game.running = false;
        game.over = true;

        particles(
          player.x + 14,
          player.y + 15,
          24,
          "#ff4fd8"
        );

        if (window.GameAudio) {
          window.GameAudio.hit();
        }

        // Memberi tahu main.js bahwa game berakhir
        if (typeof game.onOver === "function") {
          game.onOver(game.score);
        }

        return;
      }
    }

    // Menghapus rintangan di luar layar
    game.obstacles = game.obstacles.filter(
      o => o.x + o.w > -10
    );

    // Memperbarui partikel
    for (const p of game.particles) {
      p.x += p.vx * scale;
      p.y += p.vy * scale;
      p.vy += 0.1 * scale;
      p.life -= scale;
    }

    game.particles = game.particles.filter(
      p => p.life > 0
    );
  }

  // Menggambar seluruh tampilan game
  function draw() {
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#0b1020");
    bg.addColorStop(1, "#080b14");

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // Cahaya latar
    const glow = ctx.createRadialGradient(
      500, 180, 10,
      500, 180, 400
    );

    glow.addColorStop(0, "#36236b30");
    glow.addColorStop(1, "#080b1400");

    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    // Bintang
    for (const s of game.stars) {
      ctx.globalAlpha =
        s.a * (0.7 + 0.3 * Math.sin(game.frame * 0.04 + s.x));

      ctx.fillStyle = "#c8d8ff";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;

    // Grid futuristik
    ctx.strokeStyle = "#8b9cff0b";
    ctx.lineWidth = 1;

    for (let x = 0; x < W; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, groundY);
      ctx.stroke();
    }

    for (let y = 35; y < groundY; y += 35) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Lantai neon
    ctx.fillStyle = "#50f5e208";
    ctx.fillRect(0, groundY, W, H - groundY);

    ctx.strokeStyle = "#50f5e2";
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(W, groundY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Garis lantai bergerak
    for (
      let x = -(game.distance % 48);
      x < W;
      x += 48
    ) {
      ctx.fillStyle = "#50f5e22b";
      ctx.fillRect(x, groundY + 18, 24, 2);
    }

    // Rintangan neon
    for (const o of game.obstacles) {
      ctx.shadowBlur = 17;
      ctx.shadowColor = o.glow;

      rect(
        o.x, o.y, o.w, o.h, 5,
        o.glow + "40",
        o.glow
      );

      ctx.shadowBlur = 0;
      ctx.fillStyle = o.glow;

      ctx.fillRect(
        o.x + 5,
        o.y + 7,
        3,
        Math.max(5, o.h - 14)
      );
    }

    // Bayangan karakter
    ctx.fillStyle = "#50f5e222";
    ctx.beginPath();

    ctx.ellipse(
      player.x + 14,
      groundY + 2,
      22 * Math.max(
        0.55,
        1 - (groundY - player.y - player.h) / 100
      ),
      4,
      0, 0, Math.PI * 2
    );

    ctx.fill();

    // Karakter neon
    ctx.save();

    ctx.shadowBlur = 22;
    ctx.shadowColor = "#50f5e2";

    rect(
      player.x,
      player.y,
      player.w,
      player.h,
      7,
      "#50f5e2"
    );

    ctx.shadowBlur = 0;

    // Mata karakter
    rect(
      player.x + 7,
      player.y + 8,
      15, 9, 3,
      "#0c2430"
    );

    ctx.fillStyle = "#fff";
    ctx.fillRect(
      player.x + 17,
      player.y + 10,
      3, 3
    );

    // Kaki karakter
    ctx.fillStyle = "#0c2430";
    ctx.fillRect(player.x + 7, player.y + 25, 5, 5);
    ctx.fillRect(player.x + 17, player.y + 25, 5, 5);

    ctx.restore();

    // Partikel
    for (const p of game.particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, p.size, p.size);
    }

    ctx.globalAlpha = 1;
  }

  // Loop utama game
  function loop(now) {
    if (!game.running) {
      draw();
      return;
    }

    const dt = Math.min(
      32,
      now - game.lastTime || 16.67
    );

    game.lastTime = now;

    update(dt);
    draw();

    if (game.running) {
      requestAnimationFrame(loop);
    }
  }

  // Animasi latar saat game belum dimulai
  function idleLoop() {
    if (!game.running) {
      game.frame += 0.5;
      draw();
    }

    requestAnimationFrame(idleLoop);
  }

  // API game untuk digunakan main.js
  window.NeonGame = {
    start,
    jump,
    reset,
    isRunning: () => game.running,

    // Perbaikan koneksi callback skor
    set onScore(callback) {
      game.onScore = callback;
    },

    // Perbaikan koneksi callback Game Over
    set onOver(callback) {
      game.onOver = callback;
    }
  };

  // Gambar awal dan mulai animasi latar
  updateScore();
  draw();
  requestAnimationFrame(idleLoop);
})();
