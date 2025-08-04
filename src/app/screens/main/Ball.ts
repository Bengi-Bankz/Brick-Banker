import { Sprite, Texture } from "pixi.js";

export class Ball extends Sprite {
  public velocityX = 4;
  public velocityY = -4;
  public radius = 40; // Radius based on sprite size (roughly half of 80-88px)
  private screenWidth = 0;
  private screenHeight = 0;

  constructor(color: number = 0xffffff) {
    // Determine which ball image to use based on color
    let textureName: string;
    if (color === 0xff0000) {
      textureName = "redball.png";
    } else if (color === 0x0066ff || color === 0x66ff) {
      textureName = "blueball.png";
    } else {
      // Default to red ball for unknown colors
      textureName = "redball.png";
    }

    // Create sprite with the appropriate texture
    super(Texture.from(textureName));
    
    // Center the sprite
    this.anchor.set(0.5);
    
    // Update radius based on actual sprite size
    this.radius = Math.max(this.width, this.height) / 2;
    
    console.log(`Ball created with texture: ${textureName}, size: ${this.width}x${this.height}, radius: ${this.radius}`);
  }

  public update(): void {
    // Move the ball
    this.x += this.velocityX;
    this.y += this.velocityY;

    // Bounce off walls
    this.checkWallCollisions();
  }

  private checkWallCollisions(): void {
    // Debug logging to see what's happening
    console.log(`Ball position: (${this.x.toFixed(1)}, ${this.y.toFixed(1)}), velocity: (${this.velocityX}, ${this.velocityY})`);
    console.log(`Screen bounds: width=${this.screenWidth}, height=${this.screenHeight}`);
    console.log(`Wall boundaries: left=${-this.screenWidth / 2}, right=${this.screenWidth / 2}, top=${-this.screenHeight / 2}`);

    // Left and right walls
    if (this.x - this.radius <= -this.screenWidth / 2) {
      console.log(`Hit LEFT wall at x=${this.x}`);
      this.x = -this.screenWidth / 2 + this.radius;
      this.velocityX = Math.abs(this.velocityX);
    } else if (this.x + this.radius >= this.screenWidth / 2) {
      console.log(`Hit RIGHT wall at x=${this.x}`);
      this.x = this.screenWidth / 2 - this.radius;
      this.velocityX = -Math.abs(this.velocityX);
    }

    // Top wall
    if (this.y - this.radius <= -this.screenHeight / 2) {
      console.log(`Hit TOP wall at y=${this.y}`);
      this.y = -this.screenHeight / 2 + this.radius;
      this.velocityY = Math.abs(this.velocityY);
    }
  }

  public checkCannonCollision(cannon: {
    x: number;
    y: number;
    getCannonBounds: () => {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  }): boolean {
    const cannonBounds = cannon.getCannonBounds();

    // Check if ball is in the vicinity of the cannon (only check if ball is falling down)
    if (
      this.velocityY > 0 && // Ball must be moving downward
      this.y + this.radius >= cannonBounds.top &&
      this.y - this.radius <= cannonBounds.bottom &&
      this.x + this.radius >= cannonBounds.left &&
      this.x - this.radius <= cannonBounds.right
    ) {
      // Ball hit the cannon - bounce it back up
      this.y = cannonBounds.top - this.radius;

      // Calculate new velocity based on where the ball hit the cannon
      const cannonCenter = cannon.x;
      const hitPosition = (this.x - cannonCenter) / 200; // Normalize hit position

      // Add some angle to the bounce based on hit position (like a paddle)
      this.velocityX = this.velocityX + (hitPosition * 3); // Modify existing X velocity
      this.velocityY = -Math.abs(this.velocityY); // Always bounce upward

      console.log(`Ball bounced off cannon at x=${this.x}, new velocity: (${this.velocityX}, ${this.velocityY})`);
      
      return true;
    }

    return false;
  }

  public checkPaddleCollision(paddle: {
    x: number;
    y: number;
    getPaddleBounds: () => {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  }): boolean {
    const paddleBounds = paddle.getPaddleBounds();

    // Check if ball is in the vicinity of the paddle
    if (
      this.y + this.radius >= paddleBounds.top &&
      this.y - this.radius <= paddleBounds.bottom &&
      this.x + this.radius >= paddleBounds.left &&
      this.x - this.radius <= paddleBounds.right
    ) {
      // Ball hit the paddle
      this.y = paddleBounds.top - this.radius;

      // Calculate new velocity based on where the ball hit the paddle
      const paddleCenter = paddle.x;
      const hitPosition = (this.x - paddleCenter) / 60; // Normalize to -1 to 1

      // Add some angle to the bounce based on hit position
      this.velocityX = hitPosition * 5;
      this.velocityY = -Math.abs(this.velocityY);

      return true;
    }

    return false;
  }

  public checkBrickCollision(brick: {
    x: number;
    y: number;
    getBrickBounds: () => {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  }): "top" | "bottom" | "left" | "right" | null {
    const ballBounds = this.getBallBounds();
    const brickBounds = brick.getBrickBounds();

    // Check if ball intersects with brick
    if (
      ballBounds.right >= brickBounds.left &&
      ballBounds.left <= brickBounds.right &&
      ballBounds.bottom >= brickBounds.top &&
      ballBounds.top <= brickBounds.bottom
    ) {
      // Determine which side was hit based on overlap amounts
      const overlapLeft = ballBounds.right - brickBounds.left;
      const overlapRight = brickBounds.right - ballBounds.left;
      const overlapTop = ballBounds.bottom - brickBounds.top;
      const overlapBottom = brickBounds.bottom - ballBounds.top;

      const minOverlap = Math.min(
        overlapLeft,
        overlapRight,
        overlapTop,
        overlapBottom,
      );

      if (minOverlap === overlapTop) {
        return "top";
      } else if (minOverlap === overlapBottom) {
        return "bottom";
      } else if (minOverlap === overlapLeft) {
        return "left";
      } else {
        return "right";
      }
    }

    return null;
  }

  public getBallBounds() {
    return {
      left: this.x - this.radius,
      right: this.x + this.radius,
      top: this.y - this.radius,
      bottom: this.y + this.radius,
    };
  }

  public isOutOfBounds(): boolean {
    return this.y > this.screenHeight / 2 + this.radius;
  }

  public resize(screenWidth: number, screenHeight: number): void {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }

  public reset(
    x: number,
    y: number,
    velocityX?: number,
    velocityY?: number,
  ): void {
    this.x = x;
    this.y = y;
    this.velocityX = velocityX ?? 4;
    this.velocityY = velocityY ?? -4;
  }
}
