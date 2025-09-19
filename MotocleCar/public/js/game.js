class CarRacing {
    constructor() {
        // Configurar el lienzo
        this.canvas = document.getElementById("gameCanvas");
        this.ctx = this.canvas.getContext("2d");
        this.base_width = 800;
        this.base_height = 1510;
        this.scale = 1;
        this.resizeCanvas();

        this.black = "#000000";
        this.white = "#FFFFFF";
        this.red = "#FF0000";
        this.green = "#000000";
        this.gray = "#808080";
        this.fps = 90;
        this.paused = false;
        this.gameLoopId = null; // Inicializar gameLoopId
        this.userId = null; // Inicializar userId, se asignará desde el login o backend

        // Fondos
        this.backgrounds = [
            "images/funds/fondo.png",
            "images/funds/fondoTarde.png",
            "images/funds/fondoNoche.png"
        ];
        this.currentBackgroundIndex = 0;
        this.backgroundImages = this.backgrounds.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        // Carro jugador
        this.playerCarImage = new Image();
        this.playerCarImage.src = "images/cars/motocle.png";

        // Enemigos
        this.enemyCarImages = [
            new Image(), new Image(), new Image(), new Image(), new Image()
        ];
        this.enemyCarImages[0].src = "images/cars/combi.png";
        this.enemyCarImages[1].src = "images/cars/carro.png";
        this.enemyCarImages[2].src = "images/cars/hinfinitum.png";
        this.enemyCarImages[3].src = "images/cars/moto.png";
        this.enemyCarImages[4].src = "images/cars/bici.png";

        // Logos
        this.elitLogo = new Image(); this.elitLogo.src = "images/logos/elit.png";
        this.congresoLogo = new Image(); this.congresoLogo.src = "images/logos/LogoCongreso.png";

        // Imágenes de profes (crash)
        this.crashImages = [new Image(), new Image(), new Image(), new Image(), new Image()];
        this.crashImages[0].src = "images/professors/Pedraza.png";
        this.crashImages[1].src = "images/professors/Elvis.png";
        this.crashImages[2].src = "images/professors/Julio.png";
        this.crashImages[3].src = "images/professors/Victor.png";
        this.crashImages[4].src = "images/cars/bici.png";

        // Pool de enemigos
        this.enemyPool = [0,1,2,3,4];
        this.shuffleEnemies();

        // Control de intervalo de spawn
        this.lastSpawnTime = 0;
        this.minSpawnInterval = 500; // 500ms entre spawns

        this.initialize();

        // Intentar obtener userId desde el login primero
        this.loadUserIdFromLogin();
        // Si no se obtuvo desde el login, consultar al backend
        if (this.userId === null) {
            this.fetchUserId();
        }

        // Configurar WebSocket para el backend
        this.socket = new WebSocket('ws://localhost:8080'); // Para pruebas locales
        // Para producción: this.socket = new WebSocket('wss://tu-backend.railway.app');
        this.socket.onopen = () => console.log('Conectado al backend');
        this.socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Respuesta del backend:', data);
            if (data.success) {
                console.log('Puntaje guardado con ID:', data.id);
            } else {
                console.error('Error al guardar puntaje:', data.error);
            }
        };
        this.socket.onerror = (error) => console.error('Error en WebSocket:', error);
        this.socket.onclose = () => console.log('Desconectado del backend');

        // Eventos teclado
        this.keys = {};
        window.addEventListener("keydown", (e) => {
            this.keys[e.key] = true;
            if (this.backgroundMusic && this.backgroundMusic.paused) this.backgroundMusic.play();
        });
        window.addEventListener("keyup", (e) => this.keys[e.key] = false);

        // Táctiles
        this.touchStartX = null; this.touchStartY = null;
        this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
        this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e));
        this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e));

        // Resize
        window.addEventListener("resize", () => this.resizeCanvas());

        // Música
        this.songs = [
            "sounds/elAmordeSuVida.mp3",
            "sounds/hablamedeti.mp3",
            "sounds/coqueta.mp3",
            "sounds/lasnoches.mp3",
            "sounds/MALPORTA.mp3",
            "sounds/SabanasBlancas.mp3",
            "sounds/Secunena.mp3",
            "sounds/MIÉNTELE.mp3",
            "sounds/TUSANCHO.mp3",
            "sounds/CAPERUZA.mp3",
            "sounds/SERPIENTE.mp3",
            "sounds/goosebumps.mp3",
            "sounds/ENALTAVOZ.mp3"
        ];
        this.songPool = Array.from({length: this.songs.length}, (_, i) => i);
        this.shuffleSongs();
        this.currentSongIndex = 0;
        this.backgroundMusic = new Audio(this.songs[this.songPool[this.currentSongIndex]]);
        this.backgroundMusic.loop = true;
        this.backgroundMusic.volume = 0.5;

        // Botones música
        const pauseBtn = document.getElementById("pauseBtn");
        const nextBtn = document.getElementById("nextBtn");
        if (pauseBtn) {
            pauseBtn.addEventListener("click", () => {
                this.paused = !this.paused;
                if (this.paused) {
                    this.backgroundMusic.pause();
                } else {
                    this.backgroundMusic.play();
                }
            });
        }
        if (nextBtn) {
            nextBtn.addEventListener("click", () => {
                this.backgroundMusic.pause();
                this.currentSongIndex++;
                if (this.currentSongIndex >= this.songPool.length) {
                    this.shuffleSongs();
                    this.currentSongIndex = 0;
                }
                this.backgroundMusic.src = this.songs[this.songPool[this.currentSongIndex]];
                this.backgroundMusic.play();
            });
        }
    }

    // Método para cargar userId desde el sistema de login existente
    loadUserIdFromLogin() {
        // Prioridad 1: localStorage (persiste entre sesiones)
        const storedUserId = localStorage.getItem('userId');
        if (storedUserId) {
            this.userId = BigInt(storedUserId);
            console.log('UserId cargado desde localStorage:', this.userId);
            return;
        }

        // Prioridad 2: sessionStorage (solo sesión actual)
        const sessionUserId = sessionStorage.getItem('userId');
        if (sessionUserId) {
            this.userId = BigInt(sessionUserId);
            console.log('UserId cargado desde sessionStorage:', this.userId);
            return;
        }

        // Prioridad 3: Variable global (definida en la página principal)
        if (window.currentUserId) {
            this.userId = BigInt(window.currentUserId);
            console.log('UserId cargado desde variable global:', this.userId);
            return;
        }

        // Prioridad 4: Data attribute en el contenedor del juego (ej. <div data-user-id="123">)
        const gameContainer = document.getElementById('gameContainer') || document.body;
        if (gameContainer.dataset.userId) {
            this.userId = BigInt(gameContainer.dataset.userId);
            console.log('UserId cargado desde data attribute:', this.userId);
            return;
        }

        // No encontrado
        console.log('No se encontró userId desde el login, intentará obtenerlo del backend.');
    }

    // Método para obtener userId desde el backend como fallback
    fetchUserId() {
        fetch('http://localhost:3000/get-user-id', { // Cambia a tu URL de Railway en producción (ej. https://tu-app.railway.app/get-user-id)
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        })
        .then(res => res.json())
        .then(data => {
            if (data.userId) {
                this.userId = BigInt(data.userId); // Asegura que sea BIGINT
                console.log('UserId obtenido del backend:', this.userId);
            } else {
                console.error('No se pudo obtener userId desde el backend:', data.error);
                // Fallback: generar un userId temporal si falla
                this.userId = BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));
                console.log('UserId temporal generado:', this.userId);
            }
        })
        .catch(err => {
            console.error('Error al conectar con el backend para userId:', err);
            // Fallback: generar un userId temporal si falla la conexión
            this.userId = BigInt(Date.now() * 1000 + Math.floor(Math.random() * 1000));
            console.log('UserId temporal generado:', this.userId);
        });
    }

    shuffleSongs() {
        for (let i = this.songPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.songPool[i], this.songPool[j]] = [this.songPool[j], this.songPool[i]];
        }
    }

    shuffleEnemies() {
        for (let i = this.enemyPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.enemyPool[i], this.enemyPool[j]] = [this.enemyPool[j], this.enemyPool[i]];
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.scale = Math.min(
            window.innerWidth / this.base_width,
            window.innerHeight / this.base_height
        );
    }

    initialize() {
        this.car_width = 120;
        this.car_height = 240;
        this.car_x = this.base_width / 2 - this.car_width / 2;
        this.car_y = this.base_height - this.car_height - 20;
        this.car_speed = 4;
        this.enemies = [];
        this.enemy_width = 120;
        this.enemy_height = 240;
        this.enemy_speed = 4;
        this.bg_y = 0;
        this.bg_speed = this.enemy_speed;
        this.score = 0;
        this.game_over = false;
        this.road_width = this.base_width / 2;
        this.road_x = this.base_width / 4;
        this.currentBackgroundIndex = 0;
        this.lastSpawnTime = 0;
        this.spawnEnemy();
    }

    spawnEnemy() {
        if (this.enemyPool.length === 0) {
            this.enemyPool = [0,1,2,3,4];
            this.shuffleEnemies();
        }
        const designIndex = this.enemyPool.pop();
        const hitboxScale = 0.5;
        const maxAttempts = 10;
        const verticalBuffer = this.enemy_height * 2;
        let attempts = 0;
        let enemy_x, validPosition;

        do {
            validPosition = true;
            enemy_x = Math.floor(Math.random() * (this.road_width - this.enemy_width)) + this.road_x;
            const newEnemyRect = {
                x: enemy_x + this.enemy_width * (1 - hitboxScale) / 2,
                y: -this.enemy_height + this.enemy_height * (1 - hitboxScale) / 2,
                width: this.enemy_width * hitboxScale,
                height: this.enemy_height * hitboxScale + verticalBuffer
            };

            for (let existingEnemy of this.enemies) {
                const existingRect = {
                    x: existingEnemy.x + this.enemy_width * (1 - hitboxScale) / 2,
                    y: existingEnemy.y + this.enemy_height * (1 - hitboxScale) / 2,
                    width: this.enemy_width * hitboxScale,
                    height: this.enemy_height * hitboxScale + verticalBuffer
                };
                if (
                    newEnemyRect.x < existingRect.x + existingRect.width &&
                    newEnemyRect.x + newEnemyRect.width > existingRect.x &&
                    newEnemyRect.y < existingRect.y + existingRect.height &&
                    newEnemyRect.y + newEnemyRect.height > existingRect.y
                ) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        } while (!validPosition && attempts < maxAttempts);

        if (validPosition) {
            this.enemies.push({ x: enemy_x, y: -this.enemy_height, designIndex });
            this.lastSpawnTime = Date.now();
        } else {
            this.enemyPool.push(designIndex);
        }
    }

    handleTouchStart(e) {
        e.preventDefault();
        if (this.game_over) {
            this.initialize();
            this.game_over = false;
        } else {
            this.touchStartX = e.touches[0].clientX;
            this.touchStartY = e.touches[0].clientY;
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        if (this.touchStartX !== null && this.touchStartY !== null && !this.game_over) {
            const touchX = e.touches[0].clientX;
            const touchY = e.touches[0].clientY;
            const deltaX = (touchX - this.touchStartX) / this.scale;
            const deltaY = (touchY - this.touchStartY) / this.scale;
            this.car_x += deltaX * 0.8;
            this.car_y += deltaY * 0.8;
            this.touchStartX = touchX;
            this.touchStartY = touchY;
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        this.touchStartX = null;
        this.touchStartY = null;
    }

    draw_objects() {
        const offsetX = (this.canvas.width - this.base_width * this.scale) / 2;
        const offsetY = (this.canvas.height - this.base_height * this.scale) / 2;

        this.ctx.setTransform(this.scale, 0, 0, this.scale, offsetX, offsetY);

        const bgImage = this.backgroundImages[this.currentBackgroundIndex];
        if (bgImage.complete && bgImage.naturalWidth !== 0) {
            this.ctx.drawImage(bgImage, 0, this.bg_y, this.base_width, this.base_height);
            this.ctx.drawImage(bgImage, 0, this.bg_y - this.base_height, this.base_width, this.base_height);
        } else {
            this.ctx.fillStyle = this.green;
            this.ctx.fillRect(0, 0, this.base_width, this.base_height);
        }

        if (this.playerCarImage.complete && this.playerCarImage.naturalWidth !== 0) {
            this.ctx.drawImage(this.playerCarImage, this.car_x, this.car_y, this.car_width, this.car_height);
        } else {
            this.ctx.fillStyle = this.red;
            this.ctx.fillRect(this.car_x, this.car_y, this.car_width, this.car_height);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            const img = this.enemyCarImages[enemy.designIndex];
            if (img && img.complete && img.naturalWidth !== 0) {
                this.ctx.drawImage(img, enemy.x, enemy.y, this.enemy_width, this.enemy_height);
            } else {
                this.ctx.fillStyle = this.white;
                this.ctx.fillRect(enemy.x, enemy.y, this.enemy_width, this.enemy_height);
            }
            if (enemy.y > this.base_height + this.enemy_height) {
                this.enemies.splice(i, 1);
                this.score++;
                if (this.score % 15 === 0) {
                    this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgroundImages.length;
                }
            }
        }

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);

        const hudX = Math.round(offsetX + 10 * this.scale);
        const hudY = Math.round(offsetY + 40 * this.scale);

        const hudFontPx = Math.max(12, Math.round(30 * this.scale));
        this.ctx.font = `${hudFontPx}px Comic Sans MS`;
        this.ctx.fillStyle = this.white;
        this.ctx.textAlign = "left";
        this.ctx.fillText(`Puntaje: ${this.score}`, hudX, hudY);
    }

    display_message(msg) {
        this.game_over = true;

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.ctx.fillStyle = this.black;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const offsetX = (this.canvas.width - this.base_width * this.scale) / 2;
        const offsetY = (this.canvas.height - this.base_height * this.scale) / 2;

        this.ctx.setTransform(this.scale, 0, 0, this.scale, offsetX, offsetY);

        const baseY = this.base_height / 2 - 400;
        this.ctx.font = `bold 72px Comic Sans MS`;
        this.ctx.fillStyle = this.white;
        this.ctx.textAlign = "center";
        this.ctx.fillText(msg, this.base_width / 2, baseY);

        this.ctx.font = `40px Comic Sans MS`;
        this.ctx.fillText(`Puntaje final: ${this.score}`, this.base_width / 2, baseY + 70);

        this.ctx.font = `30px Comic Sans MS`;
        this.ctx.fillText("Toca la pantalla o F para reiniciar", this.base_width / 2, baseY + 130);

        if (this.crashEnemy !== undefined) {
            const crashImg = this.crashImages[this.crashEnemy];
            if (crashImg && crashImg.complete) {
                this.ctx.drawImage(crashImg, this.base_width / 2 - 200, baseY + 180, 400, 500);
            }
        }

        if (this.elitLogo && this.elitLogo.complete) {
            const logoSize = 100;
            this.ctx.drawImage(this.elitLogo, this.base_width - logoSize - 10, this.base_height - logoSize - 10, logoSize, logoSize);
        }
        if (this.congresoLogo && this.congresoLogo.complete) {
            const logoSize = 120;
            this.ctx.drawImage(this.congresoLogo, 10, this.base_height - logoSize - 10, logoSize, logoSize);
        }

        // Enviar puntaje al servidor solo si userId está asignado
        if (this.userId !== null) {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ userId: Number(this.userId), score: this.score }));
                console.log('Puntaje enviado via WebSocket:', { userId: this.userId, score: this.score });
            } else {
                console.log('WebSocket no disponible, intentando HTTP...');
                fetch('https://tu-backend.railway.app/save-score', { // Cambia a tu URL de Railway
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: Number(this.userId), score: this.score })
                })
                .then(res => res.json())
                .then(data => console.log('Puntaje guardado via HTTP:', data))
                .catch(err => console.error('Error al enviar puntaje via HTTP:', err));
            }
        } else {
            console.error('No se pudo enviar puntaje: userId no asignado');
        }

        this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    check_collision() {
        const hitboxScale = 0.5;
        const car_rect = {
            x: this.car_x + this.car_width * (1 - hitboxScale) / 2,
            y: this.car_y + this.car_height * (1 - hitboxScale) / 2,
            width: this.car_width * hitboxScale,
            height: this.car_height * hitboxScale
        };
        for (let enemy of this.enemies) {
            const enemy_rect = {
                x: enemy.x + this.enemy_width * (1 - hitboxScale) / 2,
                y: enemy.y + this.enemy_height * (1 - hitboxScale) / 2,
                width: this.enemy_width * hitboxScale,
                height: this.enemy_height * hitboxScale
            };
            if (car_rect.x < enemy_rect.x + enemy_rect.width &&
                car_rect.x + car_rect.width > enemy_rect.x &&
                car_rect.y < enemy_rect.y + enemy_rect.height &&
                car_rect.y + car_rect.height > enemy_rect.y) {
                this.crashEnemy = enemy.designIndex;
                return true;
            }
        }
        return false;
    }

    update() {
        if (!this.game_over) {
            if (this.keys["ArrowLeft"]) this.car_x -= this.car_speed;
            if (this.keys["ArrowRight"]) this.car_x += this.car_speed;
            if (this.keys["ArrowUp"]) this.car_y -= this.car_speed;
            if (this.keys["ArrowDown"]) this.car_y += this.car_speed;
            if (this.paused) return;

            this.car_x = Math.max(this.road_x, Math.min(this.car_x, this.road_x + this.road_width - this.car_width));
            this.car_y = Math.max(0, Math.min(this.car_y, this.base_height - this.car_height));

            for (let enemy of this.enemies) enemy.y += this.enemy_speed;
            const currentTime = Date.now();
            if (Math.random() < 0.01 && currentTime - this.lastSpawnTime >= this.minSpawnInterval) {
                this.enemy_speed += 0.1;
                this.spawnEnemy();
            }

            this.bg_y += this.bg_speed;
            if (this.bg_y >= this.base_height) this.bg_y = 0;

            if (this.check_collision()) {
                this.display_message("¡Choque! Fin del juego");
                return;
            }

            this.draw_objects();
        } else {
            this.display_message("¡Choque! Fin del juego");
        }

        if (this.game_over && (this.keys["f"] || this.keys["F"])) {
            this.initialize();
            this.game_over = false;
        }
    }

    run() {
        const gameLoop = () => {
            if (!this.game_over && !this.paused) {
                this.update();
            } else if (this.game_over) {
                this.update(); // Mantener el mensaje visible
            }
            setTimeout(() => requestAnimationFrame(gameLoop), 1000 / this.fps);
        };
        requestAnimationFrame(gameLoop);
    }

    gameLoop() { this.run(); }
}

// Iniciar el juego
const game = new CarRacing();
game.run();

