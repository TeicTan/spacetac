module TK.SpaceTac.UI.Specs {
    describe("UIBuilder", () => {
        let testgame = setupEmptyView();

        function get(path: (number | string)[]): [string, any] {
            let spath = `[${path.join(" -> ")}]`;
            let component: any = testgame.view.world;
            path.forEach(idx => {
                component = (typeof idx == "number") ? component.children[idx] : component.getByName(idx);
                if (!component) {
                    throw new Error(`Path not found: ${spath}`);
                }
            });
            return [spath, component];
        }

        function check(path: (number | string)[], ctype?: any, name?: string, attrs?: any): any {
            let [spath, component] = get(path);

            if (typeof ctype != "undefined") {
                expect(component instanceof ctype).toBe(true, `${spath} is not of good type`);
            }
            if (typeof name != "undefined") {
                expect(component.name).toEqual(name, spath);
            }
            if (typeof attrs != "undefined") {
                iteritems(attrs, (key, value) => {
                    expect(component[key]).toEqual(value, spath);
                });
            }

            return component;
        }

        it("creates component inside the parent container", function () {
            let builder = new UIBuilder(testgame.view, testgame.view.addLayer("testlayer"));
            let group = builder.group("test1");
            check(["View layers", "testlayer", 0], Phaser.Group, "test1");

            builder = new UIBuilder(testgame.view, group);
            builder.text("test2");
            check(["View layers", "testlayer", 0, 0], Phaser.Text, "", { text: "test2", parent: group });

            builder = new UIBuilder(testgame.view, "anothertestlayer");
            builder.text("test3");
            check(["View layers", "anothertestlayer", 0], Phaser.Text, "", { text: "test3" });
        })

        it("can clear a container", function () {
            let builder = new UIBuilder(testgame.view);
            builder.group("group1", 50, 30);
            builder.text("text1");
            let [spath, container] = get(["View layers", "base"]);
            expect(container.children.length).toBe(2);
            builder.clear();
            expect(container.children.length).toBe(0);
        })

        it("can create groups", function () {
            let builder = new UIBuilder(testgame.view);
            builder.group("group1", 50, 30);
            check(["View layers", "base", 0], Phaser.Group, "group1", { x: 50, y: 30 });
        })

        it("can create texts", function () {
            let builder = new UIBuilder(testgame.view);
            builder.text("Test content", 12, 41, { size: 61 });
            check(["View layers", "base", 0], Phaser.Text, "", { text: "Test content", x: 12, y: 41, cssFont: "61pt 'SpaceTac'" });
        })

        it("can create images", function () {
            let builder = new UIBuilder(testgame.view);
            builder.image("test-image", 100, 50);
            check(["View layers", "base", 0], Phaser.Image, "test-image", { x: 100, y: 50, key: "__missing", inputEnabled: null });
        })

        it("can create buttons", function () {
            let builder = new UIBuilder(testgame.view);
            let a = 1;
            let button1 = builder.button("test-image1", 100, 50, () => a += 1);
            check(["View layers", "base", 0], Phaser.Button, "test-image1", { x: 100, y: 50, key: "__missing", inputEnabled: true });
            expect(button1.input.useHandCursor).toBe(true, "button1 should use hand cursor");
            let button2 = builder.button("test-image2", 20, 10);
            check(["View layers", "base", 1], Phaser.Button, "test-image2", { x: 20, y: 10, key: "__missing", inputEnabled: true });
            expect(button2.input.useHandCursor).toBe(false, "button2 should not use hand cursor");

            expect(a).toBe(1);
            testClick(button1);
            expect(a).toBe(2);
            testClick(button2);
            expect(a).toBe(2);
            testClick(button1);
            expect(a).toBe(3);
        })

        it("creates sub-builders, preserving text style", function () {
            let base_style = new UITextStyle();
            base_style.width = 123;
            let builder = new UIBuilder(testgame.view, undefined, base_style);
            builder.text("Test 1");

            let group = builder.group("testgroup");
            let subbuilder = builder.in(group);
            subbuilder.text("Test 2");

            check(["View layers", "base", 0], Phaser.Text, "", { text: "Test 1", wordWrapWidth: 123 });
            check(["View layers", "base", 1, 0], Phaser.Text, "", { text: "Test 2", wordWrapWidth: 123 });
        })

        it("allows to alter text style", function () {
            let builder = new UIBuilder(testgame.view);
            builder.text("t1");
            builder.styled({ bold: true }).text("t2");
            builder.text("t3");
            builder.text("t4", undefined, undefined, { bold: true });

            check(["View layers", "base", 0], Phaser.Text, "", { text: "t1", fontWeight: "normal" });
            check(["View layers", "base", 1], Phaser.Text, "", { text: "t2", fontWeight: "bold" });
            check(["View layers", "base", 2], Phaser.Text, "", { text: "t3", fontWeight: "normal" });
            check(["View layers", "base", 3], Phaser.Text, "", { text: "t4", fontWeight: "bold" });
        })

        it("allows to change text, image or button content", function () {
            let builder = new UIBuilder(testgame.view);
            let text = builder.text("test-text");
            let image = builder.image("test-image");
            let button = builder.button("test-button");

            check(["View layers", "base", 0], Phaser.Text, "", { text: "test-text" });
            check(["View layers", "base", 1], Phaser.Image, "test-image");
            check(["View layers", "base", 2], Phaser.Button, "test-button");

            builder.change(text, "test-mod-text");
            builder.change(image, "test-mod-image");
            builder.change(button, "test-mod-button");

            check(["View layers", "base", 0], Phaser.Text, "", { text: "test-mod-text" });
            check(["View layers", "base", 1], Phaser.Image, "test-mod-image");
            check(["View layers", "base", 2], Phaser.Button, "test-mod-button");
        })
    })
}
