import {mapFromId} from '../map/MapRegistry';
import {TerrainMap, TerrainTypes, TerrainType} from './GameStateApi'; // Adjust the import path as needed
import {TerrainMapImpl} from './GameStateImpl';

export class TerrainMapLoader {
    public static load(): TerrainMap {

        const worldMap = mapFromId(1)
        const terrain: TerrainType[][] = []
        for (let x = 0; x < worldMap.width; x++) {
            terrain[x] = [];
            for (let y = 0; y < worldMap.height; y++) {
                const index = (y * worldMap.width) + x
                const tileNum = worldMap.tiles[index]
                terrain[x][y] = tileNum == 0 ? TerrainTypes.Water : TerrainTypes.Land
            }
        }
        return new TerrainMapImpl(terrain)
    }
}