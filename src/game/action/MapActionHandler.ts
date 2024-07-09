import {ClickEventListener, interactionManager} from "../../event/InteractionManager";
import {mapNavigationHandler} from "./MapNavigationHandler";
import {clientPlayer} from "../player/PlayerManager";
import {spawnManager} from "../player/SpawnManager";
import {attackActionHandler} from "./AttackActionHandler";
import {gameState, GameState} from "../GameState";

/**
 * Default map click action handler.
 * Executes the selected action on the clicked tile.
 */
class MapActionHandler implements ClickEventListener {
	private action: (tile: number) => void;

	constructor(private gs: GameState) { }
	/**
	 * Enables the map action handler.
	 */
	enable() {
		this.gs = gameState
		this.setAction(tile => spawnManager.isSelecting ? spawnManager.selectSpawnPoint(clientPlayer, tile) : attackActionHandler.preprocessAttack(clientPlayer.id, this.gs.getOwner(tile), 0.2));
		interactionManager.click.register(this);
	}

	/**
	 * Disables the map action handler.
	 */
	disable() {
		interactionManager.click.unregister(this);
	}

	/**
	 * Set the action to execute on a tile click.
	 * @param action The action to execute.
	 */
	setAction(action: (tile: number) => void) {
		this.action = action;
	}

	onClick(x: number, y: number): void {
		this.action(mapNavigationHandler.getIndex(x, y));
	}

	test(x: number, y: number): boolean {
		return mapNavigationHandler.isOnMap(x, y);
	}
}

export const mapActionHandler = new MapActionHandler(gameState);