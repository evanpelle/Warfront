import {Execution, MutableGame, MutablePlayer, PlayerID} from "../Game"

export class PlayerExecution implements Execution {

    private player: MutablePlayer

    constructor(private playerID: PlayerID) {
    }

    init(gs: MutableGame, ticks: number) {
        this.player = gs.player(this.playerID)
    }

    tick(ticks: number) {
        this.player.addTroops(Math.sqrt(this.player.numTilesOwned() * this.player.troops() + 1000) / 1000)
    }

    owner(): MutablePlayer {
        return this.player
    }

    isActive(): boolean {
        return this.player.isAlive()
    }
}