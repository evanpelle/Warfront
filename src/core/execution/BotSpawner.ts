import {Cell, Game, TerrainTypes} from "../GameApi";
import {PseudoRandom} from "../PseudoRandom";
import {SpawnIntent} from "../Schemas";
import {getSpawnCells} from "./Util";


export class BotSpawner {
    private cellToIndex;
    private freeTiles: Cell[];
    private numFreeTiles;
    private random = new PseudoRandom(123);

    constructor(private gs: Game) { }

    spawnBots(numBots: number): SpawnIntent[] {
        const bots: SpawnIntent[] = [];
        this.cellToIndex = new Map<string, number>();
        this.freeTiles = new Array();
        this.numFreeTiles = 0;

        this.gs.forEachTile(tile => {
            if (tile.terrain() == TerrainTypes.Water) {
                return;
            }
            if (tile.hasOwner()) {
                return;
            }

            this.freeTiles.push(tile.cell());
            this.cellToIndex.set(tile.cell().toString(), this.numFreeTiles);
            this.numFreeTiles++;
        });
        for (let i = 0; i < numBots; i++) {
            bots.push(this.spawnBot("Bot" + i));
        }
        return bots;
    }

    spawnBot(botName: string): SpawnIntent {
        const rand = this.random.nextInt(0, this.numFreeTiles);
        const spawn = this.freeTiles[rand];
        const spawnCells = getSpawnCells(this.gs, spawn);
        spawnCells.forEach(c => this.removeCell(c));
        const spawnIntent: SpawnIntent = {
            type: 'spawn',
            name: botName,
            isBot: true,
            x: spawn.x,
            y: spawn.y
        };
        return spawnIntent;
    }

    private removeCell(cell: Cell) {
        const index = this.cellToIndex[cell.toString()];
        this.freeTiles[index] = this.freeTiles[this.numFreeTiles - 1];
        this.cellToIndex[this.freeTiles[index].toString()] = index;
        this.numFreeTiles--;
    }
}
