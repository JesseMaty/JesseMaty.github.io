import { Vector2 } from "./vector.js";

class Node {
    bounds;
    children;
    parent;
    particles = new Map();
    checkParticleTime = 0; // How often the node will check the positions of its particles to see if theyve moved-- should be proportional to the size of the nodes bounds
    
    constructor(bounds = { l: 0, r: 0, t: 0, b: 0 }, parent) {
        this.bounds = bounds;
        this.parent = parent;
        children = [];
    }

    addChild(child){
        this.children.add(child);
    }

    addParticle(p){
        this.particles.set(p.pos, p);
    }

    getParticle(pos){
        let p = this.particles.get(pos);
        this.particles.delete(pos);
        return p;
    }

    split(){
        for(let i = 1; i <= 2; i++){
            for(let j = 1; j <= 2; j++){
                // Calculates children bounds
                let child = new Node({l:0, r:0, t: 0, b:0 }, this);
                
                // Move respective particles into child

                // Remove moved particles from this node

                // Add child to node
            }
        }
    }
}

export{Node}