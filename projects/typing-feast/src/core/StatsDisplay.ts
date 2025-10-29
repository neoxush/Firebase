
import { GameStats } from './PerformanceTracker';
import { Player } from './Player';
import { Persona } from './Personas';

export class StatsDisplay {
    private container: HTMLElement;
    private scoreEl: HTMLElement;
    private wpmEl: HTMLElement;
    private accuracyEl: HTMLElement;
    private wordsEl: HTMLElement;

    constructor(player: Player, index: number) {
        this.container = document.createElement('div');
        this.container.className = 'stats-console';
        this.container.id = `stats-console-${index}`;
        document.body.appendChild(this.container);

        const title = document.createElement('h2');
        const persona = (player as any).persona as Persona;

        if (persona) {
            title.textContent = persona.name;
            title.title = persona.description; // Hover to see the story!
        } else {
            title.textContent = 'You';
            title.style.color = '#F59E0B'; // Highlight the human player
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
