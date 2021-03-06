/// <reference path="../LootTemplate.ts"/>

module TK.SpaceTac.Equipments {
    export class ShieldTransfer extends LootTemplate {
        constructor() {
            super(SlotType.Weapon, "Shield Transfer", "Generates small gravity wells between the ship's and the target's shields, stealing physical properties and energy");

            this.setSkillsRequirements({ "skill_gravity": leveled(2, 1.5) });
            this.setCooldown(irepeat(3), irepeat(3));
            this.addTriggerAction(irepeat(3), [
                new EffectTemplate(new ValueTransferEffect("shield"), { "amount": leveled(-40, -4) })
            ], irepeat(0), leveled(250, 20));
        }
    }
}
