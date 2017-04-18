module TS.SpaceTac.Specs {
    describe("Equipment", () => {
        it("generates a full name", function () {
            let equipment = new Equipment(SlotType.Weapon, "rayofdeath");
            expect(equipment.getFullName()).toEqual("Level 1 rayofdeath");

            equipment.name = "Ray of Death";
            expect(equipment.getFullName()).toEqual("Level 1 Ray of Death");

            equipment.quality = EquipmentQuality.LEGENDARY;
            expect(equipment.getFullName()).toEqual("Level 1 Legendary Ray of Death");
        });

        it("checks capabilities requirements", function () {
            var equipment = new Equipment();
            var ship = new Ship();

            expect(equipment.canBeEquipped(ship)).toBe(true);

            equipment.requirements["skill_time"] = 2;

            expect(equipment.canBeEquipped(ship)).toBe(false);

            ship.attributes.skill_time.set(1);

            expect(equipment.canBeEquipped(ship)).toBe(false);

            ship.attributes.skill_time.set(2);

            expect(equipment.canBeEquipped(ship)).toBe(true);

            ship.attributes.skill_time.set(3);

            expect(equipment.canBeEquipped(ship)).toBe(true);

            // Second requirement
            equipment.requirements["skill_material"] = 3;

            expect(equipment.canBeEquipped(ship)).toBe(false);

            ship.attributes.skill_material.set(4);

            expect(equipment.canBeEquipped(ship)).toBe(true);
        });

        it("generates a description of the effects", function () {
            let equipment = new Equipment();
            expect(equipment.getEffectsDescription()).toEqual("does nothing");

            let action = new FireWeaponAction(equipment, 1, 200, 0, [
                new DamageEffect(50)
            ]);
            equipment.action = action;
            expect(equipment.getEffectsDescription()).toEqual("Fire (power usage 1, max range 200km):\n- do 50 damage on target");

            action.blast = 20;
            expect(equipment.getEffectsDescription()).toEqual("Fire (power usage 1, max range 200km):\n- do 50 damage in 20km radius");

            action.blast = 0;
            action.effects.push(new StickyEffect(new AttributeLimitEffect("shield_capacity", 200), 3));
            expect(equipment.getEffectsDescription()).toEqual("Fire (power usage 1, max range 200km):\n- do 50 damage on target\n- limit shield capacity to 200 for 3 turns on target");
        });

        it("gets a minimal level, based on skills requirements", function () {
            let equipment = new Equipment();
            expect(equipment.getMinimumLevel()).toBe(1);

            equipment.requirements["skill_human"] = 10;
            expect(equipment.getMinimumLevel()).toBe(1);

            equipment.requirements["skill_time"] = 1;
            expect(equipment.getMinimumLevel()).toBe(2);

            equipment.requirements["skill_gravity"] = 2;
            expect(equipment.getMinimumLevel()).toBe(2);

            equipment.requirements["skill_electronics"] = 4;
            expect(equipment.getMinimumLevel()).toBe(3);
        });
    });
}
