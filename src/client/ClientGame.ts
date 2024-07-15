import {Cell, GameState, PlayerEvent, PlayerInfo, TileEvent} from "../core/GameStateApi";
import {CreateGameState, TerrainMapImpl} from "../core/GameStateImpl";
import {TerrainMapLoader} from "../core/TerrainMapLoader";
import {Ticker, TickEvent} from "../core/Ticker";
import {EventBus} from "../EventBus";
import {Settings} from "../Settings";
import {GameRenderer} from "./graphics/GameRenderer";
import {InputHandler, ClickEvent, ZoomEvent, DragEvent} from "./InputHandler"

export async function creatClientGame(settings: Settings) {
    let eventBus = new EventBus()
    let terrainMap = await TerrainMapLoader.load()
    let gs = CreateGameState(terrainMap, eventBus)
    let gameRenderer = new GameRenderer(gs, settings.theme(), document.createElement("canvas"))
    let ticker = new Ticker(settings.tickInterval(), eventBus)

    return new ClientGame(ticker, eventBus, gs, gameRenderer, new InputHandler(eventBus))
}

export class ClientGame {
    constructor(
        private ticker: Ticker,
        private eventBus: EventBus,
        private gs: GameState,
        private renderer: GameRenderer,
        private input: InputHandler
    ) { }

    public start() {
        this.eventBus.on(TickEvent, (e) => this.tick(e))
        this.eventBus.on(TileEvent, (e) => this.renderer.tileUpdate(e))
        this.eventBus.on(PlayerEvent, (e) => this.renderer.playerUpdate(e))
        this.eventBus.on(ClickEvent, (e) => this.inputEvent(e))
        this.eventBus.on(ZoomEvent, (e) => this.renderer.onZoom(e))
        this.eventBus.on(DragEvent, (e) => this.renderer.onMove(e))

        this.renderer.initialize()
        this.input.initialize()
        this.ticker.start()
    }

    private tick(tickEvent: TickEvent) {
        this.renderer.renderGame()
    }

    private inputEvent(event: ClickEvent) {
        const cell = this.renderer.screenToWorldCoordinates(event.x, event.y)
        this.gs.spawnPlayer(new PlayerInfo("User", false), cell)
    }

}