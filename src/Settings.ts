import {PlayerID, Terrain} from "./core/GameState";
import {HSLColor} from "./client/graphics/HSLColor";

export interface RenderSettings {
	theme(): Theme
}

export interface Theme {
	territoryColor(id: PlayerID): HSLColor;

	borderColor(id: PlayerID): HSLColor;

	terrainColor(tile: Terrain): HSLColor;

	backgroundColor(): HSLColor;

	font(): string;

	shaderArgs(): {name: string, args: {[key: string]: any}}[];
}