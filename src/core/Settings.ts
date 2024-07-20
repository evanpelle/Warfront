import {HSLColor} from "../client/graphics/HSLColor";
import {PlayerID, TerrainType, TerrainTypes} from "./GameStateApi";

export interface Settings {
	theme(): Theme
	tickIntervalMs(): number
	syncIntervalMs(): number
}

export interface Theme {
	territoryColor(id: PlayerID): HSLColor;
	borderColor(id: PlayerID): HSLColor;
	terrainColor(tile: TerrainType): HSLColor;
	backgroundColor(): HSLColor;
	font(): string;
	shaderArgs(): {name: string, args: {[key: string]: any}}[];
}

export const defaultSettings = new class implements Settings {

	theme(): Theme {return pastelTheme}

	tickIntervalMs(): number {
		return 1000 / 20; // 50ms
	}

	syncIntervalMs(): number {
		return 1000 / 3 // 3 syncs per second
	}

}

const pastelTheme = new class implements Theme {

	private background = HSLColor.fromRGB(100, 100, 100)
	private land = HSLColor.fromRGB(244, 243, 198)
	private water = HSLColor.fromRGB(160, 203, 231)
	private territory = HSLColor.fromRGB(173, 216, 230)

	territoryColor(id: PlayerID): HSLColor {
		return this.territory
	}
	borderColor(id: PlayerID): HSLColor {
		return this.territory
	}
	terrainColor(tile: TerrainType): HSLColor {
		if (tile == TerrainTypes.Land) {
			return this.land
		}
		return this.water
	}
	backgroundColor(): HSLColor {
		return this.background
	}
	font(): string {
		return "Overpass"
	}
	shaderArgs(): {name: string; args: {[key: string]: any;};}[] {
		throw new Error("Method not implemented.");
	}
}