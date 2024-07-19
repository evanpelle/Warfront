
export class GameMap {
	private readonly name: string;
	readonly width: number;
	readonly height: number;
	private readonly tiles: Uint16Array;
	readonly tileExpansionCosts: Uint8Array;
	readonly tileExpansionTimes: Uint8Array;
	readonly distanceMap: Int16Array;

	constructor(name: string, width: number, height: number) {
		this.name = name;
		this.width = width;
		this.height = height;
		this.tiles = new Uint16Array(width * height);
		this.tileExpansionCosts = new Uint8Array(width * height);
		this.tileExpansionTimes = new Uint8Array(width * height);
		this.distanceMap = new Int16Array(width * height);
	}

	getTile(index: number): number {
		return this.tiles[index]
	}
}