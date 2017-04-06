/// <reference path="CharacterEquipment.ts" />

module TS.SpaceTac.UI {
    /**
     * Display a fleet member in the side of character sheet
     */
    export class CharacterFleetMember extends Phaser.Button implements CharacterEquipmentContainer {
        sheet: CharacterSheet;
        ship: Ship;
        levelup: Phaser.Image;

        constructor(sheet: CharacterSheet, x: number, y: number, ship: Ship) {
            super(sheet.game, x, y, "character-ship", () => sheet.show(ship));
            this.anchor.set(0.5, 0.5);

            this.sheet = sheet;
            this.ship = ship;

            let portrait_pic = new Phaser.Image(this.game, 0, 0, `ship-${ship.model}-portrait`);
            portrait_pic.anchor.set(0.5, 0.5);
            this.addChild(portrait_pic);

            this.levelup = new Phaser.Image(this.game, this.width / 2 - 40, -this.height / 2 + 40, "character-upgrade-available");
            this.levelup.anchor.set(1, 0);
            this.levelup.visible = this.ship.getAvailableUpgradePoints() > 0;
            this.addChild(this.levelup);

            sheet.view.tooltip.bindDynamicText(this, () => ship.name);
        }

        /**
         * Set the selected state of the ship
         */
        setSelected(selected: boolean) {
            this.loadTexture(selected ? "character-ship-selected" : "character-ship");
            Animation.setVisibility(this.game, this.levelup, this.ship.getAvailableUpgradePoints() > 0, 200);
        }

        /**
         * CharacterEquipmentContainer interface
         */
        isInside(x: number, y: number): boolean {
            return this.getBounds().contains(x, y);
        }
        getEquipmentAnchor(): { x: number, y: number, scale: number } {
            // not needed, equipment is never shown snapped in the slot
            return { x: 0, y: 0, scale: 1 };
        }
        getPriceOffset(): number {
            return 0;
        }
        addEquipment(equipment: CharacterEquipment, source: CharacterEquipmentContainer | null, test: boolean): boolean {
            if (this.ship != this.sheet.ship && equipment.item.slot !== null) {
                let slot = this.ship.getFreeSlot(equipment.item.slot);
                if (slot) {
                    if (test) {
                        return true;
                    } else {
                        return this.ship.equip(equipment.item, false);
                    }
                } else {
                    if (this.ship.getFreeCargoSpace() > 0) {
                        if (test) {
                            return true;
                        } else {
                            return this.ship.addCargo(equipment.item);
                        }
                    } else {
                        return false;
                    }
                }
            } else {
                return false;
            }
        }
        removeEquipment(equipment: CharacterEquipment, destination: CharacterEquipmentContainer | null, test: boolean): boolean {
            // should never happen
            return false;
        }
    }
}
