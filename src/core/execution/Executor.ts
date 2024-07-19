import {Cell, Execution, GameState, GameStateView, Player, PlayerInfo, TerrainTypes, Tile} from "../GameStateApi";

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


    spawnBots(numBots: number): Player[] {
        return new BotSpawner(this.gs).spawnBots(numBots)
    }

    tick() {
        this.gs.executions().forEach(e => e.tick())
        this.gs.executions().filter(e => e.isActive())
    }
}

export class AttackExecution implements Execution {
    private active: boolean = true;
    private enemyBorders: Tile[] = []

    constructor(private troops: number, private _owner: Player, private target: Player) { }

    tick() {
        if (!this.active) {
            return
        }
        if (this.troops < 1) {
            this.active = false
            return
        }

        if (this.enemyBorders.length == 0) {
            const border = this.owner().borderTilesWith(this.target)
            if (border.size == 0) {
                this.active = false
                return
            }
            for (const b of border) {
                b.neighbors().filter(t => t.owner() == this.target).forEach(t => this.enemyBorders.push(t))
            }
        }

        let tile: Tile = null
        while (true) {
            if (this.enemyBorders.length == 0) {
                return
            }
            tile = this.enemyBorders.pop()
            if (tile.owner() == this.target) {
                break
            }
        }

        this.troops -= 1
        this.owner().conquer(tile.cell())
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

    spawnBots(numBots: number): Player[] {
        const bots = []
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

    spawnBot(botName: string): Player {
        const bot = this.gs.addPlayer(new PlayerInfo(botName, true))
        const rand = getRandomNumber(this.numFreeTiles)
        const spawnCells = getSpawnCells(this.gs, this.freeTiles[rand])
        spawnCells.forEach(c => this.removeCell(c))
        spawnCells.forEach(c => this.gs.player(bot.id()).conquer(c))
        return bot
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

function getRandomElement<T>(list: T[]): T | undefined {
    return list[Math.floor(Math.random() * list.length)];
}