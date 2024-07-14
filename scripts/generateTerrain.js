const fs = require('fs');
const path = require('path');
const Jimp = require('jimp');

const WorldPng = path.join(__dirname, '../resources/maps/World.png');
const CacheFile = path.join(__dirname, '../public/assets/WorldTerrain.json');

const TerrainType = {
    Land: 0,
    Water: 1,
    // Add other terrain types as needed
};

async function generateTerrainCache() {
    console.log('Processing terrain image...');
    try {
        const image = await Jimp.read(WorldPng);
        const width = image.getWidth();
        const height = image.getHeight();
        const terrain = Array(width).fill(null).map(() => Array(height));

        const land = {type: TerrainType.Land, movement: 1, defense: 1};
        const water = {type: TerrainType.Water, movement: 0, defense: 0};

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const color = Jimp.intToRGBA(image.getPixelColor(x, y));
                terrain[x][y] = color.r > 100 ? land : water;
            }
        }

        fs.writeFileSync(CacheFile, JSON.stringify(terrain));
        console.log(`Terrain cache generated at ${CacheFile}`);
    } catch (error) {
        console.error('Error generating terrain cache:', error);
        process.exit(1);
    }
}

generateTerrainCache();