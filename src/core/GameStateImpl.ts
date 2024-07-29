import {EventBus} from "./EventBus";
import {Cell, Execution, GameState, GameStateView, Player, PlayerEvent, PlayerID, PlayerInfo, PlayerView, TerrainMap, TerrainType, TerrainTypes, TerraNullius, Tile, TileEvent} from "./GameStateApi";

export function CreateGameState(terrainMap: TerrainMap, eventBus: EventBus): GameState {
    return new GameStateImpl(terrainMap, eventBus)
}

class TileImpl implements Tile {

    constructor(
        private readonly gs: GameStateImpl,
        public _owner: PlayerImpl | TerraNullius,
        private readonly _cell: Cell,
        private readonly _terrain: TerrainType
    ) { }

    hasOwner(): boolean {return this._owner != null}
    owner(): Player | TerraNullius {return this._owner}
    isBorder(): boolean {return this.gs.isBorder(this)}
    isInterior(): boolean {return this.hasOwner() && !this.isBorder()}
    cell(): Cell {return this._cell}
    terrain(): TerrainType {return this._terrain}

    neighbors(): Tile[] {
        return this.gs.neighbors(this._cell).map(c => this.gs.tile(c))
    }

    gameState(): GameStateView {return this.gs}
}

class PlayerImpl implements Player {

    public _borderTiles: Map<Cell, Tile> = new Map()
    public _borderWith: Map<PlayerID, Set<Tile>>
    public tiles: Map<Cell, Tile> = new Map<Cell, Tile>()
    public isAliveField = true

    constructor(private gs: GameStateImpl, public readonly _id: PlayerID, public readonly playerInfo: PlayerInfo, private _troops) { }

    addTroops(troops: number): void {
        this._troops += troops
    }

    isPlayer(): this is Player {return true as const}
    ownsTile(cell: Cell): boolean {return this.tiles.has(cell)}
    setTroops(troops: number) {this._troops = troops}
    conquer(cell: Cell) {this.gs.conquer(this, cell)}
    info(): PlayerInfo {return this.playerInfo}
    id(): PlayerID {return this._id}
    troops(): number {return this._troops}
    isAlive(): boolean {return this.isAliveField}
    gameState(): GameState {return this.gs}
    executions(): Execution[] {
        return this.gs.executions().filter(exec => exec.owner().id() == this.id())
    }

    borderTilesWith(other: Player): ReadonlySet<Tile> {
        if (!this._borderWith.has(other.id())) {
            return new Set()
        }
        return this._borderWith.get(other.id())
        for (const tile of this._borderTiles.values()) {
            if (tile.neighbors().filter(t => t.owner() == other).length > 0) {
                borderWith.add(tile)
            }
        }
        return borderWith
    }
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
    _players: Map<PlayerID, PlayerImpl> = new Map<PlayerID, PlayerImpl>
    private execs: Execution[] = []
    private _width: number
    private _height: number
    private terraNullius: TerraNulliusImpl

    constructor(terrainMap: TerrainMap, private eventBus: EventBus) {
        this.terraNullius = new TerraNulliusImpl(this)
        this._width = terrainMap.width();
        this._height = terrainMap.height();
        this.map = new Array(this._width);
        for (let x = 0; x < this._width; x++) {
            this.map[x] = new Array(this._height);
            for (let y = 0; y < this._height; y++) {
                let cell = new Cell(x, y);
                this.map[x][y] = new TileImpl(this, this.terraNullius, cell, terrainMap.terrain(cell));
            }
        }
    }

    removeInactiveExecutions(): void {
        this.execs = this.execs.filter(e => e.isActive())
    }

    players(): Player[] {
        return Array.from(this._players.values())
    }

    executions(): Execution[] {
        return this.execs
    }

    addExecution(exec: Execution) {
        this.execs.push(exec)
    }

    removeExecution(exec: Execution) {
        this.execs.filter(execution => execution !== exec)
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

    playerView(id: PlayerID): Player {
        return this.player(id)
    }

    addPlayer(playerInfo: PlayerInfo): Player {
        let id = this.idCounter
        this.idCounter++
        let player = new PlayerImpl(this, id, playerInfo, 100)
        this._players.set(id, player)
        this.eventBus.emit(new PlayerEvent(player))
        return player
    }

    player(id: PlayerID): Player {
        if (!this._players.has(id)) {
            throw new Error(`Player with id ${id} not found`)
        }
        return this._players.get(id)
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
            throw new Error(`Player ${owner} already owns cell ${cell}`)
        }
        if (!owner.isPlayer()) {
            throw new Error("Must be a player")
        }
        let tile = this.map[cell.x][cell.y]
        let previousOwner = tile._owner
        if (previousOwner.isPlayer()) {
            previousOwner.tiles.delete(cell)
        }
        tile._owner = owner
        owner.tiles.set(cell, tile)
        this.updateBorders(cell)
        this.eventBus.emit(new TileEvent(tile))
    }

    private updateBorders(cell: Cell) {
        const cells: Cell[] = []
        cells.push(cell)
        this.neighbors(cell).forEach(c => cells.push(cell))
        cells.map(c => this.tile(c)).filter(c => c.hasOwner()).forEach(t => {
            if (this.isBorder(t)) {
                (t.owner() as PlayerImpl)._borderTiles.set(t.cell(), t)
            } else {
                (t.owner() as PlayerImpl)._borderTiles.delete(t.cell())
            }
        })
    }

    isBorder(tile: Tile): boolean {
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
}

class TerraNulliusImpl implements TerraNullius {

    constructor(private gs: GameState) { }

    id(): PlayerID {
        throw new Error("Method not implemented.");
    }
    ownsTile(cell: Cell): boolean {
        throw new Error("Method not implemented.");
    }
    borderTilesWith(other: PlayerView): ReadonlySet<Tile> {
        throw new Error("Method not implemented.");
    }
    isPlayer(): false {return false as const}
} 