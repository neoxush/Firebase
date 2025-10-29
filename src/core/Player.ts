import * as THREE from 'three';
import { InputHandler } from './InputHandler';
import { PerformanceTracker } from './PerformanceTracker';
import { WordRainMode } from '../modes/WordRainMode';
import { SceneManager } from './SceneManager';
import { StylishTextRenderer } from './StylishTextRenderer';

export class Player {
    public scene: THREE.Scene;
    public camera: THREE.PerspectiveCamera;
    public performanceTracker: PerformanceTracker;
    public inputHandler: InputHandler;
    private sceneManager: SceneManager;
    private wordRainMode: WordRainMode;

    constructor(private textRenderer: StylishTextRenderer) {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.performanceTracker = new PerformanceTracker();
        this.inputHandler = new InputHandler();
        this.sceneManager = new SceneManager(this.scene, this.camera);
    }

    public async initialize(wordList: string[]): Promise<void> {
        await this.sceneManager.initialize();
        const groundY = this.sceneManager.getGroundY();
        this.wordRainMode = new WordRainMode(this.scene, this.inputHandler, this.performanceTracker, this.textRenderer, groundY);
        this.wordRainMode.setWordList(wordList);
        await this.wordRainMode.initialize();
    }

    public update(deltaTime: number): void {
        this.sceneManager.update(deltaTime);
        this.wordRainMode.update(deltaTime);
    }

    public dispose(): void {
        this.wordRainMode.dispose();
        this.sceneManager.dispose();
    }
}
