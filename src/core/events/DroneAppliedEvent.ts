/// <reference path="BaseBattleEvent.ts"/>

module TS.SpaceTac {
    /**
     * Event logged when a drone applies its effects
     */
    export class DroneAppliedEvent extends BaseLogShipEvent {
        // Pointer to the drone
        drone: Drone;

        // List of impacted ships
        ships: Ship[];

        constructor(drone: Drone, ships: Ship[]) {
            super("droneapply", drone.owner);

            this.drone = drone;
            this.ships = ships;
        }
    }
}
