import PriorityQueue from "priority-queue-typescript";
import {Boat, Cell, Execution, MutableBoat, MutableGame, MutablePlayer, Player, PlayerID, Tile} from "../Game";
import {manhattanDist} from "../Util";
import {AttackExecution} from "./AttackExecution";

export class BoatAttackExecution implements Execution {

    private lastMove: number

    // TODO: make this configurable
    private ticksPerMove = 1

    private active = true

    private mg: MutableGame
    private attacker: MutablePlayer
    private target: MutablePlayer

    // TODO make private
    public path: Tile[]
    private src: Tile
    private dst: Tile

    private currTileIndex: number = 0

    private boat: MutableBoat

    constructor(
        private attackerID: PlayerID,
        private targetID: PlayerID | null,
        private cell: Cell,
        private troops: number
    ) { }

    init(mg: MutableGame, ticks: number) {
        if (this.targetID == null) {
            throw new Error("attacking terranullius not supported")
        }
        this.lastMove = ticks

        this.mg = mg
        this.attacker = mg.player(this.attackerID)
        this.target = mg.player(this.targetID)

        this.troops = Math.min(this.troops, this.attacker.troops())
        this.attacker.removeTroops(this.troops)

        this.src = this.closestShoreTileToTarget(this.attacker, this.cell)
        this.dst = this.closestShoreTileToTarget(this.target, this.cell)
        this.path = this.computePath(this.src, this.dst)
        if (this.path != null) {
            console.log(`got path ${this.path.map(t => t.cell().toString())}`)
            this.boat = this.attacker.addBoat(1000, this.src.cell(), this.target)
        } else {
            console.log('got null path')
            this.active = false
        }
    }

    tick(ticks: number) {
        if (!this.active) {
            return
        }
        if (ticks - this.lastMove < this.ticksPerMove) {
            return
        }
        this.lastMove = ticks
        this.currTileIndex++

        if (this.currTileIndex >= this.path.length) {
            if (this.dst.owner() == this.attacker) {
                this.attacker.addTroops(this.troops)
                this.active = false
                return
            }
            this.attacker.conquer(this.dst.cell())
            this.mg.addExecution(new AttackExecution(this.troops, this.attacker.id(), this.targetID, null))
            this.active = false
            return
        }

        const nextTile = this.path[this.currTileIndex]
        this.boat.move(nextTile.cell())
    }

    owner(): MutablePlayer {
        return this.attacker
    }

    isActive(): boolean {
        return this.active
    }

    private closestShoreTileToTarget(player: Player, target: Cell): Tile {
        const shoreTiles = Array.from(player.borderTiles()).filter(t => t.onShore())

        return shoreTiles.reduce((closest, current) => {
            const closestDistance = manhattanDist(target, closest.cell());
            const currentDistance = manhattanDist(target, current.cell());
            return currentDistance < closestDistance ? current : closest;
        });
    }

    private computePath(src: Tile, dst: Tile): Tile[] {
        if (!src.onShore() || !dst.onShore()) {
            return null; // Both source and destination must be on water
        }

        const openSet = new PriorityQueue<{tile: Tile, fScore: number}>(
            11,
            (a, b) => a.fScore - b.fScore
        );
        const cameFrom = new Map<Tile, Tile>();
        const gScore = new Map<Tile, number>();

        gScore.set(src, 0);
        openSet.add({tile: src, fScore: this.heuristic(src, dst)});

        while (!openSet.empty()) {
            const current = openSet.poll()!.tile;

            if (current === dst) {
                return this.reconstructPath(cameFrom, current);
            }

            for (const neighbor of current.neighbors()) {
                if (!neighbor.onShore()) continue; // Skip non-water tiles

                const tentativeGScore = gScore.get(current)! + 1; // Assuming uniform cost

                if (!gScore.has(neighbor) || tentativeGScore < gScore.get(neighbor)!) {
                    cameFrom.set(neighbor, current);
                    gScore.set(neighbor, tentativeGScore);
                    const fScore = tentativeGScore + this.heuristic(neighbor, dst);

                    openSet.add({tile: neighbor, fScore: fScore});
                }
            }
        }

        return null; // No path found
    }

    private heuristic(a: Tile, b: Tile): number {
        // Manhattan distance
        return Math.abs(a.cell().x - b.cell().x) + Math.abs(a.cell().y - b.cell().y);
    }

    private reconstructPath(cameFrom: Map<Tile, Tile>, current: Tile): Tile[] {
        const path = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current)!;
            path.unshift(current);
        }
        return path;
    }

}