import {EventBus} from "../EventBus"
import {Cell, PlayerInfo, TerrainMap} from "./GameStateApi"
import {CreateGameState} from "./GameStateImpl"

export class Game {

}

export function createGame(map: TerrainMap, human: PlayerInfo, numBots: number): Game {
	let eventBus = new EventBus()
	let gs = CreateGameState(map, eventBus)
	// gs.addPlayer(human, new Cell(100, 100))
	return null
}

// function buildSpawns(radius: number): number[] {
// 	const minDistance = radius * radius;
// 	const cellSize = radius / Math.sqrt(2);
// 	const rows = Math.ceil(gameMap.height / cellSize);
// 	const cols = Math.ceil(gameMap.width / cellSize);
// 	const grid = new Array(rows * cols).fill(-1);
// 	const active = [], points = [];
// 	const initialX = random.nextInt(gameMap.width), initialY = random.nextInt(gameMap.height);
// 	const initial = initialX + initialY * gameMap.width;
// 	active.push(initial);
// 	points.push(initial);
// 	grid[Math.floor(initialX / cellSize) + Math.floor(initialY / cellSize) * cols] = initial;
// 	while (active.length > 0) {
// 		const index = random.nextInt(active.length);
// 		const point = active[index];
// 		const px = point % gameMap.width;
// 		const py = Math.floor(point / gameMap.width);
// 		let found = false;
// 		for (let tries = 0; tries < 30; tries++) {
// 			const angle = random.next() * 2 * Math.PI;
// 			const distance = (random.next() + 1) * radius;
// 			const x = Math.floor(px + Math.cos(angle) * distance);
// 			const y = Math.floor(py + Math.sin(angle) * distance);
// 			const cellX = Math.floor(x / cellSize);
// 			const cellY = Math.floor(y / cellSize);
// 			if (x < 0 || x >= gameMap.width || y < 0 || y >= gameMap.height || grid[cellX + cellY * cols] !== -1) {
// 				continue;
// 			}
// 			let valid = true;
// 			for (let i = -1; i <= 1; i++) {
// 				for (let j = -1; j <= 1; j++) {
// 					if (cellX + i < 0 || cellX + i >= cols || cellY + j < 0 || cellY + j >= rows) {
// 						continue;
// 					}
// 					if (grid[cellX + i + (cellY + j) * cols] !== -1) {
// 						const other = grid[cellX + i + (cellY + j) * cols];
// 						const ox = other % gameMap.width - x;
// 						const oy = Math.floor(other / gameMap.width) - y;
// 						if (ox * ox + oy * oy < minDistance) {
// 							valid = false;
// 							break;
// 						}
// 					}
// 				}
// 				if (!valid) {
// 					break;
// 				}
// 			}
// 			if (valid) {
// 				found = true;
// 				const index = x + y * gameMap.width;
// 				active.push(index);
// 				if (gameMap.getTile(index).isSolid) {
// 					points.push(index);
// 				}
// 				grid[Math.floor(x / cellSize) + Math.floor(y / cellSize) * cols] = index;
// 				break;
// 			}
// 		}
// 		if (!found) {
// 			active.splice(index, 1);
// 		}
// 	}

// 	return points;
// }

// function randomSpawnPoint(player: Player): number {
// 	const target = this.spawnPoints.length > 0 ? this.spawnPoints : this.backupPoints;
// 	const index = random.nextInt(target.length);
// 	const result = target[index];
// 	target.splice(index, 1);
// 	this.getSpawnPixels(result).forEach(pixel => territoryManager.conquer(pixel, player.id));
// 	territoryRenderingManager.applyTransaction(player, player);
// 	playerNameRenderingManager.applyTransaction(player, player);
// 	return result;
// }

// function selectSpawnPoint(player: Player, tile: number): void {
// 	if (this.spawnData[player.id]) {
// 		this.spawnData[player.id].pixels.forEach(pixel => territoryManager.clear(pixel));
// 		this.spawnPoints.push(...this.spawnData[player.id].blockedPoints);
// 		this.spawnData[player.id].blockedPoints.forEach(point => this.backupPoints.splice(this.backupPoints.indexOf(point), 1));
// 	}

// 	//TODO: Check if the selected tile is a valid spawn point
// 	const data = new SpawnData();
// 	data.blockedPoints = this.spawnPoints.filter(point => Math.abs(point % gameMap.width - tile % gameMap.width) <= 4 && Math.abs(Math.floor(point / gameMap.width) - Math.floor(tile / gameMap.width)) <= 4);
// 	data.pixels = this.getSpawnPixels(tile);
// 	data.blockedPoints.forEach(point => this.spawnPoints.splice(this.spawnPoints.indexOf(point), 1));
// 	data.pixels.forEach(pixel => territoryManager.conquer(pixel, player.id));
// 	this.backupPoints.push(...data.blockedPoints);
// 	this.spawnData[player.id] = data;
// 	territoryRenderingManager.applyTransaction(player, player);
// 	playerNameRenderingManager.applyTransaction(player, player);

// 	if (isLocalGame) {
// 		this.isSelecting = false;
// 		startGameCycle();
// 	}
// }