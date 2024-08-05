import {Colord} from "colord";
import {Cell, MutableGame, Game, PlayerEvent, Tile, TileEvent, Player, Execution, BoatEvent} from "../core/Game";
import {Theme} from "../core/Settings";
import {DragEvent, ZoomEvent} from "./InputHandler";
import {calculateBoundingBox, placeName} from "./NameBoxCalculator";
import {PseudoRandom} from "../core/PseudoRandom";
import {BoatAttackExecution} from "../core/execution/BoatAttackExecution";

class NameRender {
	constructor(public lastRendered: number, public location: Cell, public fontSize: number) { }
}

export class GameRenderer {

	private scale: number = .8
	private offsetX: number = 0
	private offsetY: number = 100

	private context: CanvasRenderingContext2D

	private imageData: ImageData

	private nameRenders: Map<Player, NameRender> = new Map()

	private rand = new PseudoRandom(10)

	constructor(private gs: Game, private theme: Theme, private canvas: HTMLCanvasElement) {
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
		this.context.fillStyle = this.theme.backgroundColor().toHex();
		this.context.fillRect(0, 0, this.gs.width(), this.gs.height());

		// Create a temporary canvas for the game content
		const tempCanvas = document.createElement('canvas');
		const tempCtx = tempCanvas.getContext('2d');
		tempCanvas.width = this.gs.width();
		tempCanvas.height = this.gs.height();

		// Put the ImageData on the temp canvas
		tempCtx.putImageData(this.imageData, 0, 0);

		// Disable image smoothing for pixelated effect
		if (this.scale > 3) {
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

		let numCalcs = 0
		for (const player of this.gs.players()) {
			if (numCalcs < 50 && this.maybeRecalculatePlayerInfo(player)) {
				numCalcs++
			}
			this.renderPlayerInfo(player)
		}

		// const paths = this.gs.executions().map(e => e as Execution).filter(e => e instanceof BoatAttackExecution).map(e => e as BoatAttackExecution).filter(e => e.path != null).map(e => e.path)
		// paths.forEach(p => {
		// 	p.forEach(t => {
		// 		this.paintCell(t.cell(), new Colord({r: 255, g: 255, b: 255}))
		// 	})
		// })

		requestAnimationFrame(() => this.renderGame());
	}

	maybeRecalculatePlayerInfo(player: Player): boolean {
		if (!this.nameRenders.has(player)) {
			this.nameRenders.set(player, new NameRender(0, null, null))
		}

		const render = this.nameRenders.get(player)

		let wasUpdated = false

		if (Date.now() - render.lastRendered > 1000) {
			render.lastRendered = Date.now() + this.rand.nextInt(0, 100)
			wasUpdated = true

			const box = calculateBoundingBox(player)
			const centerX = box.min.x + ((box.max.x - box.min.x) / 2)
			const centerY = box.min.y + ((box.max.y - box.min.y) / 2)
			render.location = new Cell(centerX, centerY)
			render.fontSize = Math.max(Math.min(box.max.x - box.min.x, box.max.y - box.min.y) / player.info().name.length / 2, 1)
		}
		return wasUpdated
	}

	renderPlayerInfo(player: Player) {
		if (!player.isAlive()) {
			return
		}
		if (!this.nameRenders.has(player)) {
			return
		}

		const render = this.nameRenders.get(player)

		this.context.font = `${render.fontSize}px Arial`;
		this.context.fillStyle = this.theme.playerInfoColor(player.id()).toHex();
		this.context.textAlign = 'center';
		this.context.textBaseline = 'middle';

		const nameCenterX = render.location.x - this.gs.width() / 2
		const nameCenterY = render.location.y - this.gs.height() / 2
		this.context.fillText(player.info().name, nameCenterX, nameCenterY - render.fontSize / 2);
		this.context.fillText(String(Math.floor(player.troops())), nameCenterX, nameCenterY + render.fontSize);
	}

	tileUpdate(event: TileEvent) {
		this.paintTile(event.tile)
		this.gs.neighbors(event.tile.cell()).forEach(c => this.paintTile(this.gs.tile(c)))
	}

	playerEvent(event: PlayerEvent) {
	}

	boatEvent(event: BoatEvent) {
		this.paintCell(event.boat.cell(), new Colord({r: 255, g: 255, b: 255}))
		this.gs.neighbors(event.boat.cell()).map(c => this.gs.tile(c)).forEach(t => this.paintTile(t))
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
		const owner = tile.owner()
		if (owner.isPlayer()) {
			if (tile.isBorder()) {
				this.paintCell(tile.cell(), this.theme.borderColor(owner.id()))
			} else {
				this.paintCell(tile.cell(), this.theme.territoryColor(owner.id()))
			}
		}
	}

	paintCell(cell: Cell, color: Colord) {
		const index = (cell.y * this.gs.width()) + cell.x
		const offset = index * 4
		this.imageData.data[offset] = color.rgba.r;
		this.imageData.data[offset + 1] = color.rgba.g;
		this.imageData.data[offset + 2] = color.rgba.b;
		this.imageData.data[offset + 3] = color.rgba.a * 255 | 0
	}

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
	}

	onMove(event: DragEvent) {
		this.offsetX -= event.deltaX / this.scale;
		this.offsetY -= event.deltaY / this.scale;
	}


	screenToWorldCoordinates(screenX: number, screenY: number): Cell {

		const canvasRect = this.canvas.getBoundingClientRect();
		const canvasX = screenX - canvasRect.left;
		const canvasY = screenY - canvasRect.top;

		// Calculate the world point we want to zoom towards
		const centerX = (canvasX - this.gs.width() / 2) / this.scale + this.offsetX;
		const centerY = (canvasY - this.gs.height() / 2) / this.scale + this.offsetY;

		const gameX = centerX + this.gs.width() / 2
		const gameY = centerY + this.gs.height() / 2


		console.log(`zoom point ${centerX} ${centerY}`)
		console.log(`Current scale: ${this.scale}`);
		console.log(`Current offset: ${this.offsetX}, ${this.offsetY}`);

		return new Cell(Math.floor(gameX), Math.floor(gameY));
	}

}