module TK.SpaceTac.Specs {
    testing("TriggerAction", test => {
        test.case("constructs correctly", check => {
            let equipment = new Equipment(SlotType.Weapon, "testweapon");
            let action = new TriggerAction(equipment, [], 4, 30, 10);

            check.equals(action.code, "fire-testweapon");
            check.equals(action.getVerb(), "Fire");
            check.same(action.equipment, equipment);
        })

        test.case("applies effects to alive ships in blast radius", check => {
            let fleet = new Fleet();
            let ship = new Ship(fleet, "ship");
            let equipment = new Equipment(SlotType.Weapon, "testweapon");
            let effect = new BaseEffect("testeffect");
            let mock_apply = check.patch(effect, "getOnDiffs");
            let action = new TriggerAction(equipment, [effect], 5, 100, 10);
            equipment.action = action;
            ship.addSlot(SlotType.Weapon).attach(equipment);

            TestTools.setShipAP(ship, 10);

            let ship1 = new Ship(fleet, "ship1");
            ship1.setArenaPosition(65, 72);
            let ship2 = new Ship(fleet, "ship2");
            ship2.setArenaPosition(45, 48);
            let ship3 = new Ship(fleet, "ship3");
            ship3.setArenaPosition(45, 48);
            ship3.alive = false;

            let battle = new Battle(fleet);
            battle.play_order = [ship, ship1, ship2, ship3];
            TestTools.setShipPlaying(battle, ship);
            fleet.setBattle(battle);

            action.apply(battle, ship, Target.newFromLocation(50, 50));
            check.called(mock_apply, [
                [ship2, ship]
            ]);
        })

        test.case("transforms ship target in location target, when the weapon has blast radius", check => {
            let ship1 = new Ship();
            ship1.setArenaPosition(50, 10);
            let ship2 = new Ship();
            ship2.setArenaPosition(150, 10);
            let weapon = TestTools.addWeapon(ship1, 1, 0, 100, 30);
            let action = nn(weapon.action);

            let target = action.checkTarget(ship1, new Target(150, 10));
            check.equals(target, new Target(150, 10));

            target = action.checkTarget(ship1, Target.newFromShip(ship2));
            check.equals(target, new Target(150, 10));

            ship1.setArenaPosition(30, 10);

            target = action.checkTarget(ship1, Target.newFromShip(ship2));
            check.equals(target, new Target(130, 10));

            ship1.setArenaPosition(0, 10);

            target = action.checkTarget(ship1, Target.newFromShip(ship2));
            check.equals(target, new Target(100, 10));
        })

        test.case("lists impacted ships", check => {
            let ship1 = new Ship(null, "S1");
            ship1.setArenaPosition(10, 50);
            let ship2 = new Ship(null, "S2");
            ship2.setArenaPosition(40, 60);
            let ship3 = new Ship(null, "S3");
            ship3.setArenaPosition(0, 30);
            let ships = [ship1, ship2, ship3];

            let action = new TriggerAction(new Equipment(), [], 1, 50);
            check.equals(action.filterImpactedShips({ x: 0, y: 0 }, Target.newFromShip(ship2), ships), [ship2]);
            check.equals(action.filterImpactedShips({ x: 0, y: 0 }, Target.newFromLocation(10, 50), ships), []);

            action = new TriggerAction(new Equipment(), [], 1, 50, 40);
            check.equals(action.filterImpactedShips({ x: 0, y: 0 }, Target.newFromLocation(20, 20), ships), [ship1, ship3]);

            action = new TriggerAction(new Equipment(), [], 1, 100, 0, 30);
            check.equals(action.filterImpactedShips({ x: 0, y: 51 }, Target.newFromLocation(30, 50), ships), [ship1, ship2]);
        })

        test.case("guesses targetting mode", check => {
            let ship = new Ship();
            let equ = new Equipment();
            let action = new TriggerAction(equ, []);
            check.equals(action.getTargettingMode(ship), ActionTargettingMode.SELF_CONFIRM, "self");

            action = new TriggerAction(equ, [], 1, 50);
            check.equals(action.getTargettingMode(ship), ActionTargettingMode.SHIP, "ship");

            action = new TriggerAction(equ, [], 1, 50, 20);
            check.equals(action.getTargettingMode(ship), ActionTargettingMode.SPACE, "blast");

            action = new TriggerAction(equ, [], 1, 0, 20);
            check.equals(action.getTargettingMode(ship), ActionTargettingMode.SURROUNDINGS, "surroundings");

            action = new TriggerAction(equ, [], 1, 50, 0, 15);
            check.equals(action.getTargettingMode(ship), ActionTargettingMode.SPACE, "angle");
        })

        test.case("rotates toward the target", check => {
            let battle = TestTools.createBattle();
            let ship = battle.play_order[0];
            let weapon = TestTools.addWeapon(ship, 1, 0, 100, 30);
            let action = nn(weapon.action);
            check.patch(action, "checkTarget", (ship: Ship, target: Target) => target);
            check.equals(ship.arena_angle, 0);

            let result = action.apply(battle, ship, Target.newFromLocation(10, 20));
            check.equals(result, true);
            check.nears(ship.arena_angle, 1.107, 3);

            result = action.apply(battle, ship, Target.newFromShip(ship));
            check.equals(result, true);
            check.nears(ship.arena_angle, 1.107, 3);
        })
    });
}
