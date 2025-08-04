import { Container, Text, Graphics, Ticker } from "pixi.js";
import { FancyButton } from "@pixi/ui";
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
  private gameTime = 0; // Track total game time for trajectory variation
  
  // Side win modals (outside game area)
  private leftSideWinModal!: Graphics;
  private rightSideWinModal!: Graphics;
  private leftSideWinContainer!: Container;
  private rightSideWinContainer!: Container;
  private leftSideWinEntries: Container[] = [];
  private rightSideWinEntries: Container[] = [];
  private leftSideCurrentWinnings = 0;
  private rightSideCurrentWinnings = 0;

  // Right side control panel
  private rightControlPanel!: Graphics;
  private rightControlContainer!: Container;
  
  // Control panel buttons
  private redFireButton!: FancyButton;
  private blueFireButton!: FancyButton;
  private redFireText!: Text;
  private blueFireText!: Text;
  private shot5Button!: FancyButton;
  private shot10Button!: FancyButton;
  private shot25Button!: FancyButton;
  private shotQuantityText!: Text;
  private selectedQuantity = 5; // Default to 5 shots

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
    
    // Add ticker for game time tracking
    Ticker.shared.add(this.updateGameTime, this);
  }
  
  private updateGameTime(ticker: Ticker): void {
    this.gameTime += ticker.deltaTime;
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
    
    // Create side win modals
    this.createSideWinModals();
    
    // Create right control panel
    this.createRightControlPanel();
    
    console.log("Dark green background, border, dividing wall, side win modals, and right control panel created");
  }

  private createSideWinModals(): void {
    // Create left side win modal
    this.leftSideWinModal = new Graphics();
    this.addChild(this.leftSideWinModal);
    
    this.leftSideWinContainer = new Container();
    this.addChild(this.leftSideWinContainer);
    
    // Left side title
    const leftTitle = new Text("LEFT WINS", {
      fontSize: 18,
      fill: 0xff0000, // Red for left side
      fontWeight: "bold",
      align: "center",
    });
    leftTitle.anchor.set(0.5, 0);
    leftTitle.x = 0;
    leftTitle.y = 10;
    this.leftSideWinContainer.addChild(leftTitle);
    
    // Left side total
    const leftTotal = new Text("Total: $0.00", {
      fontSize: 14,
      fill: 0x00ff00, // Green for money
      fontWeight: "bold",
      align: "center",
    });
    leftTotal.anchor.set(0.5, 0);
    leftTotal.x = 0;
    leftTotal.y = 35;
    this.leftSideWinContainer.addChild(leftTotal);
    
    // Create right side win modal
    this.rightSideWinModal = new Graphics();
    this.addChild(this.rightSideWinModal);
    
    this.rightSideWinContainer = new Container();
    this.addChild(this.rightSideWinContainer);
    
    // Right side title
    const rightTitle = new Text("RIGHT WINS", {
      fontSize: 18,
      fill: 0x0066ff, // Blue for right side
      fontWeight: "bold",
      align: "center",
    });
    rightTitle.anchor.set(0.5, 0);
    rightTitle.x = 0;
    rightTitle.y = 10;
    this.rightSideWinContainer.addChild(rightTitle);
    
    // Right side total
    const rightTotal = new Text("Total: $0.00", {
      fontSize: 14,
      fill: 0x00ff00, // Green for money
      fontWeight: "bold",
      align: "center",
    });
    rightTotal.anchor.set(0.5, 0);
    rightTotal.x = 0;
    rightTotal.y = 35;
    this.rightSideWinContainer.addChild(rightTotal);
    
    console.log("Side win modals created");
  }

  private createRightControlPanel(): void {
    // Create right control panel background
    this.rightControlPanel = new Graphics();
    this.addChild(this.rightControlPanel);
    
    // Create container for control panel content
    this.rightControlContainer = new Container();
    this.addChild(this.rightControlContainer);
    
    // Add panel title
    const panelTitle = new Text("CONTROLS", {
      fontSize: 16,
      fill: 0xffffff, // White text
      fontWeight: "bold",
      align: "center",
    });
    panelTitle.anchor.set(0.5, 0);
    panelTitle.x = 0;
    panelTitle.y = 20;
    this.rightControlContainer.addChild(panelTitle);
    
    // Create the buttons directly in the control panel
    this.createControlPanelButtons();
    
    console.log("Right control panel created with integrated buttons");
  }

  private createControlPanelButtons(): void {
    // Create shot quantity section
    this.shotQuantityText = new Text("Shot Quantity", {
      fontSize: 14,
      fill: 0xffffff,
      fontWeight: "bold",
      align: "center",
    });
    this.shotQuantityText.anchor.set(0.5, 0);
    this.shotQuantityText.x = 0;
    this.shotQuantityText.y = 60;
    this.rightControlContainer.addChild(this.shotQuantityText);

    // Create quantity buttons (5, 10, 25) - adjusted positions for wider panel
    this.createQuantityButton(5, -80, 90);
    this.createQuantityButton(10, 0, 90);
    this.createQuantityButton(25, 80, 90);

    // Create fire buttons
    this.createControlFireButtons();
  }

  private createQuantityButton(quantity: number, x: number, y: number): void {
    const isSelected = quantity === this.selectedQuantity;
    const buttonColor = isSelected ? 0x00ff00 : 0x666666;
    
    const defaultView = new Graphics()
      .roundRect(0, 0, 40, 30, 5)
      .fill(buttonColor)
      .stroke({ width: 2, color: 0xffffff });

    const hoverView = new Graphics()
      .roundRect(0, 0, 40, 30, 5)
      .fill(isSelected ? 0x44ff44 : 0x888888)
      .stroke({ width: 2, color: 0xffffff });

    const button = new FancyButton({
      defaultView: defaultView,
      hoverView: hoverView,
    });

    button.onPress.connect(() => {
      this.selectedQuantity = quantity;
      this.updateQuantityButtons();
      console.log(`Selected quantity: ${quantity}`);
    });

    button.x = x;
    button.y = y;

    // Add text
    const text = new Text(quantity.toString(), {
      fontSize: 12,
      fill: 0x000000,
      fontWeight: "bold",
    });
    text.anchor.set(0.5);
    text.x = 20;
    text.y = 15;

    this.rightControlContainer.addChild(button);
    this.rightControlContainer.addChild(text);

    // Store references
    if (quantity === 5) this.shot5Button = button;
    else if (quantity === 10) this.shot10Button = button;
    else if (quantity === 25) this.shot25Button = button;
  }

  private updateQuantityButtons(): void {
    this.updateSingleQuantityButton(this.shot5Button, 5);
    this.updateSingleQuantityButton(this.shot10Button, 10);
    this.updateSingleQuantityButton(this.shot25Button, 25);
  }

  private updateSingleQuantityButton(button: FancyButton, quantity: number): void {
    const isSelected = quantity === this.selectedQuantity;
    const buttonColor = isSelected ? 0x00ff00 : 0x666666;
    
    const defaultView = new Graphics()
      .roundRect(0, 0, 40, 30, 5)
      .fill(buttonColor)
      .stroke({ width: 2, color: 0xffffff });

    button.defaultView = defaultView;
  }

  private createControlFireButtons(): void {
    // Red fire button
    const redButtonOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0xff0000 });

    const redSweepBackground = new Graphics()
      .rect(-50, 0, 0, 50)
      .fill(0xff0000);
    redSweepBackground.skew.x = Math.PI / 4;

    const redDefaultView = new Container();
    redDefaultView.addChild(redSweepBackground.clone());
    redDefaultView.addChild(redButtonOutline);

    const redHoverView = new Container();
    const redHoverSweep = redSweepBackground.clone();
    redHoverSweep.width = 300;
    redHoverView.addChild(redHoverSweep);
    redHoverView.addChild(new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0xff4444 }));

    this.redFireButton = new FancyButton({
      defaultView: redDefaultView,
      hoverView: redHoverView,
      animations: {
        hover: {
          props: { scale: { x: 1.1, y: 1.1 } },
          duration: 1000,
        },
      },
    });

    this.redFireButton.onPress.connect(() => {
      console.log("Red fire button pressed!");
      this.fireCannon("left", this.selectedQuantity);
    });

    this.redFireButton.onHover.connect(() => {
      this.redFireText.style.fill = 0xffffff;
    });
    
    this.redFireButton.onOut.connect(() => {
      this.redFireText.style.fill = 0xff0000;
    });

    this.redFireButton.x = -60;
    this.redFireButton.y = 150;
    this.rightControlContainer.addChild(this.redFireButton);

    this.redFireText = new Text("FIRE", {
      fontSize: 15,
      fill: 0xff0000,
      fontWeight: "bold",
    });
    this.redFireText.anchor.set(0.5);
    this.redFireText.x = 0;
    this.redFireText.y = 175;
    this.rightControlContainer.addChild(this.redFireText);

    // Blue fire button
    const blueButtonOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0x0066ff });

    const blueSweepBackground = new Graphics()
      .rect(-50, 0, 0, 50)
      .fill(0x0066ff);
    blueSweepBackground.skew.x = Math.PI / 4;

    const blueDefaultView = new Container();
    blueDefaultView.addChild(blueSweepBackground.clone());
    blueDefaultView.addChild(blueButtonOutline);

    const blueHoverView = new Container();
    const blueHoverSweep = blueSweepBackground.clone();
    blueHoverSweep.width = 300;
    blueHoverView.addChild(blueHoverSweep);
    blueHoverView.addChild(new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0x4488ff }));

    this.blueFireButton = new FancyButton({
      defaultView: blueDefaultView,
      hoverView: blueHoverView,
      animations: {
        hover: {
          props: { scale: { x: 1.1, y: 1.1 } },
          duration: 1000,
        },
      },
    });

    this.blueFireButton.onPress.connect(() => {
      console.log("Blue fire button pressed!");
      this.fireCannon("right", this.selectedQuantity);
    });

    this.blueFireButton.onHover.connect(() => {
      this.blueFireText.style.fill = 0xffffff;
    });
    
    this.blueFireButton.onOut.connect(() => {
      this.blueFireText.style.fill = 0x0066ff;
    });

    this.blueFireButton.x = -60;
    this.blueFireButton.y = 220;
    this.rightControlContainer.addChild(this.blueFireButton);

    this.blueFireText = new Text("FIRE", {
      fontSize: 15,
      fill: 0x0066ff,
      fontWeight: "bold",
    });
    this.blueFireText.anchor.set(0.5);
    this.blueFireText.x = 0;
    this.blueFireText.y = 245;
    this.rightControlContainer.addChild(this.blueFireText);
  }

  private showSideWinModal(side: "left" | "right"): void {
    // Clear previous entries for the specified side
    if (side === "left") {
      this.leftSideWinEntries.forEach(entry => {
        this.leftSideWinContainer.removeChild(entry);
      });
      this.leftSideWinEntries = [];
      this.leftSideCurrentWinnings = 0;
    } else {
      this.rightSideWinEntries.forEach(entry => {
        this.rightSideWinContainer.removeChild(entry);
      });
      this.rightSideWinEntries = [];
      this.rightSideCurrentWinnings = 0;
    }
    
    // Update the total display
    this.updateSideWinTotal(side);
    
    console.log(`${side} side win modal activated`);
  }

  private addSideWinEntry(side: "left" | "right", multiplier: number): void {
    // Calculate win amount
    const baseAmount = 10;
    const winAmount = Math.round(baseAmount * multiplier);
    
    // Update current winnings for the side
    if (side === "left") {
      this.leftSideCurrentWinnings += winAmount;
    } else {
      this.rightSideCurrentWinnings += winAmount;
    }
    
    // Create win entry container
    const winEntry = new Container();
    
    // Determine color based on side
    const sideColor = side === "left" ? 0xff6666 : 0x6666ff;
    
    // Create tile info text
    const tileText = new Text(`${multiplier}x`, {
      fontSize: 12,
      fill: sideColor,
      fontWeight: "bold",
    });
    tileText.x = 5;
    tileText.y = 0;
    winEntry.addChild(tileText);
    
    // Create win amount text
    const winText = new Text(`+$${winAmount}`, {
      fontSize: 12,
      fill: 0x00ff00, // Green for money
      fontWeight: "bold",
    });
    winText.x = 80;
    winText.y = 0;
    winEntry.addChild(winText);
    
    // Add to appropriate side
    if (side === "left") {
      this.leftSideWinEntries.push(winEntry);
      this.leftSideWinContainer.addChild(winEntry);
    } else {
      this.rightSideWinEntries.push(winEntry);
      this.rightSideWinContainer.addChild(winEntry);
    }
    
    // Update positions and total
    this.updateSideWinPositions(side);
    this.updateSideWinTotal(side);
    
    console.log(`Added ${side} side win entry: ${multiplier}x = $${winAmount}`);
  }

  private updateSideWinPositions(side: "left" | "right"): void {
    const entries = side === "left" ? this.leftSideWinEntries : this.rightSideWinEntries;
    let yPosition = 60; // Start below title and total
    
    // Show most recent entries at the top
    for (let i = entries.length - 1; i >= 0; i--) {
      const entry = entries[i];
      entry.y = yPosition;
      yPosition += 18; // Spacing between entries
    }
  }

  private updateSideWinTotal(side: "left" | "right"): void {
    const container = side === "left" ? this.leftSideWinContainer : this.rightSideWinContainer;
    const winnings = side === "left" ? this.leftSideCurrentWinnings : this.rightSideCurrentWinnings;
    
    // Find and update the total text (it's the second child)
    const totalText = container.children[1] as Text;
    if (totalText) {
      totalText.text = `Total: $${winnings.toFixed(2)}`;
    }
  }

  private positionSideWinModals(width: number, height: number): void {
    const modalWidth = 150;
    const modalHeight = 400;
    
    // Calculate the green game area bounds (based on the border margins)
    const playAreaMargin = 20;
    const gameAreaLeft = -width / 2 + playAreaMargin;
    const gameAreaRight = width / 2 - playAreaMargin;
    const gameAreaTop = -height / 2 + playAreaMargin;
    
    // Position left side modal completely outside the green area (to the left)
    const leftModalX = gameAreaLeft - modalWidth - 20; // 20px gap from green area
    const leftModalY = gameAreaTop;
    
    if (this.leftSideWinModal) {
      this.leftSideWinModal.clear();
      this.leftSideWinModal
        .rect(0, 0, modalWidth, modalHeight)
        .fill(0x000000, 0.8) // Semi-transparent black
        .stroke({ width: 2, color: 0xff0000 }); // Red border for left side
      
      this.leftSideWinModal.x = leftModalX;
      this.leftSideWinModal.y = leftModalY;
    }
    
    if (this.leftSideWinContainer) {
      this.leftSideWinContainer.x = leftModalX + modalWidth / 2; // Center in modal
      this.leftSideWinContainer.y = leftModalY;
    }
    
    // Position right side modal completely outside the green area (to the right)
    const rightModalX = gameAreaRight + 20; // 20px gap from green area
    const rightModalY = gameAreaTop;
    
    if (this.rightSideWinModal) {
      this.rightSideWinModal.clear();
      this.rightSideWinModal
        .rect(0, 0, modalWidth, modalHeight)
        .fill(0x000000, 0.8) // Semi-transparent black
        .stroke({ width: 2, color: 0x0066ff }); // Blue border for right side
      
      this.rightSideWinModal.x = rightModalX;
      this.rightSideWinModal.y = rightModalY;
    }
    
    if (this.rightSideWinContainer) {
      this.rightSideWinContainer.x = rightModalX + modalWidth / 2; // Center in modal
      this.rightSideWinContainer.y = rightModalY;
    }
    
    console.log("Side win modals positioned completely outside green game area");
  }

  private positionRightControlPanel(width: number, height: number): void {
    const panelWidth = 300; // Increased from 200 to 300
    const panelHeight = height - 40; // Full height minus margins
    
    // Calculate the right win modal position to place control panel further right
    const playAreaMargin = 20;
    const gameAreaRight = width / 2 - playAreaMargin;
    const modalWidth = 150;
    const rightWinModalX = gameAreaRight + 20; // Right win modal position
    
    // Position control panel further to the right of the right win modal
    const panelX = rightWinModalX + modalWidth + 20; // 20px gap from right win modal
    const panelY = -height / 2 + 20; // 20px margin from top (full height)
    
    if (this.rightControlPanel) {
      this.rightControlPanel.clear();
      this.rightControlPanel
        .rect(0, 0, panelWidth, panelHeight)
        .fill(0x2d5a2d, 0.9) // Stake green with slight transparency
        .stroke({ width: 2, color: 0x4a8a4a }); // Lighter green border
      
      this.rightControlPanel.x = panelX;
      this.rightControlPanel.y = panelY;
    }
    
    if (this.rightControlContainer) {
      this.rightControlContainer.x = panelX + panelWidth / 2; // Center in panel
      this.rightControlContainer.y = panelY;
    }
    
    console.log("Right control panel positioned further right of win modal, full height");
  }

  public getControlPanelPosition(): { x: number; y: number; width: number; height: number } {
    // Return the control panel's position and dimensions for the working buttons to use
    if (this.rightControlPanel) {
      return {
        x: this.rightControlPanel.x,
        y: this.rightControlPanel.y,
        width: 300, // Updated panel width
        height: this.screenHeight - 40 // Panel height
      };
    }
    // Fallback if panel doesn't exist yet
    return { x: 0, y: 0, width: 300, height: 600 };
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

    // Show side win modal for the firing side
    this.showSideWinModal(side);

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
      
      // Add time-based trajectory variation for unpredictability
      const timeVariation = Math.sin(this.gameTime * 0.001) * 0.5; // Slow oscillation based on game time
      const randomVariation = (Math.random() - 0.5) * 0.3; // Random component
      
      // Add slight variations to position and direction for multiple balls
      const angleVariation = (i - (quantity - 1) / 2) * 0.2 + timeVariation + randomVariation;
      const positionOffset = (i - (quantity - 1) / 2) * 5; // Slight horizontal offset
      
      const adjustedFirePos = {
        x: firePos.x + positionOffset,
        y: firePos.y
      };
      
      // Enhanced trajectory variation with time-based and random components
      const adjustedFireDir = {
        x: fireDir.x + Math.sin(angleVariation) * 2 + Math.cos(this.gameTime * 0.002) * 0.3,
        y: fireDir.y + Math.cos(angleVariation) * 0.5 + Math.sin(this.gameTime * 0.0015) * 0.2
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
    const wallTop = -this.screenHeight / 2; // From the very top
    const wallBottom = this.screenHeight / 2 - 80; // Stop 80px from bottom (above cannon area)
    
    // Wall bounds (centered at x=0)
    const wallLeft = -wallThickness / 2;
    const wallRight = wallThickness / 2;
    
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
              // Determine which side destroyed the brick
              const brickSide = brick.x < 0 ? "left" : "right";
              
              // Add entry to the appropriate side win modal
              this.addSideWinEntry(brickSide, brick.multiplier);
              
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

            // Check if all bricks are destroyed (but don't end level since we auto-reset)
            if (this.bricks.every((b) => b.destroyed)) {
              // All bricks destroyed in this round - award bonus points
              const roundBonus = 1000;
              this.balance += roundBonus;
              this.updateBalanceText();
              console.log(`🎉 All bricks destroyed! Bonus: $${roundBonus}`);
              
              // Show temporary bonus message
              this.statusText.text = `All Bricks Destroyed! Bonus: $${roundBonus}`;
              this.statusText.visible = true;
              setTimeout(() => {
                if (this.statusText.visible && this.statusText.text.includes("Bonus")) {
                  this.statusText.visible = false;
                }
              }, 3000);
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
    
    console.log("🏁 Round ended. Resetting board for next round.");
    
    // Reset the entire board - restore all bricks to full health
    this.resetBoard();
    
    // Update status text
    this.statusText.text = "Round complete! Board reset. Fire cannons for next round.";
    this.statusText.visible = true;
    
    // Hide status text after a delay
    setTimeout(() => {
      if (this.statusText.visible && this.statusText.text.includes("Round complete")) {
        this.statusText.visible = false;
      }
    }, 2000);
  }

  private resetBoard(): void {
    console.log("🔄 Resetting board - restoring all bricks to full health");
    
    // Reset all existing bricks to full health
    for (const brick of this.bricks) {
      brick.resetBrick();
    }
    
    console.log(`✅ Board reset complete. ${this.bricks.length} bricks restored.`);
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
      
      // Draw vertical wall from top to just above cannon area
      const wallThickness = 8;
      const wallTop = -height / 2; // Start from the very top
      const wallBottom = height / 2 - 80; // Stop 80px from bottom (above cannon area)
      const wallHeight = wallBottom - wallTop;
      
      this.dividingWall
        .rect(
          -wallThickness / 2, // Center the wall
          wallTop,           // Start from top
          wallThickness,
          wallHeight
        )
        .fill(0x666666); // Gray wall color
        
      console.log("Dividing wall drawn from top to cannon area, height:", wallHeight);
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

    // Position side win modals outside the game area
    this.positionSideWinModals(width, height);

    // Position right control panel
    this.positionRightControlPanel(width, height);

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
