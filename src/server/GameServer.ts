import {EventBus} from "../core/EventBus";
import {ClientID, GameID} from "../core/GameStateApi";
import {ClientMessage, ClientMessageSchema, Intent, ServerStartGameMessage, ServerStartGameMessageSchema, ServerTurnMessageSchema, Turn} from "../core/Schemas";
import {Settings} from "../core/Settings";
import {Ticker, TickEvent} from "../core/Ticker";
import {Client} from "./Client";

export class GameServer {

    private currTurn = 0
    private turns: Turn[]
    private intents: Intent[]

    constructor(
        public readonly id: GameID,
        private clients: Map<ClientID, Client>,
        private settings: Settings,
    ) {
    }

    public start() {
        this.clients.forEach(c => {
            c.ws.on('message', (message: string) => {
                console.log(`got message ${message}`)
                const clientMsg: ClientMessage = ClientMessageSchema.parse(JSON.parse(message))
                if (clientMsg.type == "intent") {
                    this.addIntent(clientMsg.intent)
                }
            })
        })


        const startGame = JSON.stringify(ServerStartGameMessageSchema.parse(
            {
                type: "start"
            }
        ))
        this.clients.forEach(c => {
            c.ws.send(startGame)
        })
    }

    private addIntent(intent: Intent) {
        this.intents.push(intent)
    }

    private endTurn() {
        const pastTurn: Turn = {
            turnNumber: this.turns.length,
            intents: this.intents
        }
        this.turns.push(pastTurn)
        this.intents = []
        this.clients.forEach(c => {
            c.ws.send(JSON.stringify(
                ServerTurnMessageSchema.parse(pastTurn)
            ))
        })
    }

    private tick(event: TickEvent) {

    }

}