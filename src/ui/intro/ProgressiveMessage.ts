module TS.SpaceTac.UI {
    /**
     * Rectangle to display a message that may appear progressively, as in dialogs
     */
    export class ProgressiveMessage extends UIComponent {
        constructor(parent: BaseView, width: number, height: number, message: string, center = false) {
            super(parent, width, height);

            this.addText(center ? width / 2 : 0, 0, message, "#ffffff", 20, true, center, width);
        }
    }
}