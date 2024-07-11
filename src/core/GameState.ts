import {TileUpdateEvent, EventDispatcher, eventDispatcher, PlayerUpdateEvent} from "../EventDispatcher";

export type PlayerID = number

export enum TerrainType {
    Land,
    Water
}

export class Cell {
    constructor(public readonly x, public readonly y) { }
}

export class PlayerInfo {
    constructor(public readonly name: string, public readonly isBot: boolean) { }
}

export class Terrain {
    constructor(
        private readonly _type: TerrainType,
        private readonly _expansionCost: number,
        private readonly _expansionTime: number,
    ) { }

    type(): TerrainType {return this._type}
    expansionCost(): number {return this._expansionCost}
    expansionTime(): number {return this._expansionTime}
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

export class TileImpl implements Tile {
    public _owner: PlayerImpl | null = null

    constructor(
        private readonly gs: GameStateImpl,
        private readonly _cell: Cell,
        private readonly _terrain: Terrain
    ) { }

    hasOwner(): boolean {return this.owner != null}
    owner(): Player | null {return this._owner}
    isBorder(): boolean {return this.gs.isBorder(this)}
    isInterior(): boolean {return this.hasOwner() && !this.isBorder()}
    cell(): Cell {return this._cell}
    terrain(): Terrain {return this._terrain}
    gameState(): GameStateView {return this.gs}
}

class PlayerImpl implements Player {
    public tiles: Map<Cell, Tile> = new Map<Cell, Tile>()
    public _troops: number
    public isAliveField = true

    constructor(private gs: GameStateImpl, public readonly _id: PlayerID, public readonly playerInfo: PlayerInfo) { }

    ownsTile(cell: Cell): boolean {return this.tiles.has(cell)}
    setTroops(troops: number) {this._troops = troops}
    conquer(cell: Cell) {this.gs.conquer(this, cell)}
    info(): PlayerInfo {return this.playerInfo}
    id(): PlayerID {return this._id}
    troops(): number {return this._troops}
    isAlive(): boolean {return this.isAliveField}
    gameState(): GameState {return this.gs}
}


export class TerrainMap {
    public readonly tiles: Terrain[][]

    constructor(public readonly width: number, public readonly height: number) {
        this.tiles = new Terrain[width][height]
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                this.tiles[x][y] = new Terrain(TerrainType.Land, 1, 1)
            }
        }
    }

    terrain(cell: Cell): Terrain {
        return this.tiles[cell.x][cell.y]
    }
}

export function CreateGameState(terrainMap: TerrainMap, eventDispatcher: EventDispatcher): GameState {
    return new GameStateImpl(terrainMap, eventDispatcher)
}

class GameStateImpl implements GameState {
    idCounter: PlayerID = 0;
    map: TileImpl[][]
    players: Map<PlayerID, PlayerImpl> = new Map<PlayerID, PlayerImpl>
    private _width: number
    private _height: number

    constructor(terrainMap: TerrainMap, private eventDispatcher: EventDispatcher) {
        this._width = terrainMap.width
        this._height = terrainMap.height
        this.map = new TileImpl[terrainMap.width][terrainMap.height]
        for (let x = 0; x < terrainMap.width; x++) {
            for (let y = 0; y < terrainMap.height; y++) {
                let cell = new Cell(x, y)
                this.map[x][y] = new TileImpl(this, cell, terrainMap.terrain(cell))
            }
        }
    }

    width(): number {
        return this._width
    }

    height(): number {
        return this._height
    }

    forEachTile(fn: (tile: Tile) => void): void {
        for (let x = 0; x < this._width; x++) {
            for (let y = 0; y < this._height; y++) {
                fn(this.tile(new Cell(x, y)))
            }
        }
    }

    playerView(id: PlayerID): PlayerView {
        return this.player(id)
    }

    spawnPlayer(playerInfo: PlayerInfo, spawn: Cell): Player {
        let id = this.idCounter
        this.idCounter++
        let player = new PlayerImpl(this, id, playerInfo)
        this.players[id] = player
        for (const cell of this.getSpawnCells(spawn)) {
            this.conquer(player, cell)
        }
        this.eventDispatcher.firePlayerUpdateEvent(new PlayerUpdateEvent(player))
        return player
    }

    player(id: PlayerID): Player {
        if (!this.players.has(id)) {
            throw new Error("TODO")
        }
        return this.players.get(id)
    }

    tile(cell: Cell): Tile {
        this.assertIsOnMap(cell)
        return this.map[cell.x][cell.y]
    }

    isOnMap(cell: Cell): boolean {
        return cell.x >= 0
            && cell.x < this._width
            && cell.y >= 0
            && cell.y < this._height
    }

    neighbors(cell: Cell): Cell[] {
        this.assertIsOnMap(cell)
        return [
            new Cell(cell.x + 1, cell.y),
            new Cell(cell.x - 1, cell.y),
            new Cell(cell.x, cell.y + 1),
            new Cell(cell.x, cell.y - 1)
        ].filter(c => this.isOnMap(c))
    }

    private assertIsOnMap(cell: Cell) {
        if (!this.isOnMap(cell)) {
            throw new Error("TODO")
        }
    }

    conquer(owner: PlayerImpl, cell: Cell): void {
        this.assertIsOnMap(cell)
        if (!owner.isAlive()) {
            throw new Error("TODO")
        }
        if (owner.ownsTile(cell)) {
            throw new Error("TODO")
        }
        if (!this.tile(cell).isBorder()) {
            throw new Error("TODO")
        }
        let tile = this.map[cell.x][cell.y]
        let previousOwner = tile._owner
        if (previousOwner != null) {
            previousOwner.tiles.delete(cell)
        }
        tile._owner = owner
        owner.tiles.set(cell, tile)
        this.eventDispatcher.fireTileUpdateEvent(new TileUpdateEvent(tile))
        // TODO: update for borders
    }

    isBorder(tile: TileImpl): boolean {
        this.assertIsOnMap(tile.cell())
        if (!tile.hasOwner()) {
            return false
        }
        for (const neighbor of this.neighbors(tile.cell())) {
            let bordersEnemy = this.tile(neighbor).owner() != tile.owner()
            let bordersWater = this.tile(neighbor).terrain().type() != TerrainType.Land
            if (bordersEnemy || bordersWater) {
                return true
            }
        }
        return false
    }

    private getSpawnCells(cell: Cell): Cell[] {
        let result: Cell[] = [];
        for (let dx = -2; dx <= 2; dx++) {
            for (let dy = -2; dy <= 2; dy++) {
                let c = new Cell(cell.x + dx, cell.y + dy)
                if (!this.isOnMap(c)) {
                    continue
                }
                if (Math.abs(dx) === 2 && Math.abs(dy) === 2) {
                    continue;
                }
                if (this.tile(c).terrain().type() != TerrainType.Land) {
                    continue
                }
                if (this.tile(c).hasOwner()) {
                    continue
                }
                result.push(c)
            }
        }
        return result;
    }
}