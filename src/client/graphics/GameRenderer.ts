import {Cell, GameStateView, PlayerEvent, Tile, TileEvent} from "../../core/GameStateApi";
import {Theme} from "../../Settings";
import {HSLColor} from "./HSLColor";

export class GameRenderer {

	private context: CanvasRenderingContext2D

	constructor(private gs: GameStateView, private theme: Theme, private canvas: HTMLCanvasElement) {
		this.context = canvas.getContext("2d")
	}

	initialize() {
		this.canvas = document.createElement('canvas');
		this.context = this.canvas.getContext('2d');

		// Set canvas style to fill the screen
		this.canvas.style.position = 'fixed';
		this.canvas.style.left = '0';
		this.canvas.style.top = '0';
		this.canvas.style.width = '100%';
		this.canvas.style.height = '100%';

		document.body.appendChild(this.canvas);
		window.addEventListener('resize', () => this.resizeCanvas());
		this.resizeCanvas();
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
	}

	renderGame() {
		this.context.fillStyle = this.theme.backgroundColor().toString()
		this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		this.gs.forEachTile((tile) => {
			this.paintTile(tile)
		})
		// TODO:
		// requestAnimationFrame(() => this.renderGame(gs));
	}

	tileUpdate(event: TileEvent) {
		this.paintTile(event.tile)
	}

	playerUpdate(event: PlayerEvent) {
	}

	resize(width: number, height: number): void {
		this.canvas.width = Math.ceil(width / window.devicePixelRatio);
		this.canvas.height = Math.ceil(height / window.devicePixelRatio);
	}

	paintTile(tile: Tile) {
		this.clearCell(tile.cell())
		let terrainColor = this.theme.terrainColor(tile.terrain())
		this.paintCell(tile.cell(), terrainColor)
		if (tile.hasOwner()) {
			let territoryColor = this.theme.territoryColor(tile.owner().id())
			this.paintCell(tile.cell(), territoryColor)
		}
	}


	paintCell(cell: Cell, color: HSLColor) {
		const context = this.context;
		context.fillStyle = color.toString();
		context.clearRect(cell.x, cell.y, 1, 1);
		context.fillRect(cell.x, cell.y, 1, 1);
	}

	clearCell(cell: Cell): void {
		this.context.clearRect(cell.x, cell.y, 1, 1);
	}

}