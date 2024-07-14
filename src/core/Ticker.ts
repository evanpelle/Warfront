import {EventBus, GameEvent} from "../EventBus";
import {Settings} from "../Settings";

export class TickEvent implements GameEvent {
	constructor(public readonly tickCount: number) { }
}

export class Ticker {
	private ticker: NodeJS.Timeout;
	private tickCount: number;

	constructor(private tickInterval: number, private eventBus: EventBus) {

	}

	start() {
		this.tickCount = 0;
		this.ticker = setInterval(() => this.tick(), this.tickInterval);
	}

	stop() {
		clearInterval(this.ticker);
	}

	private tick() {
		this.eventBus.emit(new TickEvent(this.tickCount))
		this.tickCount++;
	}

	getTickCount(): number {
		return this.tickCount;
	}
}