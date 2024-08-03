import PriorityQueue from "priority-queue-typescript";
import {Cell, Execution, MutableGame, Game, MutablePlayer, PlayerInfo, TerraNullius, Tile} from "../GameApi";
import {AttackIntent, Intent, Turn} from "../Schemas";
import {AttackExecution} from "./AttackExecution";
import {SpawnExecution} from "./SpawnExecution";
import {BotSpawner} from "./BotSpawner";


export class Executor {

    constructor(private gs: Game) {

    }

    addTurn(turn: Turn) {
        turn.intents.forEach(i => this.addIntent(i))
    }

    addIntent(intent: Intent) {
        switch (intent.type) {
            case "attack":
                this.gs.addExecution(
                    new AttackExecution(
                        intent.troops,
                        intent.attackerID,
                        intent.targetID,
                        new Cell(intent.targetX, intent.targetY)
                    )
                )
            case "spawn":
                if (intent.type == "spawn") {
                    this.gs.addExecution(
                        new SpawnExecution(
                            new PlayerInfo(intent.name, intent.isBot),
                            new Cell(intent.x, intent.y),
                        )
                    )
                }
        }
    }


    spawnBots(numBots: number): void {
        new BotSpawner(this.gs).spawnBots(numBots).forEach(i => this.addIntent(i))
    }
}