import {AttackExecution, Executor} from "../core/Executor";
import {Cell, ClientID, GameState, LobbyID, PlayerEvent, PlayerID, PlayerInfo, Player, TerrainMap, TileEvent, PlayerView} from "../core/GameStateApi";
import {CreateGameState} from "../core/GameStateImpl";
import {Ticker, TickEvent} from "../core/Ticker";
import {EventBus} from "../core/EventBus";
import {Settings} from "../core/Settings";
import {GameRenderer} from "./GameRenderer";
import {InputHandler, MouseUpEvent, ZoomEvent, DragEvent, MouseDownEvent} from "./InputHandler"
import {ClientIntentMessageSchema, ClientJoinMessageSchema, ClientMessageSchema, ServerMessage, ServerMessageSchema, ServerSyncMessage, Turn} from "../core/Schemas";
import {AttackIntent, Intent, SpawnIntent} from "../core/Schemas";



export function createClientGame(name: string, clientID: ClientID, lobbyID: LobbyID, settings: Settings, terrainMap: TerrainMap): ClientGame {
    let eventBus = new EventBus()
    let gs = CreateGameState(terrainMap, eventBus)
    let gameRenderer = new GameRenderer(gs, settings.theme(), document.createElement("canvas"))
    let ticker = new Ticker(settings.tickIntervalMs(), eventBus)

    return new ClientGame(
        name,
        clientID,
        lobbyID,
        ticker,
        eventBus,
        gs,
        gameRenderer,
        new InputHandler(eventBus),
        new Executor(gs)
    )
}

export class ClientGame {

    private myPlayer: PlayerView
    private turns: Turn[] = []
    private socket: WebSocket
    private started = false

    private ticksPerTurn = 1

    private ticksThisTurn = 0
    private currTurn = 0

    constructor(
        private playerName: string,
        private id: ClientID,
        private lobbyID: LobbyID,
        private ticker: Ticker,
        private eventBus: EventBus,
        private gs: GameState,
        private renderer: GameRenderer,
        private input: InputHandler,
        private executor: Executor
    ) { }

    public joinLobby() {
        this.socket = new WebSocket(`ws://localhost:3000`)
        this.socket.onopen = () => {
            console.log('Connected to game server!');
            this.socket.send(
                JSON.stringify(
                    ClientJoinMessageSchema.parse({
                        type: "join",
                        lobbyID: this.lobbyID,
                        clientID: this.id
                    })
                )
            )
        };
        this.socket.onmessage = (event: MessageEvent) => {
            const message: ServerMessage = ServerMessageSchema.parse(JSON.parse(event.data))
            if (message.type == "start") {
                console.log("starting game!")
                this.start()
            }
            if (message.type == "turn") {
                this.addTurn(message.turn)
            }
        };
    }

    public start() {
        this.started = true
        console.log('starting game!')
        // TODO: make each class do this, or maybe have client intercept all requests?
        //this.eventBus.on(TickEvent, (e) => this.tick(e))
        this.eventBus.on(TileEvent, (e) => this.renderer.tileUpdate(e))
        this.eventBus.on(PlayerEvent, (e) => this.playerEvent(e))
        this.eventBus.on(MouseUpEvent, (e) => this.inputEvent(e))
        this.eventBus.on(ZoomEvent, (e) => this.renderer.onZoom(e))
        this.eventBus.on(DragEvent, (e) => this.renderer.onMove(e))

        this.renderer.initialize()
        this.input.initialize()
        this.executor.spawnBots(500)
        // this.gs.players().filter(p => p.info().isBot).forEach(bot => {
        //     this.executor.addIntent({
        //         type: "attack",
        //         attackerID: bot.id(),
        //         targetID: null,
        //         troops: 100
        //     })
        // })


        setInterval(() => this.tick(), 10);
    }

    public addTurn(turn: Turn): void {
        this.turns.push(turn)
    }

    public tick() {
        if (this.ticksThisTurn >= this.ticksPerTurn) {
            if (this.currTurn >= this.turns.length) {
                return
            }
            this.executor.addTurn(this.turns[this.currTurn])
            this.currTurn++
            this.ticksThisTurn = 0
        }
        this.ticksThisTurn++
        this.executor.tick()
    }

    private playerEvent(event: PlayerEvent) {
        console.log('received new player event!')
        // TODO: what if multiple players has same name
        if (event.player.info().name == this.playerName) {
            console.log('setting name')
            this.myPlayer = event.player
        }
        this.renderer.playerUpdate(event)
    }

    private inputEvent(event: MouseDownEvent) {
        const cell = this.renderer.screenToWorldCoordinates(event.x, event.y)
        const tile = this.gs.tile(cell)
        if (tile.owner() == null && !this.hasSpawned()) {
            this.sendSpawnIntent(cell)
            return
        }
        if (!this.hasSpawned()) {
            return
        }

        if (tile.owner() != this.myPlayer) {
            const id = tile.owner() != null ? tile.owner().id() : null
            this.sendAttackIntent(id, cell)
        }

    }

    private hasSpawned(): boolean {
        return this.myPlayer != null
    }

    private sendSpawnIntent(cell: Cell) {
        const spawn = JSON.stringify(
            ClientIntentMessageSchema.parse({
                type: "intent",
                clientID: this.id,
                intent: {
                    type: "spawn",
                    name: this.playerName,
                    isBot: false,
                    x: cell.x,
                    y: cell.y
                }
            })
        )
        console.log(spawn)
        if (this.socket.readyState === WebSocket.OPEN) {
            console.log(`seding spawn intent: ${spawn}`)
            this.socket.send(spawn)
        } else {
            console.log('WebSocket is not open. Current state:', this.socket.readyState);
        }
    }

    private sendAttackIntent(targetID: PlayerID, cell: Cell) {
        const attack = JSON.stringify(
            ClientIntentMessageSchema.parse({
                type: "intent",
                clientID: this.id,
                intent: {
                    type: "attack",
                    attackerID: this.myPlayer.id(),
                    targetID: targetID,
                    troops: 2000,
                    targetX: cell.x,
                    targetY: cell.y
                }
            })
        )
        console.log(attack)
        if (this.socket.readyState === WebSocket.OPEN) {
            console.log(`sending attack intent: ${attack}`)
            this.socket.send(attack)
        } else {
            console.log('WebSocket is not open. Current state:', this.socket.readyState);
        }
    }

}