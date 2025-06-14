(function(thisObj) {
    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "AE Tools", undefined, {resizeable: true});
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 4;
        win.margins = [10, 10, 10, 10];

        // 3 columns x 5 rows matrix, compact style (no cell group, no column gaps)
        var ROWS = 5, COLS = 3;
        var matrix = [];
        for (var r = 0; r < ROWS; r++) {
            var row = win.add("group");
            row.orientation = "row";
            row.alignChildren = ["fill", "top"];
            row.spacing = 0;
            matrix[r] = [];
            for (var c = 0; c < COLS; c++) {
                var btn = row.add("button", undefined, "");
                btn.preferredSize = [70, 50];
                btn.minimumSize = [70, 50];
                btn.maximumSize = [70, 50];
                btn.margins = 0;
                matrix[r][c] = btn;
            }
        }

        // Assign labels, tooltips and functions
        // Row 0
        matrix[0][0].text = "Black";
        matrix[0][0].helpTip = "Create a full-size black solid in the comp.";
        matrix[0][0].onClick = function() {
            app.beginUndoGroup("Add Black Solid");
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            comp.layers.addSolid([0, 0, 0], "Black Solid", comp.width, comp.height, 1);
            app.endUndoGroup();
        };

        matrix[0][1].text = "Center";
        matrix[0][1].helpTip = "Move the selected layer(s) to the center of the comp.";
        matrix[0][1].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var layers = comp.selectedLayers;
            if (layers.length === 0) { alert("Select a layer."); return; }
            app.beginUndoGroup("Center Layer");
            for (var i = 0; i < layers.length; i++) {
                layers[i].property("Position").setValue([comp.width/2, comp.height/2]);
            }
            app.endUndoGroup();
        };

        matrix[0][2].text = "Fit";
        matrix[0][2].helpTip = "Scale and center selected layer(s) to fit comp size.";
        matrix[0][2].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var layers = comp.selectedLayers;
            if (layers.length === 0) { alert("Select a layer."); return; }
            app.beginUndoGroup("Fit Layer to Comp");
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                var w = layer.width, h = layer.height;
                var scaleX = comp.width / w * 100;
                var scaleY = comp.height / h * 100;
                var scale = Math.min(scaleX, scaleY);
                layer.property("Scale").setValue([scale, scale]);
                layer.property("Position").setValue([comp.width/2, comp.height/2]);
            }
            app.endUndoGroup();
        };

        // Row 1
        matrix[1][0].text = "Text";
        matrix[1][0].helpTip = "Add a centered text layer named 'Text'.";
        matrix[1][0].onClick = function() {
            app.beginUndoGroup("Add Text Layer");
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var textLayer = comp.layers.addText("Hello");
            textLayer.name = "Text";
            textLayer.property("Position").setValue([comp.width / 2, comp.height / 2]);
            app.endUndoGroup();
        };

        matrix[1][1].text = "Precomp";
        matrix[1][1].helpTip = "Precompose selected layer(s) with naming and options.";
        matrix[1][1].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Select comp.");
                return;
            }
            var selected = comp.selectedLayers;
            if (selected.length < 1) {
                alert("Select at least one layer.");
                return;
            }
            var dlg = new Window("dialog", "Precompose Options");
            dlg.orientation = "column";
            dlg.alignChildren = ["fill", "top"];
            dlg.spacing = 8;
            dlg.margins = 16;
            dlg.add("statictext", undefined, "Precomp Name:");
            var nameField = dlg.add("edittext", undefined, "Precomp 1");
            nameField.characters = 18;
            var moveAttrs = dlg.add("checkbox", undefined, "Move all attributes into the new composition");
            moveAttrs.value = true;
            var adjustDur = dlg.add("checkbox", undefined, "Trim precomp to selected layers duration");
            adjustDur.value = false;
            var btns = dlg.add("group");
            btns.orientation = "row";
            btns.alignChildren = ["fill", "top"];
            var okBtn = btns.add("button", undefined, "OK");
            var cancelBtn = btns.add("button", undefined, "Cancel", {name: "cancel"});
            okBtn.onClick = function() {
                dlg.close();
                app.beginUndoGroup("Precompose Layers");
                var indices = [];
                for (var i = 0; i < selected.length; i++) indices.push(selected[i].index);
                indices.sort(function(a, b) { return a - b; });
                var layers = [];
                for (var i = 0; i < indices.length; i++) layers.push(comp.layer(indices[i]));
                var precompName = nameField.text;
                var precompIndex = comp.layers.precompose(indices, precompName, moveAttrs.value);
                if (adjustDur.value) {
                    var newPrecomp = comp.layer(precompIndex).source;
                    var inTime = layers[0].inPoint;
                    var outTime = layers[0].outPoint;
                    for (var i = 1; i < layers.length; i++) {
                        inTime = Math.min(inTime, layers[i].inPoint);
                        outTime = Math.max(outTime, layers[i].outPoint);
                    }
                    newPrecomp.workAreaStart = inTime;
                    newPrecomp.workAreaDuration = outTime - inTime;
                    newPrecomp.duration = outTime - inTime;
                }
                app.endUndoGroup();
            };
            cancelBtn.onClick = function() { dlg.close(); };
            dlg.center();
            dlg.show();
        };

        matrix[1][2].text = "Trim";
        matrix[1][2].helpTip = "Set work area to the in/out points of selected layer.";
        matrix[1][2].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length === 0) { alert("Select a layer."); return; }
            var layer = selectedLayers[0];
            app.beginUndoGroup("Trim Work Area to Layer");
            comp.workAreaStart = layer.inPoint;
            comp.workAreaDuration = layer.outPoint - layer.inPoint;
            app.endUndoGroup();
        };

        // Row 2
        matrix[2][0].text = "Seq";
        matrix[2][0].helpTip = "Sequence selected layers in time with frame offset.";
        matrix[2][0].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length < 2) { alert("Select at least two layers."); return; }
            var offset = prompt("Frame offset:", "5");
            if (offset == null || isNaN(offset)) return;
            offset = parseFloat(offset);
            var frameDuration = 1 / comp.frameRate;
            app.beginUndoGroup("Sequence Layers");
            var startTime = selectedLayers[0].startTime;
            selectedLayers[0].startTime = startTime;
            for (var i = 1; i < selectedLayers.length; i++) {
                selectedLayers[i].startTime = startTime + i * offset * frameDuration;
            }
            app.endUndoGroup();
        };

        matrix[2][1].text = "Solo";
        matrix[2][1].helpTip = "Solo only the selected layers in the timeline.";
        matrix[2][1].onClick = function() {
            app.beginUndoGroup("Super Solo");
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var selected = comp.selectedLayers;
            for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).solo = false;
            for (var j = 0; j < selected.length; j++) selected[j].solo = true;
            app.endUndoGroup();
        };

        matrix[2][2].text = "Fade";
        matrix[2][2].helpTip = "Fade opacity in or out for selected layers with custom duration.";
        matrix[2][2].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var selected = comp.selectedLayers;
            if (selected.length < 1) { alert("Select at least one layer."); return; }
            var dlg = new Window("dialog", "Fade In/Out");
            dlg.orientation = "column";
            dlg.alignChildren = ["fill", "top"];
            dlg.spacing = 10;
            dlg.margins = 14;
            dlg.add("statictext", undefined, "Fade Type:");
            var groupType = dlg.add("group");
            groupType.orientation = "row";
            var rIn = groupType.add("radiobutton", undefined, "Fade In");
            var rOut = groupType.add("radiobutton", undefined, "Fade Out");
            rIn.value = true;
            dlg.add("statictext", undefined, "Duration (seconds):");
            var groupDur = dlg.add("group");
            groupDur.orientation = "row";
            var slider = groupDur.add("slider", undefined, 1, 0.1, 5);
            slider.preferredSize.width = 120;
            var durBox = groupDur.add("edittext", undefined, "1.0");
            durBox.characters = 4;
            slider.onChanging = function() { durBox.text = slider.value.toFixed(2); };
            durBox.onChange = function() {
                var v = parseFloat(durBox.text);
                if (isNaN(v) || v < 0.1) v = 0.1;
                if (v > 5) v = 5;
                slider.value = v;
                durBox.text = v.toFixed(2);
            };
            var btns = dlg.add("group");
            btns.orientation = "row";
            var okBtn = btns.add("button", undefined, "OK");
            var cancelBtn = btns.add("button", undefined, "Cancel", {name:"cancel"});
            okBtn.onClick = function() {
                var fadeIn = rIn.value;
                var dur = parseFloat(durBox.text);
                dlg.close();
                app.beginUndoGroup("Quick Fade In/Out");
                for (var i = 0; i < selected.length; i++) {
                    var layer = selected[i];
                    var op = layer.property("Transform").property("Opacity");
                    if (fadeIn) {
                        var t0 = layer.inPoint;
                        op.setValueAtTime(t0, 0);
                        op.setValueAtTime(t0 + dur, 100);
                    } else {
                        var t1 = layer.outPoint;
                        op.setValueAtTime(t1 - dur, 100);
                        op.setValueAtTime(t1, 0);
                    }
                }
                app.endUndoGroup();
            };
            cancelBtn.onClick = function() { dlg.close(); };
            dlg.center(); dlg.show();
        };

        // Row 3
        matrix[3][0].text = "RevO";
        matrix[3][0].helpTip = "Reverse the stacking order of selected layers.";
        matrix[3][0].onClick = function() {
            app.beginUndoGroup("Reverse Layer Order");
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Select comp.");
                return;
            }
            var selected = comp.selectedLayers;
            if (selected.length < 2) {
                alert("Select at least 2 layers.");
                app.endUndoGroup();
                return;
            }
            var layers = [];
            for (var i = 0; i < selected.length; i++) layers.push(selected[i]);
            layers.sort(function(a, b) { return a.index - b.index; });
            var anchor = layers[0];
            for (var i = layers.length - 1; i > 0; i--) {
                layers[i].moveBefore(anchor);
            }
            app.endUndoGroup();
        };

        matrix[3][1].text = "Anchor";
        matrix[3][1].helpTip = "Move anchor point to geometric center of selected layers.";
        matrix[3][1].onClick = function() {
            app.beginUndoGroup("Anchor to Center");
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length === 0) { alert("Select a layer."); app.endUndoGroup(); return; }
            for (var i = 0; i < selectedLayers.length; i++) {
                var layer = selectedLayers[i];
                if (layer.sourceRectAtTime) {
                    var bounds = layer.sourceRectAtTime(comp.time, false);
                    var center = [bounds.left + bounds.width / 2, bounds.top + bounds.height / 2];
                    var anchorProp = layer.property("Anchor Point");
                    var posProp = layer.property("Position");
                    var delta = [
                        center[0] - anchorProp.value[0],
                        center[1] - anchorProp.value[1]
                    ];
                    anchorProp.setValue(center);
                    posProp.setValue([posProp.value[0] + delta[0], posProp.value[1] + delta[1]]);
                }
            }
            app.endUndoGroup();
        };

        matrix[3][2].text = "AdvAnch";
        matrix[3][2].helpTip = "Advanced anchor: move to top, bottom, corners, etc.";
        matrix[3][2].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp and layers."); return; }
            var dlg = new Window("dialog", "Anchor Options");
            var grid = dlg.add("group");
            grid.orientation = "row";
            grid.alignChildren = ["fill", "top"];
            grid.spacing = 6;
            var anchorOpts = [
                {label: "Center", pos: function(b){return [b.left+b.width/2, b.top+b.height/2];}},
                {label: "Bottom", pos: function(b){return [b.left+b.width/2, b.top+b.height];}},
                {label: "Top", pos: function(b){return [b.left+b.width/2, b.top];}},
                {label: "TopL", pos: function(b){return [b.left, b.top];}},
                {label: "TopR", pos: function(b){return [b.left+b.width, b.top];}},
                {label: "BotL", pos: function(b){return [b.left, b.top+b.height];}},
                {label: "BotR", pos: function(b){return [b.left+b.width, b.top+b.height];}}
            ];
            var colCount = 3;
            var subCols = [];
            for (var i = 0; i < colCount; i++) {
                subCols[i] = grid.add("group");
                subCols[i].orientation = "column";
                subCols[i].alignChildren = ["fill", "top"];
                subCols[i].spacing = 6;
            }
            for (var i = 0; i < anchorOpts.length; i++) {
                var col = i % colCount;
                var btn = subCols[col].add("button", undefined, anchorOpts[i].label);
                btn.preferredSize = [70, 40];
                btn.onClick = (function(opt) {
                    return function() {
                        dlg.close();
                        app.beginUndoGroup("Move Anchor: " + opt.label);
                        var selectedLayers = comp.selectedLayers;
                        for (var i = 0; i < selectedLayers.length; i++) {
                            var layer = selectedLayers[i];
                            var bounds = layer.sourceRectAtTime(comp.time, false);
                            var anchorPos = opt.pos(bounds);
                            var anchorProp = layer.property("Anchor Point");
                            var posProp = layer.property("Position");
                            var delta = [
                                anchorPos[0] - anchorProp.value[0],
                                anchorPos[1] - anchorProp.value[1]
                            ];
                            anchorProp.setValue(anchorPos);
                            posProp.setValue([posProp.value[0] + delta[0], posProp.value[1] + delta[1]]);
                        }
                        app.endUndoGroup();
                    };
                })(anchorOpts[i]);
            }
            dlg.add("button", undefined, "Cancel", {name:"cancel"});
            dlg.center(); dlg.show();
        };

        // Row 4 (Advanced)
        matrix[4][0].text = "Loop";
        matrix[4][0].helpTip = "Add a loopOut() expression to keyframed properties.";
        matrix[4][0].onClick = function() {
            app.beginUndoGroup("Add loopOut()");
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var applied = false;
            var selectedLayers = comp.selectedLayers;
            for (var i = 0; i < selectedLayers.length; i++) {
                var props = selectedLayers[i].selectedProperties;
                for (var j = 0; j < props.length; j++) {
                    if (props[j] instanceof Property && props[j].canSetExpression && props[j].numKeys > 0) {
                        props[j].expression = "loopOut()";
                        applied = true;
                    }
                }
            }
            if (!applied) alert("No property with keyframes selected.");
            app.endUndoGroup();
        };

        matrix[4][1].text = "Bounce";
        matrix[4][1].helpTip = "Add a bounce expression (with slider controls) to keyframed property.";
        matrix[4][1].onClick = function() {
            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) { alert("Select comp."); return; }
            var selectedLayers = comp.selectedLayers;
            if (selectedLayers.length < 1) { alert("Select at least one layer."); return; }
            app.beginUndoGroup("Add Bounce with Sliders");
            for (var i = 0; i < selectedLayers.length; i++) {
                var layer = selectedLayers[i];
                function ensureSlider(layer, name, def) {
                    var effect = layer.property("Effects");
                    var ctrl = null;
                    for (var j = 1; j <= effect.numProperties; j++) {
                        if (effect.property(j).matchName === "ADBE Slider Control" &&
                            effect.property(j).name === name) {
                            ctrl = effect.property(j);
                            break;
                        }
                    }
                    if (!ctrl) {
                        ctrl = effect.addProperty("ADBE Slider Control");
                        ctrl.name = name;
                        ctrl.property("Slider").setValue(def);
                    }
                    return ctrl;
                }
                var amp = ensureSlider(layer, "amp", 5.0);
                var freq = ensureSlider(layer, "freq", 2.0);
                var decay = ensureSlider(layer, "decay", 4.0);
                var bounceExpr =
"amp = effect('amp')('Slider');\n" +
"freq = effect('freq')('Slider');\n" +
"decay = effect('decay')('Slider');\n" +
"n = 0;\n" +
"if (numKeys > 0) {\n" +
"  n = nearestKey(time).index;\n" +
"  if (key(n).time > time) { n--; }\n" +
"}\n" +
"if (n == 0) {\n" +
"  t = 0;\n" +
"} else {\n" +
"  t = time - key(n).time;\n" +
"}\n" +
"if (n > 0 && t < 1) {\n" +
"  v = velocityAtTime(key(n).time - thisComp.frameDuration/10);\n" +
"  value + v*(amp/100)*Math.sin(freq*t*2*Math.PI)/Math.exp(decay*t);\n" +
"} else {\n" +
"  value;\n" +
"}";
                var applied = false;
                var props = layer.selectedProperties;
                for (var j = 0; j < props.length; j++) {
                    if (props[j] instanceof Property && props[j].canSetExpression && props[j].numKeys > 0) {
                        props[j].expression = bounceExpr;
                        applied = true;
                    }
                }
                if (!applied) alert("No keyframed property selected for Bounce on " + layer.name);
            }
            app.endUndoGroup();
        };

        matrix[4][2].text = "Clean";
        matrix[4][2].helpTip = "Remove all unused files/assets from the current project.";
        matrix[4][2].onClick = function() {
            if (confirm("This will remove all unused files from your project. Proceed?")) {
                app.beginUndoGroup("Remove Unused");
                app.project.removeUnusedFootage();
                app.endUndoGroup();
            }
        };

        // Watermark at bottom
        var watermark = win.add("statictext", undefined, "get this plugin for free at ashifportfolio.com");
        watermark.justify = "left";
        try {
            watermark.graphics.foregroundColor = watermark.graphics.newPen(
                watermark.graphics.PenType.SOLID_COLOR, [0.5, 0.5, 0.5, 1], 1); // 50% faded gray
        } catch(e){}

        return win;
    }

    var myScriptPanel = buildUI(thisObj);
    if (myScriptPanel instanceof Window) {
        myScriptPanel.center();
        myScriptPanel.show();
    } else {
        myScriptPanel.layout.layout(true);
        myScriptPanel.layout.resize();
    }
})(this);
