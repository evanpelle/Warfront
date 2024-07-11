import {CachedLayer} from "./CachedLayer";
import {GameStateView} from "../../../core/GameState";
import {MapMoveListener, MapScaleListener} from "../../MapTransformHandler";

/**
 * Territory renderer.
 * Renders territory colors on the map (e.g. player territories).
 * @internal
 */
class TerritoryRenderer extends CachedLayer implements MapMoveListener, MapScaleListener {
	constructor(private gs: GameStateView) {
		super();
		// mapTransformHandler.move.register(this);
		// mapTransformHandler.scale.register(this);
	}

	invalidateCaches(): void {
		this.resizeCanvas(this.gs.width(), this.gs.height());
	}

	onMapMove(x: number, y: number): void {
		this.dx = x;
		this.dy = y;
	}

	onMapScale(scale: number): void {
		this.scale = scale;
	}
}