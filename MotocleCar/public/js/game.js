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

        //fondos
        this.backgrounds = [
            "imagenes/fondos/fondo.png",        //día
            "imagenes/fondos/fondoTarde.png",  //tarde
            "imagenes/fondos/fondoNoche.png"   //noche
        ];
        this.currentBackgroundIndex = 0;

        // Cargar imágenes de los fondos
        this.backgroundImages = this.backgrounds.map(src => {
            const img = new Image();
            img.src = src;
            return img;
        });

        //carro motocle
        this.playerCarImage = new Image();
        this.playerCarImage.src = "imagenes/carros/motocle.png";

        //enemigos
        this.enemyCarImages = [
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image()
        ];
        this.enemyCarImages[0].src = "imagenes/carros/combi.png"; 
        this.enemyCarImages[1].src = "imagenes/carros/carro.png";
        this.enemyCarImages[2].src = "imagenes/carros/hinfinitum.png"; 
        this.enemyCarImages[3].src = "imagenes/carros/moto.png";
        this.enemyCarImages[4].src = "imagenes/carros/bici.png";

        //logo elit
        this.elitLogo = new Image(); 
        this.elitLogo.src = "imagenes/logos/elit.png";
        this.elitLogo.onerror = () => {
            console.error("Error al cargar elit.png en el constructor");
        };
        //logo congreso
        this.congresoLogo = new Image();
        this.congresoLogo.src = "imagenes/logos/LogoCongreso.png";
        this.congresoLogo.onerror = () => {
            console.error("Error al cargar congreso.png en el constructor");
        };
        //imaagenes de los profes
        this.crashImages = [
            new Image(),
            new Image(),
            new Image(),
            new Image(),
            new Image()
        ];

        //profes 
        this.crashImages[0].src = "imagenes/profes/Pedraza.png";
        this.crashImages[1].src = "imagenes/profes/Elvis.png";
        this.crashImages[2].src = "imagenes/profes/Julio.png";
        this.crashImages[3].src = "imagenes/profes/Victor.png";
        this.crashImages[4].src = "imagenes/carros/bici.png";

        //lista de enemigos rebueltos
        this.enemyPool = [0, 1, 2, 3, 4];
        this.shuffleEnemies();

        this.initialize();

        // Manejo de eventos de teclado
        this.keys = {};
        window.addEventListener("keydown", (e) => this.keys[e.key] = true);
        window.addEventListener("keyup", (e) => this.keys[e.key] = false);

        // Manejo de eventos táctiles
        this.touchStartX = null;
        this.touchStartY = null;
        this.canvas.addEventListener("touchstart", (e) => this.handleTouchStart(e));
        this.canvas.addEventListener("touchmove", (e) => this.handleTouchMove(e));
        this.canvas.addEventListener("touchend", (e) => this.handleTouchEnd(e));

        // Ajustar lienzo al cambiar tamaño de ventana
        window.addEventListener("resize", () => this.resizeCanvas());

        // WebSocket para guardar puntajes
        this.socket = new WebSocket('ws://localhost:8080');
        this.userId = prompt('Ingresa tu nombre de usuario') || 'Anonymous';
        this.socket.onopen = () => console.log('Conectado al servidor WebSocket');
        this.socket.onerror = (error) => console.error('Error en WebSocket:', error);
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
        this.display_width = this.canvas.width;
        this.display_height = this.canvas.height;
    }

    initialize() {
        this.car_width = 120 * this.scale;
        this.car_height = 240 * this.scale;
        this.car_x = this.base_width / 2 - this.car_width / 2;
        this.car_y = this.base_height - this.car_height - 20 * this.scale;
        this.car_speed = 8 * this.scale;
        this.enemies = [];
        this.enemy_width = 120 * this.scale;
        this.enemy_height = 240 * this.scale;
        this.enemy_speed = 10 * this.scale;
        this.bg_y = 0;
        this.bg_speed = 10 * this.scale;
        this.score = 0;
        this.game_over = false;
        this.road_width = this.base_width / 2;
        this.road_x = this.base_width / 4;
        this.touchStartX = null;
        this.touchStartY = null;

        this.currentBackgroundIndex = 0;
        this.enemyPool = [0, 1, 2, 3, 4];
        this.shuffleEnemies();

        this.spawnEnemy();
    }

    spawnEnemy() {
        const maxAttempts = 10;
        let attempts = 0;
        let validPosition = false;
        let enemy_x;

        if (this.enemyPool.length === 0) {
            this.enemyPool = [0, 1, 2, 3, 4];
            this.shuffleEnemies();
        }
        const designIndex = this.enemyPool.pop();

        while (!validPosition && attempts < maxAttempts) {
            enemy_x = Math.floor(Math.random() * (this.road_width - this.enemy_width)) + this.road_x;
            validPosition = true;

            const minHorizontalDistance = this.enemy_width;
            const minVerticalDistance = this.enemy_height * 2;

            for (let enemy of this.enemies) {
                const horizontalOverlap = Math.abs(enemy_x - enemy.x) < minHorizontalDistance;
                const verticalOverlap = Math.abs(-this.enemy_height - enemy.y) < minVerticalDistance;
                if (horizontalOverlap && verticalOverlap) {
                    validPosition = false;
                    break;
                }
            }
            attempts++;
        }

        if (validPosition) {
            this.enemies.push({ x: enemy_x, y: -this.enemy_height, designIndex: designIndex });
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
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);

        const bgImage = this.backgroundImages[this.currentBackgroundIndex];
        if (bgImage.complete && bgImage.naturalWidth !== 0) {
            this.ctx.drawImage(bgImage, 0, this.bg_y, this.base_width, this.base_height);
            this.ctx.drawImage(bgImage, 0, this.bg_y - this.base_height, this.base_width, this.base_height);
        } else {
            this.ctx.fillStyle = this.green;
            this.ctx.fillRect(0, 0, this.base_width, this.base_height);
        }

        if (this.playerCarImage.complete && this.playerCarImage.naturalWidth !== 0) {
            this.ctx.drawImage(this.playerCarImage, this.car_x, this.car_y, this.car_width / this.scale, this.car_height / this.scale);
        } else {
            this.ctx.fillStyle = this.red;
            this.ctx.fillRect(this.car_x, this.car_y, this.car_width / this.scale, this.car_height / this.scale);
        }

        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            if (this.enemyCarImages[enemy.designIndex] && this.enemyCarImages[enemy.designIndex].complete && this.enemyCarImages[enemy.designIndex].naturalWidth !== 0) {
                this.ctx.drawImage(this.enemyCarImages[enemy.designIndex], enemy.x, enemy.y, this.enemy_width / this.scale, this.enemy_height / this.scale);
            } else {
                this.ctx.fillStyle = this.white;
                this.ctx.fillRect(enemy.x, enemy.y, this.enemy_width / this.scale, this.enemy_height / this.scale);
            }
            if (enemy.y > this.base_height + this.enemy_height) {
                this.enemies.splice(i, 1);
                this.score += 1;
                if (this.score % 15 === 0) {//cambiar el fondo segun los puntos
                    this.currentBackgroundIndex = (this.currentBackgroundIndex + 1) % this.backgroundImages.length;
                }
            }
        }

        this.ctx.font = `${50}px Comic Sans MS`;
        this.ctx.fillStyle = this.white;
        this.ctx.fillText(`Puntaje: ${this.score}`, 10, 40);

        this.ctx.restore();
    }

    display_message(msg) {
        this.game_over = true;
        this.ctx.save();
        this.ctx.scale(this.scale, this.scale);
        this.ctx.fillStyle = this.black;
        this.ctx.fillRect(0, 0, this.base_width, this.base_height);

        //para mover el texto e imagen
        const baseY = this.base_height / 2 - 400;  

        this.ctx.font = `bold ${72}px Comic Sans MS`;
        this.ctx.fillStyle = this.white;
        this.ctx.textAlign = "center";
        this.ctx.fillText(msg, this.base_width / 2, baseY);

        //puntaje
        this.ctx.font = `${40}px Comic Sans MS`;
        this.ctx.fillText(`Puntaje final: ${this.score}`, this.base_width / 2, baseY + 70);

        this.ctx.font = `${30}px Comic Sans MS`;
        this.ctx.fillText("Toca la pantalla o F para reiniciar", this.base_width / 2, baseY + 130);

        //imagen del profe 
        if (this.crashEnemy !== undefined) {
            const crashImg = this.crashImages[this.crashEnemy];
            if (crashImg && crashImg.complete && crashImg.naturalWidth !== 0) {
                const imgWidth = 400;
                const imgHeight = 500;
                const posX = this.base_width / 2 - imgWidth / 2;
                const posY = baseY + 180;
                this.ctx.drawImage(crashImg, posX, posY, imgWidth, imgHeight);
            }
        }

        //logos
        if (this.elitLogo.complete && this.elitLogo.naturalWidth !== 0) {
            const logoSize = 100;
            this.ctx.drawImage(this.elitLogo, this.base_width - logoSize - 10, this.base_height - logoSize - 10, logoSize, logoSize);
        }

        if (this.congresoLogo.complete && this.congresoLogo.naturalWidth !== 0) {
            const logoSize = 120;
            this.ctx.drawImage(this.congresoLogo, 10, this.base_height - logoSize - 10, logoSize, logoSize);
        }

        // Enviar puntaje al servidor
        if (this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ userId: this.userId, score: this.score }));
        }

        this.ctx.textAlign = "center";
        this.ctx.restore();
    }

    check_collision() {
        const hitboxScale = 0.5;//hitbox
        const car_rect = {
            x: this.car_x + (this.car_width / this.scale) * (1 - hitboxScale) / 2,
            y: this.car_y + (this.car_height / this.scale) * (1 - hitboxScale) / 2,
            width: (this.car_width / this.scale) * hitboxScale,
            height: (this.car_height / this.scale) * hitboxScale
        };
        for (let enemy of this.enemies) {
            const enemy_rect = {
                x: enemy.x + (this.enemy_width / this.scale) * (1 - hitboxScale) / 2,
                y: enemy.y + (this.enemy_height / this.scale) * (1 - hitboxScale) / 2,
                width: (this.enemy_width / this.scale) * hitboxScale,
                height: (this.enemy_height / this.scale) * hitboxScale
            };
            if (car_rect.x < enemy_rect.x + enemy_rect.width &&
                car_rect.x + car_rect.width > enemy_rect.x &&
                car_rect.y < enemy_rect.y + enemy_rect.height &&
                car_rect.y + car_rect.height > enemy_rect.y) {
                this.crashEnemy = enemy.designIndex;
                return true;
            }    
        }
    }

    update() {
        if (!this.game_over) {
            if (this.keys["ArrowLeft"]) this.car_x -= this.car_speed;
            if (this.keys["ArrowRight"]) this.car_x += this.car_speed;
            if (this.keys["ArrowUp"]) this.car_y -= this.car_speed;
            if (this.keys["ArrowDown"]) this.car_y += this.car_speed;

            this.car_x = Math.max(this.road_x, Math.min(this.car_x, this.road_x + this.road_width - this.car_width / this.scale));
            this.car_y = Math.max(0, Math.min(this.car_y, this.base_height - this.car_height / this.scale));

            for (let enemy of this.enemies) {
                enemy.y += this.enemy_speed;
            }

            if (Math.random() < 0.01) {
                this.enemy_speed += 0.8 * this.scale;//aumento de velocidad
                this.spawnEnemy();
            }

            this.bg_y += this.bg_speed;
            if (this.bg_y >= this.base_height) this.bg_y = 0;

            if (this.check_collision()) {
                this.display_message("¡Choque! Fin del juego");
                return;
            }

            this.draw_objects();
        }

        if (this.game_over && this.keys["f"]) {
            this.initialize();
            this.game_over = false; 
        }
    }

    run() {
        const gameLoop = () => {
            this.update();
            setTimeout(() => requestAnimationFrame(gameLoop), 1000 / this.fps);
        };
        requestAnimationFrame(gameLoop);
    }
}

// Iniciar el juego
const game = new CarRacing();
game.run();