import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { WordRainMode } from '../modes/WordRainMode';
import { InputHandler } from '../core/InputHandler';
import { PerformanceTracker } from '../core/PerformanceTracker';
import { SceneManager } from '../core/SceneManager';

export class GameScene extends BaseScene {
    private sceneManager!: SceneManager;
    private wordRainMode!: WordRainMode;
    private inputHandler: InputHandler;
    private performanceTracker: PerformanceTracker;

    constructor(inputHandler: InputHandler, performanceTracker: PerformanceTracker) {
        super();
        this.inputHandler = inputHandler;
        this.performanceTracker = performanceTracker;
    }

    public async initialize(wordList: string[]): Promise<void> {
        this.sceneManager = new SceneManager(this.scene, this.camera);
        await this.sceneManager.initialize();

        const groundY = this.sceneManager.getGroundY();

        this.wordRainMode = new WordRainMode(this.scene, this.inputHandler, this.performanceTracker, groundY);
        this.wordRainMode.setWordList(wordList); // Set the word list
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
