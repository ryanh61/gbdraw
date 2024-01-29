// starting with 16 x 16

// stores binary pixel values in a 2x2 array
const stored_pixels = [];

const pixels_height = 16;
const pixels_width = 16;

// populate stored_pixels array
for (var i = 0; i < pixels_height; i++) {
	pxarr = [];
	for (var j = 0; j < pixels_width; j++) {
		pxarr.push('00'); // default white
	}
	stored_pixels.push(pxarr);
}

palette_data = {
	'DMG' : {
		'color_0': '#9bbc0f',
		'color_1': '#8bac0f',
		'color_2': '#306230',
		'color_3': '#0f380f'
	},
	'Pocket' : {
		'color_0': '#ffffff', // not really right for any of these...
		'color_1': '#b6b6b6',
		'color_2': '#676767',
		'color_3': '#000000'
	}
}

const pixelCanvas = document.getElementById("canvas_pixels");
const ctx = pixelCanvas.getContext("2d");

function drawGrid() {
	// TODO: clean this mess up!
	// we're doing 16 x 16 (use pixels_height/pixels_width from above)
	// determine height of line (canvas height), then iterate from 0 to max width by width/pixels
	const h_line_length = pixelCanvas.height;
	const w_line_length = pixelCanvas.width;

	const h_box_size = pixelCanvas.width / pixels_width;

	ctx.translate(0.5, 0.5);
	for (var i = 0; i <= pixels_width; i++) {
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(i*h_box_size, 0); // start at top; + .5 to "straddle" the pixels
		ctx.lineTo(i*h_box_size, h_line_length); // go to bottom; again with the pixel adjustments...
		ctx.stroke();
		ctx.closePath();
	}
	ctx.translate(-0.5, -0.5);

	// add last line...probably a better way to handle this...
	// likely I need to leave a bit of a border around the grid.../sigh
	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.moveTo(16*h_box_size -.5, 0); // start at top; + .5 to "straddle" the pixels
	ctx.lineTo(16*h_box_size - .5, h_line_length); // go to bottom; again with the pixel adjustments...
	ctx.stroke();
	ctx.closePath();


	ctx.translate(0.5, 0.5);
	const w_box_size = pixelCanvas.height / pixels_height;
	for (var i = 0; i <= pixels_height; i++) {
		ctx.beginPath();
		ctx.lineWidth = 1;
		ctx.moveTo(0, i*w_box_size); // start at top; + .5 to "straddle" the pixels
		ctx.lineTo(w_line_length, i*w_box_size); // go to bottom; again with the pixel adjustments...
		ctx.stroke();
		ctx.closePath();
	}
	ctx.translate(-0.5, -0.5);

	ctx.beginPath();
	ctx.lineWidth = 1;
	ctx.moveTo(0, 16*w_box_size -.5); // start at top; + .5 to "straddle" the pixels
	ctx.lineTo(w_line_length, 16*w_box_size - .5); // go to bottom; again with the pixel adjustments...
	ctx.stroke();
	ctx.closePath();
}

gridCheckbox = document.getElementById("grid_checkbox");
if (gridCheckbox.checked) {
	drawGrid();
};
redrawPixels();
drawPreview();


function setPx(px, py) {
	stored_pixels[py][px] = getColorGb();
}

function drawPixel(px0, py0) {
	sideSize = pixelCanvas.height / pixels_height;

	// translate to canvas location
	canvasX = px0 * sideSize;
	canvasY = py0 * sideSize;

	pxColor = getColorJs();
	ctx.fillStyle = pxColor;

	ctx.fillRect(canvasX, canvasY, sideSize, sideSize);
}

function drawPixelColor(px0, py0, color) {
	sideSize = pixelCanvas.height / pixels_height;

	// translate to canvas location
	canvasX = px0 * sideSize;
	canvasY = py0 * sideSize;

	pxColor = gbToJsColor(color);
	ctx.fillStyle = pxColor;

	ctx.fillRect(canvasX, canvasY, sideSize, sideSize);
}

function getColorJs() {
	const radio_color = document.querySelector('input[name=current_color]:checked').value;
	palette = document.getElementById("palette_select").value;
	color = palette_data[palette][radio_color];
	return color;
}

function getColorGb() {
	const radio_color = document.querySelector('input[name=current_color]:checked').value;
	color = '00'; // default white
	switch(radio_color) {
	case 'color_1':
		color = '01'; // light
		break;
	case 'color_2':
		color = '10'; // dark
		break;
	case 'color_3':
		color = '11'; // black
		break;
	}
	return color;
}

function gbToJsColor(gb_color) {
	palette = document.getElementById("palette_select").value;
	color = palette_data[palette]['color_0']; // default white
	switch(gb_color) {
	case '01':
		color = palette_data[palette]['color_1']; // light
		break;
	case '10':
		color = palette_data[palette]['color_2']; // dark
		break;
	case '11':
		color = palette_data[palette]['color_3']; // black
		break;
	}
	return color;
}

function generateASM() {
	// a tile is 8 x 8, with two bytes per row
	// first byte is the low byte, the second byte is the high byte
	// bit 0 goes to byte 1, bit 1 goes to byte 0...

	wTiles = 2; // TODO: variable
	hTiles = 2;

	tiles_data = [];
	for (var i = 0; i < wTiles; i++) {
		for (var j = 0; j < hTiles; j++) {
			tile_data = []
			for (var m = 0; m < 8; m++) {
				for (var n = 0; n < 8; n++) {
					px = stored_pixels[m + (j*8)][n + (i*8)];
					tile_data.push(px);
				}
			}
			// tile
			tile_bytes = [];
			for (var r = 0; r < 8; r++) {
				byte0 = [];
				byte1 = [];
				for (var p = 0; p < 8; p++) {
					px = tile_data[(r*8) + p];
					byte0.push(px[1]);
					byte1.push(px[0]);
				}
				hexStr = binToHexByte(byte0.join('')) + ',' + binToHexByte(byte1.join(''));
				tile_bytes.push(hexStr);
			}
			tiles_data.push(tile_bytes.join(', '));
		}
	}

	asm_str = "";
	for (var i = 0; i < tiles_data.length; i++) {
		asm_str += "Tile" + i + ":\n";
		asm_str += "\tdb " + tiles_data[i] + "\n";
	}

	// write out
	const asmTextArea = document.getElementById("asm_output");
	asmTextArea.value = asm_str;
}

pixelCanvas.onmousedown = function(e) {
	rect = pixelCanvas.getBoundingClientRect();
	cY = e.clientY - rect.top;
	cX = e.clientX - rect.left;

	x_y = translateLocToPx(cX, cY);

	setPx(x_y[0], x_y[1]);
	drawPixel(x_y[0], x_y[1]);

	gridCheckbox = document.getElementById("grid_checkbox");
	if (gridCheckbox.checked) {
		drawGrid();
	};

	drawPreview();
}

function translateLocToPx(canvasX, canvasY) {
	s_side = pixelCanvas.width / pixels_width;
	x = canvasX / s_side;
	x_int = parseInt(x);

	y = canvasY / s_side;
	y_int = parseInt(y);

	x_y = [x_int, y_int];
	return x_y;
}

function binToHexByte(b) {
	hex = parseInt(b, 2).toString(16);
	hex = ('00' + hex).slice(-2);
	return "$" + hex; // asm prefix
}

function redrawPixels() {
	for (var y = 0; y < stored_pixels.length; y++) {
		for (var x = 0; x < stored_pixels[0].length; x++) {
			drawPixelColor(x, y, stored_pixels[y][x]);
		}
	}
}

function gridCheckClicked() {
	redrawPixels();

	gridCheckbox = document.getElementById("grid_checkbox");
	if (gridCheckbox.checked == true) {
		drawGrid();
	}
}

function paletteChange() {
	redrawPixels();
	gridCheckbox = document.getElementById("grid_checkbox");
	if (gridCheckbox.checked == true) {
		drawGrid();
	}
	drawPreview();
}

document.onkeydown = function(evt) {
	if (evt.key == '1') {
		rd = document.getElementById('color_1')
		rd.checked = true;
	} else if (evt.key == '2') {
		rd = document.getElementById('color_2')
		rd.checked = true;
	} else if (evt.key == '3') {
		rd = document.getElementById('color_3')
		rd.checked = true;
	} else if (evt.key == '0') {
		rd = document.getElementById('color_0')
		rd.checked = true;
	}
}

// TODO: "DRY" some of this with the main canvas functions...
function drawPreview() {
	previewCanvas = document.getElementById("canvas_preview");
	pctx = previewCanvas.getContext("2d");

	redrawPixelsPreview(previewCanvas, pctx);
}

function drawPixelColorPreview(px0, py0, color, pcanvas, pctx) {
	sideSize = pcanvas.height / pixels_height;

	// translate to canvas location
	canvasX = px0 * sideSize;
	canvasY = py0 * sideSize;

	pxColor = gbToJsColor(color);
	pctx.fillStyle = pxColor;

	pctx.fillRect(canvasX, canvasY, sideSize, sideSize);
}

function redrawPixelsPreview(pcanvas, pctx) {
	for (var y = 0; y < stored_pixels.length; y++) {
		for (var x = 0; x < stored_pixels[0].length; x++) {
			drawPixelColorPreview(x, y, stored_pixels[y][x], pcanvas, pctx);
		}
	}
}