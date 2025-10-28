import * as THREE from 'three';

export abstract class BaseScene {
    protected scene: THREE.Scene;
    protected camera: THREE.PerspectiveCamera;

    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    }

    public abstract initialize(): Promise<void>;

    public abstract dispose(): void;

    public getScene(): THREE.Scene { return this.scene; }

    public getCamera(): THREE.Camera { return this.camera; }

    public update(deltaTime: number): void {
        // Base scenes can have their own update logic
    }
}
