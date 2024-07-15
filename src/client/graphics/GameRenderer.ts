import {Cell, GameStateView, PlayerEvent, Tile, TileEvent} from "../../core/GameStateApi";
import {Theme} from "../../Settings";
import {DragEvent, ZoomEvent} from "../InputHandler";
import {HSLColor} from "./HSLColor";

export class GameRenderer {

	private scale: number = 1
	private offsetX: number = 0
	private offsetY: number = 0

	private context: CanvasRenderingContext2D

	private imageData: ImageData


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

		this.imageData = this.context.getImageData(0, 0, this.gs.width(), this.gs.height())
		this.initImageData()


		document.body.appendChild(this.canvas);
		window.addEventListener('resize', () => this.resizeCanvas());
		this.resizeCanvas();

		requestAnimationFrame(() => this.renderGame());
	}

	initImageData() {
		this.gs.forEachTile((tile) => {
			//const color = this.theme.terrainColor(tile.terrain())
			this.paintTile(tile)
		})
	}

	resizeCanvas() {
		this.canvas.width = window.innerWidth;
		this.canvas.height = window.innerHeight;
		//this.redraw()
	}

	renderGame() {
		// Clear the canvas
		this.context.setTransform(1, 0, 0, 1, 0, 0);
		this.context.clearRect(0, 0, this.gs.width(), this.gs.height());

		// Set background
		this.context.fillStyle = this.theme.backgroundColor().toString();
		this.context.fillRect(0, 0, this.gs.width(), this.gs.height());

		// Create a temporary canvas for the game content
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = this.gs.width();
		tempCanvas.height = this.gs.height();

		// Put the ImageData on the temp canvas
		tempCtx.putImageData(this.imageData, 0, 0);

		// Disable image smoothing for pixelated effect
		if (this.scale > 2) {
			this.context.imageSmoothingEnabled = false;
		} else {
			this.context.imageSmoothingEnabled = true;
		}

		// Apply zoom and pan
		this.context.setTransform(
			this.scale,
			0,
			0,
			this.scale,
			this.gs.width() / 2 - this.offsetX * this.scale,
			this.gs.height() / 2 - this.offsetY * this.scale
		);

		// Draw the game content from the temp canvas
		this.context.drawImage(
			tempCanvas,
			-this.gs.width() / 2,
			-this.gs.height() / 2,
			this.gs.width(),
			this.gs.height()
		);
	}

	// redraw() {
	// 	this.context.fillStyle = this.theme.backgroundColor().toString()
	// 	this.context.clearRect(0, 0, this.gs.width(), this.gs.height());
	// 	const imageData = this.context.getImageData(0, 0, this.gs.width(), this.gs.height());
	// 	this.gs.forEachTile((tile) => {
	// 		const color = this.theme.terrainColor(tile.terrain())
	// 		const index = (tile.cell().y * this.gs.width()) + tile.cell().x
	// 		color.toRGB().writeToBuffer(imageData.data, index * 4)
	// 	})
	// 	this.context.putImageData(imageData, 0, 0)
	// }

	tileUpdate(event: TileEvent) {
		// TODO: use batching and imageData
		console.log(`new tile update: ${event.tile.owner().id()}`)
		this.paintTile(event.tile)
	}

	playerUpdate(event: PlayerEvent) {
	}

	resize(width: number, height: number): void {
		this.canvas.width = Math.ceil(width / window.devicePixelRatio);
		this.canvas.height = Math.ceil(height / window.devicePixelRatio);
	}

	paintTile(tile: Tile) {
		// const index = (tile.cell().y * this.gs.width()) + tile.cell().x
		// color.toRGB().writeToBuffer(this.imageData.data, index * 4)
		let terrainColor = this.theme.terrainColor(tile.terrain())
		this.paintCell(tile.cell(), terrainColor)
		if (tile.hasOwner()) {
			let territoryColor = this.theme.territoryColor(tile.owner().id())
			this.paintCell(tile.cell(), territoryColor)
		}
	}


	paintCell(cell: Cell, color: HSLColor) {
		const index = (cell.y * this.gs.width()) + cell.x
		color.toRGB().writeToBuffer(this.imageData.data, index * 4)
	}

	// clearCell(cell: Cell): void {
	// 	this.context.clearRect(cell.x, cell.y, 1, 1);
	// }

	onZoom(event: ZoomEvent) {
		const oldScale = this.scale;
		const zoomFactor = 1 + event.delta / 600;
		this.scale *= zoomFactor;

		// Clamp the scale to prevent extreme zooming
		this.scale = Math.max(0.1, Math.min(10, this.scale));

		const canvasRect = this.canvas.getBoundingClientRect();
		const canvasX = event.x - canvasRect.left;
		const canvasY = event.y - canvasRect.top;

		// Calculate the world point we want to zoom towards
		const zoomPointX = (canvasX - this.gs.width() / 2) / oldScale + this.offsetX;
		const zoomPointY = (canvasY - this.gs.height() / 2) / oldScale + this.offsetY;

		// Adjust the offset
		this.offsetX = zoomPointX - (canvasX - this.gs.width() / 2) / this.scale;
		this.offsetY = zoomPointY - (canvasY - this.gs.height() / 2) / this.scale;

		console.log("Zoom applied. Scale:", this.scale, "Offset:", this.offsetX, this.offsetY);
	}

	onMove(event: DragEvent) {
		this.offsetX -= event.deltaX / this.scale;
		this.offsetY -= event.deltaY / this.scale;
	}


	screenToWorldCoordinates(screenX: number, screenY: number): {x: number, y: number} {

		const canvasRect = this.canvas.getBoundingClientRect();
		const canvasX = screenX - canvasRect.left;
		const canvasY = screenY - canvasRect.top;

		// Calculate the world point we want to zoom towards
		const centerX = (canvasX - this.gs.width() / 2) / this.scale + this.offsetX;
		const centerY = (canvasY - this.gs.height() / 2) / this.scale + this.offsetY;

		const gameX = centerX + this.gs.width() / 2
		const gameY = centerY + this.gs.height() / 2


		// Adjust the offset
		//this.offsetX = zoomPointX - (canvasX - this.gs.width() / 2) / this.scale;
		//this.offsetY = zoomPointY - (canvasY - this.gs.height() / 2) / this.scale;


		// const screenCenterX = this.canvas.width / 2
		// const screenCenterY = this.canvas.height / 2


		// // Calculate world coordinates
		// let worldX = screenX / this.scale + this.offsetX;
		// let worldY = screenY / this.scale + this.offsetY;

		// console.log(`Screen center: ${screenCenterX}, ${screenCenterY}`);

		// console.log(`Screen coordinates: ${screenX}, ${screenY}`);
		// console.log(`World coordinates before floor: ${worldX}, ${worldY}`);
		console.log(`zoom point ${centerX} ${centerY}`)
		console.log(`Current scale: ${this.scale}`);
		console.log(`Current offset: ${this.offsetX}, ${this.offsetY}`);

		return {x: Math.floor(gameX), y: Math.floor(gameY)};
	}

}