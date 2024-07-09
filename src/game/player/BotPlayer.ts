import {Player} from "./Player";
import {random} from "../Random";
import {attackActionHandler} from "../action/AttackActionHandler";
import {HSLColor} from "../../util/HSLColor";
import {GameState} from "../GameState";
import {EventDispatcher} from "../GameEvent";

export class BotPlayer extends Player {
	constructor(gs: GameState, eventDispatcher: EventDispatcher, id: number) {
		super(gs, eventDispatcher, id, "Bot", HSLColor.fromRGB(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)));
	}

	//TODO: Implement bot logic
	tick(): void {
		if (random.nextInt(20) < 19) return;
		let targets: number[] = [];
		for (const border of this.borderTiles) {
			this.gs.onNeighbors(border, neighbor => {
				const owner = this.gs.getOwner(neighbor);
				if (owner !== this.id && !targets.includes(owner)) {
					targets.push(owner);
				}
			});
		}
		if (targets.length < 1) {
			return;
		}
		if (targets.includes(GameState.OWNER_NONE)) {
			attackActionHandler.preprocessAttack(this.id, GameState.OWNER_NONE, 0.1);
			return;
		}
		attackActionHandler.preprocessAttack(this.id, targets[random.nextInt(targets.length)], 0.1);
	}
}