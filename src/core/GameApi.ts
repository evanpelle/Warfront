import {intersection} from "zod"
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

    toString(): string {return `Cell[${this.x},${this.y}]`}
}

export interface ExecutionView {
    isActive(): boolean
    owner(): Player
}

export interface Execution extends ExecutionView {
    init(mg: MutableGame)
    tick()
    owner(): MutablePlayer
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
    owner(): Player | TerraNullius
    hasOwner(): boolean
    isBorder(): boolean
    isInterior(): boolean
    cell(): Cell
    terrain(): Terrain
    game(): Game
    neighbors(): Tile[]
}

export interface TerraNullius {
    ownsTile(cell: Cell): boolean
    isPlayer(): false
}

export interface Player {
    info(): PlayerInfo
    id(): PlayerID
    troops(): number
    ownsTile(cell: Cell): boolean
    isAlive(): boolean
    gameState(): Game
    executions(): ExecutionView[]
    borderTiles(): ReadonlySet<Tile>
    borderTilesWith(other: Player | TerraNullius): ReadonlySet<Tile>
    isPlayer(): this is Player
    neighbors(): (Player | TerraNullius)[]
    numTilesOwned(): number
}

export interface MutablePlayer extends Player {
    setTroops(troops: number): void
    addTroops(troops: number): void
    conquer(cell: Cell): void
    executions(): Execution[]
    neighbors(): (MutablePlayer | TerraNullius)[]
}

export interface Game {
    // Throws exception is player not found
    player(id: PlayerID): Player
    players(): Player[]
    tile(cell: Cell): Tile
    isOnMap(cell: Cell): boolean
    neighbors(cell: Cell): Cell[]
    width(): number
    height(): number
    forEachTile(fn: (tile: Tile) => void): void
    executions(): ExecutionView[]
    terraNullius(): TerraNullius
    tick()
    addExecution(...exec: Execution[])
}

export interface MutableGame extends Game {
    player(id: PlayerID): MutablePlayer
    players(): MutablePlayer[]
    addPlayer(playerInfo: PlayerInfo): MutablePlayer
    executions(): Execution[]
    removeInactiveExecutions(): void
    removeExecution(exec: Execution)
}


export class TileEvent implements GameEvent {
    constructor(public readonly tile: Tile) { }
}

export class PlayerEvent implements GameEvent {
    constructor(public readonly player: Player) { }
}
