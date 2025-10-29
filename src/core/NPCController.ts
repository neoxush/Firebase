import { InputHandler } from './InputHandler';
import { Player } from './Player';

export class NPCController {
    private player: Player;
    private targetWord: string | null = null;
    private typingSpeed: number; // in characters per second
    private accuracy: number; // from 0 to 1
    private timeToNextChar: number = 0;

    constructor(player: Player, typingSpeed: number, accuracy: number) {
        this.player = player;
        this.typingSpeed = typingSpeed;
        this.accuracy = accuracy;
        this.player.inputHandler.onWordChangedCallback((word) => {
            this.targetWord = word;
            this.timeToNextChar = 1 / this.typingSpeed;
        });
    }

    public update(deltaTime: number): void {
        if (!this.targetWord) {
            return;
        }

        this.timeToNextChar -= deltaTime;

        if (this.timeToNextChar <= 0) {
            const currentInput = this.player.inputHandler.getCurrentState().typedText;
            const nextCharIndex = currentInput.length;

            if (nextCharIndex < this.targetWord.length) {
                if (Math.random() < this.accuracy) {
                    this.player.inputHandler.simulateKeyPress(this.targetWord[nextCharIndex]);
                } else {
                    // Simulate a typo
                    const wrongChar = String.fromCharCode(97 + Math.floor(Math.random() * 26));
                    this.player.inputHandler.simulateKeyPress(wrongChar);
                }
            }
            this.timeToNextChar = 1 / this.typingSpeed;
        }
    }
}
