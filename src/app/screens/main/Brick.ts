import { Graphics, Text } from "pixi.js";

export class Brick extends Graphics {
  public destroyed = false;
  public multiplier = 1; // Score multiplier for this brick
  private brickWidth = 80;
  private brickHeight = 30;
  private multiplierText!: Text;
  private maxHitPoints: number;
  private currentHitPoints: number;
  private originalColor: number;

  constructor(color: number = 0xff6b6b, multiplier: number = 1) {
    super();

    this.multiplier = multiplier;
    this.originalColor = color;

    // Handle special cases
    if (multiplier === -1) {
      // Metal squares that don't break
      this.maxHitPoints = 999999; // Effectively unbreakable
    } else if (multiplier === 999) {
      // Bonus squares
      this.maxHitPoints = 1; // Break easily for bonus
    } else {
      // Determine hit points based on multiplier (higher value = more hits needed)
      if (multiplier >= 1000) {
        this.maxHitPoints = 8; // Ultra high value bricks need 8 hits
      } else if (multiplier >= 500) {
        this.maxHitPoints = 7; // Very high value bricks need 7 hits
      } else if (multiplier >= 100) {
        this.maxHitPoints = 6; // High value bricks need 6 hits
      } else if (multiplier >= 50) {
        this.maxHitPoints = 5; // Medium-high value bricks need 5 hits
      } else if (multiplier >= 10) {
        this.maxHitPoints = 4; // Medium value bricks need 4 hits
      } else if (multiplier >= 2) {
        this.maxHitPoints = 3; // Low-medium value bricks need 3 hits
      } else {
        this.maxHitPoints = 2; // Even the lowest value bricks need 2 hits minimum
      }
    }

    this.currentHitPoints = this.maxHitPoints;
    this.drawBrick(color);
    this.addMultiplierText();
  }

  private drawBrick(color: number): void {
    // Draw the brick with a slight gradient effect
    this.beginFill(color);
    this.drawRoundedRect(
      -this.brickWidth / 2,
      -this.brickHeight / 2,
      this.brickWidth,
      this.brickHeight,
      4,
    );
    this.endFill();

    // Add a highlight on top
    this.lineStyle(2, 0xffffff, 0.3);
    this.moveTo(-this.brickWidth / 2 + 2, -this.brickHeight / 2 + 2);
    this.lineTo(this.brickWidth / 2 - 2, -this.brickHeight / 2 + 2);

    // Add a shadow on bottom
    this.lineStyle(2, 0x000000, 0.2);
    this.moveTo(-this.brickWidth / 2 + 2, this.brickHeight / 2 - 2);
    this.lineTo(this.brickWidth / 2 - 2, this.brickHeight / 2 - 2);
  }

  private addMultiplierText(): void {
    // Format multiplier text with special cases
    let multiplierDisplay: string;
    if (this.multiplier === -1) {
      multiplierDisplay = "METAL"; // Metal squares
    } else if (this.multiplier === 999) {
      multiplierDisplay = "BONUS"; // Bonus squares
    } else if (this.multiplier >= 1) {
      multiplierDisplay = `${this.multiplier}x`;
    } else {
      multiplierDisplay = `${this.multiplier}x`;
    }

    // Create text
    this.multiplierText = new Text(multiplierDisplay, {
      fontSize: this.multiplier === -1 || this.multiplier === 999 ? 12 : 16, // Smaller font for special text
      fill: 0x000000,
      fontWeight: "bold",
      align: "center",
    });

    this.multiplierText.anchor.set(0.5);
    this.multiplierText.x = 0;
    this.multiplierText.y = 0;

    this.addChild(this.multiplierText);
  }

  private updateMultiplierText(): void {
    // Update the text to show only multiplier (no HP) with special cases
    let multiplierDisplay: string;
    if (this.multiplier === -1) {
      multiplierDisplay = "METAL"; // Metal squares
    } else if (this.multiplier === 999) {
      multiplierDisplay = "BONUS"; // Bonus squares
    } else if (this.multiplier >= 1) {
      multiplierDisplay = `${this.multiplier}x`;
    } else {
      multiplierDisplay = `${this.multiplier}x`;
    }

    this.multiplierText.text = multiplierDisplay;
  }

  public checkCollision(ball: {
    x: number;
    y: number;
    getBallBounds: () => {
      left: number;
      right: number;
      top: number;
      bottom: number;
    };
  }): boolean {
    if (this.destroyed) return false;

    const ballBounds = ball.getBallBounds();
    const brickBounds = this.getBrickBounds();

    // Check if ball intersects with brick
    if (
      ballBounds.right >= brickBounds.left &&
      ballBounds.left <= brickBounds.right &&
      ballBounds.bottom >= brickBounds.top &&
      ballBounds.top <= brickBounds.bottom
    ) {
      this.destroyBrick();
      return true;
    }

    return false;
  }

  public getBrickBounds() {
    return {
      left: this.x - this.brickWidth / 2,
      right: this.x + this.brickWidth / 2,
      top: this.y - this.brickHeight / 2,
      bottom: this.y + this.brickHeight / 2,
    };
  }

  public hitBrick(): boolean {
    this.currentHitPoints--;

    if (this.currentHitPoints <= 0) {
      // Brick is completely destroyed
      this.destroyed = true;
      this.visible = false;
      return true; // Brick is destroyed
    } else {
      // Brick is damaged but not destroyed - show cracking effect and update HP display
      this.showDamage();
      this.updateMultiplierText(); // Update hit points display
      return false; // Brick is still alive
    }
  }

  private showDamage(): void {
    // Clear and redraw the brick with damage effects
    this.clear();

    // Calculate damage level (darker color + cracks)
    const damageLevel = 1 - (this.currentHitPoints / this.maxHitPoints);
    const darkenAmount = damageLevel * 0.4; // Darken by up to 40%

    // Darken the original color
    const r = Math.floor(((this.originalColor >> 16) & 0xFF) * (1 - darkenAmount));
    const g = Math.floor(((this.originalColor >> 8) & 0xFF) * (1 - darkenAmount));
    const b = Math.floor((this.originalColor & 0xFF) * (1 - darkenAmount));
    const damagedColor = (r << 16) | (g << 8) | b;

    this.drawBrick(damagedColor);
    this.drawCracks(damageLevel);
  }

  private drawCracks(damageLevel: number): void {
    // Draw crack lines based on damage level - more cracks as damage increases
    const crackAlpha = Math.min(damageLevel * 1.5, 1.0); // Make cracks more visible

    // First crack appears early
    if (damageLevel > 0.1) {
      this.moveTo(-this.brickWidth / 4, -this.brickHeight / 2);
      this.lineTo(-this.brickWidth / 4 + 10, this.brickHeight / 2);
      this.stroke({ width: 1, color: 0x000000, alpha: crackAlpha });
    }

    // Second crack for moderate damage
    if (damageLevel > 0.3) {
      this.moveTo(this.brickWidth / 4, -this.brickHeight / 2);
      this.lineTo(this.brickWidth / 4 - 8, this.brickHeight / 2);
      this.stroke({ width: 1, color: 0x000000, alpha: crackAlpha });
    }

    // Third crack for heavy damage
    if (damageLevel > 0.5) {
      this.moveTo(0, -this.brickHeight / 2);
      this.lineTo(-5, this.brickHeight / 2);
      this.stroke({ width: 1, color: 0x000000, alpha: crackAlpha });
    }

    // Fourth crack for severe damage
    if (damageLevel > 0.7) {
      this.moveTo(-this.brickWidth / 6, -this.brickHeight / 4);
      this.lineTo(this.brickWidth / 6, this.brickHeight / 4);
      this.stroke({ width: 1, color: 0x000000, alpha: crackAlpha });
    }

    // Final cracks for near destruction
    if (damageLevel > 0.85) {
      this.moveTo(this.brickWidth / 6, -this.brickHeight / 4);
      this.lineTo(-this.brickWidth / 6, this.brickHeight / 4);
      this.stroke({ width: 1, color: 0x000000, alpha: crackAlpha });
    }
  }

  public destroyBrick(): void {
    // Keep this method for compatibility but make it use hitBrick
    this.currentHitPoints = 0;
    this.hitBrick();
  }

  public resetBrick(): void {
    // Reset brick to full health and original appearance
    this.destroyed = false;
    this.visible = true;
    this.currentHitPoints = this.maxHitPoints;

    // Clear and redraw with original color
    this.clear();
    this.drawBrick(this.originalColor);
    this.addMultiplierText();

    console.log(`Brick reset: ${this.multiplier}x with ${this.maxHitPoints} HP`);
  }
}
