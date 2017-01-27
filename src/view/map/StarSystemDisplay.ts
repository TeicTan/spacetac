module TS.SpaceTac.View {
    // Group to display a star system
    export class StarSystemDisplay extends Phaser.Image {
        starsystem: Game.Star;

        constructor(parent: UniverseMapView, starsystem: Game.Star) {
            super(parent.game, starsystem.x, starsystem.y, "map-starsystem-background");
            this.anchor.set(0.5, 0.5);

            let scale = this.width;
            this.scale.set(starsystem.radius * 2 / scale);

            this.starsystem = starsystem;

            // Show boundary
            this.addCircle(starsystem.radius);

            // Show locations
            starsystem.locations.forEach(location => {
                if (location.type == Game.StarLocationType.STAR) {
                    this.addImage(location.x, location.y, "map-location-star");
                } else if (location.type == Game.StarLocationType.PLANET) {
                    let planet = this.addImage(location.x, location.y, "map-location-planet");
                    planet.rotation = Math.atan2(location.y, location.x);
                    this.addCircle(Math.sqrt(location.x * location.x + location.y * location.y), 1);
                } else if (location.type == Game.StarLocationType.WARP) {
                    let warp = this.addImage(location.x, location.y, "map-location-warp");
                }
            });
        }

        addImage(x: number, y: number, key: string): Phaser.Image {
            let image = this.game.add.image(x / this.scale.x, y / this.scale.y, key);
            image.anchor.set(0.5, 0.5);
            this.addChild(image);
            return image;
        }

        addCircle(radius, width = 3, color = 0x424242): Phaser.Graphics {
            let circle = this.game.add.graphics(0, 0);
            circle.lineStyle(width, color);
            circle.drawCircle(0, 0, radius * 2 / this.scale.x);
            this.addChild(circle);
            return circle;
        }
    }
}