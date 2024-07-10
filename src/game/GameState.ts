import {GameMap} from "../map/GameMap"
import {InvalidArgumentException} from "../util/exception/InvalidArgumentException";
import {TileUpdateEvent, EventDispatcher, eventDispatcher, PlayerUpdateEvent} from "./GameEvent";
import {FFAGameMode} from "./mode/FFAGameMode";
import {GameMode} from "./mode/GameMode"
import {BotPlayer} from "./player/BotPlayer";

export type PlayerID = number

export enum TerrainType {
    Land,
    Water
}

export interface TerritoryTile {
    getOwner(): PlayerView | null
    hasOwner(): boolean
    isBorder(): boolean
    getCell(): Cell
}

export class TerritoryTileImpl implements TerritoryTile {
    public isBorderField = false
    public owner: PlayerImpl | null = null

    constructor(
        private readonly gs: GameState,
        private readonly cell: Cell
    ) { }

    hasOwner(): boolean {
        return this.getOwner != null
    }

    getOwner(): PlayerView | null {
        return this.owner
    }

    isBorder(): boolean {
        return this.isBorderField
    }

    getCell(): Cell {
        return this.cell
    }

}

export class TerrainTile {
    constructor(public readonly cell: Cell, public readonly type: TerrainType) { }
}

export class Cell {
    constructor(public readonly x, public readonly y) { }
}

export class PlayerInfo {
    constructor(public readonly name: string, public readonly isBot: boolean) { }
}

export interface PlayerView {
    getInfo(): PlayerInfo
    getID(): PlayerID
    getAllTiles(): Readonly<Set<TerritoryTile>>
    getInteriorTiles(): Readonly<Set<TerritoryTile>>
    getBorderTiles(): Readonly<Set<TerritoryTile>>
    getTroops(): number
    owns(cell: Cell): boolean
    isInterior(cell: Cell): boolean
    isBorder(cell: Cell): boolean
    isAlive(): boolean
}

export interface Player extends PlayerView {
    setTroops(troops: number)
    conquer(cell: Cell)
}


export interface GameStateView {
    // Throws exception is player not found
    getPlayerView(id: PlayerID): PlayerView
    getTile(cell: Cell): TerritoryTile
    // Throws exception if cell is not on map.
    getTerrainTile(cell: Cell): TerrainTile
    isOnMap(cell: Cell): boolean
    neighbors(cell: Cell): Cell[]
}

export interface GameState extends GameStateView {
    getPlayer(id: PlayerID): Player
    spawnPlayer(playerInfo: PlayerInfo, spawn: Cell): Player
}

class PlayerImpl implements Player {
    public interiorTiles: Map<Cell, TerritoryTile> = new Map<Cell, TerritoryTile>()
    public borderTiles: Map<Cell, TerritoryTile> = new Map<Cell, TerritoryTile>()
    public troops: number
    public isAliveField = true

    constructor(private gs: GameStateImpl, public readonly id: PlayerID, public readonly playerInfo: PlayerInfo) {

    }

    owns(cell: Cell): boolean {
        return this.gs.getTile(cell).getOwner() == this
    }

    setTroops(troops: number) {
        this.troops = troops
    }

    conquer(cell: Cell) {
        this.gs.conquer(this, cell)
    }

    getInfo(): PlayerInfo {
        return this.playerInfo
    }

    getID(): PlayerID {
        return this.id
    }

    getAllTiles(): Readonly<Set<TerritoryTile>> {
        return new Set([...this.borderTiles.values(), ...this.interiorTiles.values()])
    }

    getInteriorTiles(): Readonly<Set<TerritoryTile>> {
        return new Set(this.interiorTiles.values())
    }

    getBorderTiles(): Readonly<Set<TerritoryTile>> {
        return new Set(this.borderTiles.values())
    }

    getTroops(): number {
        return this.troops
    }

    isInterior(cell: Cell): boolean {
        return this.interiorTiles.has(cell)
    }

    isBorder(cell: Cell): boolean {
        return this.borderTiles.has(cell)
    }

    isAlive(): boolean {
        return this.isAliveField
    }

}

export function CreateGameState(terrainMap: GameMap, eventDispatcher: EventDispatcher): GameState {
    return new GameStateImpl(terrainMap, eventDispatcher)
}

class GameStateImpl implements GameState {
    idCounter: PlayerID = 0;
    territoryMap: TerritoryTileImpl[][]
    players: Map<PlayerID, PlayerImpl> = new Map<PlayerID, PlayerImpl>

    constructor(private terrainMap: GameMap, private eventDispatcher: EventDispatcher) {
        this.territoryMap = new TerrainTile[terrainMap.width][terrainMap.height]
        for (let x = 0; x < terrainMap.width; x++) {
            for (let y = 0; y < terrainMap.height; y++) {
                this.territoryMap[x][y] = new TerritoryTileImpl(this, new Cell(x, y))
            }
        }
    }

    getPlayerView(id: PlayerID): PlayerView {
        return this.getPlayer(id)
    }

    spawnPlayer(playerInfo: PlayerInfo, spawn: Cell): Player {
        let id = this.idCounter
        this.idCounter++
        let player = new PlayerImpl(this, id, playerInfo)
        for (const cell of this.getSpawnCells(spawn)) {
            this.conquer(player, cell)
        }
        this.eventDispatcher.firePlayerUpdateEvent(new PlayerUpdateEvent(player))
        return player
    }

    getPlayer(id: PlayerID): Player {
        if (!this.players.has(id)) {
            throw new InvalidArgumentException("TODO")
        }
        return this.players.get(id)
    }

    getTile(cell: Cell): TerritoryTile {
        this.assertIsOnMap(cell)
        return this.territoryMap[cell.x][cell.y]
    }

    getTerrainTile(cell: Cell): TerrainTile {
        this.assertIsOnMap(cell)
        return this.terrainMap[cell.x][cell.y]
    }

    isOnMap(cell: Cell): boolean {
        return cell.x >= 0
            && cell.x < this.terrainMap.width
            && cell.y >= 0
            && cell.y < this.terrainMap.height
    }

    neighbors(cell: Cell): Cell[] {
        throw new Error("Method not implemented.");
    }

    private assertIsOnMap(cell: Cell) {
        if (!this.isOnMap(cell)) {
            throw new InvalidArgumentException("TODO")
        }
    }

    conquer(owner: PlayerImpl, cell: Cell): void {
        this.assertIsOnMap(cell)
        if (!owner.isAlive()) {
            throw new InvalidArgumentException("TODO")
        }
        if (owner.owns(cell)) {
            throw new InvalidArgumentException("TODO")
        }
        if (!this.getTile(cell).isBorder()) {
            throw new InvalidArgumentException("TODO")
        }
        let tile = this.territoryMap[cell.x][cell.y]
        let previousOwner = tile.owner
        if (previousOwner != null) {
            previousOwner.borderTiles.delete(cell)
            previousOwner.interiorTiles.delete(cell)
        }
        tile.owner = owner
        owner.interiorTiles.set(cell, tile)
        this.eventDispatcher.fireTileUpdateEvent(new TileUpdateEvent(tile))
    }

    onNeighbors(tile: number, closure: (tile: number) => void): void {
        let x = tile % this.terrainMap.width;
        let y = Math.floor(tile / this.terrainMap.width);
        if (x > 0) {
            closure(tile - 1);
        }
        if (x < this.terrainMap.width - 1) {
            closure(tile + 1);
        }
        if (y > 0) {
            closure(tile - this.terrainMap.width);
        }
        if (y < this.terrainMap.height - 1) {
            closure(tile + this.terrainMap.width);
        }
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
                if (this.getTerrainTile(c).type != TerrainType.Land) {
                    continue
                }
                if (this.getTile(c).hasOwner()) {
                    continue
                }
                result.push(c)
            }
        }
        return result;
    }
}