// This plugin will open a modal to prompt the user to enter a number, and
// it will then create that many rectangles on the screen.

// This file holds the main code for the plugins. It has access to the *document*.
// You can access browser APIs in the <script> tag inside "ui.html" which has a
// full browser enviroment (see documentation).

function clone(val) {
	return JSON.parse(JSON.stringify(val))
}

function copyStyles(source) {
	var styles = {}

	// if (source.fillStyleId == "") {
	// 	styles.fills = source.fills
	// }
	// else {
	// 	styles.fillStyleId = source.fillStyleId
	// 	styles.fills = source.fills
	// }

	// if (source.strokeStyleId == "") {
	// 	styles.strokes = source.strokes
	// }
	// else {
	// 	styles.strokeStyleId = source.strokeStyleId
	// 	styles.strokes = source.strokes
	// }

	styles.strokeStyleId = source.strokeStyleId
	styles.strokes = source.strokes
	styles.fillStyleId = source.fillStyleId
	styles.fills = source.fills


	styles.strokeWeight = source.strokeWeight

	styles.strokeAlign = source.strokeAlign
	styles.strokeCap = source.strokeCap
	styles.strokeJoin = source.strokeJoin
	styles.strokeMiterLimit = source.strokeMiterLimit

	if (styles.type !== "INSTANCE") {
		styles.topLeftRadius = source.topLeftRadius
		styles.topRightRadius = source.topRightRadius
		styles.bottomLeftRadius = source.bottomLeftRadius
		styles.bottomRightRadius = source.bottomRightRadius
	}

	styles.dashPattern = source.dashPattern
	styles.clipsContent = source.clipsContent

	styles.effects = clone(source.effects)


	// for (let i = 0; i < current.children.length; i++) {
	// 	styles.appendChild(current.children[i].clone())
	// }

	console.log(styles)

	return styles
}

function addStyle(node) {

	var styles: any = figma.root.getPluginData("styles")

	if (styles !== "") {
		console.log("Getting styles")
		styles = JSON.parse(styles)
	}
	else {
		styles = []
	}

	styles.push({ id: node.id, node: copyStyles(node), name: node.name })

	figma.root.setPluginData("styles", JSON.stringify(styles))
}

function updateStyle(id, name) {
	var styles = getStyles()

	styles.map((obj) => {
		if (obj.id == id) {
			obj.name = name;
		}
	})

	figma.root.setPluginData("styles", JSON.stringify(styles))
}

function getStyles(id?) {
	var styles: any = figma.root.getPluginData("styles")

	console.log("Getting layer styles")

	if (styles !== "") {
		styles = JSON.parse(styles)
	}
	else {
		styles = []
	}

	if (id) {
		var newStyles = styles.filter(function (style) {
			return style.id === id
		});

		styles = newStyles[0]

	}

	return styles
}

function pasteProperties(target, properties) {

	// Remove strokes and fills if stroke or fill layer style detected (otherwise figma detaches them)
	for (let i = 0; i < properties.length; i++) {
		var property = properties[i]
		if (property.fillStyleId !== "") {
			delete property.fills
		}

		if (property.strokeStyleId !== "") {
			delete property.strokes
		}
	}

	Object.assign(target, properties)

	return target
}

function updateStyles(selection, id?) {

	var nodes;

	if (selection) {
		nodes = selection
	}

	if (id) {
		nodes = []
		console.log(id)
		var pages = figma.root.children
		var length = pages.length;
		for (let i = 0; i < length; i++) {
			pages[i].findAll(node => {
				if (node.getPluginData("styleId") === id) {
					nodes.push(node)
				}
			})
		}

		// nodes = [figma.getNodeById(id)]
	}

	console.log(nodes)


	for (let i = 0; i < nodes.length; i++) {
		var node = nodes[i]
		var styleId = node.getPluginData("styleId")

		// Look for node with matching styleID
		var source = figma.getNodeById(styleId)

		if (source) {
			var layerStyle = copyStyles(source)
			pasteProperties(node, layerStyle)
		}
		else {
			var layerStyle = getStyles(styleId).node
			pasteProperties(node, layerStyle)
			console.log("Original node can't be found")
		}
	}

	// figma.closePlugin()

}

function clearStyles() {
	figma.root.setPluginData("styles", "")
	console.log("Styles cleared")
	figma.closePlugin()
}

function createStyles(selection) {
	var node = selection[0]
	node.setPluginData("styleId", node.id)
	// var target = pasteProperties(figma.createFrame(), styles)
	node.setRelaunchData({ updateStyles: 'Update from component styles' });
	// figma.viewport.scrollAndZoomIntoView([target]);
	addStyle(node)
}

function postMessage() {
	var styles = getStyles();
	var message = styles
	console.log("Posted message")
	figma.ui.postMessage(message)
}

function applyStyle(selection, styleId) {
	for (let i = 0; i < selection.length; i++) {
		var node = selection[i]
		node.setPluginData("styleId", styleId)

		// var styleId = node.getPluginData("styleId")

		// Look for node with matching styleID
		var source = figma.getNodeById(styleId)

		if (source) {
			var layerStyle = copyStyles(source)
			pasteProperties(node, layerStyle)
		}
		else {
			var layerStyle = getStyles(styleId).node
			pasteProperties(node, layerStyle)
			console.log("Original node can't be found")
		}

	}
}

function removeStyle(styleId) {
	var styles = getStyles()

	styles.splice(styles.findIndex(function (i) {
		return i.id === styleId;
	}), 1);

	figma.root.setPluginData("styles", JSON.stringify(styles))
}


if (figma.command === "showStyles") {
	// This shows the HTML page in "ui.html".
	figma.showUI(__html__, { width: 240, height: 360 });

	postMessage()

	// Calls to "parent.postMessage" from within the HTML page will trigger this
	// callback. The callback will be passed the "pluginMessage" property of the
	// posted message.
	figma.ui.onmessage = msg => {
		// One way of distinguishing between different types of messages sent from
		// your HTML page is to use an object with a "type" property like this.
		if (msg.type === 'create-shapes') {

			const nodes: SceneNode[] = [];

			for (let i = 0; i < msg.count; i++) {

				var shape;

				if (msg.shape === 'rectangle') {
					shape = figma.createRectangle();
				} else if (msg.shape === 'triangle') {
					shape = figma.createPolygon();
				} else {
					shape = figma.createEllipse();
				}

				shape.x = i * 150;
				shape.fills = [{ type: 'SOLID', color: { r: 1, g: 0.5, b: 0 } }];
				figma.currentPage.appendChild(shape);
				nodes.push(shape);
			}

			figma.currentPage.selection = nodes;
			figma.viewport.scrollAndZoomIntoView(nodes);
			figma.closePlugin();
		}



		if (msg.type === "add-style") {
			createStyles(figma.currentPage.selection)
			postMessage()
		}

		if (msg.type === "rename-style") {
			updateStyle(msg.id, msg.name)
			postMessage()
		}

		if (msg.type === "update-instances") {
			updateStyles(figma.currentPage.selection, msg.id)
			postMessage()
		}

		if (msg.type === "apply-style") {
			applyStyle(figma.currentPage.selection, msg.id)
		}

		if (msg.type === "remove-style") {
			removeStyle(msg.id)
			postMessage()
		}

		// Make sure to close the plugin when you're done. Otherwise the plugin will
		// keep running, which shows the cancel button at the bottom of the screen.

	};
}




if (figma.command === "createStyles") {
	createStyles(figma.currentPage.selection)
	figma.closePlugin()
}



if (figma.command === "updateStyles") {
	updateStyles(figma.currentPage.selection)
	figma.closePlugin()
}

if (figma.command === "clearStyles") {
	clearStyles()
}
