module TK.SpaceTac.Specs {
    testing("Hulls", test => {
        test.case("generates IronHull based on level", check => {
            let template = new Equipments.IronHull();

            let equipment = template.generate(1);
            check.equals(equipment.requirements, { "skill_materials": 1 });
            compare_effects(check, equipment.effects, [new AttributeEffect("hull_capacity", 100)]);
            check.equals(equipment.price, 100);

            equipment = template.generate(2);
            check.equals(equipment.requirements, { "skill_materials": 2 });
            compare_effects(check, equipment.effects, [new AttributeEffect("hull_capacity", 140)]);
            check.equals(equipment.price, 350);

            equipment = template.generate(3);
            check.equals(equipment.requirements, { "skill_materials": 3 });
            compare_effects(check, equipment.effects, [new AttributeEffect("hull_capacity", 188)]);
            check.equals(equipment.price, 850);

            equipment = template.generate(10);
            check.equals(equipment.requirements, { "skill_materials": 17 });
            compare_effects(check, equipment.effects, [new AttributeEffect("hull_capacity", 748)]);
            check.equals(equipment.price, 11350);
        });

        test.case("generates HardCoatedHull based on level", check => {
            let template = new Equipments.HardCoatedHull();

            let equipment = template.generate(1);
            check.equals(equipment.requirements, { "skill_materials": 2 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 130),
                new AttributeEffect("maneuvrability", -2),
            ]);
            check.equals(equipment.price, 124);

            equipment = template.generate(2);
            check.equals(equipment.requirements, { "skill_materials": 5 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 182),
                new AttributeEffect("maneuvrability", -3),
            ]);
            check.equals(equipment.price, 434);

            equipment = template.generate(3);
            check.equals(equipment.requirements, { "skill_materials": 8 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 244),
                new AttributeEffect("maneuvrability", -5),
            ]);
            check.equals(equipment.price, 1054);

            equipment = template.generate(10);
            check.equals(equipment.requirements, { "skill_materials": 50 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 972),
                new AttributeEffect("maneuvrability", -19),
            ]);
            check.equals(equipment.price, 14074);
        });

        test.case("generates FractalHull based on level", check => {
            let template = new Equipments.FractalHull();

            let equipment = template.generate(1);
            check.equals(equipment.requirements, { "skill_quantum": 1 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 60),
                new AttributeEffect("precision", 2),
            ]);
            compare_trigger_action(check, equipment.action, new TriggerAction(equipment, [new ValueEffect("hull", 60)], 1));
            check.equals(equipment.cooldown, new Cooldown(1, 4));
            check.equals(equipment.price, 250);

            equipment = template.generate(2);
            check.equals(equipment.requirements, { "skill_quantum": 3 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 84),
                new AttributeEffect("precision", 2),
            ]);
            compare_trigger_action(check, equipment.action, new TriggerAction(equipment, [new ValueEffect("hull", 84)], 1));
            check.equals(equipment.cooldown, new Cooldown(1, 4));
            check.equals(equipment.price, 875);

            equipment = template.generate(3);
            check.equals(equipment.requirements, { "skill_quantum": 5 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 112),
                new AttributeEffect("precision", 3),
            ]);
            compare_trigger_action(check, equipment.action, new TriggerAction(equipment, [new ValueEffect("hull", 112)], 1));
            check.equals(equipment.cooldown, new Cooldown(1, 4));
            check.equals(equipment.price, 2125);

            equipment = template.generate(10);
            check.equals(equipment.requirements, { "skill_quantum": 33 });
            compare_effects(check, equipment.effects, [
                new AttributeEffect("hull_capacity", 448),
                new AttributeEffect("precision", 14),
            ]);
            compare_trigger_action(check, equipment.action, new TriggerAction(equipment, [new ValueEffect("hull", 448)], 2));
            check.equals(equipment.cooldown, new Cooldown(1, 4));
            check.equals(equipment.price, 28375);
        });
    });
}
