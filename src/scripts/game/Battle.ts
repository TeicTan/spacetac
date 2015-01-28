module SpaceTac.Game {
    "use strict";

    // A turn-based battle between fleets
    export class Battle {
        // Log of all battle events
        log: BattleLog;

        // List of fleets engaged in battle
        fleets: Fleet[];

        // List of ships, sorted by their initiative throw
        play_order: Ship[];

        // Current ship whose turn it is to play
        playing_ship_index: number;
        playing_ship: Ship;

        // Boolean indicating if its the first turn
        first_turn: boolean;

        // Create a battle between two fleets
        constructor(fleet1: Fleet, fleet2: Fleet) {
            this.log = new BattleLog();
            this.fleets = [fleet1, fleet2];
            this.play_order = [];
            this.playing_ship_index = null;
            this.playing_ship = null;
            this.first_turn = true;
        }

        // Create a quick random battle, for testing purposes
        static newQuickRandom(): Battle {
            var player1 = Player.newQuickRandom("John");
            var player2 = Player.newQuickRandom("Carl");

            var result = new Battle(player1.fleet, player2.fleet);
            result.start();
            return result;
        }

        // Create play order, performing an initiative throw
        throwInitiative(gen: RandomGenerator = new RandomGenerator()): void {
            var play_order: Ship[] = [];

            // Throw each ship's initiative
            this.fleets.forEach(function (fleet: Fleet) {
                fleet.ships.forEach(function (ship: Ship) {
                    ship.throwInitiative(gen);
                    play_order.push(ship);
                });
            });

            // Sort by throw result
            play_order.sort(function (ship1: Ship, ship2: Ship) {
                return (ship2.initiative.current - ship1.initiative.current);
            });
            this.play_order = play_order;
        }

        // Defines the initial ship positions of all engaged fleets
        placeShips(): void {
            this.first_turn = true;
            this.placeFleetShips(this.fleets[0], 100, 100, 0);
            this.placeFleetShips(this.fleets[1], 300, 100, Math.PI);
        }

        // End the current ship turn, passing control to the next one in play order
        //  If at the end of the play order, next turn will start automatically
        //  Member 'play_order' must be defined before calling this function
        advanceToNextShip(log: boolean = true): void {
            var previous_ship = this.playing_ship;

            if (this.play_order.length === 0) {
                this.playing_ship_index = null;
                this.playing_ship = null;
            } else {
                if (this.playing_ship_index == null) {
                    this.playing_ship_index = 0;
                } else {
                    this.playing_ship_index += 1;
                }
                if (this.playing_ship_index >= this.play_order.length) {
                    this.playing_ship_index = 0;
                    this.first_turn = false;
                }
                this.playing_ship = this.play_order[this.playing_ship_index];
            }

            if (this.playing_ship) {
                this.playing_ship.startTurn(this.first_turn);
            }

            if (log) {
                this.log.add(new ShipChangeEvent(previous_ship, this.playing_ship));
            }
        }

        // Start the battle
        //  This will call all necessary initialization steps (initiative, placement...)
        //  This will not add any event to the battle log
        start(): void {
            this.fleets.forEach((fleet: Fleet) => {
                fleet.setBattle(this);
            });
            this.placeShips();
            this.throwInitiative();
            this.play_order.forEach((ship: Ship) => {
                ship.updateAttributes();
                ship.restoreHealth();
            });
            this.advanceToNextShip(false);
        }

        // Force an injection of events in the battle log to simulate the initial state
        //  For instance, this may be called after 'start', to use the log subscription system
        //  to initialize a battle UI
        //  Attributes 'play_order' and 'playing_ship' should be defined before calling this
        injectInitialEvents(): void {
            var log = this.log;

            // Simulate initial ship placement
            this.play_order.forEach((ship: Ship) => {
                log.add(new MoveEvent(ship, ship.arena_x, ship.arena_y));
            });

            // Simulate game turn
            log.add(new ShipChangeEvent(this.playing_ship, this.playing_ship));
        }

        // Defines the initial ship positions for one fleet
        //  x and y are the center of the fleet placement
        //  facing_angle is the forward angle in radians
        private placeFleetShips(fleet: Fleet, x: number, y: number, facing_angle: number): void {
            var side_angle = facing_angle + Math.PI * 0.5;
            var spacing = 50;
            var total_length = spacing * (fleet.ships.length - 1);
            var dx = Math.cos(side_angle);
            var dy = Math.sin(side_angle);
            x -= dx * total_length * 0.5;
            y -= dy * total_length * 0.5;
            for (var i = 0; i < fleet.ships.length; i++) {
                fleet.ships[i].setArenaPosition(x + i * dx * spacing, y + i * dy * spacing);
                fleet.ships[i].setArenaFacingAngle(facing_angle);
            }
        }
    }
}
