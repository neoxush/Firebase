
import { InputHandler } from './InputHandler';
import { Player } from './Player';
import { Persona } from './Personas'; // Import Persona

export class NPCController {
    public readonly persona: Persona; // Store the persona
    private player: Player;
    private targetWord: string | null = null;
    private typingSpeed: number; // in characters per second
    private accuracy: number; // from 0 to 1
    private timeToNextChar: number = 0;

    constructor(player: Player, persona: Persona) {
        this.player = player;
        this.persona = persona; // Assign the persona

        // Convert WPM to characters per second (assuming average 5 chars per word)
        this.typingSpeed = (persona.baseWPM * 5) / 60;
        this.accuracy = persona.baseAccuracy;

        this.player.inputHandler.onWordChangedCallback((word) => {
            this.targetWord = word;
            // Reset time based on new speed for the word
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
            // Add a bit of randomness to typing speed to make it more natural
            const randomFactor = 0.8 + Math.random() * 0.4; // between 0.8 and 1.2
            this.timeToNextChar = (1 / this.typingSpeed) * randomFactor;
        }
    }
}
