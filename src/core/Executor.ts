import PriorityQueue from "priority-queue-typescript";
import {Cell, Execution, GameState, GameStateView, Player, PlayerInfo, TerrainTypes, Tile} from "./GameStateApi";
import {PseudoRandom} from "./PseudoRandom";
import {AttackIntent, Intent, SpawnIntent, Turn} from "./Schemas";
import {manhattanDist} from "./Utils";


export class Executor {

    constructor(private gs: GameState) {

    }

    spawnPlayer(playerInfo: PlayerInfo, cell: Cell): Player {
        const player = this.gs.addPlayer(playerInfo)
        getSpawnCells(this.gs, cell).forEach(c => {
            player.conquer(c)
        })
        return player
    }

    addTurn(turn: Turn) {
        turn.intents.forEach(i => this.addIntent(i))
    }

    addIntent(intent: Intent) {
        switch (intent.type) {
            case "attack":
                this.gs.addExecution(
                    new AttackExecution(
                        intent.troops,
                        this.gs.player(intent.attackerID),
                        intent.targetID != null ? this.gs.player(intent.targetID) : null,
                        new Cell(intent.targetX, intent.targetY)
                    )
                )
            case "spawn":
                if (intent.type == "spawn") {
                    this.gs.addExecution(
                        new SpawnExecution(
                            new PlayerInfo(intent.name, intent.isBot),
                            new Cell(intent.x, intent.y),
                            this.gs
                        )
                    )
                }
        }
    }


    spawnBots(numBots: number): void {
        new BotSpawner(this.gs).spawnBots(numBots).forEach(i => this.addIntent(i))
    }

    tick() {
        this.gs.executions().forEach(e => e.tick())
        this.gs.removeInactiveExecutions()
    }
}

export class SpawnExecution implements Execution {

    active: boolean = true

    constructor(
        private playerInfo: PlayerInfo,
        private cell: Cell,
        private gs: GameState
    ) {

    }

    tick() {
        if (!this.isActive()) {
            return
        }
        const player = this.gs.addPlayer(this.playerInfo)
        getSpawnCells(this.gs, this.cell).forEach(c => {
            player.conquer(c)
        })
        this.active = false
    }
    owner(): Player {
        return null
    }
    isActive(): boolean {
        return this.active
    }
}

class TileContainer {
    constructor(public readonly tile: Tile, public readonly priority: number) { }
}

export class AttackExecution implements Execution {
    private active: boolean = true;
    private toConquer: PriorityQueue<TileContainer> = new PriorityQueue<TileContainer>(11, (a: TileContainer, b: TileContainer) => a.priority - b.priority);
    private random = new PseudoRandom(123)

    constructor(private troops: number, private _owner: Player, private target: Player, private targetCell: Cell) { }

    tick() {
        if (!this.active) {
            return
        }

        let numTilesPerTick = this._owner.borderTilesWith(this.target).size / 2
        while (numTilesPerTick > 0) {
            if (this.troops < 1) {
                this.active = false
                return
            }

            if (this.toConquer.size() == 0) {
                this.calculateToConquer()
            }
            if (this.toConquer.size() == 0) {
                this.active = false
                this._owner.addTroops(this.troops)
                return
            }

            const tileToConquer: Tile = this.toConquer.poll().tile
            const onBorder = tileToConquer.neighbors().filter(t => t.owner() == this._owner).length > 0
            if (tileToConquer.owner() != this.target || !onBorder) {
                continue
            }
            this._owner.conquer(tileToConquer.cell())
            this.troops -= 1
            numTilesPerTick -= 1
        }
    }

    private calculateToConquer() {
        const border = this.owner().borderTilesWith(this.target)
        const enemyBorder: Set<Tile> = new Set()
        for (const b of border) {
            b.neighbors()
                .filter(t => t.terrain() == TerrainTypes.Land)
                .filter(t => t.owner() == this.target)
                .forEach(t => enemyBorder.add(t))
        }

        // let closestTile: Tile;
        // let closestDist: number = Number.POSITIVE_INFINITY;
        // for (const enemyTile of enemyBorder) {
        //     const dist = manhattanDist(enemyTile.cell(), this.targetCell)
        //     if (dist < closestDist) {
        //         closestTile = enemyTile
        //     }
        // }
        const tileByDist = Array.from(enemyBorder).slice().sort((a, b) => manhattanDist(a.cell(), this.targetCell) - manhattanDist(b.cell(), this.targetCell))

        // tileByDist.forEach(t => console.log(`tile dist: ${manhattanDist(t.cell(), closestTile.cell())}`))

        for (let i = 0; i < Math.min(enemyBorder.size / 2, tileByDist.length); i++) {
            const enemyTile = tileByDist[i]
            const numOwnedByMe = enemyTile.neighbors()
                .filter(t => t.terrain() == TerrainTypes.Land)
                .filter(t => t.owner() == this._owner)
                .length
            // this.toConquer.add(new TileContainer(enemyTile, numOwnedByMe + (this.random.next() % 5) + (-5 * i / tileByDist.length)))
            const r = this.random.next() % 4
            this.toConquer.add(new TileContainer(enemyTile, r - numOwnedByMe))
        }

    }

    owner(): Player {
        return this._owner
    }

    isActive(): boolean {
        return this.active
    }

}

class BotSpawner {
    private cellToIndex;
    private freeTiles: Cell[];
    private numFreeTiles;
    private random = new PseudoRandom(123)

    constructor(private gs: GameStateView) { }

    spawnBots(numBots: number): SpawnIntent[] {
        const bots: SpawnIntent[] = []
        this.cellToIndex = new Map<string, number>()
        this.freeTiles = new Array();
        this.numFreeTiles = 0

        this.gs.forEachTile(tile => {
            if (tile.terrain() == TerrainTypes.Water) {
                return
            }
            if (tile.hasOwner()) {
                return
            }

            this.freeTiles.push(tile.cell())
            this.cellToIndex.set(tile.cell().string(), this.numFreeTiles)
            this.numFreeTiles++
        })
        for (let i = 0; i < numBots; i++) {
            bots.push(this.spawnBot("Bot" + i))
        }
        return bots
    }

    spawnBot(botName: string): SpawnIntent {
        const bot = new PlayerInfo(botName, true)
        const rand = this.random.nextInt(0, this.numFreeTiles)
        const spawn = this.freeTiles[rand]
        const spawnCells = getSpawnCells(this.gs, spawn)
        spawnCells.forEach(c => this.removeCell(c))
        const spawnIntent: SpawnIntent = {
            type: 'spawn',
            name: botName,
            isBot: true,
            x: spawn.x,
            y: spawn.y
        };
        return spawnIntent
    }

    private removeCell(cell: Cell) {
        const index = this.cellToIndex[cell.string()]
        this.freeTiles[index] = this.freeTiles[this.numFreeTiles - 1]
        this.cellToIndex[this.freeTiles[index].string()] = index
        this.numFreeTiles--
    }
}


function getSpawnCells(gs: GameStateView, cell: Cell): Cell[] {
    let result: Cell[] = [];
    for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
            let c = new Cell(cell.x + dx, cell.y + dy)
            if (!gs.isOnMap(c)) {
                continue
            }
            if (Math.abs(dx) === 2 && Math.abs(dy) === 2) {
                continue;
            }
            if (gs.tile(c).terrain() != TerrainTypes.Land) {
                continue
            }
            if (gs.tile(c).hasOwner()) {
                continue
            }
            result.push(c)
        }
    }
    return result;
}