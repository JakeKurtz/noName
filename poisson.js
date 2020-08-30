Array.prototype.delete = function (index) {
	if (index > -1) {
		Array.splice(index, 1);
	}
}
Array.prototype.deleteItem = function (item) {
	const index = Array.indexOf(item);
	if (index > -1) {
		Array.splice(index, 1);
	}
}

function randrange(min, max) {
	return Math.random() * (max - min) + min;
}
function randAnnulus(r_min, r_max) {
	var theta = randrange(0, 2 * Math.PI);
	var A = 2 / (r_max * r_max - r_min * r_min);
	var r = Math.sqrt(2 * randrange(0, 1) / A + r_min * r_min);

	var x = r * Math.cos(theta);
	var y = r * Math.sin(theta);

	return [x, y];
}
function dist(a, b) {
	return Math.sqrt((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2);
}

class Grid {
	constructor(max_width, min_width, max_height, min_height, radius) {

		this.cell_size = radius * Math.SQRT1_2;

		this.max_width = max_width;
		this.min_width = min_width;
		this.max_height = max_height;
		this.min_height = min_height;

		this.area_width = max_width - min_width;
		this.area_height = max_height - min_height;

		this.grid_width = Math.ceil(this.area_width / this.cell_size);
		this.grid_height = Math.ceil(this.area_height / this.cell_size);

		this.grid = this.createGrid(this.grid_width, this.grid_height);
	}

	createGrid() {
		var grid = new Array(this.grid_height);
		for (var i = 0; i < this.grid_height; i++) {
			grid[i] = new Array(this.grid_width);
		}
		return grid;
	}
	getIndex_x(pos_x) {
		return Math.floor(pos_x / this.cell_size + this.grid_width / 2);
	}
	getIndex_y(pos_y) {
		return Math.floor(pos_y / this.cell_size + this.grid_height / 2);
	}
	insertPoint(p) {
		this.grid[this.getIndex_x(p[0])][this.getIndex_y(p[1])] = p;
	}
	getPoint(p) {
		return this.grid[this.getIndex_x(p[0])][this.getIndex_y(p[1])];
	}
	isNear(a, radius) {
		var x = this.getIndex_x(a[0]);
		var y = this.getIndex_y(a[1]);

		for (var i = Math.max(x-1, 0); i <= Math.min(x+1, this.grid_width-1); i++) {
			for (var j = Math.max(y-1, 0); j <= Math.min(y+1, this.grid_height-1); j++) {

				if (i == x && j == y) continue;

				var b = this.grid[i][j];
				if (b == undefined) continue;

				var dist2 = (b[0] - a[0])**2 + (b[1] - a[1])**2;

				if (dist2 < radius*radius) {
					return true;
				}
			}
		}
		return false;
	}
	inbounds(p) {
		return p[0] <= this.max_width && p[0] >= this.min_width && p[1] <= this.max_height && p[1] >= this.min_height;
	}
}

function poisson(min_width, max_width, min_height, max_height, radius, k) {
	// STEP 0 //

	var radius = radius;
	var k = k;

	var grid = new Grid(max_width, min_width, max_height, min_height, radius);

	// STEP 1 //

	var initial_sample = [];
	var active = [];

	initial_sample[0] = randrange(min_width, max_width);
	initial_sample[1] = randrange(min_height, max_height);

	grid.insertPoint(initial_sample);
	active.push(initial_sample);

	// STEP 2 //

	while (active.length > 0) {

		var index = Math.round(randrange(0, active.length - 1));

		var d = dist([0, 0], active[index]);

		for (var i = 0; i < k; i++) {

			var point = randAnnulus(radius, 2*radius);
			point[0] += active[index][0];
			point[1] += active[index][1];

			if (!grid.isNear(point, radius) && grid.inbounds(point) && !grid.getPoint(point)) {
				active.push(point);
				grid.insertPoint(point);
				break;
			}
		}
		if (i == k) active.splice(index, 1);
	}

	var points = [];
	for (var i = 0; i < grid.grid_width; i++) {
		points.push.apply(points, grid.grid[i]);
	}
	return points;
}

export { poisson }