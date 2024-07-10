import {GameState} from "../GameState";
import {gameTicker, GameTickListener} from "../GameTicker";

export class GameExecutor implements GameTickListener {
    constructor(private gs: GameState) {
    }

    //TODO: bot ticking should be done in a separate bot manager
    tick(): void {
        this.gs.bots.forEach(bot => bot.tick());
        if (gameTicker.getTickCount() % 10 === 0) {
            this.gs.players.forEach(player => player.income());
        }
    }
}