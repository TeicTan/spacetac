/// <reference path="../BaseView.ts"/>

module TS.SpaceTac.UI {
    /**
     * Interactive map of the universe
     */
    export class UniverseMapView extends BaseView {
        // Displayed universe
        universe = new Universe()

        // Interacting player
        player = new Player()

        // Layers
        layer_universe: Phaser.Group
        layer_overlay: Phaser.Group

        // Star systems
        starsystems: StarSystemDisplay[] = []

        // Links between stars
        starlinks_group: Phaser.Group
        starlinks: Phaser.Graphics[] = []

        // Fleets
        player_fleet: FleetDisplay

        // Frame to highlight current location
        current_location: CurrentLocationMarker

        // Actions for selected location
        actions: MapLocationMenu

        // Character sheet
        character_sheet: CharacterSheet

        // Zoom level
        zoom = 0
        zoom_in: Phaser.Button
        zoom_out: Phaser.Button

        /**
         * Init the view, binding it to a universe
         */
        init(universe: Universe, player: Player) {
            super.init();

            this.universe = universe;
            this.player = player;
        }

        /**
         * Create view graphics
         */
        create() {
            super.create();

            this.layer_universe = this.addLayer("universe");
            this.layer_overlay = this.addLayer("overlay");

            this.starlinks_group = this.game.add.group(this.layer_universe);
            this.starlinks = this.universe.starlinks.map(starlink => {
                let loc1 = starlink.first.getWarpLocationTo(starlink.second);
                let loc2 = starlink.second.getWarpLocationTo(starlink.first);

                let result = new Phaser.Graphics(this.game);
                if (loc1 && loc2) {
                    result.lineStyle(0.01, 0x6cc7ce);
                    result.moveTo(starlink.first.x - 0.5 + loc1.x, starlink.first.y - 0.5 + loc1.y);
                    result.lineTo(starlink.second.x - 0.5 + loc2.x, starlink.second.y - 0.5 + loc2.y);
                }
                result.data.link = starlink;
                return result;
            });
            this.starlinks.forEach(starlink => this.starlinks_group.add(starlink));

            this.player_fleet = new FleetDisplay(this, this.player.fleet);

            this.starsystems = this.universe.stars.map(star => new StarSystemDisplay(this, star));
            this.starsystems.forEach(starsystem => this.layer_universe.add(starsystem));

            this.layer_universe.add(this.player_fleet);

            this.current_location = new CurrentLocationMarker(this, this.player_fleet);
            this.layer_universe.add(this.current_location);

            this.actions = new MapLocationMenu(this);
            this.actions.setPosition(30, 30);
            this.actions.moveToLayer(this.layer_overlay);

            this.zoom_in = new Phaser.Button(this.game, 1540, 172, "map-buttons", () => this.setZoom(this.zoom + 1), undefined, 3, 0);
            this.zoom_in.anchor.set(0.5, 0.5);
            this.layer_overlay.add(this.zoom_in);
            this.tooltip.bindStaticText(this.zoom_in, "Zoom in");
            this.zoom_out = new Phaser.Button(this.game, 1540, 958, "map-buttons", () => this.setZoom(this.zoom - 1), undefined, 4, 1);
            this.zoom_out.anchor.set(0.5, 0.5);
            this.layer_overlay.add(this.zoom_out);
            this.tooltip.bindStaticText(this.zoom_out, "Zoom out");
            let options = new Phaser.Button(this.game, 1436, 69, "map-buttons", () => this.showOptions(), undefined, 5, 2);
            options.angle = -90;
            options.anchor.set(0.5, 0.5);
            this.layer_overlay.add(options);
            this.tooltip.bindStaticText(options, "Game options");

            this.character_sheet = new CharacterSheet(this, this.getWidth() - 307);
            this.character_sheet.show(this.player.fleet.ships[0], false);
            this.character_sheet.hide(false);
            this.layer_overlay.add(this.character_sheet);

            this.gameui.audio.startMusic("spring-thaw");

            // Inputs
            this.inputs.bindCheat("r", "Reveal whole map", () => this.revealAll());

            this.setZoom(2);

            // Trigger an auto-save any time we go back to the map
            this.autoSave();
        }

        /**
         * Leaving the view, unbind and destroy
         */
        shutdown() {
            this.universe = new Universe();
            this.player = new Player();

            super.shutdown();
        }

        /**
         * Refresh the view
         */
        refresh() {
            this.setZoom(this.zoom);
        }

        /**
         * Update info on all star systems (fog of war, available data...)
         */
        updateInfo(current_star: Star | null, interactive = true) {
            this.current_location.setZoom(this.zoom);

            this.starlinks.forEach(linkgraphics => {
                let link = <StarLink>linkgraphics.data.link;
                linkgraphics.visible = this.player.hasVisitedSystem(link.first) || this.player.hasVisitedSystem(link.second);
            })

            this.starsystems.forEach(system => system.updateInfo(this.zoom, system.starsystem == current_star));

            this.actions.setFromLocation(this.player.fleet.location, this);

            if (interactive) {
                this.setInteractionEnabled(true);
            }
        }

        /**
         * Reveal the whole map (this is a cheat)
         */
        revealAll(): void {
            this.universe.stars.forEach(star => {
                star.locations.forEach(location => {
                    this.player.setVisited(location);
                });
            });
            this.refresh();
        }

        /**
         * Set the camera to center on a target, and to display a given span in height
         */
        setCamera(x: number, y: number, span: number, duration = 500, easing = Phaser.Easing.Cubic.InOut) {
            let scale = 1000 / span;
            this.tweens.create(this.layer_universe.position).to({ x: 920 - x * scale, y: 540 - y * scale }, duration, easing).start();
            this.tweens.create(this.layer_universe.scale).to({ x: scale, y: scale }, duration, easing).start();
        }

        /**
         * Set the alpha value for all links
         */
        setLinksAlpha(alpha: number) {
            this.game.add.tween(this.starlinks_group).to({ alpha: alpha }, 500 * Math.abs(this.starlinks_group.alpha - alpha)).start();
        }

        /**
         * Set the current zoom level (0, 1 or 2)
         */
        setZoom(level: number) {
            let current_star = this.player.fleet.location ? this.player.fleet.location.star : null;
            if (!current_star || level <= 0) {
                this.setCamera(0, 0, this.universe.radius * 2);
                this.setLinksAlpha(1);
                this.zoom = 0;
            } else if (level == 1) {
                // TODO Zoom to next-jump accessible
                this.setCamera(current_star.x, current_star.y, this.universe.radius * 0.5);
                this.setLinksAlpha(0.6);
                this.zoom = 1;
            } else {
                this.setCamera(current_star.x, current_star.y, current_star.radius * 2);
                this.setLinksAlpha(0.2);
                this.zoom = 2;
            }

            this.updateInfo(current_star);
        }

        /**
         * Do the jump animation to another system
         * 
         * This will only work if current location is a warp
         */
        doJump(): void {
            let location = this.player.fleet.location;
            if (location && location.type == StarLocationType.WARP && location.jump_dest) {
                let dest_location = location.jump_dest;
                let dest_star = dest_location.star;
                this.player_fleet.moveToLocation(dest_location, 3, duration => {
                    this.timer.schedule(duration / 2, () => this.updateInfo(dest_star, false));
                    this.setCamera(dest_star.x, dest_star.y, dest_star.radius * 2, duration, Phaser.Easing.Cubic.Out);
                }, () => {
                    this.setInteractionEnabled(true);
                });
                this.setInteractionEnabled(false);
            }
        }

        /**
         * Open the dockyard interface
         * 
         * This will only work if current location has a dockyard
         */
        openShop(): void {
            let location = this.player.fleet.location;
            if (location && location.shop) {
                this.character_sheet.setShop(location.shop);
                this.character_sheet.show(this.player.fleet.ships[0]);
            }
        }

        /**
         * Move the fleet to another location
         */
        moveToLocation(dest: StarLocation): void {
            if (dest != this.player.fleet.location) {
                this.setInteractionEnabled(false);
                this.player_fleet.moveToLocation(dest, 1, null, () => this.updateInfo(dest.star));
            }
        }

        /**
         * Set the interactive state
         */
        setInteractionEnabled(enabled: boolean) {
            this.actions.setVisible(enabled && this.zoom == 2, 300);
            this.animations.setVisible(this.zoom_in, enabled && this.zoom < 2, 300);
            this.animations.setVisible(this.zoom_out, enabled && this.zoom > 0, 300);
            this.animations.setVisible(this.character_sheet, enabled, 300);
        }
    }
}
