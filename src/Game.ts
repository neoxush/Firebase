import * as THREE from 'three';
import { InputHandler } from './core/InputHandler';
import { PerformanceTracker } from './core/PerformanceTracker';
import { StylishTextRenderer } from './core/StylishTextRenderer';
import { StatsDisplay } from './core/StatsDisplay';
import { BaseScene } from './scenes/BaseScene';
import { LoadingScene } from './scenes/LoadingScene';
import { GameScene } from './scenes/GameScene';
import { wordList as defaultWordList } from './data/wordlist';

export class Game {
    private renderer: THREE.WebGLRenderer;
    private currentScene!: BaseScene;
    private clock: THREE.Clock;
    private inputHandler: InputHandler;
    private performanceTracker: PerformanceTracker;
    private textRenderer: StylishTextRenderer;
    private statsDisplay: StatsDisplay;

    constructor(private container: HTMLElement) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.container.appendChild(this.renderer.domElement);
        this.clock = new THREE.Clock();
        this.inputHandler = new InputHandler();
        this.performanceTracker = new PerformanceTracker();
        this.textRenderer = new StylishTextRenderer();
        this.statsDisplay = new StatsDisplay();
        this.setupRenderer();
    }

    private setupRenderer(): void {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    private onWindowResize(): void {
        if (this.currentScene) {
            const camera = this.currentScene.getCamera() as THREE.PerspectiveCamera;
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
        }
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    public async start(): Promise<void> {
        this.inputHandler.initialize();
        await this.textRenderer.initialize();

        const loadingScene = new LoadingScene(this.textRenderer);
        await loadingScene.initialize();
        this.currentScene = loadingScene;
        this.statsDisplay.hide();

        this.animate();

        const wordList = await this.fetchWords(
            (progress) => loadingScene.updateProgress(progress),
            (message, success) => loadingScene.updateStatusMessage(message, success)
        );

        const gameScene = new GameScene(this.inputHandler, this.performanceTracker);
        await gameScene.initialize(wordList);

        this.currentScene.dispose();
        this.currentScene = gameScene;
        this.statsDisplay.show();
    }

    private async fetchWords(onProgress: (progress: number) => void, onStatusUpdate: (message: string, success?: boolean) => void): Promise<string[]> {
        onProgress(0.1);
        onStatusUpdate('Attempting to fetch the latest word library...');
        try {
            const response = await fetch('https://api.datamuse.com/words?rel_trg=computer&max=200');
            onProgress(0.6);
            if (!response.ok) {
                onStatusUpdate('Failed to fetch the latest word library. Starting the game with the offline library.', false);
                await new Promise(resolve => setTimeout(resolve, 2000));
                onProgress(1);
                return defaultWordList;
            }
            const data = await response.json();
            const words = data.map((item: { word: string }) => item.word);

            onStatusUpdate('Successfully updated the word library. The game will start shortly.', true);
            await new Promise(resolve => setTimeout(resolve, 1000));
            onProgress(1);
            return words;
        } catch (error) {
            console.error('Error fetching word list:', error);
            onStatusUpdate('Failed to fetch the latest word library. Starting the game with the offline library.', false);
            await new Promise(resolve => setTimeout(resolve, 2000));
            onProgress(1);
            return defaultWordList;
        }
    }

    private animate(): void {
        requestAnimationFrame(this.animate.bind(this));
        const deltaTime = this.clock.getDelta();
        this.currentScene.update(deltaTime);

        if (this.currentScene instanceof GameScene) {
            this.performanceTracker.update();
            const stats = this.performanceTracker.getCurrentStats();
            this.statsDisplay.update(stats);
        }

        this.renderer.render(this.currentScene.getScene(), this.currentScene.getCamera());
    }
}
