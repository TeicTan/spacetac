module SpaceTac.View.Widgets {
    // One item in a ship list (used in BattleView)
    export class ShipListItem extends Phaser.Button {
        // Reference to the ship game object
        private ship: Game.Ship;

        // Create a ship button for the battle ship list
        constructor(battleview: BattleView, x: number, y: number, ship:Game.Ship, owned: boolean) {
            this.ship = ship;

            super(battleview.game, x, y, owned ? 'ui-shiplist-own' : 'ui-shiplist-enemy');
            battleview.ui.add(this);

            this.onInputOver.add(() => {
                battleview.cursorOnShip(ship);
            });
            this.onInputOut.add(() => {
                battleview.cursorOffShip(ship);
            });
        }
    }
}