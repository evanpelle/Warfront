import {EventBus} from "./EventBus";
import {Cell, Execution, MutableGame, Game, MutablePlayer, PlayerEvent, PlayerID, PlayerInfo, Player, TerrainMap, TerrainType, TerrainTypes, TerraNullius, Tile, TileEvent} from "./GameApi";

export function createGame(terrainMap: TerrainMap, eventBus: EventBus): Game {
    return new GameImpl(terrainMap, eventBus)
}

type CellString = string

class TileImpl implements Tile {

    constructor(
        private readonly gs: GameImpl,
        public _owner: PlayerImpl | TerraNulliusImpl,
        private readonly _cell: Cell,
        private readonly _terrain: TerrainType
    ) { }

    hasOwner(): boolean {return this._owner != this.gs._terraNullius}
    owner(): MutablePlayer | TerraNullius {return this._owner}
    isBorder(): boolean {return this.gs.isBorder(this)}
    isInterior(): boolean {return this.hasOwner() && !this.isBorder()}
    cell(): Cell {return this._cell}
    terrain(): TerrainType {return this._terrain}

    neighbors(): Tile[] {
        return this.gs.neighbors(this._cell).map(c => this.gs.tile(c))
    }

    game(): Game {return this.gs}
}

export class PlayerImpl implements MutablePlayer {

    public _borderTiles: Map<CellString, Tile> = new Map()
    _borderWith: Map<Player | TerraNullius, Set<Tile>> = new Map()
    public tiles: Map<CellString, Tile> = new Map<CellString, Tile>()

    constructor(private gs: GameImpl, public readonly _id: PlayerID, public readonly playerInfo: PlayerInfo, private _troops) { }
    numTilesOwned(): number {
        return this.tiles.size
    }

    borderTiles(): ReadonlySet<Tile> {
        return new Set(this._borderTiles.values())
    }


    neighbors(): (MutablePlayer | TerraNullius)[] {
        const ns: (MutablePlayer | TerraNullius)[] = []
        for (const [player, tiles] of this._borderWith) {
            if (tiles.size > 0) {
                ns.push(player as MutablePlayer)
            }
        }
        return ns
    }

    addTroops(troops: number): void {
        this._troops += troops
    }

    isPlayer(): this is MutablePlayer {return true as const}
    ownsTile(cell: Cell): boolean {return this.tiles.has(cell.toString())}
    setTroops(troops: number) {this._troops = troops}
    conquer(cell: Cell) {this.gs.conquer(this, cell)}
    info(): PlayerInfo {return this.playerInfo}
    id(): PlayerID {return this._id}
    troops(): number {return this._troops}
    isAlive(): boolean {return this.tiles.size > 0}
    gameState(): MutableGame {return this.gs}
    executions(): Execution[] {
        return this.gs.executions().filter(exec => exec.owner().id() == this.id())
    }

    borderTilesWith(other: Player | TerraNullius): ReadonlySet<Tile> {
        return this._borderWith.get(other) || new Set();
    }

    updateBorderWithTile(tile: Tile, oldOwner: Player | TerraNullius, newOwner: Player | TerraNullius) {
        if (!this._borderWith.has(oldOwner)) {
            this._borderWith.set(oldOwner, new Set())
        }
        if (!this._borderWith.has(newOwner)) {
            this._borderWith.set(newOwner, new Set())
        }

        // Delete old neighbors
        if (this.gs.tileNeighbors(tile).filter(t => t.owner() == newOwner).length == 0) {
            this._borderWith.get(oldOwner).delete(tile)
        }
    }

    addCalcBorderWithTile(tile: Tile) {
        this.gs.neighbors(tile.cell()).map(c => this.gs.tile(c)).forEach(t => {
            this.insertBorderWithTile(tile, t.owner())
        })
    }

    removeCalcBorderWithTile(tile: Tile, oldNeighbor: Player | TerraNullius) {
        const length = this.gs.neighbors(tile.cell()).map(c => this.gs.tile(c)).filter(t => t.owner() == oldNeighbor).length
        if (length == 0) {
            this.deleteBorderWithTile(tile, oldNeighbor)
        }
    }

    insertBorderWithTile(tile: Tile, player: Player | TerraNullius) {
        if (!this._borderWith.has(player)) {
            this._borderWith.set(player, new Set())
        }
        if (player != this) {
            this._borderWith.get(player).add(tile)
        }
    }

    deleteBorderWithTile(tile: Tile, player: Player | TerraNullius) {
        if (!this._borderWith.has(player)) {
            this._borderWith.set(player, new Set())
        }
        this._borderWith.get(player).delete(tile)
    }
}

class TerraNulliusImpl implements TerraNullius {


    _borderWith: Map<Player | TerraNullius, Set<Tile>> = new Map()
    public tiles: Map<Cell, Tile> = new Map<Cell, Tile>()


    constructor(private gs: MutableGame) { }

    id(): PlayerID {
        return 0
    }
    ownsTile(cell: Cell): boolean {
        return this.tiles.has(cell)
    }
    isPlayer(): false {return false as const}

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

export class GameImpl implements MutableGame {
    private unInitExecs: Execution[] = []

    idCounter: PlayerID = 1; // Zero reserved for TerraNullius
    map: TileImpl[][]
    _players: Map<PlayerID, PlayerImpl> = new Map<PlayerID, PlayerImpl>
    private execs: Execution[] = []
    private _width: number
    private _height: number
    _terraNullius: TerraNulliusImpl

    constructor(terrainMap: TerrainMap, private eventBus: EventBus) {
        this._terraNullius = new TerraNulliusImpl(this)
        this._width = terrainMap.width();
        this._height = terrainMap.height();
        this.map = new Array(this._width);
        for (let x = 0; x < this._width; x++) {
            this.map[x] = new Array(this._height);
            for (let y = 0; y < this._height; y++) {
                let cell = new Cell(x, y);
                this.map[x][y] = new TileImpl(this, this._terraNullius, cell, terrainMap.terrain(cell));
            }
        }
    }

    tick() {
        this.unInitExecs.forEach(e => e.init(this))
        this.execs.push(...this.unInitExecs)
        this.unInitExecs = []

        this.executions().forEach(e => e.tick())
        this.removeInactiveExecutions()
    }

    terraNullius(): TerraNullius {
        return this._terraNullius
    }

    removeInactiveExecutions(): void {
        this.execs = this.execs.filter(e => e.isActive())
    }

    players(): MutablePlayer[] {
        return Array.from(this._players.values()).filter(p => p.isAlive())
    }

    executions(): Execution[] {
        return this.execs
    }

    addExecution(...exec: Execution[]) {
        this.unInitExecs.push(...exec)
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

    playerView(id: PlayerID): MutablePlayer {
        return this.player(id)
    }

    addPlayer(playerInfo: PlayerInfo): MutablePlayer {
        let id = this.idCounter
        this.idCounter++
        let player = new PlayerImpl(this, id, playerInfo, 10000)
        this._players.set(id, player)
        this.eventBus.emit(new PlayerEvent(player))
        return player
    }

    player(id: PlayerID | null): MutablePlayer {
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

    tileNeighbors(tile: Tile): Tile[] {
        return this.neighbors(tile.cell()).map(c => this.tile(c))
    }

    private assertIsOnMap(cell: Cell) {
        if (!this.isOnMap(cell)) {
            throw new Error(`cell ${cell.toString()} is not on map`)
        }
    }

    conquer(owner: PlayerImpl, cell: Cell): void {
        if (owner.ownsTile(cell)) {
            throw new Error(`Player ${owner} already owns cell ${cell.toString()}`)
        }
        if (!owner.isPlayer()) {
            throw new Error("Must be a player")
        }
        let tile = this.tile(cell) as TileImpl
        let previousOwner = tile._owner
        if (previousOwner.isPlayer()) {
            previousOwner.tiles.delete(cell.toString())
            previousOwner._borderTiles.delete(cell.toString())
        }
        tile._owner = owner
        owner.tiles.set(cell.toString(), tile)
        this.updateBorders(cell)
        this.updateBordersWith(tile, previousOwner)
        this.eventBus.emit(new TileEvent(tile))
    }

    private updateBorders(cell: Cell) {
        const cells: Cell[] = []
        cells.push(cell)
        this.neighbors(cell).forEach(c => cells.push(c))
        cells.map(c => this.tile(c)).filter(c => c.hasOwner()).forEach(t => {
            if (this.isBorder(t)) {
                (t.owner() as PlayerImpl)._borderTiles.set(t.cell().toString(), t)
            } else {
                (t.owner() as PlayerImpl)._borderTiles.delete(t.cell().toString())
            }
        })
    }

    private updateBordersWith(tile: TileImpl, previousOwner: PlayerImpl | TerraNulliusImpl) {
        const newOwner = tile._owner
        const neighbors = this.neighbors(tile.cell()).map(c => this.tile(c))

        if (newOwner.isPlayer()) {
            newOwner.addCalcBorderWithTile(tile)
        }



        neighbors.map(t => (t as TileImpl)).forEach(t => {
            const p = t._owner
            if (p.isPlayer()) {
                p.addCalcBorderWithTile(t)
                p.removeCalcBorderWithTile(t, previousOwner)
            }
            if (previousOwner.isPlayer()) {
                previousOwner.deleteBorderWithTile(tile, p)
            }
        })

        // tiles.forEach(t => {
        //     const owner = (t as TileImpl)._owner
        //     if (owner.isPlayer()) {
        //         owner.updateBorderWithTile(t, previousOwner, t.owner())
        //     }

        //     if (!cellOwner._borderWith.has(t.owner())) {
        //         cellOwner._borderWith.set(t.owner(), new Set())
        //     }
        //     if (t.owner() != cellOwner) {
        //         cellOwner._borderWith.get(t.owner()).add(this.tile(cell))
        //     }
        // })
    }

    isBorder(tile: Tile): boolean {
        this.assertIsOnMap(tile.cell())
        if (!tile.hasOwner()) {
            return false
        }
        for (const neighbor of this.neighbors(tile.cell())) {
            let bordersEnemy = this.tile(neighbor).owner() != tile.owner()
            if (bordersEnemy) {
                return true
            }
        }
        return false
    }
}