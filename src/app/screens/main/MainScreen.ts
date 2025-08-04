import { animate } from "motion";
import type { Ticker } from "pixi.js";
import { Container, Graphics } from "pixi.js";

import { engine } from "../../getEngine";

import { BrickBreakerGame } from "./BrickBreakerGame";
import { GameUIPanel } from "./GameUIPanel";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public mainContainer: Container;
  private game: BrickBreakerGame;
  private uiPanel: GameUIPanel;
  private gameBorder: Graphics;
  private paused = false;

  constructor() {
    super();

    this.mainContainer = new Container();
    this.addChild(this.mainContainer);
    this.game = new BrickBreakerGame();
    
    // Add the game to the main container immediately
    this.mainContainer.addChild(this.game);

    // Create game border
    this.gameBorder = new Graphics();
    this.createGameBorder();
    this.addChild(this.gameBorder);

    // Create UI panel
    this.uiPanel = new GameUIPanel();
    this.addChild(this.uiPanel);

    // Connect UI panel events to game actions
    this.uiPanel.onRedFire = () => {
      console.log("MainScreen: Red fire callback triggered");
      const quantity = this.uiPanel.getSelectedQuantity();
      this.game.fireCannon("left", quantity);
    };

    this.uiPanel.onBlueFire = () => {
      console.log("MainScreen: Blue fire callback triggered");
      const quantity = this.uiPanel.getSelectedQuantity();
      this.game.fireCannon("right", quantity);
    };

    // Sync initial balance
    this.uiPanel.updateBalance(this.game.getBalance());

    // Make the game container clickable for restarts
    this.mainContainer.eventMode = "static";
    this.mainContainer.on("pointerdown", () => {
      this.game.handleClick();
    });
  }

  private createGameBorder(): void {
    // Create a border around the game area
    this.gameBorder.clear();
    this.gameBorder.lineStyle(4, 0x666666, 1); // 4px thick gray border
    
    // Draw border rectangle - will be resized in resize method
    this.gameBorder.drawRect(-400, -300, 800, 600);
  }

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    if (this.paused) return;
    this.game.update();

    // Keep UI panel balance in sync with game balance
    this.uiPanel.updateBalance(this.game.getBalance());
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.mainContainer.interactiveChildren = false;
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.mainContainer.interactiveChildren = true;
    this.paused = false;
  }

  /** Fully reset */
  public reset() {}

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    // Calculate game area dimensions (leave space for UI panel)
    const baseGameWidth = width - 350; // Leave space for UI panel on right
    const gameWidth = baseGameWidth * 0.7; // Reduce game canvas width by 30%
    const gameHeight = height - 40; // Leave some margin top/bottom
    
    this.mainContainer.x = centerX - 175; // Offset left to account for UI panel
    this.mainContainer.y = centerY;

    // Update game border
    this.gameBorder.clear();
    this.gameBorder.lineStyle(4, 0x666666, 1);
    this.gameBorder.drawRect(
      this.mainContainer.x - gameWidth / 2,
      this.mainContainer.y - gameHeight / 2,
      gameWidth,
      gameHeight
    );

    // Resize UI panel but don't position it (buttons are now in the control panel)
    this.uiPanel.resize(width, height);
    
    // Hide the GameUIPanel since buttons are now integrated into the control panel
    this.uiPanel.visible = false;

    this.game.resize(gameWidth, gameHeight);
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    // Animate UI panel
    this.uiPanel.alpha = 0;
    const finalPromise = animate(
      this.uiPanel,
      { alpha: 1 },
      { duration: 0.3, delay: 0.75, ease: "backOut" },
    );

    await finalPromise;

    // Game is already added to main container in constructor
  }

  /** Hide screen with animations */
  public async hide() {}

  /** Auto pause the app when window go out of focus */
  public blur() {
    // No popup needed - just pause the game
    this.pause();
  }
}
