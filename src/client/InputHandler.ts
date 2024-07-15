import {EventBus, GameEvent} from "../EventBus";
import {Cell} from "../core/GameStateApi";

export class ClickEvent implements GameEvent {
    constructor(
        public readonly x: number,
        public readonly y: number
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

    private isDragging: boolean = false;
    private lastMouseX: number = 0;
    private lastMouseY: number = 0;

    constructor(private eventBus: EventBus) { }

    initialize() {
        document.addEventListener("pointerdown", (e) => this.onPointerDown(e));
        document.addEventListener("wheel", (e) => this.onScroll(e), {passive: false});
        document.addEventListener('mousedown', this.onMouseDown.bind(this));
        document.addEventListener('mousemove', this.onMouseMove.bind(this));
        document.addEventListener('mouseup', this.onMouseUp.bind(this));
        document.addEventListener('mouseleave', this.onMouseUp.bind(this))
    }

    onPointerDown(event: PointerEvent) {
        this.eventBus.emit(new ClickEvent(event.x, event.y))
    }

    private onScroll(event: WheelEvent) {
        this.eventBus.emit(new ZoomEvent(event.x, event.y, event.deltaY))
    }

    private onMouseDown(event: MouseEvent) {
        this.isDragging = true;
        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    private onMouseMove(event: MouseEvent) {
        if (!this.isDragging) return;

        const deltaX = event.clientX - this.lastMouseX;
        const deltaY = event.clientY - this.lastMouseY;

        this.eventBus.emit(new DragEvent(deltaX, deltaY))

        this.lastMouseX = event.clientX;
        this.lastMouseY = event.clientY;
    }

    private onMouseUp(event: MouseEvent) {
        this.isDragging = false;
    }

}