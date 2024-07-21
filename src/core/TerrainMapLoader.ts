import {Jimp as JimpType, JimpConstructors} from '@jimp/core';
import 'jimp';
import {TerrainMap, TerrainType, TerrainTypes} from './GameStateApi';
import {TerrainMapImpl} from './GameStateImpl';

declare const Jimp: JimpType & JimpConstructors;

export async function loadTerrainMap(): Promise<TerrainMap> {
    const imageModule = await import(`../../resources/maps/World.png`);
    const imageUrl = imageModule.default;
    const image = await Jimp.read(imageUrl)
    const {width, height} = image.bitmap;

    const terrain: TerrainType[][] = Array(width).fill(null).map(() => Array(height).fill(TerrainTypes.Water));

    image.scan(0, 0, width, height, function (x: number, y: number, idx: number) {
        const red = this.bitmap.data[idx + 0];

        if (red > 100) {
            terrain[x][y] = TerrainTypes.Land;
        }
    })

    return new TerrainMapImpl(terrain);
}