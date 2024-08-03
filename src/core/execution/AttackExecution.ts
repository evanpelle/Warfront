import PriorityQueue from "priority-queue-typescript";
import {Cell, Execution, MutableGame, MutablePlayer, PlayerID, Player, TerrainTypes, TerraNullius, Tile} from "../GameApi";
import {PseudoRandom} from "../PseudoRandom";
import {manhattanDist} from "../Util";

export class AttackExecution implements Execution {
    private active: boolean = true;
    private toConquer: PriorityQueue<TileContainer> = new PriorityQueue<TileContainer>(11, (a: TileContainer, b: TileContainer) => a.priority - b.priority);
    private random = new PseudoRandom(123)

    private _owner: MutablePlayer
    private target: MutablePlayer | TerraNullius

    constructor(
        private troops: number,
        private _ownerID: PlayerID,
        private targetID: PlayerID | null,
        private targetCell: Cell | null
    ) { }

    init(gs: MutableGame) {
        this._owner = gs.player(this._ownerID)
        this.target = this.targetID == null ? gs.terraNullius() : gs.player(this.targetID)
        this.troops = Math.min(this._owner.troops(), this.troops)
        this._owner.setTroops(this._owner.troops() - this.troops)
    }

    tick() {
        if (!this.active) {
            return
        }

        let numTilesPerTick = this._owner.borderTilesWith(this.target).size / 2
        while (numTilesPerTick > 0) {
            if (this.troops < 1) {
                this.active = false
                return
            }

            if (this.toConquer.size() == 0) {
                this.calculateToConquer()
            }
            if (this.toConquer.size() == 0) {
                this.active = false
                this._owner.addTroops(this.troops)
                return
            }

            const tileToConquer: Tile = this.toConquer.poll().tile
            const onBorder = tileToConquer.neighbors().filter(t => t.owner() == this._owner).length > 0
            if (tileToConquer.owner() != this.target || !onBorder) {
                continue
            }
            this._owner.conquer(tileToConquer.cell())
            this.troops -= 1
            numTilesPerTick -= 1
        }
    }

    private calculateToConquer() {
        const border = this.owner().borderTilesWith(this.target)
        const enemyBorder: Set<Tile> = new Set()
        for (const b of border) {
            b.neighbors()
                .filter(t => t.terrain() == TerrainTypes.Land)
                .filter(t => t.owner() == this.target)
                .forEach(t => enemyBorder.add(t))
        }

        // let closestTile: Tile;
        // let closestDist: number = Number.POSITIVE_INFINITY;
        // for (const enemyTile of enemyBorder) {
        //     const dist = manhattanDist(enemyTile.cell(), this.targetCell)
        //     if (dist < closestDist) {
        //         closestTile = enemyTile
        //     }
        // }

        // tileByDist.forEach(t => console.log(`tile dist: ${manhattanDist(t.cell(), closestTile.cell())}`))
        let tileByDist = []
        if (this.targetCell == null) {
            tileByDist = Array.from(enemyBorder).slice().sort((a, b) => this.random.next() - .5)
        } else {
            tileByDist = Array.from(enemyBorder).slice().sort((a, b) => manhattanDist(a.cell(), this.targetCell) - manhattanDist(b.cell(), this.targetCell))
        }
        for (let i = 0; i < Math.min(enemyBorder.size / 2, tileByDist.length); i++) {
            const enemyTile = tileByDist[i]
            const numOwnedByMe = enemyTile.neighbors()
                .filter(t => t.terrain() == TerrainTypes.Land)
                .filter(t => t.owner() == this._owner)
                .length
            // this.toConquer.add(new TileContainer(enemyTile, numOwnedByMe + (this.random.next() % 5) + (-5 * i / tileByDist.length)))
            const r = this.random.next() % 4
            this.toConquer.add(new TileContainer(enemyTile, r + numOwnedByMe * 1000))
        }

    }

    owner(): MutablePlayer {
        return this._owner
    }

    isActive(): boolean {
        return this.active
    }

}


class TileContainer {
    constructor(public readonly tile: Tile, public readonly priority: number) { }
}