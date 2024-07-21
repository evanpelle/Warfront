import {GameID, LobbyID} from "../core/GameStateApi";
import {Client} from "./Client";
import {Lobby} from "./Lobby";
import {GameServer} from "./GameServer";
import {defaultSettings} from "../core/Settings";
import {generateUniqueID} from "../core/Utils";

export class GameManager {

    private lastNewLobby: number = 0
    private newLobbyCreationRateMs = 1 * 1000

    private _lobbies: Map<LobbyID, Lobby> = new Map()

    private games: Map<GameID, GameServer> = new Map()


    public addClientToLobby(client: Client, lobbyID: LobbyID) {
        this._lobbies.get(lobbyID).addClient(client)
    }

    addLobby(lobby: Lobby) {
        this._lobbies.set(lobby.id, lobby)
    }

    lobby(id: LobbyID): Lobby {
        return this._lobbies.get(id)
    }

    lobbies(): Lobby[] {
        return Array.from(this._lobbies.values())
    }

    addGame(game: GameServer) {
        this.games.set(game.id, game)
    }

    startGame(lobby: Lobby) {
        const gs = new GameServer(generateUniqueID(), lobby.clients, defaultSettings)
        this.games.set(gs.id, gs)
        gs.start()
    }

    tick() {
        const now = Date.now()

        const active = this.lobbies().filter(l => !l.isExpired(now))
        const expired = this.lobbies().filter(l => l.isExpired(now))
        this._lobbies = new Map(active.map(lobby => [lobby.id, lobby]));
        expired.forEach(lobby => {
            const game = new GameServer(generateUniqueID(), lobby.clients, defaultSettings)
            this.games.set(game.id, game)
            game.start()
        })

        if (now > this.lastNewLobby + this.newLobbyCreationRateMs) {
            this.lastNewLobby = now
            this.addLobby(new Lobby(generateUniqueID(), 10 * 1000))
        }
    }
}