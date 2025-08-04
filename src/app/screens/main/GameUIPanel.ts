import { Container, Graphics, Text } from "pixi.js";
import { FancyButton } from "@pixi/ui";

export class GameUIPanel extends Container {
  private redFireButton!: FancyButton;
  private blueFireButton!: FancyButton;
  private redFireText!: Text;
  private blueFireText!: Text;
  
  // Shot quantity buttons
  private shot5Button!: FancyButton;
  private shot10Button!: FancyButton;
  private shot25Button!: FancyButton;
  private shotQuantityText!: Text;
  private selectedQuantity = 5; // Default to 5 shots

  public onRedFire?: () => void;
  public onBlueFire?: () => void;
  public onMenuPress?: () => void;

  constructor() {
    super();
    this.createShotQuantityButtons();
    this.createRedFireButton();
    this.createBlueFireButton();
  }

  private createRedFireButton(): void {
    // Create the main button outline (always visible)
    const buttonOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0xff0000 });

    // Create the diagonal sweep background (starts with width 0)
    const sweepBackground = new Graphics()
      .rect(-50, 0, 0, 50) // Start with width 0
      .fill(0xff0000);
    
    // Apply skew transform (45 degrees)
    sweepBackground.skew.x = Math.PI / 4; // 45 degrees in radians

    // Default view - no mask to avoid warnings
    const defaultView = new Container();
    const defaultSweep = sweepBackground.clone();
    defaultView.addChild(defaultSweep);
    defaultView.addChild(buttonOutline);

    // Hover view - sweep expands to fill button
    const hoverView = new Container();
    const hoverSweep = sweepBackground.clone();
    hoverSweep.width = 300; // 250% width like CSS
    hoverView.addChild(hoverSweep);
    
    // Hover outline with lighter color and shadow effect
    const hoverOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0xff4444 }); // Lighter red
    
    hoverView.addChild(hoverOutline);

    // Pressed view (similar to hover but slightly smaller scale)
    const pressedView = new Container();
    const pressedSweep = sweepBackground.clone();
    pressedSweep.width = 300;
    hoverView.addChild(pressedSweep);
    
    const pressedOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0xff4444 });
    
    pressedView.addChild(pressedSweep);
    pressedView.addChild(pressedOutline);

    this.redFireButton = new FancyButton({
      defaultView: defaultView,
      hoverView: hoverView,
      pressedView: pressedView,
      animations: {
        hover: {
          props: {
            scale: { x: 1.1, y: 1.1 }, // Scale up like CSS transform: scale(1.1)
          },
          duration: 1000, // 1000ms like CSS
        },
        pressed: {
          props: {
            scale: { x: 1.05, y: 1.05 },
          },
          duration: 100,
        },
      },
    });

    this.redFireButton.onPress.connect(() => {
      console.log("Red fire button pressed!");
      console.log("onRedFire callback exists:", !!this.onRedFire);
      if (this.onRedFire) {
        console.log("Calling onRedFire callback");
        this.onRedFire();
      } else {
        console.log("No onRedFire callback set!");
      }
    });

    // Add hover listeners to change text color
    this.redFireButton.onHover.connect(() => {
      this.redFireText.style.fill = 0xffffff; // White on hover
    });
    
    this.redFireButton.onOut.connect(() => {
      this.redFireText.style.fill = 0xff0000; // Back to red
    });

    // Position the button
    this.redFireButton.x = -130; // Move left for side-by-side layout
    this.redFireButton.y = 0; // Center vertically
    this.addChild(this.redFireButton);

    // Create text with letter spacing effect
    this.redFireText = new Text({
      text: 'FIRE',
      style: {
        fontFamily: 'Arial',
        fontSize: 15,
        fill: 0xff0000, // Red initially
        fontWeight: 'bold',
        letterSpacing: 3, // Letter spacing like CSS
      }
    });
    this.redFireText.anchor.set(0.5);
    this.redFireText.x = -70; // Center on red button
    this.redFireText.y = 25; // Center on red button
    this.addChild(this.redFireText);
  }

  private createBlueFireButton(): void {
    // Create the main button outline (always visible)
    const buttonOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0x0066ff });

    // Create the diagonal sweep background (starts with width 0)
    const sweepBackground = new Graphics()
      .rect(-50, 0, 0, 50) // Start with width 0
      .fill(0x0066ff);
    
    // Apply skew transform (45 degrees)
    sweepBackground.skew.x = Math.PI / 4; // 45 degrees in radians

    // Default view - no mask to avoid warnings (same as red button)
    const defaultView = new Container();
    const defaultSweep = sweepBackground.clone();
    defaultView.addChild(defaultSweep);
    defaultView.addChild(buttonOutline);

    // Hover view - sweep expands to fill button
    const hoverView = new Container();
    const hoverSweep = sweepBackground.clone();
    hoverSweep.width = 300; // 250% width like CSS
    hoverView.addChild(hoverSweep);
    
    // Hover outline with lighter color
    const hoverOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0x4488ff }); // Lighter blue
    
    hoverView.addChild(hoverOutline);

    // Pressed view (similar to hover but slightly smaller scale)
    const pressedView = new Container();
    const pressedSweep = sweepBackground.clone();
    pressedSweep.width = 300;
    
    const pressedOutline = new Graphics()
      .roundRect(0, 0, 120, 50, 5)
      .stroke({ width: 2, color: 0x4488ff });
    
    pressedView.addChild(pressedSweep);
    pressedView.addChild(pressedOutline);

    this.blueFireButton = new FancyButton({
      defaultView: defaultView,
      hoverView: hoverView,
      pressedView: pressedView,
      animations: {
        hover: {
          props: {
            scale: { x: 1.1, y: 1.1 }, // Scale up like CSS
          },
          duration: 1000, // 1000ms like CSS
        },
        pressed: {
          props: {
            scale: { x: 1.05, y: 1.05 },
          },
          duration: 100,
        },
      },
    });

    this.blueFireButton.onPress.connect(() => {
      console.log("Blue fire button pressed!");
      console.log("onBlueFire callback exists:", !!this.onBlueFire);
      if (this.onBlueFire) {
        console.log("Calling onBlueFire callback");
        this.onBlueFire();
      } else {
        console.log("No onBlueFire callback set!");
      }
    });

    // Add hover listeners to change text color
    this.blueFireButton.onHover.connect(() => {
      this.blueFireText.style.fill = 0xffffff; // White on hover
    });
    
    this.blueFireButton.onOut.connect(() => {
      this.blueFireText.style.fill = 0x0066ff; // Back to blue
    });

    // Position the button
    this.blueFireButton.x = 10; // Move right for side-by-side layout with gap
    this.blueFireButton.y = 0; // Center vertically, same as red button
    this.addChild(this.blueFireButton);

    // Create text with letter spacing effect
    this.blueFireText = new Text({
      text: 'FIRE',
      style: {
        fontFamily: 'Arial',
        fontSize: 15,
        fill: 0x0066ff, // Blue initially
        fontWeight: 'bold',
        letterSpacing: 3, // Letter spacing like CSS
      }
    });
    this.blueFireText.anchor.set(0.5);
    this.blueFireText.x = 70; // Center on blue button
    this.blueFireText.y = 25; // Center on blue button
    this.addChild(this.blueFireText);
  }

  private createShotQuantityButtons(): void {
    // Create title text
    this.shotQuantityText = new Text({
      text: 'Shot Quantity',
      style: {
        fontFamily: 'Arial',
        fontSize: 14,
        fill: 0xffffff,
        fontWeight: 'bold',
      }
    });
    this.shotQuantityText.anchor.set(0.5);
    this.shotQuantityText.x = 0;
    this.shotQuantityText.y = -100; // Position above fire buttons
    this.addChild(this.shotQuantityText);

    // Create quantity buttons (5, 10, 25)
    this.createQuantityButton(5, -60, -70);
    this.createQuantityButton(10, 0, -70);
    this.createQuantityButton(25, 60, -70);
  }

  private createQuantityButton(quantity: number, x: number, y: number): void {
    // Create simple button
    const isSelected = quantity === this.selectedQuantity;
    const buttonColor = isSelected ? 0x00ff00 : 0x666666; // Green if selected, gray otherwise
    
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
    const text = new Text({
      text: quantity.toString(),
      style: {
        fontFamily: 'Arial',
        fontSize: 12,
        fill: 0x000000,
        fontWeight: 'bold',
      }
    });
    text.anchor.set(0.5);
    text.x = 20; // Center on button
    text.y = 15; // Center on button

    this.addChild(button);
    this.addChild(text);

    // Store references
    if (quantity === 5) this.shot5Button = button;
    else if (quantity === 10) this.shot10Button = button;
    else if (quantity === 25) this.shot25Button = button;
  }

  private updateQuantityButtons(): void {
    // Update button colors based on selection
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

  public getSelectedQuantity(): number {
    return this.selectedQuantity;
  }

  public resize(width: number, height: number): void {
    // Position the panel in the bottom-right corner
    this.x = width - 200;
    this.y = height - 100;
  }

  // Placeholder method to prevent errors
  public updateBalance(_newBalance: number): void {
    // We'll implement this later when we add balance display
    // Removed console.log to prevent spam
  }
}
