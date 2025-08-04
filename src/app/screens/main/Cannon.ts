import { Sprite, Container, Graphics } from "pixi.js";

export class Cannon extends Container {
  private cannonSprite!: Sprite;
  private direction: "left" | "right" | "center";
  private originalFiringX: number = 0;
  private originalFiringY: number = 0;

  constructor(direction: "left" | "right" | "center") {
    super();

    this.direction = direction;
    this.createCannon();
  }

  public setOriginalFiringPosition(x: number, y: number): void {
    this.originalFiringX = x;
    this.originalFiringY = y;
  }

  private createCannon(): void {
    try {
      // Use cannonpaddle.png instead
      this.cannonSprite = Sprite.from("cannonpaddle.png");
      this.cannonSprite.anchor.set(0.5);

      // For center, don't flip. For left, flip horizontally
      if (this.direction === "left") {
        this.cannonSprite.scale.x = -1;
      }
      // For "center", keep it as-is since cannonpaddle.png has cannons on both sides

      this.addChild(this.cannonSprite);
      console.log(
        `${this.direction} cannon loaded with cannonpaddle.png successfully`,
      );
    } catch (error) {
      console.error(
        "Failed to load cannonpaddle.png, using fallback graphics:",
        error,
      );
      // Fallback to graphics if image fails to load
      this.createFallbackCannon();
    }
  }

  private createFallbackCannon(): void {
    console.log(`Creating ${this.direction} cannon with BRIGHT GREEN graphics`);

    // Create a VERY visible bright cannon graphic
    const cannon = new Graphics();
    cannon.beginFill(0x00ff00); // BRIGHT GREEN for maximum visibility
    cannon.drawCircle(0, 0, 40); // Bigger main body
    cannon.endFill();

    // Add bright white outline
    cannon.lineStyle(3, 0xffffff);
    cannon.drawCircle(0, 0, 40);

    // Add barrel
    cannon.beginFill(0x00ff00);
    if (this.direction === "left") {
      cannon.drawRect(-50, -10, 30, 20); // Bigger barrel
    } else {
      cannon.drawRect(20, -10, 30, 20);
    }
    cannon.endFill();

    // Add white outline to barrel
    cannon.lineStyle(3, 0xffffff);
    if (this.direction === "left") {
      cannon.drawRect(-50, -10, 30, 20);
    } else {
      cannon.drawRect(20, -10, 30, 20);
    }

    this.addChild(cannon);
    console.log(
      `${this.direction} cannon graphics added, children count:`,
      this.children.length,
    );
  }

  public getFirePosition(side?: "left" | "right"): { x: number; y: number } {
    // Return the position where the ball should spawn from the cannon barrel
    let cannonWidth = 60; // Default width

    if (this.cannonSprite && this.cannonSprite.width) {
      cannonWidth = this.cannonSprite.width;
    }

    // Use original firing position if set, otherwise use current position
    const firingX = this.originalFiringX !== 0 ? this.originalFiringX : this.x;
    const firingY = this.originalFiringY !== 0 ? this.originalFiringY : this.y;

    // For center cannon, we can fire from either side
    if (this.direction === "center") {
      if (side === "left") {
        return { x: firingX - cannonWidth / 2, y: firingY };
      } else if (side === "right") {
        return { x: firingX + cannonWidth / 2, y: firingY };
      }
      // Default to right side if no side specified
      return { x: firingX + cannonWidth / 2, y: firingY };
    }

    // Original logic for left/right cannons
    if (this.direction === "left") {
      return { x: firingX - cannonWidth / 2, y: firingY };
    } else {
      return { x: firingX + cannonWidth / 2, y: firingY };
    }
  }

  public getFireDirection(side?: "left" | "right"): { x: number; y: number } {
    // Return the initial velocity direction for the ball

    // For center cannon, we can fire in either direction
    if (this.direction === "center") {
      if (side === "left") {
        return { x: -4, y: -4 };
      } else if (side === "right") {
        return { x: 4, y: -4 };
      }
      // Default to right direction if no side specified
      return { x: 4, y: -4 };
    }

    // Original logic for left/right cannons
    if (this.direction === "left") {
      return { x: -4, y: -4 };
    } else {
      return { x: 4, y: -4 };
    }
  }

  public getCannonBounds(): { left: number; right: number; top: number; bottom: number } {
    // Get cannon dimensions
    let cannonWidth = 60; // Default width
    let cannonHeight = 20; // Default height

    if (this.cannonSprite) {
      cannonWidth = this.cannonSprite.width;
      cannonHeight = this.cannonSprite.height;
    }

    // Return bounds relative to cannon position
    return {
      left: this.x - cannonWidth / 2,
      right: this.x + cannonWidth / 2,
      top: this.y - cannonHeight / 2,
      bottom: this.y + cannonHeight / 2,
    };
  }
}
