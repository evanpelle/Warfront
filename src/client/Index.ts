import {defaultSettings} from "../core/Settings";
import {createClientGame} from "./ClientGame";

class Client {
    private startButton: HTMLButtonElement | null;

    constructor() {
        this.startButton = document.getElementById('startButton') as HTMLButtonElement | null;
        this.initialize();
    }

    private initialize(): void {
        if (this.startButton) {
            this.startButton.addEventListener('click', this.handleStartClick.bind(this));
        } else {
            console.error('Start button not found');
        }
    }

    private handleStartClick(): void {
        console.log('Game started!');
        console.log('creating game client!')
        createClientGame(defaultSettings).start()
    }
}

// Initialize the client when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Client();
});