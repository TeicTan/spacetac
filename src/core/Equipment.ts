module TS.SpaceTac {
    /**
     * Quality of loot.
     */
    export enum EquipmentQuality {
        WEAK,
        COMMON,
        FINE,
        PREMIUM,
        LEGENDARY
    }

    // Piece of equipment to attach in slots
    export class Equipment {
        // Type of slot this equipment can fit in
        slot_type: SlotType | null

        // Actual slot this equipment is attached to
        attached_to: Slot | null = null

        // Identifiable equipment code (may be used by UI to customize visual effects)
        code: string

        // Equipment name
        name: string

        // Equipment generic description
        description = ""

        // Indicative equipment level
        level = 1

        // Indicative equipment quality
        quality = EquipmentQuality.COMMON

        // Base price
        price = 0

        // Minimum skills to be able to equip this
        requirements: { [key: string]: number } = {}

        // Permanent effects on the ship that equips this
        effects: BaseEffect[] = []

        // Action available when equipped
        action = new BaseAction("nothing", "Do nothing", false)

        // Equipment wear due to usage in battles (will lower the sell price)
        wear = 0

        // Basic constructor
        constructor(slot: SlotType | null = null, code = "equipment") {
            this.slot_type = slot;
            this.code = code;
            this.name = code;
        }

        jasmineToString() {
            return this.attached_to ? `${this.attached_to.ship.name} - ${this.name}` : this.name;
        }

        /**
         * Get the fully qualified name (e.g. "Level 4 Strong Ray of Death")
         */
        getFullName(): string {
            let name = this.name;
            if (this.quality != EquipmentQuality.COMMON) {
                name = capitalize(EquipmentQuality[this.quality].toLowerCase()) + " " + name;
            }
            return `Level ${this.level} ${name}`;
        }

        /**
         * Get the full textual description for this equipment (without the full name).
         */
        getFullDescription(): string {
            let requirements: string[] = [];
            iteritems(this.requirements, (skill, value) => {
                if (value > 0) {
                    requirements.push(`- ${SHIP_ATTRIBUTES[skill].name} ${value}`);
                }
            });

            let description = this.getEffectsDescription();
            if (this.description) {
                description += "\n\n" + this.description;
            }
            if (requirements.length > 0) {
                description = "Requires:\n" + requirements.join("\n") + "\n\n" + description;
            }
            if (this.wear > 0) {
                description = (this.wear >= 100 ? "Worn" : "Second hand") + "\n\n" + description;
            }
            return description;
        }

        /**
         * Get the minimum level at which the requirements in skill may be fulfilled.
         * 
         * This is informative and is not directly enforced. It will only be enforced by skills requirements.
         */
        getMinimumLevel(): number {
            let points = sum(values(this.requirements));
            return ShipLevel.getLevelForPoints(points);
        }

        /**
         * Get the equipment price value.
         */
        getPrice(): number {
            return Math.floor(this.price * 100 / (100 + this.wear));
        }

        /**
         * Returns true if the equipment can be equipped on a ship.
         * 
         * This checks *requirements* against the ship skills.
         * 
         * This does not check where the equipment currently is (except if is it already attached and should be detached first).
         */
        canBeEquipped(ship: Ship): boolean {
            if (this.attached_to) {
                return false;
            } else {
                var able = true;
                iteritems(this.requirements, (attr, minvalue) => {
                    if (ship.getAttribute(<keyof ShipAttributes>attr) < minvalue) {
                        able = false;
                    }
                });
                return able;
            }
        }

        /**
         * Detach from the slot it is attached to
         */
        detach(): void {
            if (this.attached_to) {
                this.attached_to.attached = null;
                this.attached_to = null;
            }
        }

        /**
         * Get a human readable description of the effects of this equipment
         */
        getEffectsDescription(): string {
            let parts: string[] = [];

            if (this.effects.length > 0) {
                parts.push(["When equipped:"].concat(this.effects.map(effect => "- " + effect.getDescription())).join("\n"));
            }

            let action_desc = this.action.getEffectsDescription();
            if (action_desc != "") {
                parts.push(action_desc);
            }

            return parts.length > 0 ? parts.join("\n\n") : "does nothing";
        }

        /**
         * Add equipment wear
         */
        addWear(factor: number): void {
            this.wear += factor;
        }
    }
}
