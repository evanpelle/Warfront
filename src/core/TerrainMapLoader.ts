import {TerrainMap, Terrain, TerrainType} from './GameStateApi'; // Adjust the import path as needed
import {TerrainMapImpl} from './GameStateImpl';

export class TerrainMapLoader {
    public static async load(): Promise<TerrainMap> {
        console.log('Loading terrain from cache...');
        const startTime = performance.now();

        const response = await fetch('/assets/WorldTerrain.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const terrainData = await response.json();

        const width = terrainData.length;
        const height = terrainData[0].length;

        const terrain: Terrain[][] = [];

        for (let x = 0; x < width; x++) {
            terrain[x] = [];
            for (let y = 0; y < height; y++) {
                const cell = terrainData[x][y];
                terrain[x][y] = new Terrain(
                    cell.type as TerrainType,
                    cell.movement,
                    cell.defense
                );
            }
        }

        const endTime = performance.now();
        console.log(`Terrain loaded in ${endTime - startTime} ms`);

        return new TerrainMapImpl(terrain);
    }
}