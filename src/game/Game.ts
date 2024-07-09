import {GameMap} from "../map/GameMap";
import {gameRenderer} from "../Loader";
import {mapNavigationHandler} from "./action/MapNavigationHandler";
import {PlayerManager, playerManager} from "./player/PlayerManager";
import {Player} from "./player/Player";
import {mapActionHandler} from "./action/MapActionHandler";
import {spawnManager} from "./player/SpawnManager";
import {random} from "./Random";
import {gameTicker} from "./GameTicker";
import {playerNameRenderingManager} from "../renderer/manager/PlayerNameRenderingManager";
import {attackActionHandler} from "./action/AttackActionHandler";
import {HSLColor} from "../util/HSLColor";
import {GameMode} from "./mode/GameMode";
import {getSetting} from "../util/UserSettingManager";
import {GameState, gameState, setGameState} from "./GameState";
import {eventDispatcher} from "./GameEvent";
import {territoryRenderingManager} from "../renderer/manager/TerritoryRenderingManager";

/**
 * The map of the current game.
 */
export let gameMap: GameMap;
/**
 * The current game mode.
 */
export let gameMode: GameMode;
/**
 * Whether the game is currently running.
 */
export let isPlaying: boolean;
/**
 * Local games are directly played on the client without any server interaction.
 */
export let isLocalGame: boolean;

/**
 * Start a new game with the given map.
 * @param map The map to start the game with.
 * @param mode The game mode to use.
 */
export function startGame(map: GameMap, mode: GameMode) {
	gameMap = map;
	setGameState(new GameState(map, mode, playerManager))
	spawnManager.init(500);
	territoryRenderingManager.init()
	gameMode = mode;
	mapNavigationHandler.enable();
	mapActionHandler.enable();
	gameRenderer.initGameplayLayers();
	//gameState.init();
	playerNameRenderingManager.reset(500);
	attackActionHandler.init(500);
	playerManager.init(gameState, [new Player(gameState, eventDispatcher, 0, getSetting("playerName") ?? "UnknownPlayer", HSLColor.fromRGB(0, 200, 200))], 0, 500);
	playerNameRenderingManager.finishRegistration(playerManager.players);

	isPlaying = true;
	isLocalGame = true;
	random.reset(23452345);
}

/**
 * Start the game cycle.
 * @internal This method is called by the spawn manager when the player has selected a spawn point.
 */
export function startGameCycle() {
	gameTicker.start();
}
