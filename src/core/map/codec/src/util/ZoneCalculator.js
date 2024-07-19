"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoneCalculator = void 0;
class ZoneCalculator {
    /**
     * Builds zones from a map
     * @param data raw map data
     * @returns array of zones
     */
    static buildZones(data) {
        const result = [];
        for (const zone of ZoneCalculator.calculateZones(data)) {
            const tileMap = [];
            for (const tile of zone) {
                tileMap[tile] = true;
            }
            const leftBorder = [];
            const leftBorderMap = [];
            const topBorder = [];
            const topBorderMap = [];
            for (const tile of zone) {
                if (!tileMap[tile - 1]) {
                    leftBorder.push(tile);
                    leftBorderMap[tile] = true;
                }
                if (!tileMap[tile - data.width]) {
                    topBorder.push(tile);
                    topBorderMap[tile] = true;
                }
            }
            result.push({ id: data.tiles[zone[0]], tileMap, leftBorder, leftBorderMap, topBorder, topBorderMap });
        }
        return result;
    }
    /**
     * Calculates all connected zones of a map
     * @param data raw map data
     * @returns array of zone tiles for each zone
     * @private
     */
    static calculateZones(data) {
        const zoneTiles = [];
        const zoneCache = new Uint16Array(data.width); // one row of cache is enough
        for (let i = 0; i < data.tiles.length; i++) {
            let id = ZoneCalculator.findZone(i, data.tiles, data.width, zoneCache, zoneTiles);
            zoneCache[i % data.width] = id;
            zoneTiles[id].push(i);
        }
        return zoneTiles.filter(zone => zone);
    }
    /**
     * Inserts a tile into the zone map
     * @param tile index of the tile to check
     * @param tileTypes array of tile types
     * @param width width of the map
     * @param zoneCache cache of previous rows' zones
     * @param zoneTiles array of zone tiles
     * @returns the zone id of the tile
     * @private
     */
    static findZone(tile, tileTypes, width, zoneCache, zoneTiles) {
        const type = tileTypes[tile];
        const topType = tileTypes[tile - width];
        const leftType = tileTypes[tile - 1];
        const topZone = zoneCache[tile % width];
        const leftZone = zoneCache[(tile + width - 1) % width];
        if (type === topType) {
            if (type === leftType) {
                return ZoneCalculator.mergeZones(leftZone, topZone, zoneCache, zoneTiles);
            }
            return topZone;
        }
        else if (type === leftType) {
            return leftZone;
        }
        zoneTiles.push([]);
        return zoneTiles.length - 1;
    }
    /**
     * Merges adjacent zones of the same type
     * @param from zone to merge from
     * @param into zone to merge into
     * @param zoneCache cache of previous rows' zones
     * @param zoneTiles array of zone tiles
     * @returns the new zone id
     * @private
     */
    static mergeZones(from, into, zoneCache, zoneTiles) {
        if (from === into)
            return into;
        if (zoneTiles[into].length < zoneTiles[from].length) {
            [into, from] = [from, into];
        }
        zoneTiles[into].push(...zoneTiles[from]);
        delete zoneTiles[from];
        zoneCache.forEach((value, index) => {
            if (value === from)
                zoneCache[index] = into;
        });
        return into;
    }
}
exports.ZoneCalculator = ZoneCalculator;
