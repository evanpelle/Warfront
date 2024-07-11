import {CachedLayer} from "./CachedLayer";
import {Theme} from "../../../Settings";
import {loadShaders} from "../shader/ShaderManager";
import {GameStateView} from "../../../core/GameState";
import {MapMoveListener, MapScaleListener} from "../../MapTransformHandler";

/**
 * Map background renderer.
 * All static map tiles (and possibly other static objects) should be rendered here.
 * @internal
 */
class MapRenderer extends CachedLayer implements MapMoveListener, MapScaleListener {
	constructor(private gs: GameStateView) {
		super();
		// mapTransformHandler.move.register(this);
		// mapTransformHandler.scale.register(this);
	}

	invalidateCaches(): void {
		// let [width, height] = this.gs.dimensions()
		// this.resizeCanvas(width, height);
		// loadShaders();
		// this.forceRepaint(getSetting("theme"));
	}

	forceRepaint(theme: Theme): void {
		// let [width, height] = this.gs.dimensions()
		// const imageData = this.context.getImageData(0, 0, width, height);
		// const tileColors: RGBColor[] = [];

		// this.gs.forEachTile((tile: Tile) => {

		// })

		// for (let i = 0; i < width * height; i++) {
		// 	const tile = this.getTile(i);
		// 	if (!tileColors[tile.id]) {
		// 		tileColors[tile.id] = theme.getTerrainTileColor(tile).toRGB();
		// 	}
		// 	tileColors[tile.id].writeToBuffer(imageData.data, i * 4);
		// }
		// applyPostGenerationShaders(imageData.data);
		// this.context.putImageData(imageData, 0, 0);
	}

	onMapMove(x: number, y: number): void {
		this.dx = x;
		this.dy = y;
	}

	onMapScale(scale: number): void {
		this.scale = scale;
	}
}