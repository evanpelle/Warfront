import {GameEvent} from "../EventBus"

export type PlayerID = number


export class Cell {
    constructor(
        public readonly x,
        public readonly y
    ) { }
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
}

export interface PlayerView {
    info(): PlayerInfo
    id(): PlayerID
    troops(): number
    ownsTile(cell: Cell): boolean
    isAlive(): boolean
    gameState(): GameStateView
}

export interface Player extends PlayerView {
    setTroops(troops: number): void
    conquer(cell: Cell): void
    gameState(): GameState
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
}

export interface GameState extends GameStateView {
    player(id: PlayerID): Player
    spawnPlayer(playerInfo: PlayerInfo, spawn: Cell): Player
}


export class TileEvent implements GameEvent {
    constructor(public readonly tile: Tile) { }
}

export class PlayerEvent implements GameEvent {
    constructor(public readonly player: Player) { }
}