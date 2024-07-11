import {PlayerView, Tile} from "./core/GameState";


export class TileUpdateEvent {
    constructor(
        public tile: Tile
    ) { }
}

export class PlayerUpdateEvent {
    constructor(
        public newPlayer: PlayerView
    ) { }
}

export class EventDispatcher {
    private tileUpdateEventListeners: ((event: TileUpdateEvent) => void)[] = [];
    private playerUpdateEventListeners: ((event: PlayerUpdateEvent) => void)[] = [];


    registerTileUpdateEventListener(listener: (event: TileUpdateEvent) => void) {
        this.tileUpdateEventListeners.push(listener)
    }

    fireTileUpdateEvent(event: TileUpdateEvent) {
        this.tileUpdateEventListeners.forEach((listener) => listener(event))
    }

    registerPlayerUpdateEventListener(listener: (event: PlayerUpdateEvent) => void) {
        this.playerUpdateEventListeners.push(listener)
    }

    firePlayerUpdateEvent(event: PlayerUpdateEvent) {
        this.playerUpdateEventListeners.forEach((listener) => listener(event))
    }
}

export const eventDispatcher = new EventDispatcher()