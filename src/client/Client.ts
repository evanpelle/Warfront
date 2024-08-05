import {TerrainMap} from "../core/Game";
import {ServerMessage, ServerMessageSchema} from "../core/Schemas";
import {defaultSettings} from "../core/Settings";
import {loadTerrainMap} from "../core/TerrainMapLoader";
import {generateUniqueID} from "../core/Util";
import {ClientGame, createClientGame} from "./ClientGame";
import {v4 as uuidv4} from 'uuid';

// import WebSocket from 'ws';

class Client {
    private hasJoined = false

    private startButton: HTMLButtonElement | null;
    private socket: WebSocket | null = null;
    private terrainMap: Promise<TerrainMap>
    private game: ClientGame

    private lobbiesContainer: HTMLElement | null;
    private lobbiesInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.startButton = document.getElementById('startButton') as HTMLButtonElement | null;
        this.lobbiesContainer = document.getElementById('lobbies-container');

    }

    initialize(): void {
        this.terrainMap = loadTerrainMap()
        this.startLobbyPolling()
    }

    private startLobbyPolling(): void {
        this.fetchAndUpdateLobbies(); // Fetch immediately on start
        this.lobbiesInterval = setInterval(() => this.fetchAndUpdateLobbies(), 1000);
    }

    private async fetchAndUpdateLobbies(): Promise<void> {
        try {
            const data = await this.fetchLobbies();
            this.updateLobbiesDisplay(data.lobbies);
        } catch (error) {
            console.error('Error fetching and updating lobbies:', error);
        }
    }

    private updateLobbiesDisplay(lobbies: Array<{id: string}>): void {
        if (!this.lobbiesContainer) return;

        this.lobbiesContainer.innerHTML = ''; // Clear existing lobbies

        lobbies.forEach(lobby => {
            const button = document.createElement('button');
            button.textContent = `Join Lobby ${lobby.id}`;
            button.onclick = () => this.joinLobby(lobby.id);
            this.lobbiesContainer.appendChild(button);
        });

        // Join first lobby
        if (!this.hasJoined && lobbies.length > 0) {
            this.hasJoined = true
            console.log(`joining lobby ${lobbies[0].id}`)
            this.joinLobby(lobbies[0].id)
        }
    }

    async fetchLobbies() {
        const url = '/lobbies';
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}, statusText: ${response.statusText}`);
            }
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error fetching lobbies:', error);
            throw error;
        }
    }

    private async joinLobby(lobbyID: string) {
        this.terrainMap.then((map) => {
            this.game = createClientGame(uuidv4().slice(0, 4), generateUniqueID(), lobbyID, defaultSettings, map)
            this.game.joinLobby()
        })
    }
}

// Initialize the client when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Client().initialize();
});