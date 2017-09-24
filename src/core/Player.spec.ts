module TK.SpaceTac {
    describe("Player", function () {
        it("keeps track of visited locations", function () {
            let player = new Player();
            let star1 = new Star();
            let star2 = new Star();
            let loc1a = new StarLocation(star1);
            let loc1b = new StarLocation(star1);
            let loc2a = new StarLocation(star2);
            let loc2b = new StarLocation(star2);

            function checkVisited(s1 = false, s2 = false, v1a = false, v1b = false, v2a = false, v2b = false) {
                expect(player.hasVisitedSystem(star1)).toBe(s1);
                expect(player.hasVisitedSystem(star2)).toBe(s2);
                expect(player.hasVisitedLocation(loc1a)).toBe(v1a);
                expect(player.hasVisitedLocation(loc1b)).toBe(v1b);
                expect(player.hasVisitedLocation(loc2a)).toBe(v2a);
                expect(player.hasVisitedLocation(loc2b)).toBe(v2b);
            }

            checkVisited();

            player.setVisited(loc1b);

            checkVisited(true, false, false, true, false, false);

            player.setVisited(loc1a);

            checkVisited(true, false, true, true, false, false);

            player.setVisited(loc2a);

            checkVisited(true, true, true, true, true, false);

            player.setVisited(loc2a);

            checkVisited(true, true, true, true, true, false);
        });

        it("reverts battle", function () {
            let player = new Player();
            let star = new Star();
            let loc1 = new StarLocation(star);
            loc1.clearEncounter();
            let loc2 = new StarLocation(star);
            loc2.encounter_random = new SkewedRandomGenerator([0], true);

            player.fleet.setLocation(loc1);
            expect(player.getBattle()).toBeNull();
            expect(player.fleet.location).toBe(loc1);

            player.fleet.setLocation(loc2);
            expect(player.getBattle()).not.toBeNull();
            expect(player.fleet.location).toBe(loc2);
            expect(player.hasVisitedLocation(loc2)).toBe(true);
            let enemy = loc2.encounter;

            player.revertBattle();
            expect(player.getBattle()).toBeNull();
            expect(player.fleet.location).toBe(loc1);
            expect(player.hasVisitedLocation(loc2)).toBe(true);

            player.fleet.setLocation(loc2);
            expect(player.getBattle()).not.toBeNull();
            expect(player.fleet.location).toBe(loc2);
            expect(player.hasVisitedLocation(loc2)).toBe(true);
            expect(nn(player.getBattle()).fleets[1]).toBe(nn(enemy));
        });
    });
}