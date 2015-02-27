/// <reference path="BaseLogEvent.ts"/>

module SpaceTac.Game {
    "use strict";

    // Event logged when a TemporaryEffect is added to a ship
    export class EffectDurationChangedEvent extends BaseLogEvent {
        // Pointer to the effect
        effect: TemporaryEffect;

        // Previous duration
        previous: number;

        constructor(ship: Ship, effect: TemporaryEffect, previous: number) {
            super("effectadd", ship);

            this.effect = effect;
            this.previous = previous;
        }
    }
}
