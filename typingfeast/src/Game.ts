import * as THREE from 'three';
import { InputHandler } from './core/InputHandler';
import { PerformanceTracker } from './core/PerformanceTracker';
import { StylishTextRenderer } from './core/StylishTextRenderer';
import { StatsDisplay } from './core/StatsDisplay';
import { Player } from './core/Player';
import { NPCController } from './core/NPCController';
import { wordList as defaultWordList } from './data/wordlist';

export class Game {
    private renderer: THREE.WebGLRenderer;
    private clock: THREE.Clock;
    private players: Player[] = [];
    private npcControllers: NPCController[] = [];
    private textRenderer: StylishTextRenderer;
    private statsDisplays: StatsDisplay[] = [];
    private humanPlayer: Player;

    constructor(private container: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.container.appendChild(this.renderer.domElement);
        this.clock = new THREE.Clock();
        this.textRenderer = new StylishTextRenderer();
        this.humanPlayer = new Player(this.textRenderer);
        this.players.push(this.humanPlayer);

        for (let i = 0; i < 2; i++) {
            const npcPlayer = new Player(this.textRenderer);
            this.players.push(npcPlayer);
            this.npcControllers.push(new NPCController(npcPlayer, 5 + Math.random() * 5, 0.9));
        }

        this.players.forEach((player, index) => {
            this.statsDisplays.push(new StatsDisplay(index, player === this.humanPlayer));
        });

        this.setupRenderer();
    }

    private setupRenderer(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    private onWindowResize(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.updatePlayerCameras();
    }

    private updatePlayerCameras(): void {
        const targetAspectRatio = 4.0 / 3.0;
        this.players.forEach(player => {
            player.camera.aspect = targetAspectRatio;
            player.camera.updateProjectionMatrix();
        });
    }

    public async start(): Promise<void> {
        this.humanPlayer.inputHandler.initialize();
        await this.textRenderer.initialize();

        const wordList = await this.fetchWords();

        for (const player of this.players) {
            await player.initialize(wordList);
        }

        this.statsDisplays.forEach(display => display.show());
        this.updatePlayerCameras(); 
        this.animate();
    }

    private async fetchWords(): Promise<string[]> {
        try {
            const response = await fetch('https://api.datamuse.com/words?rel_trg=computer&max=200');
            if (!response.ok) {
                return defaultWordList;
            }
            const data = await response.json();
            return data.map((item: { word: string }) => item.word);
        } catch (error) {
            console.error('Error fetching word list:', error);
            return defaultWordList;
        }
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();

        this.players.forEach((player, index) => {
            player.update(deltaTime);
            if (index > 0) { // human player is at index 0
                this.npcControllers[index - 1]?.update(deltaTime);
            }
            player.performanceTracker.update();
            const stats = player.performanceTracker.getCurrentStats();
            this.statsDisplays[index].update(stats);
        });

        const width = window.innerWidth;
        const height = window.innerHeight;
        const nPlayers = this.players.length;
        const viewWidth = width / nPlayers;
        const targetAspectRatio = 4.0 / 3.0;

        this.renderer.setScissorTest(true);
        this.renderer.setClearColor(0x000000, 1);

        const playerInfo = this.players.map((player, index) => ({ player, originalIndex: index }));

        const humanPlayerIndex = playerInfo.findIndex(info => info.player === this.humanPlayer);
        if (humanPlayerIndex !== -1) {
            const humanPlayerInfo = playerInfo.splice(humanPlayerIndex, 1)[0];
            const middleIndex = Math.floor(nPlayers / 2);
            playerInfo.splice(middleIndex, 0, humanPlayerInfo);
        }

        playerInfo.forEach(({ player, originalIndex }, displayIndex) => {
            const left = displayIndex * viewWidth;

            let viewportWidth = viewWidth;
            let viewportHeight = viewportWidth / targetAspectRatio;

            if (viewportHeight > height) {
                viewportHeight = height;
                viewportWidth = viewportHeight * targetAspectRatio;
            }

            const offsetX = (viewWidth - viewportWidth) / 2;
            const offsetY = (height - viewportHeight) / 2;

            this.renderer.setScissor(left + offsetX, offsetY, viewportWidth, viewportHeight);
            this.renderer.setViewport(left + offsetX, offsetY, viewportWidth, viewportHeight);
            this.renderer.clear();
            this.renderer.render(player.scene, player.camera);

            this.statsDisplays[originalIndex].setPosition(`${left + offsetX + 5}px`, `${offsetY + 5}px`);
        });

        this.renderer.setScissorTest(false);
    }
}
