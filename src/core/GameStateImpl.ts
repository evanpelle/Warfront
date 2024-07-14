import {EventBus} from "../EventBus";
import {Cell, GameState, GameStateView, Player, PlayerEvent, PlayerID, PlayerInfo, PlayerView, TerrainMap, TerrainType, TerrainTypes, Tile, TileEvent} from "./GameStateApi";

export function CreateGameState(terrainMap: TerrainMap, eventBus: EventBus): GameState {
    return new GameStateImpl(terrainMap, eventBus)
}

export class TileImpl implements Tile {
    public _owner: PlayerImpl | null = null

    constructor(
        private readonly gs: GameStateImpl,
        private readonly _cell: Cell,
        private readonly _terrain: TerrainType
    ) { }

    hasOwner(): boolean {return this._owner != null}
    owner(): Player | null {return this._owner}
    isBorder(): boolean {return this.gs.isBorder(this)}
    isInterior(): boolean {return this.hasOwner() && !this.isBorder()}
    cell(): Cell {return this._cell}
    terrain(): TerrainType {return this._terrain}
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


export class TerrainMapImpl implements TerrainMap {


    constructor(public readonly tiles: TerrainType[][]) { }

    terrain(cell: Cell): TerrainType {
        return this.tiles[cell.x][cell.y]
    }

    width(): number {
        return this.tiles.length
    }

    height(): number {
        return this.tiles[0].length
    }
}

class GameStateImpl implements GameState {
    idCounter: PlayerID = 0;
    map: TileImpl[][]
    players: Map<PlayerID, PlayerImpl> = new Map<PlayerID, PlayerImpl>
    private _width: number
    private _height: number

    constructor(terrainMap: TerrainMap, private eventBus: EventBus) {
        this._width = terrainMap.width();
        this._height = terrainMap.height();
        this.map = new Array(this._width);
        for (let x = 0; x < this._width; x++) {
            this.map[x] = new Array(this._height);
            for (let y = 0; y < this._height; y++) {
                let cell = new Cell(x, y);
                this.map[x][y] = new TileImpl(this, cell, terrainMap.terrain(cell));
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
        this.eventBus.emit(new PlayerEvent(player))
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
        this.eventBus.emit(new TileEvent(tile))
        // TODO: update for borders
    }

    isBorder(tile: TileImpl): boolean {
        this.assertIsOnMap(tile.cell())
        if (!tile.hasOwner()) {
            return false
        }
        for (const neighbor of this.neighbors(tile.cell())) {
            let bordersEnemy = this.tile(neighbor).owner() != tile.owner()
            let bordersWater = this.tile(neighbor).terrain() != TerrainTypes.Land
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
                if (this.tile(c).terrain() != TerrainTypes.Land) {
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