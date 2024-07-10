import {GameMap} from "../map/GameMap";
import {gameRenderer} from "../Loader";
import {mapNavigationHandler} from "./action/MapNavigationHandler";
import {Player} from "./player/Player";
import {mapActionHandler} from "./action/MapActionHandler";
import {spawnPoints} from "./player/SpawnManager";
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
import {BotPlayer} from "./player/BotPlayer";
import {GameExecutor} from "./action/GameExecutor";

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
	setGameState(new GameState(map, mode))
	var gameExecutor = new GameExecutor(gameState)
	gameTicker.registry.register(gameExecutor);
	territoryRenderingManager.init()
	gameMode = mode;
	mapNavigationHandler.enable();
	mapActionHandler.enable();
	gameRenderer.initGameplayLayers();
	//gameState.init();
	playerNameRenderingManager.reset(500);
	attackActionHandler.init(500);
	addPlayers(gameState, new Player(gameState, eventDispatcher, 0, getSetting("playerName") ?? "UnknownPlayer", HSLColor.fromRGB(0, 200, 200)), 0, 500);
	playerNameRenderingManager.finishRegistration(gameState.players);

	territoryRenderingManager.forceRepaint(getSetting("theme"))
	isPlaying = true;
	isLocalGame = true;
	random.reset(23452345);
	startGameCycle()
}


/**
 * Initializes the player manager with the given players.
 * @param humans human players, one for local games, multiple for online games.
 * @param clientId Player ID of the client player (the player that is controlled this client).
 * @param maxPlayers The maximum number of players.
 */
function addPlayers(gs: GameState, human: Player, clientId: number, maxPlayers: number): void {
	var clientPlayer = human

	var sp = spawnPoints(gs, maxPlayers)
	for (let i = 1; i < maxPlayers; i++) {
		gs.registerPlayer(new BotPlayer(gs, eventDispatcher, i), true, sp[i]);
	}
	gs.clientPlayer = clientPlayer
}

/**
 * Start the game cycle.
 * @internal This method is called by the spawn manager when the player has selected a spawn point.
 */
export function startGameCycle() {
	gameTicker.start();
}
