import {Game, Player, Tile, Cell} from '../core/GameApi';

export interface Point {
    x: number;
    y: number;
}

export interface Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;
}

export function placeName(game: Game, player: Player): [position: Cell, fontSize: number] {
    const boundingBox = calculateBoundingBox(player);
    const grid = createGrid(game, player, boundingBox);
    const largestRectangle = findLargestInscribedRectangle(grid);

    const center = new Cell(
        largestRectangle.x + largestRectangle.width / 2,
        largestRectangle.y + largestRectangle.height / 2,
    )

    const fontSize = calculateFontSize(largestRectangle, player.info().name);

    return [center, fontSize]
}

export function calculateBoundingBox(player: Player): {min: Point; max: Point} {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    player.borderTiles().forEach((tile: Tile) => {
        const cell = tile.cell();
        minX = Math.min(minX, cell.x);
        minY = Math.min(minY, cell.y);
        maxX = Math.max(maxX, cell.x);
        maxY = Math.max(maxY, cell.y);
    });

    return {min: {x: minX, y: minY}, max: {x: maxX, y: maxY}};
}

export function createGrid(game: Game, player: Player, boundingBox: {min: Point; max: Point}): boolean[][] {
    const width = boundingBox.max.x - boundingBox.min.x + 1;
    const height = boundingBox.max.y - boundingBox.min.y + 1;
    const grid: boolean[][] = Array(width).fill(null).map(() => Array(height).fill(false));

    for (let y = boundingBox.min.y; y <= boundingBox.max.y; y++) {
        for (let x = boundingBox.min.x; x <= boundingBox.max.x; x++) {
            const cell = new Cell(x, y);
            if (game.isOnMap(cell)) {
                const tile = game.tile(cell);
                grid[x - boundingBox.min.x][y - boundingBox.min.y] = tile.owner() === player;
            }
        }
    }

    return grid;
}

export function findLargestInscribedRectangle(grid: boolean[][]): Rectangle {
    const rows = grid[0].length;
    const cols = grid.length;
    const heights: number[] = new Array(cols).fill(0);
    let largestRect: Rectangle = {x: 0, y: 0, width: 0, height: 0};

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            if (grid[col][row]) {
                heights[row]++;
            } else {
                heights[row] = 0;
            }
        }

        const rectForRow = largestRectangleInHistogram(heights);

        if (rectForRow.width * rectForRow.height > largestRect.width * largestRect.height) {
            largestRect = {
                x: rectForRow.x,
                y: row - rectForRow.height + 1,
                width: rectForRow.width,
                height: rectForRow.height
            };
        }
    }

    return largestRect;
}

export function largestRectangleInHistogram(widths: number[]): Rectangle {
    const stack: number[] = [];
    let maxArea = 0;
    let largestRect: Rectangle = {x: 0, y: 0, width: 0, height: 0};

    for (let i = 0; i <= widths.length; i++) {
        const h = i === widths.length ? 0 : widths[i];

        while (stack.length > 0 && h < widths[stack[stack.length - 1]]) {
            const height = widths[stack.pop()!];
            const width = stack.length === 0 ? i : i - stack[stack.length - 1] - 1;

            if (height * width > maxArea) {
                maxArea = height * width;
                largestRect = {
                    x: stack.length === 0 ? 0 : stack[stack.length - 1] + 1,
                    y: 0,
                    width: width,
                    height: height
                };
            }
        }

        stack.push(i);
    }

    return largestRect;
}

export function calculateFontSize(rectangle: Rectangle, name: string): number {
    // This is a simplified calculation. You might want to adjust it based on your specific font and rendering system.
    const aspectRatio = name.length; // Assuming width:height ratio of 2:1 for each character
    const widthConstrained = rectangle.width / name.length;
    const heightConstrained = rectangle.height / 2;
    return Math.min(widthConstrained, heightConstrained);
}