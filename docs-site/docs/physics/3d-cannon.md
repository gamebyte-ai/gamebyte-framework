---
id: 3d-cannon
title: 3D Physics (Cannon.js)
description: 3D physics with Cannon.js
sidebar_position: 3
keywords: [3d, physics, cannon.js, rigid body]
llm_summary: "Cannon.js 3D physics. Create world: Physics.create3DWorld(). Bodies: create3DBody({ shape, mass }). Sync with Three.js meshes in update loop."
---

<!-- llm-context: 3d-physics, cannon-js, rigid-body, collision, three-js-sync -->

import LiveDemo from '@site/src/components/LiveDemo';

# 3D Physics (Cannon.js)

GameByte uses Cannon-es for 3D physics simulation.

## World Setup

```typescript
import { Physics } from '@gamebyte/framework';

Physics.create3DWorld({
    gravity: { x: 0, y: -9.8, z: 0 },
    iterations: 10,
    tolerance: 0.001
});
```

<LiveDemo
  src="/demos/physics-3d-demo.html"
  height={560}
  title="3D Physics Demo"
/>

:::tip Theme Support
This demo automatically adapts to your selected theme. Try toggling the theme using the 🌙/☀️ button in the navigation bar!
:::

## Creating Bodies

### Box Body

```typescript
const box = Physics.create3DBody({
    x: 0, y: 5, z: 0,
    shape: 'box',
    size: { x: 1, y: 1, z: 1 },
    mass: 1,
    options: {
        label: 'crate'
    }
});
```

### Sphere Body

```typescript
const ball = Physics.create3DBody({
    x: 0, y: 10, z: 0,
    shape: 'sphere',
    radius: 0.5,
    mass: 1,
    options: {
        restitution: 0.7  // Bouncy
    }
});
```

### Ground Plane

```typescript
const ground = Physics.create3DStaticBody({
    x: 0, y: 0, z: 0,
    shape: 'plane',
    options: {
        label: 'ground'
    }
});

// Rotate to be horizontal
Physics.setRotation(ground, { x: -Math.PI / 2, y: 0, z: 0 });
```

## Syncing with Three.js

```typescript
import * as THREE from 'three';

class PhysicsMesh {
    public mesh: THREE.Mesh;
    public body: CANNON.Body;

    constructor() {
        // Create Three.js mesh
        this.mesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: 0x4CAF50 })
        );

        // Create physics body
        this.body = Physics.create3DBody({
            x: 0, y: 5, z: 0,
            shape: 'box',
            size: { x: 1, y: 1, z: 1 },
            mass: 1
        });
    }

    update(): void {
        // Copy position and rotation from physics to mesh
        this.mesh.position.copy(this.body.position as any);
        this.mesh.quaternion.copy(this.body.quaternion as any);
    }
}
```

## Character Controller

```typescript
class CharacterController3D {
    private body: CANNON.Body;
    private speed = 5;
    private jumpForce = 7;
    private isGrounded = false;

    constructor() {
        this.body = Physics.create3DBody({
            x: 0, y: 2, z: 0,
            shape: 'capsule',
            radius: 0.5,
            height: 1,
            mass: 1,
            options: {
                label: 'player',
                fixedRotation: true  // Don't tip over
            }
        });

        this.setupGroundCheck();
    }

    private setupGroundCheck(): void {
        Physics.onCollision3D('player', 'ground', () => {
            this.isGrounded = true;
        });
    }

    update(input: { forward: boolean, back: boolean, left: boolean, right: boolean, jump: boolean }, camera: THREE.Camera): void {
        const velocity = { x: 0, y: this.body.velocity.y, z: 0 };

        // Get camera direction
        const forward = new THREE.Vector3();
        camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();

        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));

        // Movement relative to camera
        if (input.forward) {
            velocity.x += forward.x * this.speed;
            velocity.z += forward.z * this.speed;
        }
        if (input.back) {
            velocity.x -= forward.x * this.speed;
            velocity.z -= forward.z * this.speed;
        }
        if (input.left) {
            velocity.x -= right.x * this.speed;
            velocity.z -= right.z * this.speed;
        }
        if (input.right) {
            velocity.x += right.x * this.speed;
            velocity.z += right.z * this.speed;
        }

        Physics.setVelocity3D(this.body, velocity);

        // Jump
        if (input.jump && this.isGrounded) {
            Physics.applyImpulse3D(this.body, { x: 0, y: this.jumpForce, z: 0 });
            this.isGrounded = false;
        }
    }

    getPosition(): THREE.Vector3 {
        return new THREE.Vector3(
            this.body.position.x,
            this.body.position.y,
            this.body.position.z
        );
    }
}
```

## Vehicle Physics

```typescript
const vehicle = Physics.createVehicle({
    chassis: {
        shape: 'box',
        size: { x: 2, y: 0.5, z: 4 },
        mass: 500
    },
    wheels: [
        { position: { x: -1, y: 0, z: 1.5 }, radius: 0.4 },
        { position: { x: 1, y: 0, z: 1.5 }, radius: 0.4 },
        { position: { x: -1, y: 0, z: -1.5 }, radius: 0.4 },
        { position: { x: 1, y: 0, z: -1.5 }, radius: 0.4 }
    ],
    suspension: {
        stiffness: 30,
        damping: 3,
        compression: 4
    }
});

// Control vehicle
function updateVehicle(input: { throttle: number, steering: number }) {
    vehicle.setSteeringValue(input.steering, 0); // Front left
    vehicle.setSteeringValue(input.steering, 1); // Front right
    vehicle.applyEngineForce(input.throttle * 1000, 2); // Rear left
    vehicle.applyEngineForce(input.throttle * 1000, 3); // Rear right
}
```

## Raycasting

```typescript
// Ray from camera for picking
const from = camera.position;
const direction = new THREE.Vector3();
camera.getWorldDirection(direction);
const to = from.clone().add(direction.multiplyScalar(100));

const result = Physics.raycast3D(from, to);
if (result.hit) {
    console.log('Hit:', result.body.label);
    console.log('Point:', result.point);
    console.log('Normal:', result.normal);
}
```
