/// <reference path="BaseLogEvent.ts"/>

module TS.SpaceTac {
    // Battle event, when a ship turn ended, and advanced to a new one
    export class ShipChangeEvent extends BaseLogEvent {
        // Ship that starts playing
        new_ship: Ship;

        constructor(ship: Ship, new_ship: Ship) {
            super("ship_change", ship, new_ship ? Target.newFromShip(new_ship) : null);

            this.new_ship = new_ship;
        }
    }
}
