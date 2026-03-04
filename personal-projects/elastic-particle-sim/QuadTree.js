import { AABB } from "./AABB.js";
import { Vector2 } from "./Vector.js";

export class QuadTree {
    capacity = 3;
    bounds;
    particles;
    maxDepth = 1;
    depth = 0;

    // children
    northWest; northEast; southWest; southEast;

    parent;

    constructor(bounds, parent = null) {
        this.bounds = bounds;
        this.particles = [];
        this.northWest = null;
        this.northEast = null;
        this.southWest = null;
        this.southEast = null;
    }

    // Inserts a particle into appropriate quad
    insert(p) {
        if (!this.bounds.containsPoint(p.pos)) { return false };

        if (this.particles.length < this.capacity /*|| this.depth >= this.maxDepth)*/ && this.northWest === null) {
            this.particles.push(p);
            return true;
        }

        if (this.northWest === null) {
            this.split();
            this.redistribute();
        }
        return this.northWest.insert(p) ||
            this.northEast.insert(p) ||
            this.southWest.insert(p) ||
            this.southEast.insert(p)
    }

    split() {
        const cx = this.bounds.center.x;
        const cy = this.bounds.center.y;
        const hdx = this.bounds.halfDimension.x / 2;
        const hdy = this.bounds.halfDimension.y / 2;

        if (this.northWest === null) {
            this.northWest = new QuadTree(new AABB(new Vector2(cx - hdx, cy - hdy), new Vector2(hdx, hdy)), this);
            this.northEast = new QuadTree(new AABB(new Vector2(cx + hdx, cy - hdy), new Vector2(hdx, hdy)), this);
            this.southWest = new QuadTree(new AABB(new Vector2(cx - hdx, cy + hdy), new Vector2(hdx, hdy)), this);
            this.southEast = new QuadTree(new AABB(new Vector2(cx + hdx, cy + hdy), new Vector2(hdx, hdy)), this);
            this.northWest.depth = this.depth + 1;
            this.northEast.depth = this.depth + 1;
            this.southWest.depth = this.depth + 1;
            this.southEast.depth = this.depth + 1;
        }

    }

    redistribute() {
        this.particles.forEach(p => {
            this.northWest.insert(p) ||
            this.northEast.insert(p) ||
            this.southWest.insert(p) ||
            this.southEast.insert(p)
        });
        this.particles = [];
    }

    // Find all points that appear within a AABB range
    queryRange(range) {
        // Prepare an array of results
        let results = [];

        // Automatically abort if the range does not intersect this quad
        if (!this.bounds.intersectsAABB(range)) return results;

        // Check objects at this quad level
        this.particles.forEach(p => {
            if (range.containsPoint(p.pos)) results.push(p);
        })

        // Terminate here, if there are no children
        if (this.northWest === null) return results;

        // Otherwise, add the points from the children
        return [...results, ...this.northWest.queryRange(range),
        ...this.northEast.queryRange(range),
        ...this.southWest.queryRange(range),
        ...this.southEast.queryRange(range)]

    }

    clear() {
        this.particles = [];
        this.northWest = null;
        this.northEast = null;
        this.southWest = null;
        this.southEast = null;
    }

    draw(ctx, lineWidth = 5, lineColor = "red") {
        ctx.save()
        ctx.lineWidth = lineWidth;
        ctx.strokeStyle = lineColor;
        ctx.strokeRect(this.bounds.center.x - this.bounds.halfDimension.x, this.bounds.center.y - this.bounds.halfDimension.y, this.bounds.halfDimension.x * 2, this.bounds.halfDimension.y * 2);
        ctx.restore();
        if (this.northWest != null) // If children exist
        {
            this.northWest.draw(ctx, lineWidth / 2, lineColor);
            this.northEast.draw(ctx, lineWidth / 2, lineColor);
            this.southWest.draw(ctx, lineWidth / 2, lineColor);
            this.southEast.draw(ctx, lineWidth / 2, lineColor);
        }
    }
}