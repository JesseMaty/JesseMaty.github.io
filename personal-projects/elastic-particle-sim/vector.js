export class Vector2 {
    x = 0;
    y = 0;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    add(other) {
        return new Vector2(this.x + other.x, this.y + other.y);
    }

    sub(other) {
        return new Vector2(this.x - other.x, this.y - other.y);
    }

    mult(s) {
        return new Vector2(this.x * s, this.y * s)
    }

    div(s) {
        if (s === 0)
            return new Vector2(0, 0);
        return this.mult(1 / s);
    }

    static dot(a, b) {
        return a.x * b.x + a.y * b.y;
    }

    mag() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        if (this.mag() != 0)
            return this.div(this.mag());
        return new Vector2(0, 0);
    }

    copy() {
        return new Vector2(this.x, this.y);
    }

    static clampMag(a, max) {
        let mag = a.mag();
        if (mag >= max) {
            return a.normalize().mult(max);
        }
        return a.copy();
    }
}
