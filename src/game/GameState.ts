import {GameMap} from "../map/GameMap"
import {mapFromId} from "../map/MapRegistry";
import {ClearTileEvent, EventDispatcher} from "./GameEvent";
import {FFAGameMode} from "./mode/FFAGameMode";
import {GameMode} from "./mode/GameMode"
import {playerManager, PlayerManager} from "./player/PlayerManager"

export class GameState {
    tileOwners: Uint16Array;
    public static readonly OWNER_NONE = 65535;
    private dispatcher: EventDispatcher

    public map: GameMap
    public mode: GameMode
    public players: PlayerManager

    constructor(map: GameMap, mode: GameMode, players: PlayerManager) {
        this.map = map
        this.mode = mode
        this.players = players
        this.init()
    }

    init() {
        this.tileOwners = new Uint16Array(this.map.width * this.map.height);
        for (let i = 0; i < this.tileOwners.length; i++) {
            this.tileOwners[i] = this.map.getTile(i).isSolid ? GameState.OWNER_NONE : GameState.OWNER_NONE - 1;
        }
    }

    /**
     * Checks if a tile is a border tile of the territory of its owner.
     *
     * A tile is a border tile if it is adjacent to a tile that is not owned by the same player.
     * Pixels on the edge of the map are also considered border tiles.
     * @param tile The tile to check.
     * @returns True if the tile is a border tile, false otherwise.
     */
    isBorder(tile: number): boolean {
        let x = tile % this.map.width;
        let y = Math.floor(tile / this.map.width);
        let owner = this.tileOwners[tile];
        return x === 0 || x === this.map.width - 1 || y === 0 || y === this.map.height - 1 ||
            this.tileOwners[tile - 1] !== owner || this.tileOwners[tile + 1] !== owner ||
            this.tileOwners[tile - this.map.width] !== owner || this.tileOwners[tile + this.map.width] !== owner;
    }

    /**
     * Checks if a tile has an owner.
     * @param tile The tile to check.
     * @returns True if the tile has an owner, false otherwise.
     */
    hasOwner(tile: number): boolean {
        return this.tileOwners[tile] !== GameState.OWNER_NONE;
    }

    /**
     * Checks if a tile is owned by a specific player.
     * @param tile The tile to check.
     * @param owner The player to check against.
     * @returns True if the tile is owned by the player, false otherwise.
     */
    isOwner(tile: number, owner: number): boolean {
        return this.tileOwners[tile] === owner;
    }

    /**
     * Gets the owner of a tile.
     * @param tile The tile to get the owner of.
     * @returns The owner of the tile.
     */
    getOwner(tile: number): number {
        return this.tileOwners[tile];
    }

    /**
     * Conquers a tile for a player.
     *
     * If the tile is already owned by a player, the player will lose the tile.
     * Conquered tiles will be passed to the renderer directly.
     * @param tile The tile to conquer.
     * @param owner The player that will own the tile.
     */
    conquer(tile: number, owner: number): void {
        const previousOwner = this.tileOwners[tile];
        this.tileOwners[tile] = owner;
        if (previousOwner !== GameState.OWNER_NONE) {
            playerManager.getPlayer(previousOwner).removeTile(tile);
        }
        playerManager.getPlayer(owner).addTile(tile);
    }

    /**
     * Clears a tile.
     */
    clear(tile: number): void {
        const owner = this.tileOwners[tile];
        if (owner !== GameState.OWNER_NONE) {
            this.tileOwners[tile] = GameState.OWNER_NONE;
            playerManager.getPlayer(owner).removeTile(tile);
            this.dispatcher.fireClearTileEvent(new ClearTileEvent(tile))
        }
    }

    onNeighbors(tile: number, closure: (tile: number) => void): void {
        let x = tile % this.map.width;
        let y = Math.floor(tile / this.map.width);
        if (x > 0) {
            closure(tile - 1);
        }
        if (x < this.map.width - 1) {
            closure(tile + 1);
        }
        if (y > 0) {
            closure(tile - this.map.width);
        }
        if (y < this.map.height - 1) {
            closure(tile + this.map.width);
        }
    }

    /**
     * Check if a tile borders a tile owned by a player.
     * @param tile The tile to check.
     * @param player The player to check for.
     * @returns True if the tile borders a tile owned by the player, false otherwise.
     */
    bordersTile(tile: number, player: number): boolean {
        let x = tile % this.map.width;
        let y = Math.floor(tile / this.map.width);
        return (x > 0 && this.isOwner(tile - 1, player)) ||
            (x < this.map.width - 1 && this.isOwner(tile + 1, player)) ||
            (y > 0 && this.isOwner(tile - this.map.width, player)) ||
            (y < this.map.height - 1 && this.isOwner(tile + this.map.width, player));
    }
}

export const gameState = new GameState(mapFromId(Math.floor(Math.random() * 2)), new FFAGameMode(), null)
