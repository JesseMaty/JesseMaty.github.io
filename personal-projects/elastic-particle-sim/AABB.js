import { Vector2 } from "./Vector.js";

export class AABB {
    center;
    halfDimension;

    constructor(center = new Vector2(0, 0), halfDimension = new Vector2(0, 0)) {
        this.center = center;
        this.halfDimension = halfDimension;
    }

    containsPoint(point) {
        return (
            point.x <= this.center.x + this.halfDimension.x &&
            point.x >= this.center.x - this.halfDimension.x &&
            point.y <= this.center.y + this.halfDimension.y &&
            point.y >= this.center.y - this.halfDimension.y) ?? false;
    }

    containsCircle(center, radius) {
        return (
            center.x + radius <= this.center.x + this.halfDimension.x &&
            center.x - radius >= this.center.x - this.halfDimension.x &&
            center.y + radius <= this.center.y + this.halfDimension.y &&
            center.y - radius >= this.center.y - this.halfDimension.y) ?? false;
    }

    intersectsAABB(other) {
        return (this.center.x - this.halfDimension.x <= other.center.x + other.halfDimension.x &&
            this.center.x + this.halfDimension.x >= other.center.x - other.halfDimension.x) &&
            (this.center.y - this.halfDimension.y <= other.center.y + other.halfDimension.y &&
                this.center.y + this.halfDimension.y >= other.center.y - other.halfDimension.y);
    }
}
