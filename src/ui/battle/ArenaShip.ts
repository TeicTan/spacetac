module TS.SpaceTac.UI {
    // Ship sprite in the arena (BattleView)
    export class ArenaShip extends Phaser.Group {
        // Link to the view
        arena: Arena
        battleview: BattleView

        // Link to displayed ship
        ship: Ship

        // Boolean to indicate if it is an enemy ship
        enemy: boolean

        // Ship sprite
        sprite: Phaser.Button

        // Statis effect
        stasis: Phaser.Image

        // Target effect
        target: Phaser.Image

        // HSP display
        hull: ValueBar
        toggle_hull: Toggle
        shield: ValueBar
        toggle_shield: Toggle
        power: Phaser.Group
        toggle_power: Toggle

        // Play order
        play_order: Phaser.Text
        toggle_play_order: Toggle

        // Frame to indicate the owner of the ship, and if it is playing
        frame: Phaser.Image

        // Effects display
        sticky_effects: Phaser.Group
        effects: Phaser.Group

        // Create a ship sprite usable in the Arena
        constructor(parent: Arena, ship: Ship) {
            super(parent.game);
            this.arena = parent;
            this.battleview = parent.battleview;

            this.ship = ship;
            this.enemy = this.ship.getPlayer() != this.battleview.player;

            // Add ship sprite
            this.sprite = new Phaser.Button(this.game, 0, 0, "ship-" + ship.model.code + "-sprite");
            this.sprite.rotation = ship.arena_angle;
            this.sprite.anchor.set(0.5, 0.5);
            this.sprite.scale.set(64 / this.sprite.width);
            this.add(this.sprite);

            // Add stasis effect
            this.stasis = new Phaser.Image(this.game, 0, 0, "battle-arena-stasis");
            this.stasis.anchor.set(0.5, 0.5);
            this.stasis.visible = false;
            this.add(this.stasis);

            // Add target effect
            this.target = new Phaser.Image(this.game, 0, 0, "battle-arena-target");
            this.target.anchor.set(0.5, 0.5);
            this.target.visible = false;
            this.add(this.target);

            // Add playing effect
            this.frame = new Phaser.Image(this.game, 0, 0, `battle-arena-ship-normal-${this.enemy ? "enemy" : "own"}`, 0);
            this.frame.anchor.set(0.5, 0.5);
            this.add(this.frame);

            // HSP display
            this.hull = new ValueBar(this.game, -59, -47, "battle-arena-ship-hull-base", true);
            this.hull.setBarImage("battle-arena-ship-hull-full", 3);
            this.hull.setValue(this.ship.getValue("hull"), this.ship.getAttribute("hull_capacity"));
            this.toggle_hull = this.battleview.animations.newVisibilityToggle(this.hull, 200, false);
            this.add(this.hull);
            this.shield = new ValueBar(this.game, 40, -47, "battle-arena-ship-shield-base", true);
            this.shield.setBarImage("battle-arena-ship-shield-full", 3);
            this.shield.setValue(this.ship.getValue("shield"), this.ship.getAttribute("shield_capacity"));
            this.toggle_shield = this.battleview.animations.newVisibilityToggle(this.shield, 200, false);
            this.add(this.shield);
            this.power = new Phaser.Group(this.game);
            this.toggle_power = this.battleview.animations.newVisibilityToggle(this.power, 200, false);
            this.add(this.power);

            // Play order display
            this.play_order = new Phaser.Text(this.game, 55, -47, "", { font: "bold 14pt Arial", fill: "#aaaaaa" });
            this.toggle_play_order = this.battleview.animations.newVisibilityToggle(this.play_order, 200, false);
            this.add(this.play_order);

            // Effects display
            this.sticky_effects = new Phaser.Group(this.game);
            this.add(this.sticky_effects);
            this.effects = new Phaser.Group(this.game);
            this.add(this.effects);

            this.updateStickyEffects();
            this.updatePowerIndicator(ship.getValue("power"));

            // Handle input on ship sprite
            UITools.setHoverClick(this.sprite,
                () => this.battleview.cursorOnShip(ship),
                () => this.battleview.cursorOffShip(ship),
                () => this.battleview.cursorClicked()
            );

            // Set location
            if (ship.alive) {
                this.position.set(ship.arena_x - 150 * Math.cos(ship.arena_angle), ship.arena_y - 150 * Math.sin(ship.arena_angle));
                this.moveTo(ship.arena_x, ship.arena_y, ship.arena_angle);
            } else {
                this.moveTo(ship.arena_x, ship.arena_y, ship.arena_angle, false);
            }

            // Log processing
            this.battleview.log_processor.register(event => this.processLogEvent(event));
            this.battleview.log_processor.registerForShip(ship, event => this.processShipLogEvent(event));
        }

        /**
         * Process a battle log event
         */
        private processLogEvent(event: BaseLogEvent): number {
            if (event instanceof ShipChangeEvent) {
                if (event.new_ship === this.ship) {
                    this.play_order.text = "";
                } else {
                    this.play_order.text = this.battleview.battle.getTurnsBefore(this.ship).toString();
                }
            }
            return 0;
        }

        /**
         * Process a log event for this ship
         */
        private processShipLogEvent(event: BaseLogShipEvent): number {
            if (event instanceof EffectAddedEvent || event instanceof EffectRemovedEvent || event instanceof EffectDurationChangedEvent) {
                this.updateStickyEffects();
                return 0;
            } else if (event instanceof ValueChangeEvent) {
                if (event.value.name == "hull") {
                    this.toggle_hull.start(1500, true);
                    this.hull.setValue(event.value.get(), event.value.getMaximal() || 0);
                    return 0;
                } else if (event.value.name == "shield") {
                    this.toggle_shield.start(1500, true);
                    this.shield.setValue(event.value.get(), event.value.getMaximal() || 0);
                    if (event.value.get() == 0) {
                        this.displayEffect("Shield failure", false);
                    }
                    return 0;
                } else if (event.value.name == "power") {
                    this.toggle_power.start(1500, true);
                    this.updatePowerIndicator(event.value.get());
                    return 0;
                } else {
                    this.displayValueChanged(event);
                    return 0;
                }
            } else if (event instanceof DamageEvent) {
                this.displayEffect(`${event.hull + event.shield} damage`, false);
                return 0;
            } else if (event instanceof MoveEvent) {
                let duration = this.moveTo(event.target.x, event.target.y, event.facing_angle, !event.initial);
                return duration;
            } else {
                return 0;
            }
        }

        /**
         * Set the hovered state on this ship
         * 
         * This will show the information HUD accordingly
         */
        setHovered(hovered: boolean, tactical: boolean) {
            if (hovered && this.ship.alive) {
                this.toggle_hull.start();
                this.toggle_shield.start();
                this.toggle_power.start();
                if (tactical) {
                    this.toggle_play_order.start();
                }
            } else {
                this.toggle_hull.stop();
                this.toggle_shield.stop();
                this.toggle_power.stop();
                this.toggle_play_order.stop();
            }
        }

        // Set the playing state on this ship
        //  This will toggle the "playing" indicator
        setPlaying(playing: boolean) {
            this.frame.loadTexture(`battle-arena-ship-${playing ? "playing" : "normal"}-${this.enemy ? "enemy" : "own"}`);
        }

        /**
         * Set the ship as target of current action
         * 
         * This will toggle the visibility of target indicator
         */
        setTargetted(targetted: boolean): void {
            this.target.visible = targetted;
        }

        /**
         * Activate the dead effect (stasis)
         */
        setDead(dead = true) {
            if (dead) {
                this.displayEffect("stasis", false);
            }
            this.frame.alpha = dead ? 0.5 : 1.0;
            this.battleview.animations.setVisible(this.stasis, dead, 400);
        }

        /**
         * Move the sprite to a location
         * 
         * Return the duration of animation
         */
        moveTo(x: number, y: number, facing_angle: number, animate = true): number {
            if (animate) {
                let duration = Animations.moveInSpace(this, x, y, facing_angle, this.sprite);
                return duration;
            } else {
                this.x = x;
                this.y = y;
                this.sprite.rotation = facing_angle;
                return 0;
            }
        }

        /**
         * Briefly show an effect on this ship
         */
        displayEffect(message: string, beneficial: boolean) {
            let text = new Phaser.Text(this.game, 0, 20 * this.effects.children.length, message, { font: "14pt Arial", fill: beneficial ? "#afe9c6" : "#e9afaf" });
            this.effects.addChild(text);

            let arena = this.battleview.arena.getBoundaries();
            this.effects.position.set(
                (this.ship.arena_x < 100) ? -35 : ((this.ship.arena_x > arena.width - 100) ? (35 - this.effects.width) : (-this.effects.width * 0.5)),
                (this.ship.arena_y < arena.height * 0.9) ? 45 : (-45 - this.effects.height)
            );

            this.game.tweens.removeFrom(this.effects);
            this.effects.alpha = 1;
            let tween = this.game.tweens.create(this.effects).to({ alpha: 0 }, 500).delay(1000).start();
            tween.onComplete.addOnce(() => this.effects.removeAll(true));
        }

        /**
         * Display interesting changes in ship values
         */
        displayValueChanged(event: ValueChangeEvent) {
            let diff = event.diff;
            let name = event.value.name;
            this.displayEffect(`${name} ${diff < 0 ? "-" : "+"}${Math.abs(diff)}`, diff >= 0);
        }

        /**
         * Update the stick effects
         */
        updateStickyEffects() {
            this.sticky_effects.removeAll();

            let count = this.ship.sticky_effects.length
            if (count) {
                let positions = UITools.evenlySpace(70, 10, count);
                this.ship.sticky_effects.forEach((effect, index) => {
                    let dot = new Phaser.Image(this.game, positions[index] - 40, -47, `battle-arena-ship-effect-${effect.isBeneficial() ? "good" : "bad"}`);
                    this.sticky_effects.add(dot);
                });
            }
        }

        /**
         * Update the power indicator
         */
        updatePowerIndicator(power: number) {
            this.power.removeAll();

            if (power) {
                let positions = UITools.evenlySpace(70, 10, power);
                range(power).forEach(index => {
                    let dot = new Phaser.Image(this.game, positions[index] - 40, 40, "battle-arena-ship-power");
                    this.power.add(dot);
                });
            }
        }
    }
}
