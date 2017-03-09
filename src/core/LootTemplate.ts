module TS.SpaceTac {
    // Template used to generate a loot equipment
    export class LootTemplate {
        // Type of slot this equipment will fit in
        slot: SlotType;

        // Base name that will be given to generated equipment
        name: string;

        // Capability requirement ranges (indexed by attributes)
        requirements: { [key: string]: IntegerRange };

        // Distance to target
        distance: Range;

        // Effect area's radius
        blast: Range;

        // Duration, in number of turns
        duration: IntegerRange;

        // Permanent effects (when attached to an equipment slot)
        permanent_effects: EffectTemplate[];

        // Effects on target
        target_effects: EffectTemplate[];

        // Action Points usage
        ap_usage: Range;

        // Level requirement
        min_level: IntegerRange;

        // Create a loot template
        constructor(slot: SlotType, name: string) {
            this.slot = slot;
            this.name = name;
            this.requirements = {};
            this.distance = new Range(0, 0);
            this.blast = new Range(0, 0);
            this.duration = new IntegerRange(0, 0);
            this.ap_usage = new IntegerRange(0, 0);
            this.min_level = new IntegerRange(0, 0);
            this.permanent_effects = [];
            this.target_effects = [];
        }

        // Set a capability requirement
        addRequirement(capability: keyof ShipAttributes, min: number, max: number | null = null): void {
            this.requirements[capability] = new IntegerRange(min, max);
        }

        // Generate a random equipment with this template
        generate(random = RandomGenerator.global): Equipment {
            var power = random.random();
            return this.generateFixed(power);
        }

        // Generate a fixed-power equipment with this template
        generateFixed(power: number): Equipment {
            var result = new Equipment();

            result.slot = this.slot;
            result.code = (this.name || "").toLowerCase().replace(/ /g, "");
            result.name = this.name;

            result.distance = this.distance.getProportional(power);
            result.blast = this.blast.getProportional(power);
            result.duration = this.duration.getProportional(power);
            result.ap_usage = this.ap_usage.getProportional(power);
            result.min_level = this.min_level.getProportional(power);

            let action = this.getActionForEquipment(result)
            if (action) {
                result.action = action;
            }

            iteritems(this.requirements, (key: string, requirement: IntegerRange) => {
                if (requirement) {
                    result.requirements[key] = requirement.getProportional(power);
                }
            });

            this.permanent_effects.forEach((eff_template: EffectTemplate) => {
                result.permanent_effects.push(eff_template.generateFixed(power));
            });
            this.target_effects.forEach((eff_template: EffectTemplate) => {
                result.target_effects.push(eff_template.generateFixed(power));
            });

            return result;
        }

        // Find the power range that will result in the level range
        getPowerRangeForLevel(level: IntegerRange): Range | null {
            if (level.min > this.min_level.max || level.max < this.min_level.min) {
                return null;
            } else {
                var min: number;
                var max: number;

                if (level.min <= this.min_level.min) {
                    min = 0.0;
                } else {
                    min = this.min_level.getReverseProportional(level.min);
                }
                if (level.max >= this.min_level.max) {
                    max = 1.0;
                } else {
                    max = this.min_level.getReverseProportional(level.max + 1);
                }

                return new Range(min, max);
            }
        }

        // Generate an equipment that will have its level requirement in the given range
        //  May return null if level range is not compatible with the template
        generateInLevelRange(level: IntegerRange, random = RandomGenerator.global): Equipment | null {
            var random_range = this.getPowerRangeForLevel(level);
            if (random_range) {
                var power = random.random() * (random_range.max - random_range.min) + random_range.min;
                return this.generateFixed(power);
            } else {
                return null;
            }
        }

        /**
         * Convenience function to add a modulated effect to the equipment
         */
        addEffect(effect: BaseEffect, min_value: number, max_value: number | null = null, target = true) {
            var template = new EffectTemplate(effect);
            template.addModifier("value", new IntegerRange(min_value, max_value));
            if (target) {
                this.target_effects.push(template);
            } else {
                this.permanent_effects.push(template);
            }
        }

        /**
         * Convenience function to add a modulated sticky effect to the equipment
         */
        addStickyEffect(effect: BaseEffect, min_value: number, max_value: number | null = null, min_duration: number = 1,
            max_duration: number | null = null, on_stick = false, on_turn_start = false, target = true): void {
            var template = new EffectTemplate(new StickyEffect(effect, 0, on_stick, on_turn_start));
            template.addModifier("value", new IntegerRange(min_value, max_value));
            template.addModifier("duration", new IntegerRange(min_duration, max_duration));
            if (target) {
                this.target_effects.push(template);
            } else {
                this.permanent_effects.push(template);
            }
        }

        /**
         * Convenience function to add damage on target, immediate or over time
         */
        addDamage(min_value: number, max_value: number | null = null, min_duration: number | null = null, max_duration: number | null = null) {
            if (min_duration != null) {
                this.addStickyEffect(new DamageEffect(), min_value, max_value, min_duration, max_duration, true, false, true);
            } else {
                this.addEffect(new DamageEffect(), min_value, max_value, true);
            }
        }

        /**
         * Convenience function to add an attribute on the ship that equips the loot
         */
        increaseAttribute(attribute: keyof ShipAttributes, min_value: number, max_value: number | null = null) {
            this.addEffect(new AttributeEffect(attribute), min_value, max_value, false);
        }

        /**
         * Set the power consumption
         */
        setPowerConsumption(minimal: number, maximal: number | null = null) {
            this.ap_usage = new IntegerRange(minimal, maximal);
        }

        // Method to reimplement to assign an action to a generated equipment
        protected getActionForEquipment(equipment: Equipment): BaseAction | null {
            return null;
        }
    }
}
