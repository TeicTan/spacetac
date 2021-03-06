/// <reference path="../BaseView.ts"/>

module TK.SpaceTac.UI {
    /**
     * View to configure the initial characters in the fleet
     */
    export class FleetCreationView extends BaseView {
        built_fleet: Fleet
        infinite_shop: Shop
        character_sheet: CharacterSheet

        create() {
            super.create();

            let models = ShipModel.getRandomModels(2);

            this.built_fleet = new Fleet();
            this.built_fleet.addShip(new Ship(null, "First", models[0]));
            this.built_fleet.addShip(new Ship(null, "Second", models[1]));
            this.built_fleet.credits = this.built_fleet.ships.length * 1000;

            let basic_equipments = () => {
                let generator = new LootGenerator();
                let equipments = generator.templates.map(template => template.generate(1));
                return sortedBy(equipments, equipment => equipment.slot_type);
            }
            this.infinite_shop = new Shop(1, basic_equipments(), 0, basic_equipments);

            this.character_sheet = new CharacterSheet(this, undefined, undefined, () => this.validateFleet());
            this.character_sheet.setShop(this.infinite_shop, "Available stock (from Master Merchant Guild)");
            this.character_sheet.show(this.built_fleet.ships[0], false);
            this.getLayer("characters").add(this.character_sheet);
        }

        /**
         * Validate the configured fleet and move on
         */
        async validateFleet() {
            let confirmed = await UIConfirmDialog.ask(this, "Do you confirm these initial fleet settings ?");
            if (confirmed) {
                this.session.setCampaignFleet(this.built_fleet, this.session.hasUniverse());
                this.backToRouter();
            }
        }
    }
}
