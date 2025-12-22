class Segment {
	constructor(x, y, length, angle, hue) {
		this.length = length;
		this.angle = angle;
		this.hue = hue;
		this._b = createVector();
		this.a = createVector(x, y);
	}

	get b() {
		let dx = this.length * cos(this.angle);
		let dy = this.length * sin(this.angle);
		this._b.set(this.a.x + dx, this.a.y + dy);
		return this._b;
	}

	update() {
		return this;
	}

	show() {
		stroke(this.hue, 100, 100);
		strokeWeight(10);
		line(this.a.x, this.a.y, this.b.x, this.b.y);
		stroke(255);
		strokeWeight(20);
		point(this.a);
		point(this.b);

		return this;
	}

	followPoint(tx, ty) {
		const t = createVector(tx, ty);
		const d = p5.Vector.sub(t, this.a);
		this.angle = d.heading();

		d.setMag(this.length);
		this.a = p5.Vector.sub(t, d)

		return this;
	}

	follow(seg) {
		return this.followPoint(seg.a.x, seg.a.y);
	}

	moveTo(point) {
		this.a.set(point);

		return this;
	}
}

export default Segment;
