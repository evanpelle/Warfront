import {Cell, TileEvent} from "../../core/GameStateApi";
import {Theme} from "../../Settings";
import {HSLColor} from "./HSLColor";

// TODO calculater border tiles
class TerritoryRenderingManager {
	private readonly territoryQueue: Array<number> = [];
	private readonly playerBorderQueue: Array<number> = [];
	private readonly targetBorderQueue: Array<number> = [];

	constructor(private theme: Theme) { }

	tileUpdateEvent(event: TileEvent) {
		if (event.tile.owner == null) {
			this.clear(event.tile.cell())
			return
		}
		var color: HSLColor
		if (event.tile.isBorder()) {
			color = this.theme.borderColor(event.tile.owner().id())
		} else {
			color = this.theme.territoryColor(event.tile.owner().id())
		}
		// this.paintTile(event.tile.cell(), color)
	}

	/**
	 * Add a tile to the territory update queue.
	 * @param tile index of the tile
	 */
	setTerritory(tile: number): void {
		this.territoryQueue.push(tile);
	}

	/**
	 * Add a border to the territory update queue.
	 * @param tile index of the tile
	 */
	setPlayerBorder(tile: number): void {
		this.playerBorderQueue.push(tile);
	}

	/**
	 * Add a border to the territory update queue.
	 * @param tile index of the tile
	 */
	setTargetBorder(tile: number): void {
		this.targetBorderQueue.push(tile);
	}

	/**
	 * Clear the tile at the given index.
	 * @param tile index of the tile
	 */
	clear(cell: Cell): void {
		// this.context.clearRect(cell.x, cell.y, 1, 1);
	}
}