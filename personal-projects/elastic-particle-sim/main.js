import { Vector2 } from "./Vector.js";
import { AABB } from "./AABB.js";
import { QuadTree } from "./QuadTree.js";

let width = 1080;
let height = 720;
const particles = [];
let particleRadius = 10;
let maxParticleRadius = 10;
let gravity = 0;
let bounciness = 1;
let spawnRate = 1;
let totalKE = 0;
let clock = 0;
let runTime = 0;

// Mouse
let isMouseDown = false;
let mousePos = new Vector2(0, 0);
let prevMousePos = new Vector2(0, 0);
let mouseState;
let grabbedParticle = null;
let grabStrength = 1;
let grabSize = 40;

// Quad Tree
let qt = new QuadTree(new AABB(new Vector2(width / 2, height / 2), new Vector2(width / 2, height / 2)))
let showQTBounds = false;

window.onload = init;

let ctx;
let fpsOutput;
let partCount;
let keOutput;
function init() {
    // Set up canvas
    const canvas = document.querySelector("canvas");
    ctx = canvas.getContext("2d");
    canvas.style.width = width;
    canvas.style.height = height;

    setupHTML();

    // Mouse Functions
    canvas.addEventListener("mousedown", (e) => {
        isMouseDown = true;
        mousePos = getMousePos(canvas, e);
        mouseState = e.button;
    });
    canvas.addEventListener("mouseup", () => { isMouseDown = false; clock = spawnRate; grabbedParticle = null })
    canvas.addEventListener("mousemove", (e) => { prevMousePos = mousePos; mousePos = getMousePos(canvas, e) })

    // Color Screen
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);
    requestAnimationFrame(update);
}

let lastTs = 0;
const displayUpdateFreq = 0.1;
let displayClock = 0;
function update(ts) {
    // Time stuff
    ts *= 0.001;
    const deltaTime = ts - lastTs;
    lastTs = ts;

    // Reset Frame
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, width, height);

    // Spawn new Particle
    runTime += deltaTime;
    if (isMouseDown) {
        if (mouseState == 0) { // If LMB
            clock += deltaTime;
            if (clock >= spawnRate) {
                clock -= spawnRate;
                let color = `hsl(${(runTime * 20) % 360}, 100%, 50%)`;

                let dir = Vector2.clampMag(mousePos.sub(prevMousePos), 5);

                createParticle(mousePos.copy(), dir, particleRadius, color);
            }
        }
        else if (mouseState == 2) // If RMB
        {
            if (grabbedParticle == null) {
                grabbedParticle = getParticlesNearPos(mousePos, grabSize)[0];
            }
            else {
                let dV = mousePos.sub(grabbedParticle.pos); // Desired Velocity
                let header = dV.sub(grabbedParticle.velocity);

                grabbedParticle.velocity = grabbedParticle.velocity.add(header.mult(grabStrength));
                prevMousePos = mousePos;
            }
        }
    }

    updateParticles(deltaTime);
    drawParticles(ctx);

    // Draws option quad tree bounds
    if (showQTBounds) {
        qt.draw(ctx);
    }

    // Update Display Content
    displayClock += deltaTime;
    if (displayClock >= displayUpdateFreq) {
        const fps = 1 / deltaTime;
        fpsOutput.textContent = fps.toFixed();
        keOutput.textContent = totalKE.toFixed(2);
        partCount.textContent = parseInt(particles.length);
        displayClock -= displayUpdateFreq;
    }
    qt.clear();
    particles.forEach(p => {qt.insert(p)});


    requestAnimationFrame(update);
}

function createParticle(pos = new Vector2(0, 0), velocity = new Vector2(0, 0), r = 10, color = "red") {
    if(particleRadius > maxParticleRadius) maxParticleRadius = particleRadius;
    let mass = r * r * 10;
    let p = { pos, velocity, r, mass, color }
    particles.push(p);
}

function drawParticles(ctx) {
    particles.forEach(p => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(p.pos.x, p.pos.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.closePath();
        ctx.restore();
    });
}

function getParticlesNearPos(pos, dist) {
    let nearParticles = [];
    particles.forEach(p => {
        let particleDist = p.pos.sub(pos).mag();
        if (particleDist <= dist) {
            nearParticles.push({ particle: p, distance: particleDist });
        }
    });
    nearParticles.sort((a, b) => {
        return a.distance - b.distance;
    });
    nearParticles = nearParticles.map(data => {
        return data.particle;
    })
    return nearParticles;
}

function updateParticles(deltaTime) {
    totalKE = 0;

    // Go through each leaf in quad tree and check collisions
    const leafCollisions = (leaf, root = leaf) => {
        // If children exist
        if (leaf.northWest !== null) {
            let hd = leaf.northWest.bounds.halfDimension;
            let scaledHD = new Vector2(hd.x + maxParticleRadius, hd.y + maxParticleRadius);
            checkCollisions(leaf.queryRange(new AABB(leaf.northWest.bounds.center, scaledHD)));
            leafCollisions(leaf.northWest, root);
            checkCollisions(leaf.queryRange(new AABB(leaf.northEast.bounds.center, scaledHD)));
            leafCollisions(leaf.northEast, root);
            checkCollisions(leaf.queryRange(new AABB(leaf.southWest.bounds.center, scaledHD)));
            leafCollisions(leaf.southWest, root);
            checkCollisions(leaf.queryRange(new AABB(leaf.southEast.bounds.center, scaledHD)));
            leafCollisions(leaf.southEast, root);
        }
    }

    leafCollisions(qt);

    particles.forEach(p => {
        // Check for small velocities
        if (p.velocity.mag() <= 0.1)
            p.velocity = new Vector2(0, 0);

        p.pos.x += p.velocity.x * deltaTime * 100;
        p.pos.y += p.velocity.y * deltaTime * 100;

        edgeCollision(p);

        // Apply Gravity
        if (p.pos.y < height - p.r)
            p.velocity.y += gravity * deltaTime;

        const mag = p.velocity.mag();
        let ke = 0.5 * p.mass * (mag * mag);
        totalKE += ke;
    });
}

function edgeCollision(p) {
    if (p.pos.x <= 0 + p.r) {
        p.pos.x = 0 + p.r;

        p.velocity.x *= -bounciness;
    }
    if (p.pos.x >= width - p.r) {
        p.pos.x = width - p.r;

        p.velocity.x *= -bounciness;
    }
    if (p.pos.y <= 0 + p.r) {
        p.pos.y = 0 + p.r;

        p.velocity.y *= -bounciness;
    }
    if (p.pos.y >= height - p.r) {
        p.pos.y = height - p.r;

        p.velocity.y *= -bounciness;
    }
}

function checkCollisions(particles) {
    for (let count = 0; count < 1; count++) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const a = particles[i];
                const b = particles[j];

                const impact = b.pos.sub(a.pos); // Line of Impact
                const dist = impact.mag();
                const r = a.r + b.r;
                const overlap = r - dist;

                if (overlap < 0)
                    continue;

                // Seperate 
                const deltaPos = impact.normalize().mult(overlap / 2);
                a.pos = a.pos.sub(deltaPos);
                b.pos = b.pos.add(deltaPos);
                const dir = impact.normalize().mult(r);

                // Particle A collision resolution
                let diffVelocity = b.velocity.sub(a.velocity).mult(bounciness);
                let num = Vector2.dot(diffVelocity, dir);
                let den = (a.mass + b.mass) * (r * r);
                let deltaVA = dir.copy().mult((2 * b.mass * num / den));
                a.velocity = a.velocity.add(deltaVA);

                // Particle B collision resolution
                let deltaVB = dir.copy().mult((-2 * a.mass * num / den));
                b.velocity = b.velocity.add(deltaVB);
            }
        }
    }
    return particles || [];
}

function getMousePos(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    return new Vector2(event.clientX - rect.left, event.clientY - rect.top);
}

function setupHTML() {
    // Set up display outputs
    fpsOutput = document.querySelector("#fps-output");
    partCount = document.querySelector("#particle-count-output");
    keOutput = document.querySelector("#ke-output")


    // Set up controls

    const grabStrengthInput = document.querySelector("#grab-strength-input");
    const grabStrengthOutput = document.querySelector("#grab-strength-output");
    const gravityInput = document.querySelector("#gravity-input");
    const radiusInput = document.querySelector("#radius-input");
    const spawnrateInput = document.querySelector("#spawn-rate-input");
    const qtInput = document.querySelector('#qt-input');

    gravityInput.value = gravity;
    radiusInput.value = particleRadius;
    spawnrateInput.value = spawnRate;
    grabStrengthInput.value = grabStrength;
    grabStrengthOutput.value = grabStrength;

    qtInput.checked = showQTBounds;
    
    grabStrengthInput.addEventListener("change", () => {
        grabStrength = parseFloat(grabStrengthInput.value);
        grabStrengthOutput.textContent = grabStrength.toFixed(2);
    })

    gravityInput.addEventListener("change", () => {
        gravity = parseFloat(gravityInput.value);
    })

    radiusInput.addEventListener("change", () => {
        particleRadius = parseFloat(radiusInput.value);
    })

    spawnrateInput.addEventListener("change", () => {
        spawnRate = parseFloat(spawnrateInput.value);
    })

    qtInput.addEventListener('change', () => showQTBounds = !showQTBounds);
}