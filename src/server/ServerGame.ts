import {EventBus} from "../core/EventBus";
import {ServerID} from "../core/GameStateApi";
import {Intent} from "../core/Schemas";
import {Settings} from "../core/Settings";
import {Ticker, TickEvent} from "../core/Ticker";

export class ServerGame {

    private currSync = 0
    private intents: Intent[]
    private syncTicker: Ticker
    private tickTicker: Ticker

    constructor(
        private eventBus: EventBus,
        private settings: Settings,
        private id: ServerID
    ) {
        eventBus.on(TickEvent, e => this.tick(e))
        this.syncTicker = new Ticker(settings.tickIntervalMs(), eventBus)
        this.tickTicker = new Ticker(settings.syncIntervalMs(), eventBus)
    }

    public start() {
        this.syncTicker.start()
        this.tickTicker.start()
    }

    public addIntent(intent: Intent) {
        this.intents.push(intent)
    }

    public endSync() {
        this.intents = []
        this.currSync++
        // TODO send to clients
    }

    private tick(event: TickEvent) {

    }

}