/// <reference path="events/BaseBattleEvent.ts"/>

module TS.SpaceTac {
    // Check a single game log event
    function checkEvent(got: BaseBattleEvent, ship: Ship, code: string,
        target_ship: Ship | null = null, target_x: number | null = null, target_y: number | null = null): void {
        if (target_ship) {
            if (target_x === null) {
                target_x = target_ship.arena_x;
            }
            if (target_y === null) {
                target_y = target_ship.arena_y;
            }
        }

        expect(got.ship).toBe(ship);
        expect(got.code).toEqual(code);
        if (got.target) {
            expect(got.target.ship).toBe(target_ship);
            if (target_x === null) {
                expect(got.target.x).toBeNull();
            } else {
                expect(got.target.x).toBeCloseTo(target_x, 0.000001);
            }
            if (target_y === null) {
                expect(got.target.y).toBeNull();
            } else {
                expect(got.target.y).toBeCloseTo(target_y, 0.000001);
            }
        } else if (target_ship || target_x || target_y) {
            fail("Got no target");
        }
    }

    // Fake event
    class FakeEvent extends BaseBattleEvent {
        constructor() {
            super("fake", new Ship());
        }
    }

    describe("BattleLog", function () {
        it("forwards events to subscribers, until unsubscribe", function () {
            var log = new BattleLog();
            var received: BaseBattleEvent[] = [];
            var fake = new FakeEvent();

            var sub = log.subscribe(function (event: BaseBattleEvent) {
                received.push(event);
            });

            log.add(fake);
            expect(received).toEqual([fake]);

            log.add(fake);
            expect(received).toEqual([fake, fake]);

            log.unsubscribe(sub);
            log.add(fake);
            expect(received).toEqual([fake, fake]);
        });

        it("logs ship change events", function () {
            var battle = Battle.newQuickRandom();
            battle.log.clear();
            battle.log.addFilter("value");
            expect(battle.log.events.length).toBe(0);

            battle.advanceToNextShip();
            expect(battle.log.events.length).toBe(1);
            checkEvent(battle.log.events[0], battle.play_order[0], "ship_change", battle.play_order[1]);
        });

        it("can receive simulated initial state events", function () {
            let battle = Battle.newQuickRandom(true, 1, 4);
            let playing = nn(battle.playing_ship);

            let result = battle.getBootstrapEvents();
            expect(result.length).toBe(17);
            for (var i = 0; i < 8; i++) {
                checkEvent(result[i], battle.play_order[i], "move", null,
                    battle.play_order[i].arena_x, battle.play_order[i].arena_y);
            }
            for (var i = 0; i < 8; i++) {
                checkEvent(result[8 + i], battle.play_order[i], "activeeffects");
            }
            checkEvent(result[16], playing, "ship_change", playing);
        });

        it("stop accepting events once the battle is ended", function () {
            let log = new BattleLog();

            log.add(new ValueChangeEvent(new Ship(), new ShipValue("test"), 1));
            log.add(new EndBattleEvent(new BattleOutcome(null)));
            log.add(new ShipChangeEvent(new Ship(), new Ship()));

            expect(log.events.length).toBe(2);
            expect(log.events[0] instanceof ValueChangeEvent).toBe(true);
            expect(log.events[1] instanceof EndBattleEvent).toBe(true);
        });
    });
}
