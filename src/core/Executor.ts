import {GameState, Tile} from "./GameStateApi";

export  class Executor {

    constructor(private gs: GameState) {

    }


    spawnBots(numBots: number) {
        const tiles = new Set<Tile>
        this.gs.forEachTile(tile => {
            tiles.add(tile)
        })
        
    }

    getRandomItem(set: Set<Tile>): Tile {
        let items = Array.from(set);
        return items[Math.floor(Math.random() * items.length)];
    }
}