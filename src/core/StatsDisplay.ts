import { GameStats } from "./PerformanceTracker";

export class StatsDisplay {
    private scoreEl: HTMLElement;
    private wpmEl: HTMLElement;
    private accuracyEl: HTMLElement;
    private wordsEl: HTMLElement;

    constructor() {
        this.scoreEl = document.getElementById('stats-score')!;
        this.wpmEl = document.getElementById('stats-wpm')!;
        this.accuracyEl = document.getElementById('stats-accuracy')!;
        this.wordsEl = document.getElementById('stats-words')!;
    }

    public update(stats: GameStats): void {
        this.scoreEl.innerText = stats.score.toString();
        this.wpmEl.innerText = stats.wpm.toFixed(0);
        this.accuracyEl.innerText = `${stats.accuracy.toFixed(1)}%`;
        this.wordsEl.innerText = stats.wordsCompleted.toString();
    }

    public show(): void {
        const consoleEl = document.getElementById('stats-console');
        if (consoleEl) {
            consoleEl.style.display = 'block';
        }
    }

    public hide(): void {
        const consoleEl = document.getElementById('stats-console');
        if (consoleEl) {
            consoleEl.style.display = 'none';
        }
    }
}
