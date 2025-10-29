import * as THREE from 'three';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';

const candyShaderMaterial = new THREE.ShaderMaterial({
    uniforms: {
        baseColor: { value: new THREE.Color(0xff0000) },
        rimColor: { value: new THREE.Color(0xffffff) },
        rimPower: { value: 3.0 },
        specularColor: { value: new THREE.Color(0xffffff) },
        shininess: { value: 50.0 },
    },
    vertexShader: `
        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            vNormal = normalize(normalMatrix * normal);
            vPosition = vec3(modelViewMatrix * vec4(position, 1.0));
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,
    fragmentShader: `
        uniform vec3 baseColor;
        uniform vec3 rimColor;
        uniform float rimPower;
        uniform vec3 specularColor;
        uniform float shininess;

        varying vec3 vNormal;
        varying vec3 vPosition;

        void main() {
            vec3 viewDir = normalize(-vPosition);
            float rim = 1.0 - dot(viewDir, vNormal);
            rim = smoothstep(0.0, 1.0, rim);
            rim = pow(rim, rimPower);

            vec3 lightDir = normalize(vec3(1.0, 2.0, 1.5));
            vec3 reflectDir = reflect(-lightDir, vNormal);
            float specular = max(0.0, dot(viewDir, reflectDir));
            specular = pow(specular, shininess);

            vec3 finalColor = baseColor + rim * rimColor * 0.5 + specular * specularColor;
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `,
});

export class StylishTextRenderer {
    private font: Font | null = null;
    private textCache: Map<string, THREE.BufferGeometry> = new Map();

    public async initialize(): Promise<void> {
        const fontLoader = new FontLoader();
        this.font = await fontLoader.loadAsync('https://unpkg.com/three@0.158.0/examples/fonts/gentilis_bold.typeface.json');
    }

    public createTextMesh(text: string, position: THREE.Vector3, size: number = 1): THREE.Group {
        if (!this.font) {
            throw new Error("Font not loaded");
        }

        const group = new THREE.Group();
        group.userData = { size, text };
        this.updateTextMesh(group, text);
        group.position.copy(position);
        group.castShadow = true;
        return group;
    }

    public updateTextMesh(textGroup: THREE.Group, newText: string): void {
        if (!this.font) {
            throw new Error("Font not loaded");
        }

        const size = textGroup.userData.size || 1;
        const charWidth = size * 1.2;
        const totalWidth = newText.length * charWidth;

        // Reuse or create character meshes
        for (let i = 0; i < newText.length; i++) {
            const char = newText[i];
            let charGroup = textGroup.children[i] as THREE.Group;

            if (!charGroup) {
                charGroup = new THREE.Group();
                textGroup.add(charGroup);

                const backgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.5 });
                const backgroundGeometry = new THREE.PlaneGeometry(size * 1.2, size * 1.4);
                const backgroundMesh = new THREE.Mesh(backgroundGeometry, backgroundMaterial);
                backgroundMesh.position.z = -0.3;
                charGroup.add(backgroundMesh);

                const geometry = this.getCharGeometry(char, size);
                const material = candyShaderMaterial.clone();
                material.uniforms.baseColor.value = new THREE.Color(0xffffff);
                
                const mesh = new THREE.Mesh(geometry, material);
                mesh.name = 'letter';
                charGroup.add(mesh);
            }
            charGroup.position.x = i * charWidth - totalWidth / 2;
        }

        // Remove surplus characters
        while (textGroup.children.length > newText.length) {
            textGroup.remove(textGroup.children[textGroup.children.length - 1]);
        }

        textGroup.userData.text = newText;
    }

    private getCharGeometry(char: string, size: number): THREE.BufferGeometry {
        const cacheKey = `${char}_${size}`;
        if (this.textCache.has(cacheKey)) {
            return this.textCache.get(cacheKey)!;
        }

        const geometry = new TextGeometry(char, {
            font: this.font!,
            size: size,
            height: 0.2,
            curveSegments: 4, // Reduced for performance
            bevelEnabled: true,
            bevelThickness: 0.02, // Simplified
            bevelSize: 0.01,
            bevelSegments: 1 // Reduced
        });
        geometry.center();
        this.textCache.set(cacheKey, geometry);
        return geometry;
    }

    public setHighlight(textMesh: THREE.Group, highlighted: boolean): void {
        textMesh.children.forEach(charGroup => {
            const backgroundMesh = charGroup.children[0] as THREE.Mesh;
            if (backgroundMesh && backgroundMesh.material instanceof THREE.MeshBasicMaterial) {
                backgroundMesh.material.opacity = highlighted ? 0.7 : 0.5;
            }
        });
    }

    public createIndicator(): THREE.Group {
        if (!this.font) {
            throw new Error("Font not loaded");
        }

        const indicatorGroup = new THREE.Group();
        indicatorGroup.visible = false;

        const material = candyShaderMaterial.clone();
        material.uniforms.baseColor.value = new THREE.Color(0xF59E0B);

        const createText = (char: string) => {
            const geometry = this.getCharGeometry(char, 1);
            return new THREE.Mesh(geometry, material);
        };

        const head = createText('>');
        head.name = 'head';
        indicatorGroup.add(head);

        const bracketOpen = createText('[');
        bracketOpen.name = 'bracket_open';
        indicatorGroup.add(bracketOpen);

        const bracketClose = createText(']');
        bracketClose.name = 'bracket_close';
        indicatorGroup.add(bracketClose);

        return indicatorGroup;
    }

    public updateTextState(textMesh: THREE.Group, typedLength: number, hasError: boolean): void {
        for (let i = 0; i < textMesh.children.length; i++) {
            const charGroup = textMesh.children[i] as THREE.Group;
            const mesh = charGroup.children.find(c => c.name === 'letter') as THREE.Mesh;
            
            if (mesh && mesh.material instanceof THREE.ShaderMaterial) {
                const material = (mesh.material as THREE.ShaderMaterial);

                if (i < typedLength) {
                    if (hasError && i === typedLength - 1) {
                        material.uniforms.baseColor.value.setHex(0xf44336); // Red
                    } else {
                        material.uniforms.baseColor.value.setHex(0x4CAF50); // Green
                    }
                } else {
                    material.uniforms.baseColor.value.setHex(0xffffff); // White
                }
            }
        }
    }
    
    public animateTextEntry(textMesh: THREE.Group): void {
        textMesh.scale.set(1, 1, 1); // No animation for performance
    }

    public animateTextExit(textMesh: THREE.Group, onComplete?: () => void): void {
        textMesh.visible = false; // Hide instantly
        if(onComplete) onComplete();
    }

    public dispose(): void {
        this.textCache.forEach(geometry => geometry.dispose());
        this.textCache.clear();
    }
}
