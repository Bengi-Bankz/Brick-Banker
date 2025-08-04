import { Container, Text, Graphics } from "pixi.js";
import { Ball } from "./Ball";
import { Brick } from "./Brick";
import { Cannon } from "./Cannon";
import { engine } from "../../getEngine";

export class BrickBreakerGame extends Container {
  private balls: Ball[] = [];
  private bricks: Brick[] = [];
  private cannon!: Cannon;
  private balance = 1000; // Starting balance
  private gameState: "playing" | "gameOver" | "levelComplete" = "playing";
  private balanceText!: Text;
  private statusText!: Text;
  private instructionTimer = 0;
  private screenWidth = 800; // Default screen dimensions
  private screenHeight = 600;
  private background!: Graphics; // Changed from Sprite to Graphics
  private border!: Graphics;
  private dividingWall!: Graphics; // Vertical wall in the middle
  private roundActive = false; // Track if a round is currently active
  private shotsFiredThisRound = { left: false, right: false }; // Track which sides have fired

  constructor() {
    super();

    // Create background first (so it appears behind everything)
    this.createBackground();

    // Create game objects - ONLY CANNONS for now
    this.createCannonsAndButtons();

    // Create UI text
    this.balanceText = new Text(`Balance: $${this.balance}`, {
      fontSize: 24,
      fill: 0xffffff,
    });

    this.statusText = new Text("Cannons only - no paddle/buttons!", {
      fontSize: 24,
      fill: 0xffffff,
      align: "center",
    });
    this.statusText.anchor.set(0.5);

    // Add to container - ONLY CANNON AND UI
    this.addChild(this.cannon);
    console.log("Added cannon to container");

    this.addChild(this.balanceText);
    this.addChild(this.statusText);

    console.log("Total children in BrickBreakerGame:", this.children.length);

    this.createBricks();
  }

  private createCannonsAndButtons(): void {
    // Create ONLY one cannon (cannonpaddle.png has cannons on both sides)
    this.cannon = new Cannon("center"); // Use "center" to enable left/right firing
    console.log("Created single cannon with cannonpaddle.png");
  }

  private createBackground(): void {
    // Create dark green background using Graphics
    this.background = new Graphics();
    this.addChild(this.background);
    
    // Create border around the play area
    this.border = new Graphics();
    this.addChild(this.border);
    
    // Create dividing wall in the middle
    this.dividingWall = new Graphics();
    this.addChild(this.dividingWall);
    
    console.log("Dark green background, border, and dividing wall created");
  }

  public fireCannon(side: "left" | "right", quantity: number = 1): void {
    console.log(`🔥 FIRE CANNON CALLED: ${side} side, quantity: ${quantity}`);
    console.log(`🔥 Game state:`, this.gameState);
    console.log(`🔥 Cannon exists:`, !!this.cannon);
    console.log(`🔥 Screen dimensions:`, this.screenWidth, 'x', this.screenHeight);
    
    // Check if this side has already fired this round
    if (this.shotsFiredThisRound[side]) {
      console.warn(`❌ ${side} side has already fired this round!`);
      return;
    }
    
    if (!this.cannon) {
      console.error("❌ Cannot fire: cannon is null!");
      return;
    }
    
    if (this.gameState !== "playing") {
      console.warn("❌ Cannot fire: game is not in playing state");
      return;
    }

    // Mark this side as having fired and activate round
    this.shotsFiredThisRound[side] = true;
    this.roundActive = true;
    console.log(`🎯 Round activated. Shots fired this round:`, this.shotsFiredThisRound);

    // Play cannon fire sound effect (with error handling)
    try {
      engine().audio.sfx.play("main/sounds/sfx-press.mp3", { volume: 0.8 });
      console.log("🔊 Sound effect played successfully");
    } catch (error) {
      console.warn("🔊 Could not play cannon fire sound:", error);
    }
    
    const firePos = this.cannon.getFirePosition(side);
    const fireDir = this.cannon.getFireDirection(side);
    
    console.log(`Fire position: x=${firePos.x}, y=${firePos.y}`);
    console.log(`Fire direction: x=${fireDir.x}, y=${fireDir.y}`);
    console.log(`Cannon position: x=${this.cannon.x}, y=${this.cannon.y}`);

    // Determine ball color based on cannon side
    const ballColor = side === "left" ? 0xff0000 : 0x0066ff; // Red for left, blue for right

    // Create multiple balls based on quantity
    for (let i = 0; i < quantity; i++) {
      const ball = new Ball(ballColor);
      
      // Add slight variations to position and direction for multiple balls
      const angleVariation = (i - (quantity - 1) / 2) * 0.2; // Spread balls in a fan pattern
      const positionOffset = (i - (quantity - 1) / 2) * 5; // Slight horizontal offset
      
      const adjustedFirePos = {
        x: firePos.x + positionOffset,
        y: firePos.y
      };
      
      const adjustedFireDir = {
        x: fireDir.x + Math.sin(angleVariation) * 2,
        y: fireDir.y + Math.cos(angleVariation) * 0.5
      };
      
      ball.reset(adjustedFirePos.x, adjustedFirePos.y, adjustedFireDir.x, adjustedFireDir.y);

      console.log(`Ball ${i + 1}/${quantity} created at: x=${ball.x}, y=${ball.y} with velocity: x=${ball.velocityX}, y=${ball.velocityY}`);

      // CRITICAL: Set screen bounds immediately so isOutOfBounds() works correctly
      ball.resize(this.screenWidth, this.screenHeight);
      
      this.balls.push(ball);
      this.addChild(ball);
    }
    
    console.log(`${quantity} balls added. Total active balls: ${this.balls.length}`);
    console.log(`Ball color: #${ballColor.toString(16)}`);
  }

  private createBricks(): void {
    const rows = 8; // Reduced from 10 to 8
    const cols = 8; // Reduced from 10 to 8
    const brickSpacing = 85; // Increased to be larger than brick width (80px)
    const rowSpacing = 35; // Slightly increased for better spacing

    // Calculate center of the grid
    const centerRow = (rows - 1) / 2;
    const centerCol = (cols - 1) / 2;
    const maxDistance = Math.sqrt(
      centerRow * centerRow + centerCol * centerCol,
    );

    // Define multipliers and colors for different distance ranges (from center to outside)
    const multiplierRings = [
      { multiplier: 5000, color: 0xff0000 }, // Red - 5000x (center)
      { multiplier: 1000, color: 0xff6600 }, // Red-Orange - 1000x
      { multiplier: 500, color: 0xff9900 }, // Orange - 500x
      { multiplier: 100, color: 0xffcc00 }, // Yellow-Orange - 100x
      { multiplier: 50, color: 0xffff00 }, // Yellow - 50x
      { multiplier: 10, color: 0x99ff00 }, // Yellow-Green - 10x
      { multiplier: 5, color: 0x00ff00 }, // Green - 5x
      { multiplier: 2, color: 0x00ff99 }, // Cyan-Green - 2x
      { multiplier: 0.5, color: 0x0099ff }, // Blue-Cyan - 0.5x
      { multiplier: 0.1, color: 0x0066ff }, // Blue - 0.1x (outer border)
    ];

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        // Calculate distance from center
        const distanceFromCenter = Math.sqrt(
          Math.pow(row - centerRow, 2) + Math.pow(col - centerCol, 2),
        );

        // Normalize distance to 0-1 range
        const normalizedDistance = distanceFromCenter / maxDistance;

        // Map distance to multiplier ring index
        const ringIndex = Math.min(
          Math.floor(normalizedDistance * multiplierRings.length),
          multiplierRings.length - 1,
        );

        const ring = multiplierRings[ringIndex];
        const brick = new Brick(ring.color, ring.multiplier);

        // Position bricks in a grid - moved closer to top
        brick.x = (col - cols / 2 + 0.5) * brickSpacing;
        brick.y = (row - rows / 2) * rowSpacing - 250; // Moved higher up

        this.bricks.push(brick);
        this.addChild(brick);
      }
    }
  }

  private checkDividingWallCollision(ball: Ball): boolean {
    // Check if ball hits the dividing wall in the center
    const wallThickness = 8;
    const wallHeight = this.screenHeight - 100;
    
    // Wall bounds (centered at x=0)
    const wallLeft = -wallThickness / 2;
    const wallRight = wallThickness / 2;
    const wallTop = -wallHeight / 2;
    const wallBottom = wallHeight / 2;
    
    // Ball bounds
    const ballLeft = ball.x - ball.radius;
    const ballRight = ball.x + ball.radius;
    const ballTop = ball.y - ball.radius;
    const ballBottom = ball.y + ball.radius;
    
    // Check collision
    if (ballRight >= wallLeft && ballLeft <= wallRight && 
        ballBottom >= wallTop && ballTop <= wallBottom) {
      
      // Determine which side of the wall was hit and bounce accordingly
      if (ball.velocityX > 0 && ball.x < 0) {
        // Ball moving right, hit left side of wall
        ball.velocityX = -Math.abs(ball.velocityX);
      } else if (ball.velocityX < 0 && ball.x > 0) {
        // Ball moving left, hit right side of wall
        ball.velocityX = Math.abs(ball.velocityX);
      }
      
      console.log("Ball bounced off dividing wall");
      return true;
    }
    
    return false;
  }

  public update(): void {
    if (this.gameState !== "playing") return;

    // Handle instruction timer
    if (this.instructionTimer < 180) {
      // Show instructions for 3 seconds (assuming 60fps)
      this.instructionTimer++;
    } else if (
      this.statusText.visible &&
      this.statusText.text.includes("fire buttons")
    ) {
      this.statusText.visible = false;
    }

    // Update game objects (NO PADDLE FOR NOW)
    // this.paddle.update(); // REMOVED - no paddle

    // Update all balls
    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];
      ball.update();

      // Check dividing wall collision first
      this.checkDividingWallCollision(ball);

      // Check cannon collision (ball bounces off cannon like a paddle)
      if (ball.checkCannonCollision(this.cannon)) {
        // Play paddle bounce sound effect
        try {
          engine().audio.sfx.play("main/sounds/sfx-hover.mp3", { volume: 0.6 });
        } catch (error) {
          console.warn("Could not play cannon bounce sound:", error);
        }
        // Ball bounced off cannon - continue with game loop
      }

      // Check paddle collision (SKIP FOR NOW - no paddle)
      /*
      if (ball.checkPaddleCollision(this.paddle)) {
        // Play sound effect here if needed
      }
      */

      // Check brick collisions
      for (const brick of this.bricks) {
        if (!brick.destroyed) {
          const collision = ball.checkBrickCollision(brick);
          if (collision) {
            // Hit the brick - it may or may not be destroyed
            const brickDestroyed = brick.hitBrick();

            // Play sound effects based on result
            if (brickDestroyed) {
              // Brick destroyed - play destruction sound
              try {
                engine().audio.sfx.play("main/sounds/sfx-press.mp3", { volume: 0.4 });
              } catch (error) {
                console.warn("Could not play brick destruction sound:", error);
              }
            } else {
              // Brick hit but not destroyed - play hit sound
              try {
                engine().audio.sfx.play("main/sounds/sfx-hover.mp3", { volume: 0.3 });
              } catch (error) {
                console.warn("Could not play brick hit sound:", error);
              }
            }

            // Only award points if the brick is completely destroyed
            if (brickDestroyed) {
              // Calculate balance bonus using brick multiplier
              const baseBonus = 10;
              const multipliedBonus = Math.round(baseBonus * brick.multiplier);
              this.balance += multipliedBonus;
              this.updateBalanceText();
            }

            // Bounce ball based on collision side
            if (collision === "top" || collision === "bottom") {
              ball.velocityY = -ball.velocityY;
            } else {
              ball.velocityX = -ball.velocityX;
            }

            // Check if all bricks are destroyed
            if (this.bricks.every((b) => b.destroyed)) {
              this.gameState = "levelComplete";
              this.statusText.text = "Level Complete!\nClick to continue";
              this.statusText.visible = true;
            }
            break; // Only handle one collision per frame
          }
        }
      }

      // Check if ball is out of bounds
      if (ball.isOutOfBounds()) {
        // Remove ball from game
        this.removeChild(ball);
        this.balls.splice(i, 1);

        // If no balls left, end the round and allow new shots
        if (this.balls.length === 0) {
          this.endRound();
        }
      }
    }
  }

  private endRound(): void {
    // Reset round tracking
    this.roundActive = false;
    this.shotsFiredThisRound = { left: false, right: false };
    
    console.log("🏁 Round ended. Ready for new shots.");
    
    // Update status text
    this.statusText.text = "Round complete! Fire cannons for next round.";
    this.statusText.visible = true;
    
    // Hide status text after a delay
    setTimeout(() => {
      if (this.statusText.visible && this.statusText.text.includes("Round complete")) {
        this.statusText.visible = false;
      }
    }, 2000);
  }

  private resetBall(): void {
    // Clear any existing balls
    for (const ball of this.balls) {
      this.removeChild(ball);
    }
    this.balls = [];

    // Create a new ball in the center above the paddle (white/neutral color)
    const ball = new Ball(); // Uses default white color
    ball.reset(0, 100); // Reset ball position above paddle
    this.addChild(ball);
    this.balls.push(ball);

    // Show instruction text
    this.statusText.text = "Use the fire buttons to shoot balls!";
    this.statusText.visible = true;
    this.instructionTimer = 0;
  }

  private updateBalanceText(): void {
    this.balanceText.text = `Balance: $${this.balance}`;
  }

  public getBalance(): number {
    return this.balance;
  }

  public setBalance(newBalance: number): void {
    this.balance = newBalance;
    this.updateBalanceText();
  }

  public restart(): void {
    this.balance = 1000; // Reset balance
    this.gameState = "playing";
    this.instructionTimer = 0;

    // Reset UI
    this.updateBalanceText();
    this.statusText.text = "Fire cannons to launch balls!";
    this.statusText.visible = true;

    // Reset ball
    this.resetBall();

    // Reset bricks
    for (const brick of this.bricks) {
      this.removeChild(brick);
    }
    this.bricks = [];
    this.createBricks();
  }

  public resize(width: number, height: number): void {
    // Store current screen dimensions
    this.screenWidth = width;
    this.screenHeight = height;

    // Draw dark green background to cover the full screen
    if (this.background) {
      this.background.clear();
      this.background
        .rect(-width / 2, -height / 2, width, height)
        .fill(0x0d4a2d); // Dark green color
    }

    // Draw border around the play area
    if (this.border) {
      this.border.clear();
      
      // Draw outer border (thick decorative border)
      this.border
        .rect(-width / 2, -height / 2, width, height)
        .stroke({ width: 8, color: 0x444444 }); // Dark gray border
      
      // Draw inner border (play area boundary)
      const playAreaMargin = 20;
      this.border
        .rect(
          -width / 2 + playAreaMargin, 
          -height / 2 + playAreaMargin, 
          width - playAreaMargin * 2, 
          height - playAreaMargin * 2
        )
        .stroke({ width: 4, color: 0x888888 }); // Lighter gray inner border
    }

    // Draw dividing wall in the middle
    if (this.dividingWall) {
      this.dividingWall.clear();
      
      // Draw vertical wall from top to bottom in the center
      const wallThickness = 8;
      const wallHeight = height - 100; // Leave some space at top and bottom
      
      this.dividingWall
        .rect(
          -wallThickness / 2, // Center the wall
          -wallHeight / 2,    // Center vertically
          wallThickness,
          wallHeight
        )
        .fill(0x666666); // Gray wall color
        
      console.log("Dividing wall drawn at center with thickness:", wallThickness);
    }

    // Resize all balls
    for (const ball of this.balls) {
      ball.resize(width, height);
    }

    // Position UI elements
    this.balanceText.x = -width / 2 + 20;
    this.balanceText.y = -height / 2 + 20;

    this.statusText.x = 0;
    this.statusText.y = 0;

    // Position ONLY cannon - MOVED DOWN 75px from original position (was 150px, now up by 75px)
    const originalCannonY = height / 2 - 150; // Original position above UI panel
    const cannonY = originalCannonY + 75; // Move cannon down by only 75px (was 150px)

    // Single cannon - CENTER BOTTOM (moved down 75px from original)
    this.cannon.x = 0;
    this.cannon.y = cannonY;
    
    // Store the original firing position for the cannon to use
    this.cannon.setOriginalFiringPosition(0, originalCannonY);

    console.log("Cannon position (MOVED DOWN):", {
      cannon: { x: this.cannon.x, y: this.cannon.y },
      originalFiring: { x: 0, y: originalCannonY },
      screenSize: { width, height },
    });

    // Reset ball if game just started
    if (this.balls.length === 0) {
      this.resetBall();
    }
  }

  public handleClick(): void {
    if (this.gameState === "gameOver" || this.gameState === "levelComplete") {
      this.restart();
    }
  }
}
