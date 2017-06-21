module TS.SpaceTac {
    describe("MoveAction", function () {
        it("checks movement against remaining AP", function () {
            var ship = new Ship();
            var battle = new Battle(ship.fleet);
            battle.playing_ship = ship;
            ship.values.power.setMaximal(20);
            ship.values.power.set(6);
            ship.arena_x = 0;
            ship.arena_y = 0;
            var engine = new Equipment();
            var action = new MoveAction(engine, 0.5);

            expect(action.getDistanceByActionPoint(ship)).toBe(0.5);

            var result = action.checkTarget(ship, Target.newFromLocation(0, 2));
            expect(result).toEqual(Target.newFromLocation(0, 2));

            result = action.checkTarget(ship, Target.newFromLocation(0, 8));
            expect(result).toEqual(Target.newFromLocation(0, 2.9));

            ship.values.power.set(0);
            result = action.checkTarget(ship, Target.newFromLocation(0, 8));
            expect(result).toBeNull();
        });

        it("forbids targetting a ship", function () {
            var ship1 = new Ship(null, "Test1");
            var ship2 = new Ship(null, "Test2");
            var action = new MoveAction(new Equipment());

            var result = action.checkTarget(ship1, Target.newFromShip(ship1));
            expect(result).toBeNull();

            result = action.checkTarget(ship1, Target.newFromShip(ship2));
            expect(result).toBeNull();
        });

        it("applies to ship location, battle log and AP", function () {
            var ship = new Ship();
            var battle = new Battle(ship.fleet);
            ship.values.power.setMaximal(20);
            ship.values.power.set(5);
            ship.arena_x = 0;
            ship.arena_y = 0;
            var engine = new Equipment();
            var action = new MoveAction(engine, 1);
            battle.playing_ship = ship;

            spyOn(console, "warn").and.stub();

            var result = action.apply(ship, Target.newFromLocation(10, 10));
            expect(result).toBe(true);
            expect(ship.arena_x).toBeCloseTo(3.535533, 0.00001);
            expect(ship.arena_y).toBeCloseTo(3.535533, 0.00001);
            expect(ship.values.power.get()).toEqual(0);

            result = action.apply(ship, Target.newFromLocation(10, 10));
            expect(result).toBe(false);
            expect(ship.arena_x).toBeCloseTo(3.535533, 0.00001);
            expect(ship.arena_y).toBeCloseTo(3.535533, 0.00001);
            expect(ship.values.power.get()).toEqual(0);

            expect(battle.log.events.length).toBe(2);

            expect(battle.log.events[0].code).toEqual("value");
            expect(battle.log.events[0].ship).toBe(ship);
            expect((<ValueChangeEvent>battle.log.events[0]).value).toEqual(
                new ShipValue("power", 0, 20));

            expect(battle.log.events[1].code).toEqual("move");
            expect(battle.log.events[1].ship).toBe(ship);
            let dest = (<MoveEvent>battle.log.events[1]).end;
            expect(dest.x).toBeCloseTo(3.535533, 0.00001);
            expect(dest.y).toBeCloseTo(3.535533, 0.00001);
        });

        it("can't move too much near another ship", function () {
            var battle = TestTools.createBattle(1, 1);
            var ship = battle.fleets[0].ships[0];
            var enemy = battle.fleets[1].ships[0];
            TestTools.setShipAP(ship, 100);
            ship.setArenaPosition(5, 5);
            enemy.setArenaPosition(10, 5);

            var action = new MoveAction(new Equipment());
            action.distance_per_power = 10;
            action.safety_distance = 2;

            var result = action.checkLocationTarget(ship, Target.newFromLocation(7, 5));
            expect(result).toEqual(Target.newFromLocation(7, 5));

            result = action.checkLocationTarget(ship, Target.newFromLocation(8, 5));
            expect(result).toEqual(Target.newFromLocation(8, 5));

            result = action.checkLocationTarget(ship, Target.newFromLocation(9, 5));
            expect(result).toEqual(Target.newFromLocation(8, 5));

            result = action.checkLocationTarget(ship, Target.newFromLocation(10, 5));
            expect(result).toEqual(Target.newFromLocation(8, 5));

            result = action.checkLocationTarget(ship, Target.newFromLocation(12, 5));
            expect(result).toEqual(Target.newFromLocation(12, 5));
        });

        it("move exclusion radius is applied correctly over two ships", function () {
            var battle = TestTools.createBattle(1, 2);
            var ship = battle.fleets[0].ships[0];
            var enemy1 = battle.fleets[1].ships[0];
            var enemy2 = battle.fleets[1].ships[1];
            TestTools.setShipAP(ship, 100);
            enemy1.setArenaPosition(0, 80);
            enemy2.setArenaPosition(0, 100);

            var action = new MoveAction(new Equipment());
            action.distance_per_power = 1000;
            action.safety_distance = 15;

            var result = action.checkLocationTarget(ship, Target.newFromLocation(0, 110));
            expect(result).toEqual(Target.newFromLocation(0, 65));
        });
    });
}
