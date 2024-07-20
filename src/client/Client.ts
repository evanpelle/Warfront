import {TerrainMap} from "../core/GameStateApi";
import {defaultSettings} from "../core/Settings";
import {loadTerrainMap} from "../core/TerrainMapLoader";
import {createClientGame} from "./ClientGame";

class Client {
    private startButton: HTMLButtonElement | null;
    private socket: WebSocket | null = null;
    private terrainMap: Promise<TerrainMap>

    constructor() {
        this.startButton = document.getElementById('startButton') as HTMLButtonElement | null;
    }

    initialize(): void {
        this.terrainMap = loadTerrainMap()
        // Usage
        if (this.startButton) {
            this.startButton.addEventListener('click', this.handleStartClick.bind(this));
        } else {
            console.error('Start button not found');
        }
        this.connectWebSocket()
    }

    private connectWebSocket(): void {
        console.log(`connecting websocket ws://${window.location.host}...`)
        this.socket = new WebSocket(`ws://localhost:3000`);

        this.socket.onopen = () => {
            console.log('Connected to server');
        };

        this.socket.onmessage = (event) => {
            console.log('Message from server:', event.data);
        };

        this.socket.onclose = () => {
            console.log('Disconnected from server');
        };
    }

    private handleStartClick(): void {
        console.log('Game started!');
        this.terrainMap.then((map) => {
            const game = createClientGame(defaultSettings, map)
            game.start()
        })

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            console.log('sending game started message')
            this.socket.send('Game started');
        }
    }
}

// Initialize the client when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Client().initialize();
});