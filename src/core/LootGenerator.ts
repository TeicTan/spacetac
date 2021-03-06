module TK.SpaceTac {
    /**
     * Equipment generator from loot templates
     * 
     * Loot templates are automatically populated from the "SpaceTac.Equipments" namespace
     */
    export class LootGenerator {
        // List of available templates
        templates: LootTemplate[]

        // Random generator that will be used
        random: RandomGenerator

        // Filter to select a subset of templates
        templatefilter: (template: LootTemplate) => boolean

        constructor(random = RandomGenerator.global, populate: boolean = true) {
            this.templates = [];
            this.random = random;
            this.templatefilter = () => true;

            if (populate) {
                this.populate();
            }
        }

        /**
         * Set the template filter for next generations
         */
        setTemplateFilter(filter: (template: LootTemplate) => boolean) {
            this.templatefilter = filter;
        }

        // Fill the list of templates
        populate(): void {
            let templates: LootTemplate[] = [];
            let namespace: any = TK.SpaceTac.Equipments;
            for (var template_name in namespace) {
                if (template_name && template_name.indexOf("Abstract") != 0) {
                    let template_class = namespace[template_name];
                    let template: LootTemplate = new template_class();
                    templates.push(template);
                }
            }
            this.templates = templates;
        }

        // Generate a random equipment for a specific level
        //  If slot is specified, it will generate an equipment for this slot type specifically
        //  If no equipment could be generated from available templates, null is returned
        generate(level: number, quality = EquipmentQuality.COMMON, slot: SlotType | null = null): Equipment | null {
            // Generate equipments matching conditions, with each template
            let templates = this.templates.filter(this.templatefilter).filter(template => slot == null || slot == template.slot);
            let equipments = templates.map(template => template.generate(level, quality, this.random));

            // No equipment could be generated with given conditions
            if (equipments.length === 0) {
                return null;
            }

            // Pick a random equipment
            return this.random.choice(equipments);
        }

        /**
         * Generate a random equipment of highest level, from a given set of skills
         */
        generateHighest(skills: ShipSkills, quality = EquipmentQuality.COMMON, slot: SlotType | null = null): Equipment | null {
            let templates = this.templates.filter(this.templatefilter).filter(template => slot == null || slot == template.slot);
            let candidates = nna(templates.map(template => template.generateHighest(skills, quality, this.random)));
            if (candidates.length) {
                let chosen = this.random.weighted(candidates.map(equ => equ.level));
                return candidates[chosen];
            } else {
                return null;
            }
        }
    }
}
