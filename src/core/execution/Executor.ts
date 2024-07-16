import {Cell, Execution, GameState, GameStateView, Player, PlayerInfo, TerrainTypes, Tile} from "../GameStateApi";

export class Executor {

    constructor(private gs: GameState) {

    }

    spawnPlayer(playerInfo: PlayerInfo, cell: Cell) {
        const player = this.gs.addPlayer(playerInfo)
        getSpawnCells(this.gs, cell).forEach(c => {
            player.conquer(c)
        })
    }


    spawnBots(numBots: number) {
        new BotSpawner(this.gs).spawnBots(numBots)
    }

    tick() {
        this.gs.executions().forEach(e => e.tick())
        this.gs.executions().filter(e => e.isActive())
    }
}

class AttackExecution implements Execution {
    private active: boolean = true;

    constructor(private _owner: Player, private target: Player, private gs: GameState) { }

    tick() {

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

    constructor(private gs: GameState) { }

    spawnBots(numBots: number) {
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
            this.spawnBot("Bot" + i)
        }
    }

    spawnBot(botName: string) {
        const bot = this.gs.addPlayer(new PlayerInfo(botName, true))
        const rand = getRandomNumber(this.numFreeTiles)
        const spawnCells = getSpawnCells(this.gs, this.freeTiles[rand])
        spawnCells.forEach(c => this.removeCell(c))
        spawnCells.forEach(c => this.gs.player(bot.id()).conquer(c))
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

function getRandomNumber(n: number): number {
    return Math.floor(Math.random() * n);
}