import {TerrainMap} from "../core/GameStateApi";
import {ServerMessage, ServerMessageSchema} from "../core/Schemas";
import {defaultSettings} from "../core/Settings";
import {loadTerrainMap} from "../core/TerrainMapLoader";
import {ClientGame, createClientGame} from "./ClientGame";
import {v4 as uuidv4} from 'uuid';

// import WebSocket from 'ws';

class Client {
    private startButton: HTMLButtonElement | null;
    private socket: WebSocket | null = null;
    private terrainMap: Promise<TerrainMap>
    private game: ClientGame

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
            if (this.game != null) {
                console.log(`got event: ${event.data}`)
                const message: ServerMessage = ServerMessageSchema.parse(JSON.parse(event.data))
                if (message.type == 'sync') {
                    this.game.addIntents(message.intents)
                    this.game.tick(null)
                }
            }
        };

        this.socket.onclose = () => {
            console.log('Disconnected from server');
        };
    }

    private handleStartClick(): void {
        console.log('Game started!');
        this.terrainMap.then((map) => {
            this.game = createClientGame(uuidv4().slice(0, 4), this.socket, defaultSettings, map)
            this.game.start()
        })

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            //console.log('sending game started message')
            // this.socket.send('Game started');
        }
    }
}

// Initialize the client when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Client().initialize();
});