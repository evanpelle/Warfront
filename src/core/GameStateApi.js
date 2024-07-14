"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlayerEvent = exports.TileEvent = exports.Terrain = exports.PlayerInfo = exports.Cell = exports.TerrainType = void 0;
var TerrainType;
(function (TerrainType) {
    TerrainType[TerrainType["Land"] = 0] = "Land";
    TerrainType[TerrainType["Water"] = 1] = "Water";
})(TerrainType || (exports.TerrainType = TerrainType = {}));
class Cell {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
}
exports.Cell = Cell;
class PlayerInfo {
    constructor(name, isBot) {
        this.name = name;
        this.isBot = isBot;
    }
}
exports.PlayerInfo = PlayerInfo;
class Terrain {
    constructor(type, expansionCost, expansionTime) {
        this.type = type;
        this.expansionCost = expansionCost;
        this.expansionTime = expansionTime;
    }
}
exports.Terrain = Terrain;
class TileEvent {
    constructor(tile) {
        this.tile = tile;
    }
}
exports.TileEvent = TileEvent;
class PlayerEvent {
    constructor(player) {
        this.player = player;
    }
}
exports.PlayerEvent = PlayerEvent;
