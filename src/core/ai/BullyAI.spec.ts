module TS.SpaceTac.Specs {
    describe("BullyAI", function () {
        it("lists enemies", function () {
            var battle = new Battle();
            battle.fleets[0].addShip(new Ship(null, "0-0"));
            battle.fleets[1].addShip(new Ship(null, "1-0"));
            battle.fleets[1].addShip(new Ship(null, "1-1"));
            iforeach(battle.iships(), ship => ship.setAttribute("initiative", 1));

            var random = new SkewedRandomGenerator([0, 0.5, 1]);
            battle.throwInitiative(random);

            var ai = new BullyAI(battle.fleets[0].ships[0], Timer.synchronous);

            var result = ai.listAllEnemies();
            expect(result).toEqual([battle.fleets[1].ships[1], battle.fleets[1].ships[0]]);
        });

        it("lists weapons", function () {
            var ship = new Ship();

            var ai = new BullyAI(ship, Timer.synchronous);
            ai.ship = ship;

            var result = ai.listAllWeapons();
            expect(result.length).toBe(0);

            var weapon1 = new Equipment(SlotType.Weapon, "weapon1");
            weapon1.action = new FireWeaponAction(weapon1, 1, 1, 1, [new DamageEffect(50)]);
            ai.ship.addSlot(SlotType.Weapon).attach(weapon1);
            var weapon2 = new Equipment(SlotType.Weapon, "weapon2");
            weapon2.action = new FireWeaponAction(weapon1, 1, 1, 1, [new DamageEffect(100)]);
            ai.ship.addSlot(SlotType.Weapon).attach(weapon2);
            var weapon3 = new Equipment(SlotType.Weapon, "weapon3");
            ai.ship.addSlot(SlotType.Weapon).attach(weapon3);

            ai.ship.addSlot(SlotType.Shield).attach(new Equipment(SlotType.Shield));

            result = ai.listAllWeapons();
            expect(result).toEqual([weapon1, weapon2]);
        });

        it("checks a firing possibility", function () {
            var ship = new Ship();
            let engine = TestTools.addEngine(ship, 1 / 3);
            TestTools.setShipAP(ship, 10);
            var enemy = new Ship();
            var ai = new BullyAI(ship, Timer.synchronous);
            ai.ship = ship;
            ai.move_margin = 0;
            let weapon = TestTools.addWeapon(ship, 0, 2, 3);

            // enemy in range, the ship can fire without moving
            ship.values.power.set(8);
            ship.arena_x = 1;
            ship.arena_y = 0;
            enemy.arena_x = 3;
            enemy.arena_y = 0;
            var result = ai.checkBullyManeuver(enemy, weapon);
            if (result) {
                expect(result.simulation.need_move).toBe(false);
                expect(result.simulation.fire_location).toEqual(Target.newFromShip(enemy));
                expect(result.equipment).toBe(weapon);
            } else {
                fail("No maneuver proposed");
            }

            // enemy out of range, but moving can bring it in range
            ship.values.power.set(8);
            ship.arena_x = 1;
            ship.arena_y = 0;
            enemy.arena_x = 6;
            enemy.arena_y = 0;
            result = ai.checkBullyManeuver(enemy, weapon);
            if (result) {
                expect(result.simulation.move_location).toEqual(Target.newFromLocation(3, 0));
                expect(result.simulation.fire_location).toEqual(Target.newFromShip(enemy));
                expect(result.equipment).toBe(weapon);
            } else {
                fail("No maneuver proposed");
            }

            // enemy out of range, but moving can bring it in range, except for the safety margin
            ai.move_margin = 0.1;
            ship.values.power.set(8);
            ship.arena_x = 1;
            ship.arena_y = 0;
            enemy.arena_x = 6;
            enemy.arena_y = 0;
            result = ai.checkBullyManeuver(enemy, weapon);
            expect(result).toBeNull();
            ai.move_margin = 0;

            // enemy totally out of range
            ship.values.power.set(8);
            ship.arena_x = 1;
            ship.arena_y = 0;
            enemy.arena_x = 30;
            enemy.arena_y = 0;
            result = ai.checkBullyManeuver(enemy, weapon);
            expect(result).toBeNull();

            // enemy in range but not enough AP to fire
            ship.values.power.set(1);
            ship.arena_x = 1;
            ship.arena_y = 0;
            enemy.arena_x = 3;
            enemy.arena_y = 0;
            result = ai.checkBullyManeuver(enemy, weapon);
            expect(result).toBeNull();

            // can move in range of enemy, but not enough AP to fire
            ship.values.power.set(7);
            ship.arena_x = 1;
            ship.arena_y = 0;
            enemy.arena_x = 6;
            enemy.arena_y = 0;
            result = ai.checkBullyManeuver(enemy, weapon);
            expect(result).toBeNull();

            // no engine, can't move
            engine.detach();
            ship.values.power.set(8);
            ship.arena_x = 1;
            ship.arena_y = 0;
            enemy.arena_x = 6;
            enemy.arena_y = 0;
            result = ai.checkBullyManeuver(enemy, weapon);
            expect(result).toBeNull();
        });

        it("lists available firing actions", function () {
            var battle = new Battle();
            var ship1 = new Ship();
            ship1.setArenaPosition(3, 2);
            battle.fleets[0].addShip(ship1);
            var ship2 = new Ship();
            ship2.setArenaPosition(5, 3);
            battle.fleets[1].addShip(ship2);
            var ship3 = new Ship();
            ship3.setArenaPosition(11, 15);
            battle.fleets[1].addShip(ship3);
            battle.throwInitiative(new SkewedRandomGenerator([1, 0.5, 0]));

            var ai = new BullyAI(ship1, Timer.synchronous);
            ai.ship = ship1;

            var result = ai.listAllManeuvers();
            expect(result.length).toBe(0);

            TestTools.setShipAP(ai.ship, 8);
            let weapon1 = TestTools.addWeapon(ai.ship, 10, 1, 50);
            let weapon2 = TestTools.addWeapon(ai.ship, 5, 1, 10);

            result = ai.listAllManeuvers();
            expect(result.length).toBe(3);
        });

        it("gets a fallback maneuver", function () {
            var battle = TestTools.createBattle(1, 3);
            var ai = new BullyAI(battle.fleets[0].ships[0], Timer.synchronous);

            TestTools.setShipAP(ai.ship, 5);
            var engine = TestTools.addEngine(ai.ship, 100);
            (<MoveAction>engine.action).safety_distance = 20;

            var maneuver: BullyManeuver | null;

            battle.fleets[1].ships.forEach((ship: Ship) => {
                ai.ship.setArenaPosition(0, 0);
            });

            // Too much near an enemy, don't move
            ai.ship.setArenaPosition(10, 0);
            maneuver = ai.getFallbackManeuver();
            expect(maneuver).toBeNull();
            ai.ship.setArenaPosition(20, 0);
            maneuver = ai.getFallbackManeuver();
            expect(maneuver).toBeNull();

            // Move towards an enemy (up to minimal distance)
            ai.ship.setArenaPosition(30, 0);
            maneuver = ai.getFallbackManeuver();
            if (maneuver) {
                expect(maneuver.simulation.move_location).toEqual(Target.newFromLocation(25, 0));
            } else {
                fail("No maneuver proposed");
            }
            ai.ship.setArenaPosition(25, 0);
            maneuver = ai.getFallbackManeuver();
            if (maneuver) {
                expect(maneuver.simulation.move_location).toEqual(Target.newFromLocation(22.5, 0));
            } else {
                fail("No maneuver proposed");
            }
        });

        it("applies the chosen move", function () {
            var battle = new Battle();
            var ship1 = new Ship();
            ship1.setArenaPosition(0, 0);
            battle.fleets[0].addShip(ship1);
            var ship2 = new Ship();
            ship2.setArenaPosition(8, 0);
            battle.fleets[1].addShip(ship2);

            var ai = new BullyAI(ship1, Timer.synchronous);
            ai.move_margin = 0;

            var engine = new Equipment(SlotType.Engine);
            engine.action = new MoveAction(engine, 0.5);
            ai.ship.addSlot(SlotType.Engine).attach(engine);

            var weapon = new Equipment(SlotType.Weapon);
            weapon.action = new FireWeaponAction(weapon, 1, 6, 0, [new DamageEffect(20)]);
            ai.ship.addSlot(SlotType.Weapon).attach(weapon);

            ai.ship.values.power.setMaximal(10);
            ai.ship.values.power.set(6);

            ship2.values.hull.set(15);
            ship2.values.shield.set(10);

            var move = ai.checkBullyManeuver(ship2, weapon);
            expect(move).not.toBeNull();

            battle.playing_ship = ai.ship;
            battle.log.clear();
            ai.applyManeuver(move);

            expect(battle.log.events.length).toBe(7);

            expect(battle.log.events[0]).toEqual(new ValueChangeEvent(ship1, new ShipValue("power", 2, 10), -4));
            expect(battle.log.events[1]).toEqual(new MoveEvent(ship1, 2, 0));

            expect(battle.log.events[2]).toEqual(new ValueChangeEvent(ship1, new ShipValue("power", 1, 10), -1));
            expect(battle.log.events[3]).toEqual(new FireEvent(ship1, weapon, Target.newFromShip(ship2)));
            expect(battle.log.events[4]).toEqual(new ValueChangeEvent(ship2, new ShipValue("shield", 0), -10));
            expect(battle.log.events[5]).toEqual(new ValueChangeEvent(ship2, new ShipValue("hull", 5), -10));
            expect(battle.log.events[6]).toEqual(new DamageEvent(ship2, 10, 10));
        });
    });
}
