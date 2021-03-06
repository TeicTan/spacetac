/// <reference path="../LootTemplate.ts"/>

module TK.SpaceTac.Equipments {
    /**
     * Drone that repairs damage done to the hull.
     */
    export class RepairDrone extends LootTemplate {
        constructor() {
            super(SlotType.Weapon, "Repair Drone", "Drone able to repair small hull breaches, using quantum patches", 190);

            this.setSkillsRequirements({ "skill_quantum": leveled(1, 3) });
            this.addDroneAction(leveled(3, 0.2), leveled(300, 10), leveled(150, 5), [
                new EffectTemplate(new ValueEffect("hull"), { "value_end": leveled(30) })
            ]);
        }
    }
}