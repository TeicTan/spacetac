module TS.SpaceTac {
    describe("Battle", function () {
        it("defines play order by initiative throws", function () {
            var fleet1 = new Fleet(null);
            var fleet2 = new Fleet(null);

            var ship1 = new Ship(fleet1, "F1S1");
            ship1.setAttribute("initiative", 2);
            var ship2 = new Ship(fleet1, "F1S2");
            ship2.setAttribute("initiative", 4);
            var ship3 = new Ship(fleet1, "F1S3");
            ship3.setAttribute("initiative", 1);
            var ship4 = new Ship(fleet2, "F2S1");
            ship4.setAttribute("initiative", 8);
            var ship5 = new Ship(fleet2, "F2S2");
            ship5.setAttribute("initiative", 2);

            var battle = new Battle(fleet1, fleet2);
            expect(battle.play_order.length).toBe(0);

            var gen = new RandomGenerator(1.0, 0.1, 1.0, 0.2, 0.6);
            battle.throwInitiative(gen);

            expect(battle.play_order.length).toBe(5);
            expect(battle.play_order).toEqual([ship1, ship4, ship5, ship3, ship2]);
        });

        it("places ships on lines, facing the arena center", function () {
            var fleet1 = new Fleet(null);
            var fleet2 = new Fleet(null);

            var ship1 = new Ship(fleet1, "F1S1");
            var ship2 = new Ship(fleet1, "F1S2");
            var ship3 = new Ship(fleet1, "F1S3");
            var ship4 = new Ship(fleet2, "F2S1");
            var ship5 = new Ship(fleet2, "F2S2");

            var battle = new Battle(fleet1, fleet2, 1000, 500);
            battle.placeShips();

            expect(ship1.arena_x).toBeCloseTo(50, 0.0001);
            expect(ship1.arena_y).toBeCloseTo(150, 0.0001);
            expect(ship1.arena_angle).toBeCloseTo(0, 0.0001);

            expect(ship2.arena_x).toBeCloseTo(50, 0.0001);
            expect(ship2.arena_y).toBeCloseTo(250, 0.0001);
            expect(ship2.arena_angle).toBeCloseTo(0, 0.0001);

            expect(ship3.arena_x).toBeCloseTo(50, 0.0001);
            expect(ship3.arena_y).toBeCloseTo(350, 0.0001);
            expect(ship3.arena_angle).toBeCloseTo(0, 0.0001);

            expect(ship4.arena_x).toBeCloseTo(950, 0.0001);
            expect(ship4.arena_y).toBeCloseTo(300, 0.0001);
            expect(ship4.arena_angle).toBeCloseTo(Math.PI, 0.0001);

            expect(ship5.arena_x).toBeCloseTo(950, 0.0001);
            expect(ship5.arena_y).toBeCloseTo(200, 0.0001);
            expect(ship5.arena_angle).toBeCloseTo(Math.PI, 0.0001);
        });

        it("advances to next ship in play order", function () {
            var fleet1 = new Fleet(null);
            var fleet2 = new Fleet(null);

            var ship1 = new Ship(fleet1, "F1S1");
            var ship2 = new Ship(fleet1, "F1S2");
            var ship3 = new Ship(fleet2, "F2S1");

            var battle = new Battle(fleet1, fleet2);

            // Check empty play_order case
            expect(battle.playing_ship).toBeNull();
            expect(battle.playing_ship_index).toBeNull();
            battle.advanceToNextShip();
            expect(battle.playing_ship).toBeNull();
            expect(battle.playing_ship_index).toBeNull();

            // Force play order
            var gen = new RandomGenerator(0.1, 0.2, 0.0);
            battle.throwInitiative(gen);

            expect(battle.playing_ship).toBeNull();
            expect(battle.playing_ship_index).toBeNull();

            battle.advanceToNextShip();

            expect(battle.playing_ship).toBe(ship2);
            expect(battle.playing_ship_index).toBe(0);

            battle.advanceToNextShip();

            expect(battle.playing_ship).toBe(ship1);
            expect(battle.playing_ship_index).toBe(1);

            battle.advanceToNextShip();

            expect(battle.playing_ship).toBe(ship3);
            expect(battle.playing_ship_index).toBe(2);

            battle.advanceToNextShip();

            expect(battle.playing_ship).toBe(ship2);
            expect(battle.playing_ship_index).toBe(0);

            // A dead ship is not skipped
            ship1.setDead();

            battle.advanceToNextShip();

            expect(battle.playing_ship).toBe(ship1);
            expect(battle.playing_ship_index).toBe(1);
        });

        it("calls startTurn on ships", function () {
            var fleet1 = new Fleet(null);
            var fleet2 = new Fleet(null);

            var ship1 = new Ship(fleet1, "F1S1");
            var ship2 = new Ship(fleet1, "F1S2");
            var ship3 = new Ship(fleet2, "F2S1");

            var battle = new Battle(fleet1, fleet2);

            spyOn(ship1, "startTurn").and.callThrough();
            spyOn(ship2, "startTurn").and.callThrough();
            spyOn(ship3, "startTurn").and.callThrough();

            // Force play order
            var gen = new RandomGenerator(0.3, 0.2, 0.1);
            battle.throwInitiative(gen);

            battle.advanceToNextShip();
            expect(ship1.startTurn).toHaveBeenCalledWith();

            battle.advanceToNextShip();
            expect(ship2.startTurn).toHaveBeenCalledWith();

            battle.advanceToNextShip();
            expect(ship3.startTurn).toHaveBeenCalledWith();

            battle.advanceToNextShip();
            expect(ship1.startTurn).toHaveBeenCalledWith();
        });

        it("detects victory condition and logs a final EndBattleEvent", function () {
            var fleet1 = new Fleet();
            var fleet2 = new Fleet();

            var ship1 = new Ship(fleet1, "F1S1");
            var ship2 = new Ship(fleet1, "F1S2");
            new Ship(fleet2, "F2S1");

            var battle = new Battle(fleet1, fleet2);

            battle.start();
            expect(battle.ended).toBe(false);

            ship1.setDead();
            ship2.setDead();

            battle.log.clear();
            battle.advanceToNextShip();

            expect(battle.ended).toBe(true);
            expect(battle.log.events.length).toBe(1);
            expect(battle.log.events[0].code).toBe("endbattle");
            expect((<EndBattleEvent>battle.log.events[0]).outcome.winner).not.toBeNull();
            expect((<EndBattleEvent>battle.log.events[0]).outcome.winner).toBe(fleet2);
        });

        it("handles a draw in end battle", function () {
            var fleet1 = new Fleet();
            var fleet2 = new Fleet();

            var ship1 = new Ship(fleet1, "F1S1");
            var ship2 = new Ship(fleet1, "F1S2");
            var ship3 = new Ship(fleet2, "F2S1");

            var battle = new Battle(fleet1, fleet2);

            battle.start();
            expect(battle.ended).toBe(false);

            ship1.setDead();
            ship2.setDead();
            ship3.setDead();

            battle.log.clear();
            battle.advanceToNextShip();

            expect(battle.ended).toBe(true);
            expect(battle.log.events.length).toBe(1);
            expect(battle.log.events[0].code).toBe("endbattle");
            expect((<EndBattleEvent>battle.log.events[0]).outcome.winner).toBeNull();
        });

        it("collects ships present in a circle", function () {
            var fleet1 = new Fleet();
            var ship1 = new Ship(fleet1, "F1S1");
            ship1.setArenaPosition(0, 0);
            var ship2 = new Ship(fleet1, "F1S2");
            ship2.setArenaPosition(5, 8);
            var ship3 = new Ship(fleet1, "F1S3");
            ship3.setArenaPosition(6.5, 9.5);
            var ship4 = new Ship(fleet1, "F1S4");
            ship4.setArenaPosition(12, 12);

            var battle = new Battle(fleet1);
            battle.throwInitiative(new RandomGenerator(5, 4, 3, 2));

            var result = battle.collectShipsInCircle(Target.newFromLocation(5, 8), 3);
            expect(result).toEqual([ship2, ship3]);
        });

        it("adds and remove drones", function () {
            let battle = new Battle();
            let ship = new Ship();
            let drone = new Drone(ship);
            let onDeploy = spyOn(drone, "onDeploy");

            expect(battle.drones).toEqual([]);
            expect(battle.log.events).toEqual([]);

            battle.addDrone(drone);

            expect(battle.drones).toEqual([drone]);
            expect(battle.log.events).toEqual([new DroneDeployedEvent(drone)]);
            expect(onDeploy).toHaveBeenCalledTimes(1);

            battle.addDrone(drone);

            expect(battle.drones).toEqual([drone]);
            expect(battle.log.events).toEqual([new DroneDeployedEvent(drone)]);
            expect(onDeploy).toHaveBeenCalledTimes(1);

            battle.removeDrone(drone);

            expect(battle.drones).toEqual([]);
            expect(battle.log.events).toEqual([new DroneDeployedEvent(drone), new DroneDestroyedEvent(drone)]);

            battle.removeDrone(drone);

            expect(battle.drones).toEqual([]);
            expect(battle.log.events).toEqual([new DroneDeployedEvent(drone), new DroneDestroyedEvent(drone)]);

            // check initial log fill
            battle.drones = [drone];
            battle.log.events = [];
            battle.injectInitialEvents();
            let expected = new DroneDeployedEvent(drone);
            expected.initial = true;
            expect(battle.log.events).toEqual([expected]);
        });

        it("checks if a player is able to play", function () {
            let battle = new Battle();
            let player = new Player();

            expect(battle.canPlay(player)).toBe(false);

            let ship = new Ship();
            battle.playing_ship = ship;

            expect(battle.canPlay(player)).toBe(false);

            ship.fleet.player = player;

            expect(battle.canPlay(player)).toBe(true);
        });
    });
}
