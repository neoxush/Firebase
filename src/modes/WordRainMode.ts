import * as THREE from 'three';
import { StylishTextRenderer } from '../core/StylishTextRenderer';
import { InputHandler } from '../core/InputHandler';
import { PerformanceTracker } from '../core/PerformanceTracker';

interface FallingWord {
  id: string;
  text: string;
  mesh: THREE.Group;
  fallSpeed: number;
  timeLimit: number;
  isActive: boolean;
  indicator: THREE.Group;
}

export class WordRainMode {
  private words: FallingWord[] = [];
  private currentWord: FallingWord | null = null;
  private textRenderer: StylishTextRenderer;
  private wordList: string[] = [];
  private spawnTimer: number = 0;
  private spawnInterval: number = 3000; // 3 seconds
  private groundY: number = -5;
  private nextWordId: number = 0;

  constructor(
    private scene: THREE.Scene,
    private inputHandler: InputHandler,
    private performanceTracker: PerformanceTracker,
    groundY: number = -5
  ) {
    this.textRenderer = new StylishTextRenderer();
    this.groundY = groundY;
    this.setupInputHandlers();
  }

  public setWordList(wordList: string[]): void {
    this.wordList = wordList;
  }

  public async initialize(): Promise<void> {
    console.log('Initializing WordRainMode...');
    await this.textRenderer.initialize();
    console.log('TextRenderer initialized, spawning first word...');
    this.spawnWord();
    console.log('WordRainMode initialization complete');
  }

  private setupInputHandlers(): void {
    this.inputHandler.onWordCompleteCallback((word: string, accuracy: number) => {
      this.handleWordComplete(word, accuracy);
    });

    this.inputHandler.onErrorCallback(() => {
      this.performanceTracker.recordError();
    });
  }

  private spawnWord(): void {
    if (this.wordList.length === 0) {
        console.warn("Word list is empty, cannot spawn a new word.");
        return;
    }
    const word = this.getRandomWord();
    const wordId = `word_${this.nextWordId++}`;
    
    console.log(`Spawning word: "${word}"`);
    
    const x = (Math.random() - 0.5) * 20;
    const startY = 10;
    const z = (Math.random() - 0.5) * 5;
    
    const position = new THREE.Vector3(x, startY, z);
    const mesh = this.textRenderer.createTextMesh(word, position, 1.0);
    
    const indicator = this.textRenderer.createIndicator();
    mesh.add(indicator);

    this.scene.add(mesh);
    this.textRenderer.animateTextEntry(mesh);
    
    const fallingWord: FallingWord = {
      id: wordId,
      text: word,
      mesh,
      fallSpeed: 1 + Math.random() * 0.5, 
      timeLimit: 8000 + word.length * 500, 
      isActive: true,
      indicator
    };
    
    this.words.push(fallingWord);
    
    if (!this.currentWord) {
      this.setCurrentWord(fallingWord);
    }
    
    console.log(`Word "${word}" spawned at position:`, position);
  }

  private getRandomWord(): string {
    return this.wordList[Math.floor(Math.random() * this.wordList.length)];
  }

  private setCurrentWord(word: FallingWord | null): void {
    if (this.currentWord) {
        this.currentWord.indicator.visible = false;
        this.textRenderer.setHighlight(this.currentWord.mesh, false);
    }
    this.currentWord = word;
    if (this.currentWord) {
        this.currentWord.indicator.visible = true;
        this.inputHandler.setCurrentWord(this.currentWord.text);
        this.updateIndicatorPosition(this.currentWord);
        this.textRenderer.setHighlight(this.currentWord.mesh, true);
    }
  }
  
  private updateIndicatorPosition(word: FallingWord): void {
    const head = word.indicator.getObjectByName('head');
    const bracketOpen = word.indicator.getObjectByName('bracket_open');
    const bracketClose = word.indicator.getObjectByName('bracket_close');

    const size = word.mesh.userData.size || 1;
    const charWidth = size * 1.2;
    const totalWidth = word.text.length * charWidth;

    if (head) head.position.x = -totalWidth / 2 - charWidth;
    if (bracketOpen) bracketOpen.position.x = -totalWidth / 2 - charWidth * 0.5;
    if (bracketClose) bracketClose.position.x = totalWidth / 2 + charWidth * 0.5;
  }

  private handleWordComplete(word: string, accuracy: number): void {
    if (!this.currentWord || this.currentWord.text !== word) return;
    
    this.performanceTracker.recordWordCompletion(word, accuracy);
    
    const stats = this.performanceTracker.getCurrentStats();
    console.log(`-=-=-=-= STATS =-=-=-=-`);
    console.log(`Score: ${stats.score}`);
    console.log(`WPM: ${stats.wpm.toFixed(0)}`);
    console.log(`Accuracy: ${stats.accuracy.toFixed(1)}%`);
    console.log(`Completed Words: ${stats.wordsCompleted}`);
    console.log(`-=-=-=-=-=-=-=-=-=-=-=-`);
    
    this.removeWord(this.currentWord);
    
    this.selectNextWord();
    
    this.spawnWord();
  }

  private removeWord(word: FallingWord): void {
    this.textRenderer.animateTextExit(word.mesh, () => {
      this.scene.remove(word.mesh);
      this.disposeWordMesh(word.mesh);
    });
    
    const index = this.words.indexOf(word);
    if (index > -1) {
      this.words.splice(index, 1);
    }
    
    if (this.currentWord === word) {
      this.currentWord = null;
    }
  }

  private selectNextWord(): void {
    const availableWords = this.words.filter(w => w.isActive && w !== this.currentWord);
    
    if (availableWords.length > 0) {
      const lowestWord = availableWords.reduce((lowest, current) => 
        current.mesh.position.y < lowest.mesh.position.y ? current : lowest
      );
      
      this.setCurrentWord(lowestWord);
    } else {
        this.setCurrentWord(null);
    }
  }

  public update(deltaTime: number): void {
    this.updateWordPositions(deltaTime);
    this.updateSpawning(deltaTime);
    this.checkCollisions();
    this.updateCurrentWordVisual();
  }

  private updateWordPositions(deltaTime: number): void {
    this.words.forEach(word => {
      if (!word.isActive) return;
      word.mesh.position.y -= word.fallSpeed * deltaTime;
    });
  }

  private updateSpawning(deltaTime: number): void {
    this.spawnTimer += deltaTime * 1000;
    
    if (this.spawnTimer >= this.spawnInterval) {
      this.spawnWord();
      this.spawnTimer = 0;
      this.spawnInterval = Math.max(1500, this.spawnInterval - 50);
    }
  }

  private checkCollisions(): void {
    const wordsToRemove: FallingWord[] = [];
    this.words.forEach(word => {
      if (word.mesh.position.y <= this.groundY) {
        wordsToRemove.push(word);
        if (word === this.currentWord) {
          this.performanceTracker.recordError();
        }
      }
    });
    
    wordsToRemove.forEach(word => {
      this.removeWord(word);
    });
    
    if (!this.currentWord && this.words.length > 0) {
      this.selectNextWord();
    }
  }

  private updateCurrentWordVisual(): void {
    if (!this.currentWord) return;
    
    const typingState = this.inputHandler.getCurrentState();
    this.textRenderer.updateTextState(
      this.currentWord.mesh,
      typingState.position,
      typingState.hasError
    );
  }

  private disposeWordMesh(mesh: THREE.Group): void {
    mesh.children.forEach(child => {
        if (child instanceof THREE.Group || child instanceof THREE.Mesh) {
            if (child instanceof THREE.Group) {
                child.children.forEach(subChild => {
                    if (subChild instanceof THREE.Mesh) {
                        subChild.geometry.dispose();
                        if (Array.isArray(subChild.material)) {
                            subChild.material.forEach(mat => mat.dispose());
                        } else {
                            subChild.material.dispose();
                        }
                    }
                });
            } else if (child instanceof THREE.Mesh) {
                child.geometry.dispose();
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        }
    });
  }

  public dispose(): void {
    this.words.forEach(word => {
      this.scene.remove(word.mesh);
      this.disposeWordMesh(word.mesh);
    });
    
    this.words = [];
    this.setCurrentWord(null);
    this.textRenderer.dispose();
  }
}
