import {ClientID} from "../core/GameStateApi";
import {Client} from "./Client";

export class Lobby {

    public clients: Map<ClientID, Client> = new Map()
    private startGameTs: number


    constructor(public readonly id: string, durationMs: number) {
        this.startGameTs = Date.now() + durationMs
    }

    public addClient(client: Client) {
        this.clients.set(client.id, client)
    }

    public isExpired(now: number): boolean {
        return now > this.startGameTs
    }
}