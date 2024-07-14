export class FullScreenRenderer {
    private context: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;

    constructor() {
        this.canvas = document.createElement('canvas');
        this.context = this.canvas.getContext('2d');

        // Set canvas style to fill the screen
        this.canvas.style.position = 'fixed';
        this.canvas.style.left = '0';
        this.canvas.style.top = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
    }

    initialize() {
        document.body.appendChild(this.canvas);
        window.addEventListener('resize', () => this.resizeCanvas());
        this.resizeCanvas();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.drawWhiteBackground();
    }

    drawWhiteBackground() {
        // Set fill color to white
        this.context.fillStyle = 'white';

        // Draw a rectangle that fills the entire canvas
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        console.log('White background drawn');
        console.log('Canvas dimensions:', this.canvas.width, 'x', this.canvas.height);
    }
}