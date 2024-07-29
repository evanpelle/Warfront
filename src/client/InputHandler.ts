import {EventBus, GameEvent} from "../core/EventBus";
import {Cell} from "../core/GameStateApi";

export class MouseUpEvent implements GameEvent {
    constructor(
        public readonly x: number,
        public readonly y: number,
    ) { }
}

export class MouseDownEvent implements GameEvent {
    constructor(
        public readonly x: number,
        public readonly y: number,
    ) { }
}

export class ZoomEvent implements GameEvent {
    constructor(
        public readonly x: number,
        public readonly y: number,
        public readonly delta: number
    ) { }
}

export class DragEvent implements GameEvent {
    constructor(
        public readonly deltaX: number,
        public readonly deltaY: number,
    ) { }
}

export class InputHandler {

    private lastMouseDownX: number = 0
    private lastMouseDownY: number

    private isMouseDown: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    constructor(private eventBus: EventBus) { }

    initialize() {
        document.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        document.addEventListener("pointerup", (e) => this.onPointerUp(e));
        document.addEventListener("wheel", (e) => this.onScroll(e), {passive: false});
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('mouseleave', this.onMouseUp.bind(this))
    }

    onPointerDown(event: PointerEvent) {
        this.lastMouseDownX = event.x
        this.lastMouseDownY = event.y
        this.eventBus.emit(new MouseDownEvent(event.x, event.y))
    }

    onPointerUp(event: PointerEvent) {
        const dist = Math.abs(event.x - this.lastMouseDownX) + Math.abs(event.y - this.lastMouseDownY);
        if (dist < 10) {
            this.eventBus.emit(new MouseUpEvent(event.x, event.y))
        }
    }

    private onScroll(event: WheelEvent) {
        this.eventBus.emit(new ZoomEvent(event.x, event.y, event.deltaY))
    }

    private onMouseDown(event: MouseEvent) {
        this.isMouseDown = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isMouseDown) return;

        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;

        this.eventBus.emit(new DragEvent(deltaX, deltaY))

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    private onMouseUp(event: MouseEvent) {
        this.isMouseDown = false;
    }

}