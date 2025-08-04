import { Graphics, FederatedPointerEvent, Text } from "pixi.js";
import { engine } from "../../getEngine";

export class Paddle extends Graphics {
  public speed = 8;
  private screenWidth = 0;
  private isDragging = false;
  private lastPointerX = 0;
  private paddleText: Text;
  private paddleWidth = 200; // Made wider

  constructor() {
    super();

    // Draw the wider paddle
    this.beginFill(0xffffff);
    this.drawRoundedRect(-this.paddleWidth / 2, -10, this.paddleWidth, 20, 10);
    this.endFill();

    // Add "2 x" text on the paddle
    this.paddleText = new Text("2 x", {
      fontSize: 16,
      fill: 0x000000, // Black text
      fontWeight: "bold",
    });
    this.paddleText.anchor.set(0.5);
    this.paddleText.x = 0;
    this.paddleText.y = 0;
    this.addChild(this.paddleText);

    // Make it interactive
    this.eventMode = "static";
    this.cursor = "pointer";

    // Add pointer events for mouse/touch control
    this.on("pointerdown", this.onPointerDown.bind(this));
  }

  private onPointerDown(event: FederatedPointerEvent): void {
    this.isDragging = true;
    this.lastPointerX = event.global.x;

    // Add global listeners for drag and release
    engine().stage.on("pointermove", this.onPointerMove.bind(this));
    engine().stage.on("pointerup", this.onPointerUp.bind(this));
    engine().stage.on("pointerupoutside", this.onPointerUp.bind(this));
  }

  private onPointerMove(event: FederatedPointerEvent): void {
    if (!this.isDragging) return;

    const deltaX = event.global.x - this.lastPointerX;
    this.x += deltaX;
    this.lastPointerX = event.global.x;

    // Keep paddle within screen bounds
    this.constrainToScreen();
  }

  private onPointerUp(): void {
    this.isDragging = false;

    // Remove global listeners
    engine().stage.off("pointermove", this.onPointerMove.bind(this));
    engine().stage.off("pointerup", this.onPointerUp.bind(this));
    engine().stage.off("pointerupoutside", this.onPointerUp.bind(this));
  }

  public update(): void {
    // Update logic can go here if needed
    this.constrainToScreen();
  }

  private constrainToScreen(): void {
    const halfWidth = this.paddleWidth / 2; // Use dynamic paddle width
    this.x = Math.max(
      halfWidth,
      Math.min(this.screenWidth - halfWidth, this.x),
    );
  }

  public resize(screenWidth: number): void {
    this.screenWidth = screenWidth;
    this.constrainToScreen();
  }

  public getPaddleBounds() {
    const halfWidth = this.paddleWidth / 2;
    return {
      left: this.x - halfWidth,
      right: this.x + halfWidth,
      top: this.y - 10,
      bottom: this.y + 10,
    };
  }
}
