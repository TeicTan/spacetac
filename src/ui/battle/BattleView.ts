/// <reference path="../BaseView.ts"/>

module TS.SpaceTac.UI {
    // Interactive view of a Battle
    export class BattleView extends BaseView {

        // Displayed battle
        battle: Battle;

        // Interacting player
        player: Player;

        // UI container
        ui: Phaser.Group;

        // Battleground container
        arena: Arena;

        // Background image
        background: Phaser.Image | null;

        // Targetting mode (null if we're not in this mode)
        targetting: Targetting | null;

        // Ship list
        ship_list: ShipList;

        // Action bar
        action_bar: ActionBar;

        // Currently hovered ship
        ship_hovered: Ship | null;

        // Ship tooltip
        ship_tooltip: ShipTooltip;

        // Character sheet
        character_sheet: CharacterSheet;

        // Subscription to the battle log
        log_processor: LogProcessor;

        // True if player interaction is allowed
        interacting: boolean;

        // Init the view, binding it to a specific battle
        init(player: Player, battle: Battle) {
            super.init();

            this.player = player;
            this.battle = battle;
            this.targetting = null;
            this.ship_hovered = null;
            this.background = null;

            this.battle.timer = this.timer;

            this.log_processor = new LogProcessor(this);
        }

        // Create view graphics
        create() {
            super.create();

            var game = this.game;

            // Background
            game.stage.backgroundColor = 0x000000;
            this.background = new Phaser.Image(game, 0, 0, "battle-background", 0);
            game.add.existing(this.background);

            // Add arena (local map)
            this.arena = new Arena(this);
            game.add.existing(this.arena);

            // Add UI layer
            this.ui = new Phaser.Group(game);
            game.add.existing(this.ui);

            // Add UI elements
            this.action_bar = new ActionBar(this);
            this.ship_list = new ShipList(this);
            this.ship_tooltip = new ShipTooltip(this);
            this.add.existing(this.ship_tooltip);
            this.character_sheet = new CharacterSheet(this, -this.getWidth());
            this.add.existing(this.character_sheet);

            // "Battle" animation
            this.displayFightMessage();

            // BGM
            this.gameui.audio.startMusic("full-on");

            // Key mapping
            this.inputs.bindCheat(Phaser.Keyboard.W, "Win current battle", () => {
                this.battle.endBattle(this.player.fleet);
            });
            this.inputs.bindCheat(Phaser.Keyboard.A, "Use AI to play", () => {
                if (this.interacting && this.battle.playing_ship) {
                    this.setInteractionEnabled(false);
                    this.battle.playAI(new TacticalAI(this.battle.playing_ship));
                }
            });

            // Start processing the log
            this.log_processor.start();
        }

        // Leaving the view, we unbind the battle
        shutdown() {
            this.exitTargettingMode();

            this.log_processor.destroy();
            this.ui.destroy();
            this.arena.destroy();

            super.shutdown();
        }

        // Display an animated "BATTLE" text in the center of the view
        displayFightMessage(): void {
            var text = this.game.add.text(this.getMidWidth(), this.getMidHeight(), "BATTLE !",
                { align: "center", font: "bold 42px Arial", fill: "#EE2233" });
            text.anchor.set(0.5, 0.5);
            this.game.tweens.create(text.scale).to({ x: 3, y: 3 }).start();
            var text_anim = this.game.tweens.create(text).to({ alpha: 0 });
            text_anim.onComplete.addOnce(() => {
                text.destroy();
            });
            text_anim.start();
        }

        // Method called when cursor starts hovering over a ship (or its icon)
        cursorOnShip(ship: Ship): void {
            if (!this.targetting || ship.alive) {
                this.setShipHovered(ship);
            }
        }

        // Method called when cursor stops hovering over a ship (or its icon)
        cursorOffShip(ship: Ship): void {
            if (this.ship_hovered === ship) {
                this.setShipHovered(null);
            }
        }

        // Method called when cursor moves in space
        cursorInSpace(x: number, y: number): void {
            if (!this.ship_hovered) {
                if (this.targetting) {
                    this.targetting.setTargetSpace(x, y);
                }
            }
        }

        // Method called when cursor has been clicked (in space or on a ship)
        cursorClicked(): void {
            if (this.targetting) {
                this.targetting.validate();
            } else if (this.ship_hovered && this.ship_hovered.getPlayer() == this.player) {
                this.character_sheet.show(this.ship_hovered);
                this.setShipHovered(null);
            }
        }

        // Set the currently hovered ship
        setShipHovered(ship: Ship | null): void {
            this.ship_hovered = ship;
            this.arena.setShipHovered(ship);
            this.ship_list.setHovered(ship);
            this.ship_tooltip.setShip(ship);
            if (this.targetting) {
                if (ship) {
                    this.targetting.setTargetShip(ship);
                } else {
                    this.targetting.unsetTarget();
                }
            }
        }

        // Enable or disable the global player interaction
        //  Disable interaction when it is the AI turn, or when the current ship can't play
        setInteractionEnabled(enabled: boolean): void {
            this.exitTargettingMode();
            this.interacting = enabled;
        }

        // Enter targetting mode
        //  While in this mode, the Targetting object will receive hover and click events, and handle them
        enterTargettingMode(): Targetting | null {
            if (!this.interacting) {
                return null;
            }

            if (this.targetting) {
                this.exitTargettingMode();
            }

            this.targetting = new Targetting(this);
            return this.targetting;
        }

        // Exit targetting mode
        exitTargettingMode(): void {
            if (this.targetting) {
                this.targetting.destroy();
            }
            this.targetting = null;
        }
    }
}
