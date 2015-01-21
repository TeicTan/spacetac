module SpaceTac.View {
    "use strict";

    // Icon to activate a ship capability (move, fire...)
    export class ActionIcon extends Phaser.Button {

        // Link to the parent battle view
        battleview: BattleView;

        // Related ship
        ship: Game.Ship;

        // Related game action
        action: Game.BaseAction;

        // Current targetting
        private targetting: Targetting;

        // Create an icon for a single ship action
        constructor(bar: ActionBar, x: number, y: number, ship: Game.Ship, action: Game.BaseAction) {
            this.battleview = bar.battleview;
            this.ship = ship;
            this.action = action;

            super(bar.game, x, y, "action-" + action.code);
            bar.addChild(this);

            // TODO Handle action.canBeUsed() result to enable/disable the button

            this.input.useHandCursor = true;
            this.onInputUp.add(() => {
                this.processClick();
            }, this);
        }

        // Process a click event on the action icon
        processClick() {
            if (!this.action.canBeUsed(this.battleview.battle, this.ship)) {
                return;
            }

            console.log("Action started", this.action);

            if (this.action.needs_target) {
                this.targetting = this.battleview.enterTargettingMode();
                this.targetting.setSource(this.battleview.arena.findShipSprite(this.ship));
                this.targetting.targetSelected.add(this.processSelection, this);
                this.targetting.targetHovered.add(this.processHover, this);
            } else {
                this.processSelection(null);
            }
        }

        // Called when a target is hovered
        //  This will check the target against current action and adjust it if needed
        processHover(target: Game.Target) {
            target = this.action.checkTarget(this.battleview.battle, this.ship, target);
            this.targetting.setTarget(target, false);
        }

        // Called when a target is selected
        processSelection(target: Game.Target) {
            console.log("Action target", this.action, target);

            if (this.action.apply(this.battleview.battle, this.ship, target)) {
                this.battleview.exitTargettingMode();
            }
        }
    }
}
