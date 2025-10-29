export interface TypingState {
  currentWord: string;
  typedText: string;
  position: number;
  hasError: boolean;
  isComplete: boolean;
}

export class InputHandler {
  private typingState: TypingState;
  private onKeyPress: ((key: string) => void) | null = null;
  private onWordComplete: ((word: string, accuracy: number) => void) | null = null;
  private onError: (() => void) | null = null;
  private onWordChanged: ((word: string) => void) | null = null;

  constructor() {
    this.typingState = {
      currentWord: '',
      typedText: '',
      position: 0,
      hasError: false,
      isComplete: false
    };
  }

  public initialize(): void {
    document.addEventListener('keydown', this.handleKeyDown.bind(this));
    document.addEventListener('keypress', this.handleKeyPress.bind(this));
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      event.preventDefault();
      this.handleBackspace();
    }
  }

  private handleKeyPress(event: KeyboardEvent): void {
    event.preventDefault();
    const key = event.key;
    if (key.length === 1 && key.match(/[a-zA-Z0-9\s.,!?;:'"()-]/)) {
      this.processCharacter(key);
      this.onKeyPress?.(key);
    }
  }

  public simulateKeyPress(char: string): void {
    this.processCharacter(char);
  }

  private processCharacter(char: string): void {
    if (this.typingState.isComplete) return;

    const expectedChar = this.typingState.currentWord[this.typingState.position];
    
    if (char === expectedChar) {
      this.typingState.typedText += char;
      this.typingState.position++;
      this.typingState.hasError = false;
      
      if (this.typingState.position >= this.typingState.currentWord.length) {
        this.completeWord();
      }
    } else {
      this.typingState.hasError = true;
      this.onError?.();
    }
  }

  private handleBackspace(): void {
    if (this.typingState.position > 0 && !this.typingState.isComplete) {
      this.typingState.position--;
      this.typingState.typedText = this.typingState.typedText.slice(0, -1);
      this.typingState.hasError = false;
    }
  }

  private completeWord(): void {
    this.typingState.isComplete = true;
    const accuracy = this.calculateAccuracy();
    this.onWordComplete?.(this.typingState.currentWord, accuracy);
  }

  private calculateAccuracy(): number {
    const correctChars = this.typingState.typedText.length;
    const totalChars = this.typingState.currentWord.length;
    return totalChars > 0 ? (correctChars / totalChars) * 100 : 100;
  }

  public setCurrentWord(word: string): void {
    this.typingState = {
      currentWord: word,
      typedText: '',
      position: 0,
      hasError: false,
      isComplete: false
    };
    this.onWordChanged?.(word);
  }

  public getCurrentState(): TypingState {
    return { ...this.typingState };
  }

  public onKeyPressCallback(callback: (key: string) => void): void {
    this.onKeyPress = callback;
  }

  public onWordCompleteCallback(callback: (word: string, accuracy: number) => void): void {
    this.onWordComplete = callback;
  }

  public onErrorCallback(callback: () => void): void {
    this.onError = callback;
  }

  public onWordChangedCallback(callback: (word: string) => void): void {
    this.onWordChanged = callback;
  }

  public dispose(): void {
    document.removeEventListener('keydown', this.handleKeyDown.bind(this));
    document.removeEventListener('keypress', this.handleKeyPress.bind(this));
  }
}
