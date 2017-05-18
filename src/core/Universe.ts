module TS.SpaceTac {
    /**
     * Main game universe
     */
    export class Universe {
        // List of star systems
        stars: Star[] = []

        // List of links between star systems
        starlinks: StarLink[] = []

        // Radius of the universe
        radius = 5

        // Source of randomness
        random = RandomGenerator.global;

        // Generates a universe, with star systems and such
        generate(starcount = 50): void {
            while (this.stars.length == 0 || any(this.stars, star => star.getLinks().length == 0)) {
                this.stars = this.generateStars(starcount);

                let links = this.getPotentialLinks();
                this.starlinks = this.filterCrossingLinks(links);
            }

            this.generateWarpLocations();

            this.stars.forEach((star: Star) => {
                star.generate();
            });

            this.setEncounterLevels();

            this.addShops();
        }

        // Generate a given number of stars, not too crowded
        generateStars(count: number): Star[] {
            var result: Star[] = [];

            var names = new NameGenerator(Star.NAMES_POOL);

            while (count) {
                var x = this.random.random() * this.radius * 2.0 - this.radius;
                var y = this.random.random() * this.radius * 2.0 - this.radius;
                var star = new Star(this, x, y);

                var nearest = this.getNearestTo(star, result);
                if (nearest && nearest.getDistanceTo(star) < this.radius * 0.1) {
                    continue;
                }

                star.name = names.getName() || "Star";
                result.push(star);

                count--;
            }

            return result;
        }

        // Get a list of potential links between the stars
        getPotentialLinks(): StarLink[] {
            var result: StarLink[] = [];

            this.stars.forEach((first: Star, idx1: number) => {
                this.stars.forEach((second: Star, idx2: number) => {
                    if (idx1 < idx2) {
                        if (first.getDistanceTo(second) < this.radius * 0.6) {
                            result.push(new StarLink(first, second));
                        }
                    }
                });
            });

            return result;
        }

        // Filter a list of potential links to avoid crossing ones
        filterCrossingLinks(links: StarLink[]): StarLink[] {
            var result: StarLink[] = [];

            links.forEach((link1: StarLink) => {
                var crossed = false;
                links.forEach((link2: StarLink) => {
                    if (link1 !== link2 && link1.isCrossing(link2) && link1.getLength() >= link2.getLength()) {
                        crossed = true;
                    }
                });
                if (!crossed) {
                    result.push(link1);
                }
            });

            return result;
        }

        // Generate warp locations for the links between stars
        generateWarpLocations() {
            this.starlinks.forEach(link => {
                let warp1 = link.first.generateWarpLocationTo(link.second, this.random);
                let warp2 = link.second.generateWarpLocationTo(link.first, this.random);

                warp1.setJumpDestination(warp2);
                warp2.setJumpDestination(warp1);
            });

        }

        // Get the star nearest to another
        getNearestTo(star: Star, others = this.stars): Star | null {
            if (others.length === 0) {
                return null;
            } else {
                var mindist = this.radius * 2.0;
                var nearest: Star | null = null;
                others.forEach((istar: Star) => {
                    if (istar !== star) {
                        var dist = star.getDistanceTo(istar);
                        if (dist < mindist) {
                            nearest = istar;
                            mindist = dist;
                        }
                    }
                });
                return nearest;
            }
        }

        // Check if a link exists between two stars
        areLinked(first: Star, second: Star): boolean {
            var result = false;
            this.starlinks.forEach((link: StarLink) => {
                if (link.isLinking(first, second)) {
                    result = true;
                }
            });
            return result;
        }

        // Add a link between two stars
        addLink(first: Star, second: Star): void {
            if (!this.areLinked(first, second)) {
                this.starlinks.push(new StarLink(first, second));
            }
        }

        /**
         * Set the average level of encounters in each system
         */
        setEncounterLevels(maximal?: number) {
            if (!maximal) {
                maximal = Math.min(99, Math.ceil(Math.sqrt(this.stars.length)));
            }

            // Reset levels
            this.stars.forEach(star => star.level = 1);

            // Choose two systems to be the lowest and highest danger zones (not connected directly)
            let lowest = this.random.choice(this.stars.filter(star => star.getLinks().length > 1));
            let highest = this.random.choice(this.stars.filter(star => star != lowest && !star.getLinkTo(lowest)));
            highest.level = maximal;

            // Make danger gradients
            range(this.stars.length).forEach(() => {
                this.stars.forEach(star => {
                    if (star != lowest && star != highest) {
                        let neighbors = star.getLinks().map(link => nn(link.getPeer(star)));
                        let minlevel = min(neighbors.map(neighbor => neighbor.level));
                        let maxlevel = max(neighbors.map(neighbor => neighbor.level));
                        star.level = (minlevel + maxlevel) / 2;
                    }
                });
            });

            // Round levels
            this.stars.forEach(star => star.level = Math.round(star.level));
        }

        /**
         * Add random shops
         */
        addShops(): void {
            this.stars.forEach(star => {
                star.locations.forEach(location => {
                    if (this.random.random() > 0.6) {
                        location.addShop(star.level);
                    }
                });
            });
        }

        /**
         * Get a good start location
         */
        getStartLocation(): StarLocation {
            let stars = acopy(this.stars);
            stars.sort((a, b) => cmp(a.level, b.level));
            return stars[0].locations[0];
        }
    }
}
