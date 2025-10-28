import * as THREE from 'three';
import { BaseScene } from './BaseScene';
import { StylishTextRenderer } from '../core/StylishTextRenderer';

export class LoadingScene extends BaseScene {
    private textRenderer: StylishTextRenderer;
    private loadingBar!: THREE.Mesh;
    private loadingText!: THREE.Group;
    private dot1!: THREE.Group;
    private dot2!: THREE.Group;
    private dot3!: THREE.Group;
    private statusMessageElement: HTMLElement;
    private statusFlagElement: HTMLElement;
    private statusTextElement: HTMLElement;
    private time: number = 0;

    constructor(textRenderer: StylishTextRenderer) {
        super();
        this.textRenderer = textRenderer;
        this.statusMessageElement = document.getElementById('status-messages')!;
        this.statusFlagElement = this.statusMessageElement.querySelector('.status-flag')!;
        this.statusTextElement = this.statusMessageElement.querySelector('#status-text')!;
    }

    public async initialize(): Promise<void> {
        this.camera.position.z = 10;

        const loadingMessage = 'Loading';
        const textSize = 1;
        const charWidth = textSize * 1.2;
        const loadingTextWidth = loadingMessage.length * charWidth;
        const dotWidth = charWidth;
        const totalDotsWidth = 3 * dotWidth;

        const totalWidth = loadingTextWidth + totalDotsWidth;
        const startX = -totalWidth / 2;

        const loadingTextCenter = startX + loadingTextWidth / 2;
        this.loadingText = this.textRenderer.createTextMesh(loadingMessage, new THREE.Vector3(loadingTextCenter, 1, 0), textSize);
        this.scene.add(this.loadingText);

        const dot1Center = startX + loadingTextWidth + dotWidth / 2;
        this.dot1 = this.textRenderer.createTextMesh('.', new THREE.Vector3(dot1Center, 1, 0), textSize);
        this.scene.add(this.dot1);

        const dot2Center = dot1Center + dotWidth;
        this.dot2 = this.textRenderer.createTextMesh('.', new THREE.Vector3(dot2Center, 1, 0), textSize);
        this.scene.add(this.dot2);

        const dot3Center = dot2Center + dotWidth;
        this.dot3 = this.textRenderer.createTextMesh('.', new THREE.Vector3(dot3Center, 1, 0), textSize);
        this.scene.add(this.dot3);

        // Loading Bar
        const barWidth = 10;
        const barHeight = 0.5;
        const backgroundGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x444444 });
        const backgroundBar = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
        backgroundBar.position.set(0, -0.5, 0);
        this.scene.add(backgroundBar);

        const foregroundGeometry = new THREE.PlaneGeometry(barWidth, barHeight);
        const foregroundMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.loadingBar = new THREE.Mesh(foregroundGeometry, foregroundMaterial);
        this.loadingBar.position.set(-barWidth / 2, -0.5, 0.1);
        this.loadingBar.scale.x = 0; 
        this.scene.add(this.loadingBar);
    }

    public update(deltaTime: number): void {
        this.time += deltaTime;
        const numDots = 1 + Math.floor(this.time * 2) % 3;
        this.dot1.visible = numDots >= 1;
        this.dot2.visible = numDots >= 2;
        this.dot3.visible = numDots >= 3;
    }

    public updateProgress(progress: number): void {
        const barWidth = 10;
        this.loadingBar.scale.x = progress;
        this.loadingBar.position.x = - (barWidth * (1 - progress) / 2);
    }
    
    public updateStatusMessage(message: string, success?: boolean): void {
        this.statusTextElement.innerText = message;
        if (success === true) {
            this.statusFlagElement.classList.add('success');
            this.statusFlagElement.classList.remove('failure');
        } else if (success === false) {
            this.statusFlagElement.classList.add('failure');
            this.statusFlagElement.classList.remove('success');
        }
    }

    public dispose(): void {
        this.scene.remove(this.loadingText);
        this.scene.remove(this.dot1);
        this.scene.remove(this.dot2);
        this.scene.remove(this.dot3);
        this.scene.remove(this.loadingBar);
        this.statusMessageElement.style.display = 'none';
    }
}
