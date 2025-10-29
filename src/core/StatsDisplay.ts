import { GameStats } from './PerformanceTracker';

export class StatsDisplay {
    private container: HTMLElement;
    private scoreEl: HTMLElement;
    private wpmEl: HTMLElement;
    private accuracyEl: HTMLElement;
    private wordsEl: HTMLElement;

    constructor(index: number, isHumanPlayer: boolean) {
        this.container = document.createElement('div');
        this.container.className = 'stats-console';
        this.container.id = `stats-console-${index}`;
        document.body.appendChild(this.container);

        const title = document.createElement('h2');
        title.textContent = `Player ${index + 1}`;
        if (isHumanPlayer) {
            const youIndicator = document.createElement('span');
            youIndicator.textContent = ' (You)';
            youIndicator.style.color = '#F59E0B';
            title.appendChild(youIndicator);
        }
        this.container.appendChild(title);

        this.scoreEl = this.createStatElement('Score', 'stats-score');
        this.wpmEl = this.createStatElement('WPM', 'stats-wpm');
        this.accuracyEl = this.createStatElement('Accuracy', 'stats-accuracy');
        this.wordsEl = this.createStatElement('Completed', 'stats-words');
    }

    private createStatElement(label: string, id: string): HTMLElement {
        const statContainer = document.createElement('div');
        const labelEl = document.createElement('span');
        labelEl.textContent = `${label}: `;
        const valueEl = document.createElement('span');
        valueEl.id = id;
        valueEl.textContent = '0';
        statContainer.appendChild(labelEl);
        statContainer.appendChild(valueEl);
        this.container.appendChild(statContainer);
        return valueEl;
    }

    public update(stats: GameStats): void {
        this.scoreEl.innerText = stats.score.toString();
        this.wpmEl.innerText = stats.wpm.toFixed(0);
        this.accuracyEl.innerText = `${stats.accuracy.toFixed(1)}%`;
        this.wordsEl.innerText = stats.wordsCompleted.toString();
    }

    public show(): void {
        this.container.style.display = 'block';
    }

    public hide(): void {
        this.container.style.display = 'none';
    }

    public setPosition(left: string, top: string): void {
        this.container.style.left = left;
        this.container.style.top = top;
    }
}
