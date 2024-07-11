import {EventDispatcher} from "../EventDispatcher";

class GameTicker {
	private readonly TICK_INTERVAL = 1000 / 20; // 50ms
	private ticker: NodeJS.Timeout;
	private tickCount: number;

	constructor(private eventDispatcher: EventDispatcher) {

	}


	start() {
		this.tickCount = 0;
		this.ticker = setInterval(() => this.tick(), this.TICK_INTERVAL);
	}

	stop() {
		clearInterval(this.ticker);
	}

	private tick() {
		// TODO fire tick event
		this.tickCount++;
	}

	getTickCount(): number {
		return this.tickCount;
	}
}