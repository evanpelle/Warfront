import {Player} from "./player/Player";


export class TileUpdateEvent {
    constructor(
        public newOwner: Player,
        public tilePos: number,
        public isBorder: boolean,
        public isDelete: boolean = false
    ) { }
}

export class PlayerUpdateEvent {
    constructor(
        public newPlayer: Player
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