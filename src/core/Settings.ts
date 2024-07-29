import {PlayerID, TerrainType, TerrainTypes} from "./GameStateApi";
import {Colord, colord} from "colord";

export interface Settings {
	theme(): Theme;
	turnIntervalMs(): number
	tickIntervalMs(): number
	ticksPerTurn(): number
	lobbyCreationRate(): number
	lobbyLifetime(): number
}

export interface Theme {
	territoryColor(id: PlayerID): Colord;
	borderColor(id: PlayerID): Colord;
	terrainColor(tile: TerrainType): Colord;
	backgroundColor(): Colord;
	font(): string;
	shaderArgs(): {name: string; args: {[key: string]: any}}[];
}

export const defaultSettings = new class implements Settings {
	ticksPerTurn(): number {
		return 1
	}
	turnIntervalMs(): number {
		return 1000 / 10
	}
	lobbyCreationRate(): number {
		return 5 * 1000
	}
	lobbyLifetime(): number {
		return 2 * 1000
	}
	theme(): Theme {return pastelTheme;}

	tickIntervalMs(): number {
		return 1000 / 20; // 50ms
	}
}

const pastelTheme = new class implements Theme {
	private background = colord({r: 100, g: 100, b: 100});
	private land = colord({r: 244, g: 243, b: 198});
	private water = colord({r: 160, g: 203, b: 231});
	private territory = colord({r: 173, g: 216, b: 230});

	territoryColor(id: PlayerID): Colord {
		return colord({r: (id * 10) % 250, g: (id * 100) % 250, b: (id) % 250});
	}

	borderColor(id: PlayerID): Colord {
		return this.territory;
	}

	terrainColor(tile: TerrainType): Colord {
		if (tile == TerrainTypes.Land) {
			return this.land;
		}
		return this.water;
	}

	backgroundColor(): Colord {
		return this.background;
	}

	font(): string {
		return "Overpass";
	}

	shaderArgs(): {name: string; args: {[key: string]: any}}[] {
		throw new Error("Method not implemented.");
	}
}