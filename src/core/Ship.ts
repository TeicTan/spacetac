/// <reference path="ShipAttribute.ts"/>
/// <reference path="ShipValue.ts"/>

module TS.SpaceTac {

    /**
     * Set of ShipAttribute for a ship
     */
    export class ShipAttributes {
        // Attribute controlling the play order
        initiative = new ShipAttribute("initiative")
        // Maximal hull value
        hull_capacity = new ShipAttribute("hull capacity")
        // Maximal shield value
        shield_capacity = new ShipAttribute("shield capacity")
        // Maximal power value
        power_capacity = new ShipAttribute("power capacity")
        // Initial power value at the start of a battle
        power_initial = new ShipAttribute("initial power")
        // Power value recovered each turn
        power_recovery = new ShipAttribute("power recovery")
        // Skills
        skill_material = new ShipAttribute("material skill")
        skill_energy = new ShipAttribute("energy skill")
        skill_electronics = new ShipAttribute("electronics skill")
        skill_human = new ShipAttribute("human skill")
        skill_time = new ShipAttribute("time skill")
        skill_gravity = new ShipAttribute("gravity skill")
    }

    /**
     * Set of ShipValue for a ship
     */
    export class ShipValues {
        hull = new ShipValue("hull")
        shield = new ShipValue("shield")
        power = new ShipValue("power")
    }

    /**
     * Static attributes and values object for name queries
     */
    export const SHIP_ATTRIBUTES = new ShipAttributes();
    export const SHIP_VALUES = new ShipValues();

    /**
     * A single ship in a fleet
     */
    export class Ship {
        // Fleet this ship is a member of
        fleet: Fleet

        // Level of this ship
        level: number

        // Name of the ship
        name: string

        // Code of the ShipModel used to create it
        model: string

        // Flag indicating if the ship is alive
        alive: boolean

        // Position in the arena
        arena_x: number
        arena_y: number

        // Facing direction in the arena
        arena_angle: number

        // Sticky effects that applies a given number of times
        sticky_effects: StickyEffect[]

        // List of slots, able to contain equipment
        slots: Slot[]

        // Ship attributes
        attributes = new ShipAttributes()

        // Ship values
        values = new ShipValues()

        // Boolean set to true if the ship is currently playing its turn
        playing = false

        // Priority in play_order
        play_priority = 0;

        // Create a new ship inside a fleet
        constructor(fleet: Fleet = null, name: string = null) {
            this.fleet = fleet || new Fleet();
            this.level = 1;
            this.name = name;
            this.model = "default";
            this.alive = true;
            this.sticky_effects = [];
            this.slots = [];

            this.attributes.initiative.set(1);  // TODO Should not be needed

            this.arena_x = 0;
            this.arena_y = 0;
            this.arena_angle = 0;

            if (fleet) {
                fleet.addShip(this);
            }
        }

        // Returns true if the ship is able to play
        //  If *check_ap* is true, ap_current=0 will make this function return false
        isAbleToPlay(check_ap: boolean = true): boolean {
            var ap_checked = !check_ap || this.values.power.get() > 0;
            return this.alive && ap_checked;
        }

        // Set position in the arena
        //  This does not consumes action points
        setArenaPosition(x: number, y: number) {
            this.arena_x = x;
            this.arena_y = y;
        }

        // Set facing angle in the arena
        setArenaFacingAngle(angle: number) {
            this.arena_angle = angle;
        }

        // String repr
        jasmineToString(): string {
            return "Ship " + this.name;
        }

        // Make an initiative throw, to resolve play order in a battle
        throwInitiative(gen: RandomGenerator): void {
            this.play_priority = gen.throw(this.attributes.initiative.get());
        }

        // Return the player owning this ship
        getPlayer(): Player {
            if (this.fleet) {
                return this.fleet.player;
            } else {
                return null;
            }
        }

        // get the current battle this ship is engaged in
        getBattle(): Battle {
            if (this.fleet) {
                return this.fleet.battle;
            } else {
                return null;
            }
        }

        // Get the list of actions available
        //  This list does not filter out actions unavailable due to insufficient AP, it only filters out
        //  actions that are not allowed/available at all on the ship
        getAvailableActions(): BaseAction[] {
            var actions: BaseAction[] = [];

            this.slots.forEach((slot: Slot) => {
                if (slot.attached && slot.attached.action) {
                    actions.push(slot.attached.action);
                }
            });

            actions.push(new EndTurnAction());
            return actions;
        }

        // Add an event to the battle log, if any
        addBattleEvent(event: BaseLogEvent): void {
            var battle = this.getBattle();
            if (battle && battle.log) {
                battle.log.add(event);
            }
        }

        /**
         * Get a ship value
         */
        getValue(name: keyof ShipValues): number {
            return this.values[name].get();
        }

        /**
         * Set a ship value
         * 
         * If *offset* is true, the value will be added to current value.
         * If *log* is true, an attribute event will be added to the battle log
         * 
         * Returns true if the value changed.
         */
        setValue(name: keyof ShipValues, value: number, offset = false, log = true): boolean {
            let changed: boolean;
            let val = this.values[name];

            if (offset) {
                changed = val.add(value);
            } else {
                changed = val.set(value);
            }

            if (changed && log) {
                this.addBattleEvent(new ValueChangeEvent(this, val));
            }

            return changed;
        }

        /**
         * Get a ship attribute's current value
         */
        getAttribute(name: keyof ShipAttributes): number {
            return this.attributes[name].get();
        }

        /**
         * Set a ship attribute
         * 
         * If *log* is true, an attribute event will be added to the battle log
         * 
         * Returns true if the value changed.
         */
        setAttribute(name: keyof ShipAttributes, value: number, log = true): boolean {
            let changed: boolean;
            let attr = this.attributes[name];

            changed = attr.set(value);

            // TODO more generic
            if (name == "power_capacity") {
                this.values.power.setMaximal(attr.get());
            } else if (name == "shield_capacity") {
                this.values.shield.setMaximal(attr.get());
            } else if (name == "hull_capacity") {
                this.values.hull.setMaximal(attr.get());
            }

            if (changed && log) {
                this.addBattleEvent(new ValueChangeEvent(this, attr));
            }

            return changed;
        }

        // Initialize the action points counter
        //  This should be called once at the start of a battle
        //  If no value is provided, the attribute ap_initial will be used
        initializeActionPoints(value: number = null): void {
            if (value === null) {
                value = this.attributes.power_initial.get();
            }
            this.setValue("power", value);
        }

        // Recover action points
        //  This should be called once at the end of a turn
        //  If no value is provided, the current attribute ap_recovery will be used
        recoverActionPoints(value: number = null): void {
            if (value === null) {
                value = this.attributes.power_recovery.get();
            }
            this.setValue("power", value, true);
        }

        // Consumes action points
        useActionPoints(value: number): void {
            this.setValue("power", -value, true);
        }

        // Call a method for each drone of the battlefield
        forEachDrone(callback: (drone: Drone) => any) {
            let battle = this.getBattle();
            if (battle) {
                battle.drones.forEach(callback);
            }
        }

        // Method called at the start of battle
        startBattle() {
            this.updateAttributes();
            this.restoreHealth();
            this.initializeActionPoints();
        }

        // Method called at the start of this ship turn
        startTurn(): void {
            if (this.playing) {
                console.error("startTurn called twice", this);
                return;
            }
            this.playing = true;

            // Recompute attributes
            this.updateAttributes();

            // Apply sticky effects
            this.sticky_effects.forEach(effect => effect.startTurn(this));
            this.cleanStickyEffects();

            // Broadcast to drones
            this.forEachDrone(drone => drone.onTurnStart(this));
        }

        // Method called at the end of this ship turn
        endTurn(): void {
            if (!this.playing) {
                console.error("endTurn called before startTurn", this);
                return;
            }
            this.playing = false;

            // Broadcast to drones
            this.forEachDrone(drone => drone.onTurnEnd(this));

            // Recover action points for next turn
            this.updateAttributes();
            this.recoverActionPoints();

            // Apply sticky effects
            this.sticky_effects.forEach(effect => effect.endTurn(this));
            this.cleanStickyEffects();
        }

        /**
         * Register a sticky effect
         * 
         * Pay attention to pass a copy, not the original equipment effect, because it will be modified
         */
        addStickyEffect(effect: StickyEffect, log = true): void {
            this.sticky_effects.push(effect);
            if (log) {
                this.addBattleEvent(new EffectAddedEvent(this, effect));
            }
        }

        /**
         * Clean sticky effects that are no longer active
         */
        cleanStickyEffects() {
            let [active, ended] = binpartition(this.sticky_effects, effect => effect.duration > 0);
            this.sticky_effects = active;
            ended.forEach(effect => this.addBattleEvent(new EffectRemovedEvent(this, effect)));
        }

        /**
         * Check if the ship is inside a given circular area
         */
        isInCircle(x: number, y: number, radius: number): boolean {
            let dx = this.arena_x - x;
            let dy = this.arena_y - y;
            let distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        }

        // Move toward a location
        //  This does not check or consume action points
        moveTo(x: number, y: number, log: boolean = true): void {
            var angle = Math.atan2(y - this.arena_y, x - this.arena_x);
            this.setArenaFacingAngle(angle);

            this.setArenaPosition(x, y);

            if (log) {
                this.addBattleEvent(new MoveEvent(this, x, y));
            }

            // Broadcast to drones
            this.forEachDrone(drone => drone.onShipMove(this));
        }

        // Set the death status on this ship
        setDead(log: boolean = true): void {
            this.alive = false;
            if (log) {
                this.addBattleEvent(new DeathEvent(this));
            }
        }

        // Apply damages to hull and/or shield
        addDamage(hull: number, shield: number, log: boolean = true): void {
            this.setValue("shield", -shield, true, log);
            this.setValue("hull", -hull, true, log);

            if (log) {
                this.addBattleEvent(new DamageEvent(this, hull, shield));
            }

            if (this.values.hull.get() === 0) {
                // Ship is dead
                this.setDead(log);
            }
        }

        // Add an empty equipment slot of the given type
        addSlot(type: SlotType): Slot {
            var result = new Slot(this, type);
            this.slots.push(result);
            return result;
        }

        // List all attached equipments of a given type (all types if null)
        listEquipment(slottype: SlotType = null): Equipment[] {
            var result: Equipment[] = [];

            this.slots.forEach((slot: Slot) => {
                if (slot.type === slottype && slot.attached) {
                    result.push(slot.attached);
                }
            });

            return result;
        }

        // Get the number of attached equipments
        getEquipmentCount(): number {
            var result = 0;
            this.slots.forEach((slot: Slot) => {
                if (slot.attached) {
                    result++;
                }
            });
            return result;
        }

        // Get a random attached equipment, null if no equipment is attached
        getRandomEquipment(random: RandomGenerator = new RandomGenerator()): Equipment {
            var count = this.getEquipmentCount();
            if (count === 0) {
                return null;
            } else {
                var picked = random.throwInt(0, count - 1);
                var result: Equipment = null;
                var index = 0;
                this.slots.forEach((slot: Slot) => {
                    if (slot.attached) {
                        if (index === picked) {
                            result = slot.attached;
                        }
                        index++;
                    }
                });
                return result;
            }
        }

        // Update attributes, taking into account attached equipment and active effects
        updateAttributes(): void {
            // Sum all attribute effects
            var new_attrs = new ShipAttributes();
            this.collectEffects("attr").forEach((effect: AttributeEffect) => {
                new_attrs[effect.attrcode].add(effect.value);
            });

            // Apply limit attributes
            this.collectEffects("attrlimit").forEach((effect: AttributeLimitEffect) => {
                new_attrs[effect.attrcode].setMaximal(effect.value);
            });

            // TODO better typing
            iteritems(<any>new_attrs, (key, value) => {
                this.setAttribute(<keyof ShipAttributes>key, (<ShipAttribute>value).get());
            });
        }

        // Fully restore hull and shield
        restoreHealth(): void {
            this.values.hull.set(this.attributes.hull_capacity.get());
            this.values.shield.set(this.attributes.shield_capacity.get());
        }

        // Collect all effects to apply for updateAttributes
        private collectEffects(code: string): BaseEffect[] {
            var result: BaseEffect[] = [];

            this.slots.forEach(slot => {
                if (slot.attached) {
                    slot.attached.permanent_effects.forEach(effect => {
                        if (effect.code == code) {
                            result.push(effect);
                        }
                    });
                }
            });

            this.sticky_effects.forEach(effect => {
                if (effect.base.code == code) {
                    result.push(effect.base);
                }
            });

            return result;
        }
    }
}