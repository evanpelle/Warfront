import {GameEvent} from "./EventBus"

export type ClientID = string

export type PlayerID = number // TODO: make string?

export type GameID = string

export type LobbyID = string

export class Cell {
    constructor(
        public readonly x,
        public readonly y
    ) { }

    string(): string {return `Cell[${this.x, this.y}]`}
}

export interface ExecutionView {
    isActive(): boolean
    owner(): PlayerView
}

export interface Execution extends ExecutionView {
    tick()
    owner(): Player
}

export class PlayerInfo {
    constructor(
        public readonly name: string,
        public readonly isBot: boolean
    ) { }
}

// TODO: make terrain api better.
export class Terrain {
    constructor(
        public readonly expansionCost: number,
        public readonly expansionTime: number,
    ) { }
}

export type TerrainType = typeof TerrainTypes[keyof typeof TerrainTypes];

export const TerrainTypes = {
    Land: new Terrain(1, 1),
    Water: new Terrain(0, 0)
}

export interface TerrainMap {
    terrain(cell: Cell): Terrain
    width(): number
    height(): number
}

export interface Tile {
    owner(): PlayerView | null
    hasOwner(): boolean
    isBorder(): boolean
    isInterior(): boolean
    cell(): Cell
    terrain(): Terrain
    gameState(): GameStateView
    neighbors(): Tile[]
}

export interface PlayerView {
    info(): PlayerInfo
    id(): PlayerID
    troops(): number
    ownsTile(cell: Cell): boolean
    isAlive(): boolean
    gameState(): GameStateView
    executions(): ExecutionView[]
    borderTiles(): ReadonlySet<Tile>
    borderTilesWith(other: PlayerView): ReadonlySet<Tile>
}

export interface Player extends PlayerView {
    setTroops(troops: number): void
    conquer(cell: Cell): void
    gameState(): GameState
    executions(): Execution[]
}

export interface GameStateView {
    // Throws exception is player not found
    player(id: PlayerID): PlayerView
    tile(cell: Cell): Tile
    isOnMap(cell: Cell): boolean
    neighbors(cell: Cell): Cell[]
    width(): number
    height(): number
    forEachTile(fn: (tile: Tile) => void): void
    executions(): ExecutionView[]
}

export interface GameState extends GameStateView {
    player(id: PlayerID): Player
    players(): Player[]
    addPlayer(playerInfo: PlayerInfo): Player
    executions(): Execution[]
    addExecution(exec: Execution)
    removeExecution(exec: Execution)
}


export class TileEvent implements GameEvent {
    constructor(public readonly tile: Tile) { }
}

export class PlayerEvent implements GameEvent {
    constructor(public readonly player: PlayerView) { }
}