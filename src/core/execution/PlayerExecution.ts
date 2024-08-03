import {Execution, MutableGame, MutablePlayer, PlayerID} from "../GameApi"

export class PlayerExecution implements Execution {

    private player: MutablePlayer

    constructor(private playerID: PlayerID) {
    }

    init(gs: MutableGame) {
        this.player = gs.player(this.playerID)
    }

    tick() {
        this.player.addTroops(Math.sqrt(this.player.numTilesOwned() * this.player.troops() + 1000) / 1000)
    }

    owner(): MutablePlayer {
        return this.player
    }

    isActive(): boolean {
        return this.player.isAlive()
    }
}