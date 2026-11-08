---
name: three-physics-rapier
description: Use when integrating Rapier physics (rigid bodies, colliders, joints, character controllers) into a Three.js or R3F scene. Builds a complete physics-to-render sync system with fixed timestep, disposal, and debug visualization.
category: three
pairs_with: three-physics-rapier-eval
---

# Rapier Physics in Three.js

## What this builds
A production physics integration layer that couples a Rapier WASM physics world to a Three.js scene graph, with fixed-timestep simulation, rigid body/collider lifecycle management, transform sync from physics to render, debug wireframe visualization, and full cleanup on teardown. The finished system lets you tag meshes as dynamic/kinematic/fixed, attach collider shapes, and have physically-driven motion with zero per-frame allocation.

- Rapier WASM world initialized asynchronously with proper await pattern
- Fixed-timestep accumulator decoupled from render frame rate
- Rigid body + collider creation from Three.js mesh geometry
- Per-frame transform sync: physics world -> Three.js Object3D positions/rotations
- Character controller (KinematicCharacterController) for player-like movement
- Joints (revolute, prismatic, spherical, fixed) between bodies
- Debug wireframe renderer showing collider shapes
- Full disposal: bodies, colliders, joints, and the world itself

## When to use / when not to
- Use when your 3D scene needs real rigid body dynamics: objects falling, bouncing, stacking, colliding, hinging.
- Use when you need a character controller that slides along walls, climbs steps, and respects gravity.
- Use for interactive product physics (knock objects around, drop things on a surface).
- Do NOT use for purely cosmetic motion (floating, orbiting, bobbing). That is animation, not physics. See `three-js-fundamentals` for simple transform animation.
- Do NOT use for 2D physics. Rapier has a 2D build (`@dimforge/rapier2d`), but this toolkit covers the 3D variant only.
- Do NOT use for soft body, cloth, or fluid simulation. Rapier is a rigid body engine. Those need specialized solvers.
- If working in R3F, consider `@react-three/rapier` which wraps Rapier in React components. This toolkit covers both vanilla and the principles that `@react-three/rapier` abstracts.

## Stack decision

| Dependency | Version | Why |
|---|---|---|
| `three` | 0.169.0 | Render engine |
| `@dimforge/rapier3d-compat` | 0.14.0 | Rapier 3D physics, WASM build with JS compat layer. The `-compat` build works without top-level await or WASM import support; it bundles the WASM as base64. |
| `@react-three/rapier` | 1.4.0 | R3F declarative wrapper (R3F path only) |

**Why Rapier over alternatives:**
- **vs Cannon.js / cannon-es**: Rapier is deterministic, faster at high body counts (Rust/WASM vs pure JS), has CCD (continuous collision detection), and is actively maintained. Cannon-es is unmaintained since 2023.
- **vs Ammo.js (Bullet)**: Ammo.js is a full Emscripten port of Bullet, 300KB+ gzipped. Rapier is ~250KB gzipped but with a cleaner API and no manual memory management.
- **vs Jolt Physics**: Jolt is newer and competitive, but Rapier has better Three.js ecosystem integration (react-three-rapier) and more web-specific documentation.

**Cheaper alternative:** For simple gravity + ground plane + sphere bouncing, a hand-rolled Euler integrator (velocity += gravity * dt, position += velocity * dt, if y < 0 bounce) is zero dependencies and sufficient for decorative physics.

## Architecture

```
PhysicsSystem
  |- RAPIER.World (gravity, integration parameters)
  |    |- RigidBody[] (dynamic, kinematic, fixed)
  |    |    |- Collider[] (cuboid, ball, capsule, trimesh, convex hull)
  |    |    |- Joints (revolute, prismatic, spherical, fixed)
  |    |
  |    |- CharacterController (optional)
  |
  |- BodyMap<Three.Object3D -> RigidBody>
  |    |- maps each Three.js mesh to its physics body
  |    |- sync loop reads body transform -> writes to mesh
  |
  |- FixedTimestep
  |    |- accumulator pattern: decouple physics rate from render rate
  |    |- default 60Hz physics (16.67ms step)
  |    |- max 4 sub-steps per frame to prevent spiral of death
  |
  |- DebugRenderer (optional)
  |    |- LineSegments showing collider wireframes
  |    |- Updated each frame from world.debugRender()
  |
  |- Disposer
       |- removes all bodies, colliders, joints from world
       |- frees world
       |- disposes debug geometry
```

Lifecycle: await RAPIER.init() -> create world -> add bodies/colliders -> render loop steps world + syncs transforms -> teardown removes everything.

## Build it: step by step

### Phase 1: Install and initialize WASM

```bash
npm install @dimforge/rapier3d-compat@0.14.0
```

Rapier's WASM must be initialized before any API call. Use the `-compat` build which handles WASM loading internally.

```js
import RAPIER from '@dimforge/rapier3d-compat'

let world = null

async function initPhysics() {
  await RAPIER.init()
  const gravity = new RAPIER.Vector3(0, -9.81, 0)
  world = new RAPIER.World(gravity)
  return world
}
```

### Phase 2: Create the body/collider mapping system

```js
class PhysicsSystem {
  constructor() {
    this.world = null
    this.bodyMap = new Map()    // Three.Object3D -> RigidBody
    this.meshMap = new Map()    // RigidBody handle -> Three.Object3D
    this.colliders = []
    this.joints = []
    this.disposed = false
    this._pos = new THREE.Vector3()
    this._quat = new THREE.Quaternion()
  }

  async init(gravity = { x: 0, y: -9.81, z: 0 }) {
    await RAPIER.init()
    this.world = new RAPIER.World(gravity)
    return this
  }
}
```

### Phase 3: Add rigid bodies with colliders

Three body types: dynamic (affected by forces/gravity), fixed (immovable), kinematic (moved by code, affects dynamic bodies).

```js
PhysicsSystem.prototype.addDynamic = function (mesh, shape, opts = {}) {
  const bodyDesc = RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
    .setRotation({
      x: mesh.quaternion.x,
      y: mesh.quaternion.y,
      z: mesh.quaternion.z,
      w: mesh.quaternion.w,
    })

  if (opts.linearDamping != null) bodyDesc.setLinearDamping(opts.linearDamping)
  if (opts.angularDamping != null) bodyDesc.setAngularDamping(opts.angularDamping)
  if (opts.ccd) bodyDesc.setCcdEnabled(true)

  const body = this.world.createRigidBody(bodyDesc)

  const colliderDesc = this._createColliderDesc(shape, opts)
  if (opts.restitution != null) colliderDesc.setRestitution(opts.restitution)
  if (opts.friction != null) colliderDesc.setFriction(opts.friction)
  if (opts.density != null) colliderDesc.setDensity(opts.density)
  if (opts.mass != null) colliderDesc.setMass(opts.mass)

  const collider = this.world.createCollider(colliderDesc, body)

  this.bodyMap.set(mesh, body)
  this.meshMap.set(body.handle, mesh)
  this.colliders.push(collider)
  return body
}

PhysicsSystem.prototype.addFixed = function (mesh, shape, opts = {}) {
  const bodyDesc = RAPIER.RigidBodyDesc.fixed()
    .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
    .setRotation({
      x: mesh.quaternion.x,
      y: mesh.quaternion.y,
      z: mesh.quaternion.z,
      w: mesh.quaternion.w,
    })
  const body = this.world.createRigidBody(bodyDesc)

  const colliderDesc = this._createColliderDesc(shape, opts)
  if (opts.restitution != null) colliderDesc.setRestitution(opts.restitution)
  if (opts.friction != null) colliderDesc.setFriction(opts.friction)

  const collider = this.world.createCollider(colliderDesc, body)
  this.bodyMap.set(mesh, body)
  this.meshMap.set(body.handle, mesh)
  this.colliders.push(collider)
  return body
}

PhysicsSystem.prototype.addKinematic = function (mesh, shape, opts = {}) {
  const bodyDesc = RAPIER.RigidBodyDesc.kinematicPositionBased()
    .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
    .setRotation({
      x: mesh.quaternion.x,
      y: mesh.quaternion.y,
      z: mesh.quaternion.z,
      w: mesh.quaternion.w,
    })
  const body = this.world.createRigidBody(bodyDesc)
  const colliderDesc = this._createColliderDesc(shape, opts)
  const collider = this.world.createCollider(colliderDesc, body)
  this.bodyMap.set(mesh, body)
  this.meshMap.set(body.handle, mesh)
  this.colliders.push(collider)
  return body
}
```

### Phase 4: Collider shape factory

```js
PhysicsSystem.prototype._createColliderDesc = function (shape, opts) {
  switch (shape) {
    case 'cuboid': {
      const s = opts.halfExtents ?? { x: 0.5, y: 0.5, z: 0.5 }
      return RAPIER.ColliderDesc.cuboid(s.x, s.y, s.z)
    }
    case 'ball': {
      return RAPIER.ColliderDesc.ball(opts.radius ?? 0.5)
    }
    case 'capsule': {
      return RAPIER.ColliderDesc.capsule(opts.halfHeight ?? 0.5, opts.radius ?? 0.25)
    }
    case 'cylinder': {
      return RAPIER.ColliderDesc.cylinder(opts.halfHeight ?? 0.5, opts.radius ?? 0.5)
    }
    case 'cone': {
      return RAPIER.ColliderDesc.cone(opts.halfHeight ?? 0.5, opts.radius ?? 0.5)
    }
    case 'trimesh': {
      // For static/fixed bodies only. Dynamic trimesh is unsupported (use convex hull).
      const geo = opts.geometry
      const vertices = new Float32Array(geo.attributes.position.array)
      const indices = new Uint32Array(geo.index.array)
      return RAPIER.ColliderDesc.trimesh(vertices, indices)
    }
    case 'convexHull': {
      const geo = opts.geometry
      const points = new Float32Array(geo.attributes.position.array)
      return RAPIER.ColliderDesc.convexHull(points)
    }
    default:
      throw new Error(`Unknown collider shape: ${shape}`)
  }
}
```

### Phase 5: Fixed-timestep simulation

Physics must run at a fixed rate regardless of render frame rate. The accumulator pattern prevents instability from variable delta times.

```js
PhysicsSystem.prototype.createStepper = function (fixedDt = 1 / 60, maxSubSteps = 4) {
  this._fixedDt = fixedDt
  this._maxSubSteps = maxSubSteps
  this._accumulator = 0
}

PhysicsSystem.prototype.step = function (dt) {
  if (this.disposed || !this.world) return

  this._accumulator += dt
  let steps = 0
  while (this._accumulator >= this._fixedDt && steps < this._maxSubSteps) {
    this.world.step()
    this._accumulator -= this._fixedDt
    steps++
  }
  // Clamp accumulator to prevent spiral of death
  if (this._accumulator > this._fixedDt * 2) {
    this._accumulator = 0
  }

  this._syncTransforms()
}

PhysicsSystem.prototype._syncTransforms = function () {
  this.bodyMap.forEach((body, mesh) => {
    if (body.isDynamic() || body.isKinematic()) {
      const pos = body.translation()
      const rot = body.rotation()
      mesh.position.set(pos.x, pos.y, pos.z)
      mesh.quaternion.set(rot.x, rot.y, rot.z, rot.w)
    }
  })
}
```

### Phase 6: Kinematic body control

Move kinematic bodies by setting their next position. The physics engine interpolates and handles collision response against dynamic bodies.

```js
PhysicsSystem.prototype.moveKinematic = function (mesh, position, rotation) {
  const body = this.bodyMap.get(mesh)
  if (!body) return
  body.setNextKinematicTranslation(position)
  if (rotation) {
    body.setNextKinematicRotation(rotation)
  }
}
```

### Phase 7: Character controller

Rapier's `KinematicCharacterController` handles step climbing, slope limits, and snapping to ground.

```js
PhysicsSystem.prototype.createCharacterController = function (opts = {}) {
  const cc = this.world.createCharacterController(opts.offset ?? 0.01)
  cc.setUp({ x: 0, y: 1, z: 0 })
  cc.setMaxSlopeClimbAngle(opts.maxSlope ?? (45 * Math.PI) / 180)
  cc.setMinSlopeSlideAngle(opts.minSlide ?? (30 * Math.PI) / 180)
  cc.enableAutostep(opts.stepHeight ?? 0.3, opts.stepWidth ?? 0.2, true)
  cc.enableSnapToGround(opts.snapDistance ?? 0.3)
  this._characterController = cc
  return cc
}

PhysicsSystem.prototype.moveCharacter = function (mesh, desiredMovement) {
  const body = this.bodyMap.get(mesh)
  if (!body || !this._characterController) return

  // Get the collider attached to this body
  const collider = body.collider(0)
  this._characterController.computeColliderMovement(collider, desiredMovement)
  const corrected = this._characterController.computedMovement()

  const pos = body.translation()
  body.setNextKinematicTranslation({
    x: pos.x + corrected.x,
    y: pos.y + corrected.y,
    z: pos.z + corrected.z,
  })
}
```

### Phase 8: Joints

```js
PhysicsSystem.prototype.addRevoluteJoint = function (meshA, meshB, opts = {}) {
  const bodyA = this.bodyMap.get(meshA)
  const bodyB = this.bodyMap.get(meshB)
  if (!bodyA || !bodyB) return null

  const anchorA = opts.anchorA ?? { x: 0, y: 0, z: 0 }
  const anchorB = opts.anchorB ?? { x: 0, y: 0, z: 0 }
  const axis = opts.axis ?? { x: 0, y: 0, z: 1 }

  const params = RAPIER.JointData.revolute(anchorA, anchorB, axis)
  if (opts.limitsEnabled) {
    params.limitsEnabled = true
    params.limits = [opts.limitsMin ?? -Math.PI, opts.limitsMax ?? Math.PI]
  }
  const joint = this.world.createImpulseJoint(params, bodyA, bodyB, true)
  this.joints.push(joint)
  return joint
}

PhysicsSystem.prototype.addFixedJoint = function (meshA, meshB) {
  const bodyA = this.bodyMap.get(meshA)
  const bodyB = this.bodyMap.get(meshB)
  if (!bodyA || !bodyB) return null

  const anchorA = { x: 0, y: 0, z: 0 }
  const anchorB = { x: 0, y: 0, z: 0 }
  const frameA = { x: 0, y: 0, z: 0, w: 1 }
  const frameB = { x: 0, y: 0, z: 0, w: 1 }

  const params = RAPIER.JointData.fixed(anchorA, frameA, anchorB, frameB)
  const joint = this.world.createImpulseJoint(params, bodyA, bodyB, true)
  this.joints.push(joint)
  return joint
}
```

### Phase 9: Debug wireframe renderer

```js
PhysicsSystem.prototype.initDebug = function (scene) {
  this._debugMesh = new THREE.LineSegments(
    new THREE.BufferGeometry(),
    new THREE.LineBasicMaterial({ color: 0x00ff00, depthTest: false }),
  )
  this._debugMesh.renderOrder = 999
  this._debugMesh.frustumCulled = false
  scene.add(this._debugMesh)
  this._debugEnabled = true
}

PhysicsSystem.prototype.updateDebug = function () {
  if (!this._debugEnabled || !this._debugMesh) return

  const buffers = this.world.debugRender()
  const geometry = this._debugMesh.geometry
  geometry.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(buffers.vertices, 3),
  )
  geometry.setAttribute(
    'color',
    new THREE.Float32BufferAttribute(buffers.colors, 4),
  )
  // Update material to use vertex colors
  this._debugMesh.material.vertexColors = true
}
```

### Phase 10: Disposal

```js
PhysicsSystem.prototype.dispose = function () {
  if (this.disposed) return
  this.disposed = true

  // Remove joints first (joints reference bodies)
  for (const joint of this.joints) {
    this.world.removeImpulseJoint(joint, true)
  }
  this.joints = []

  // Remove colliders and bodies
  this.bodyMap.forEach((body) => {
    // Colliders are auto-removed when body is removed
    this.world.removeRigidBody(body)
  })
  this.bodyMap.clear()
  this.meshMap.clear()
  this.colliders = []

  if (this._characterController) {
    this.world.removeCharacterController(this._characterController)
    this._characterController = null
  }

  // Clean debug visualization
  if (this._debugMesh) {
    this._debugMesh.geometry.dispose()
    this._debugMesh.material.dispose()
    this._debugMesh.parent?.remove(this._debugMesh)
    this._debugMesh = null
  }

  this.world.free()
  this.world = null
}
```

### Phase 11: Complete wiring example

```js
import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'

// Scene setup (see three-js-fundamentals)
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100)
camera.position.set(0, 5, 10)
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(innerWidth, innerHeight)
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

const physics = new PhysicsSystem()

async function start() {
  await physics.init()
  physics.createStepper(1 / 60, 4)

  // Ground plane (fixed body)
  const ground = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.2, 20),
    new THREE.MeshStandardMaterial({ color: 0x444444 }),
  )
  ground.position.y = -0.1
  scene.add(ground)
  physics.addFixed(ground, 'cuboid', {
    halfExtents: { x: 10, y: 0.1, z: 10 },
    restitution: 0.3,
    friction: 0.8,
  })

  // Falling cubes
  for (let i = 0; i < 50; i++) {
    const cube = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.6, 0.6),
      new THREE.MeshStandardMaterial({
        color: new THREE.Color().setHSL(Math.random(), 0.6, 0.5),
      }),
    )
    cube.position.set(
      (Math.random() - 0.5) * 4,
      2 + i * 0.8,
      (Math.random() - 0.5) * 4,
    )
    cube.castShadow = true
    scene.add(cube)
    physics.addDynamic(cube, 'cuboid', {
      halfExtents: { x: 0.3, y: 0.3, z: 0.3 },
      restitution: 0.4,
      friction: 0.6,
      linearDamping: 0.1,
      angularDamping: 0.3,
    })
  }

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const dir = new THREE.DirectionalLight(0xffffff, 2)
  dir.position.set(5, 8, 3)
  scene.add(dir)

  // Optional: debug wireframes
  // physics.initDebug(scene)

  const clock = new THREE.Clock()
  renderer.setAnimationLoop(() => {
    const dt = clock.getDelta()
    physics.step(dt)
    // physics.updateDebug()
    renderer.render(scene, camera)
  })
}

start()

// On teardown:
// physics.dispose()
// renderer.dispose()
```

## The full reference implementation

```js
import * as THREE from 'three'
import RAPIER from '@dimforge/rapier3d-compat'

class PhysicsSystem {
  constructor() {
    this.world = null
    this.bodyMap = new Map()
    this.meshMap = new Map()
    this.colliders = []
    this.joints = []
    this.disposed = false
    this._fixedDt = 1 / 60
    this._maxSubSteps = 4
    this._accumulator = 0
    this._characterController = null
    this._debugMesh = null
    this._debugEnabled = false
  }

  async init(gravity = { x: 0, y: -9.81, z: 0 }) {
    await RAPIER.init()
    this.world = new RAPIER.World(gravity)
    return this
  }

  _createColliderDesc(shape, opts) {
    switch (shape) {
      case 'cuboid': return RAPIER.ColliderDesc.cuboid(
        opts.halfExtents?.x ?? 0.5, opts.halfExtents?.y ?? 0.5, opts.halfExtents?.z ?? 0.5)
      case 'ball': return RAPIER.ColliderDesc.ball(opts.radius ?? 0.5)
      case 'capsule': return RAPIER.ColliderDesc.capsule(opts.halfHeight ?? 0.5, opts.radius ?? 0.25)
      case 'cylinder': return RAPIER.ColliderDesc.cylinder(opts.halfHeight ?? 0.5, opts.radius ?? 0.5)
      case 'cone': return RAPIER.ColliderDesc.cone(opts.halfHeight ?? 0.5, opts.radius ?? 0.5)
      case 'trimesh': {
        const g = opts.geometry
        return RAPIER.ColliderDesc.trimesh(
          new Float32Array(g.attributes.position.array),
          new Uint32Array(g.index.array))
      }
      case 'convexHull': return RAPIER.ColliderDesc.convexHull(
        new Float32Array(opts.geometry.attributes.position.array))
      default: throw new Error(`Unknown shape: ${shape}`)
    }
  }

  _addBody(mesh, bodyDesc, shape, opts) {
    const body = this.world.createRigidBody(bodyDesc)
    const cd = this._createColliderDesc(shape, opts)
    if (opts.restitution != null) cd.setRestitution(opts.restitution)
    if (opts.friction != null) cd.setFriction(opts.friction)
    if (opts.density != null) cd.setDensity(opts.density)
    if (opts.mass != null) cd.setMass(opts.mass)
    if (opts.sensor) cd.setSensor(true)
    const collider = this.world.createCollider(cd, body)
    this.bodyMap.set(mesh, body)
    this.meshMap.set(body.handle, mesh)
    this.colliders.push(collider)
    return body
  }

  addDynamic(mesh, shape, opts = {}) {
    const desc = RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
      .setRotation({ x: mesh.quaternion.x, y: mesh.quaternion.y,
                     z: mesh.quaternion.z, w: mesh.quaternion.w })
    if (opts.linearDamping != null) desc.setLinearDamping(opts.linearDamping)
    if (opts.angularDamping != null) desc.setAngularDamping(opts.angularDamping)
    if (opts.ccd) desc.setCcdEnabled(true)
    return this._addBody(mesh, desc, shape, opts)
  }

  addFixed(mesh, shape, opts = {}) {
    const desc = RAPIER.RigidBodyDesc.fixed()
      .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
      .setRotation({ x: mesh.quaternion.x, y: mesh.quaternion.y,
                     z: mesh.quaternion.z, w: mesh.quaternion.w })
    return this._addBody(mesh, desc, shape, opts)
  }

  addKinematic(mesh, shape, opts = {}) {
    const desc = RAPIER.RigidBodyDesc.kinematicPositionBased()
      .setTranslation(mesh.position.x, mesh.position.y, mesh.position.z)
      .setRotation({ x: mesh.quaternion.x, y: mesh.quaternion.y,
                     z: mesh.quaternion.z, w: mesh.quaternion.w })
    return this._addBody(mesh, desc, shape, opts)
  }

  moveKinematic(mesh, position, rotation) {
    const body = this.bodyMap.get(mesh)
    if (!body) return
    body.setNextKinematicTranslation(position)
    if (rotation) body.setNextKinematicRotation(rotation)
  }

  applyImpulse(mesh, impulse) {
    const body = this.bodyMap.get(mesh)
    if (!body) return
    body.applyImpulse(impulse, true)
  }

  applyForce(mesh, force) {
    const body = this.bodyMap.get(mesh)
    if (!body) return
    body.addForce(force, true)
  }

  removeBody(mesh) {
    const body = this.bodyMap.get(mesh)
    if (!body) return
    this.world.removeRigidBody(body)
    this.bodyMap.delete(mesh)
    this.meshMap.delete(body.handle)
  }

  createCharacterController(opts = {}) {
    const cc = this.world.createCharacterController(opts.offset ?? 0.01)
    cc.setUp({ x: 0, y: 1, z: 0 })
    cc.setMaxSlopeClimbAngle(opts.maxSlope ?? (45 * Math.PI / 180))
    cc.setMinSlopeSlideAngle(opts.minSlide ?? (30 * Math.PI / 180))
    cc.enableAutostep(opts.stepHeight ?? 0.3, opts.stepWidth ?? 0.2, true)
    cc.enableSnapToGround(opts.snapDistance ?? 0.3)
    this._characterController = cc
    return cc
  }

  moveCharacter(mesh, desiredMovement) {
    const body = this.bodyMap.get(mesh)
    if (!body || !this._characterController) return
    const collider = body.collider(0)
    this._characterController.computeColliderMovement(collider, desiredMovement)
    const m = this._characterController.computedMovement()
    const p = body.translation()
    body.setNextKinematicTranslation({ x: p.x + m.x, y: p.y + m.y, z: p.z + m.z })
  }

  addRevoluteJoint(meshA, meshB, opts = {}) {
    const a = this.bodyMap.get(meshA), b = this.bodyMap.get(meshB)
    if (!a || !b) return null
    const params = RAPIER.JointData.revolute(
      opts.anchorA ?? { x: 0, y: 0, z: 0 },
      opts.anchorB ?? { x: 0, y: 0, z: 0 },
      opts.axis ?? { x: 0, y: 0, z: 1 })
    if (opts.limits) { params.limitsEnabled = true; params.limits = opts.limits }
    const joint = this.world.createImpulseJoint(params, a, b, true)
    this.joints.push(joint)
    return joint
  }

  createStepper(fixedDt = 1/60, maxSubSteps = 4) {
    this._fixedDt = fixedDt; this._maxSubSteps = maxSubSteps; this._accumulator = 0
  }

  step(dt) {
    if (this.disposed || !this.world) return
    this._accumulator += dt
    let steps = 0
    while (this._accumulator >= this._fixedDt && steps < this._maxSubSteps) {
      this.world.step(); this._accumulator -= this._fixedDt; steps++
    }
    if (this._accumulator > this._fixedDt * 2) this._accumulator = 0
    this.bodyMap.forEach((body, mesh) => {
      if (body.isDynamic() || body.isKinematic()) {
        const p = body.translation(), r = body.rotation()
        mesh.position.set(p.x, p.y, p.z)
        mesh.quaternion.set(r.x, r.y, r.z, r.w)
      }
    })
  }

  initDebug(scene) {
    this._debugMesh = new THREE.LineSegments(
      new THREE.BufferGeometry(),
      new THREE.LineBasicMaterial({ color: 0x00ff00, depthTest: false }))
    this._debugMesh.renderOrder = 999
    this._debugMesh.frustumCulled = false
    scene.add(this._debugMesh)
    this._debugEnabled = true
  }

  updateDebug() {
    if (!this._debugEnabled || !this._debugMesh) return
    const b = this.world.debugRender()
    const g = this._debugMesh.geometry
    g.setAttribute('position', new THREE.Float32BufferAttribute(b.vertices, 3))
    g.setAttribute('color', new THREE.Float32BufferAttribute(b.colors, 4))
    this._debugMesh.material.vertexColors = true
  }

  dispose() {
    if (this.disposed) return
    this.disposed = true
    for (const j of this.joints) this.world.removeImpulseJoint(j, true)
    this.joints = []
    this.bodyMap.forEach((body) => this.world.removeRigidBody(body))
    this.bodyMap.clear(); this.meshMap.clear(); this.colliders = []
    if (this._characterController) {
      this.world.removeCharacterController(this._characterController)
      this._characterController = null
    }
    if (this._debugMesh) {
      this._debugMesh.geometry.dispose()
      this._debugMesh.material.dispose()
      this._debugMesh.parent?.remove(this._debugMesh)
      this._debugMesh = null
    }
    this.world.free()
    this.world = null
  }
}
```

## Tuning the feel

| Parameter | Value | Why |
|---|---|---|
| Gravity | -9.81 m/s^2 | Earth standard. Use -4.0 for floaty/low-gravity, -20.0 for heavy/snappy. |
| Fixed timestep | 1/60 (16.67ms) | Match render rate. Use 1/120 for higher fidelity physics (double CPU cost). |
| Max sub-steps | 4 | Prevents spiral of death on frame drops. 4 means physics can catch up from a 67ms frame drop. |
| Linear damping | 0.1 | Air resistance. 0.0 = vacuum (objects never stop). 0.5 = heavy air. 2.0+ = underwater feel. |
| Angular damping | 0.3 | Rotational resistance. Higher makes objects stop spinning sooner. |
| Restitution | 0.3-0.5 | Bounciness. 0.0 = dead stop. 1.0 = perfect elastic bounce. Above 0.8 feels cartoonish. |
| Friction | 0.5-0.8 | Surface grip. 0.0 = ice. 1.0 = rubber. |
| CCD enabled | true for fast-moving objects | Prevents tunneling through thin walls. Costs ~20% more per body. |
| Character controller offset | 0.01 | Skin width. Too large = floats above ground. Too small = clips through thin edges. |
| Autostep height | 0.3 | Max step the character can climb without jumping. Tune to your stair height. |
| Snap to ground | 0.3 | Distance the character will snap down to the ground. Prevents floating on slopes. |

## Variants

### 1. Product showcase (knock objects around)
A table surface (fixed body) with products (dynamic bodies, low damping, moderate restitution). Mouse drag applies force via raycast intersection point. Low gravity (-4.0) for a playful, floaty feel.

### 2. Ragdoll
Chain of capsule bodies connected by revolute joints with angle limits. Each limb is a capsule collider. Apply impulse to the root body to launch the ragdoll. Angular damping 0.8 to prevent infinite spinning.

### 3. Domino chain
Thin cuboid bodies (half-extents 0.05, 0.4, 0.2) standing in a line. First one gets a small impulse. Restitution 0.1 (low bounce), friction 0.9 (grip). High angular damping (0.5) so they settle quickly.

### 4. Vehicle physics
Chassis as a dynamic cuboid. Wheels as kinematic cylinders connected via revolute joints. Steer by setting joint motor targets. Suspension modeled by spring joints.

### 5. Breakable objects
Start with a single mesh. On collision above a force threshold (read contact force from collision events), replace the mesh with multiple smaller dynamic bodies scattered from the impact point. Pre-generate the fragments as convex hull colliders.

## Performance budget

| Metric | Target | Lever |
|---|---|---|
| Physics step time | < 4ms per frame | Reduce body count, simplify colliders |
| Active body count | < 500 on desktop, < 100 on mobile | Sleep distant/settled bodies |
| Collider complexity | Primitives (cuboid, ball, capsule) over trimesh | Trimesh is 10-50x more expensive than primitives |
| WASM bundle | ~250KB gzipped | One-time load cost; acceptable for any physics-heavy page |
| Memory per body | ~1KB | 500 bodies = ~500KB |

**What to cut first:**
1. Replace trimesh colliders with convex hulls or primitive approximations
2. Enable body sleeping (Rapier does this by default; do not disable it)
3. Reduce body count (combine small nearby objects into compound colliders)
4. Lower simulation rate (1/30 instead of 1/60; noticeable but acceptable for background physics)
5. Disable CCD on slow-moving objects

## Accessibility

### prefers-reduced-motion
```js
if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
  // Let physics settle on init (run 120 steps instantly), then freeze
  for (let i = 0; i < 120; i++) physics.world.step()
  physics._syncTransforms()
  // Do not step further; scene shows a static, physically-settled arrangement
}
```

### Semantics
Physics simulations are interactive visual content. If objects are clickable/draggable, expose those interactions through DOM buttons or aria-live regions that announce state changes. The canvas itself needs `role="application"` with keyboard fallbacks when the physics scene is the primary interactive content, not just decorative.

### Honest cost
Physics simulations consume CPU (WASM execution) and GPU (rendering). On low-end devices, a 500-body simulation can claim 8ms+ of CPU time per frame, leaving very little for rendering. Test on target devices.

## Anti-slop rules
1. DO NOT use `world.step()` with a variable delta time. Physics engines require fixed timesteps for determinism and stability. Use the accumulator pattern.
2. DO NOT create trimesh colliders for dynamic bodies. Rapier does not support dynamic trimesh collision (it is fixed-body only). Use convex hull or primitive shapes.
3. DO NOT forget `await RAPIER.init()` before any Rapier API call. The WASM module must be initialized first. Skipping this produces cryptic null-pointer errors.
4. DO NOT create Rapier vectors/quaternions inside the render loop. Rapier's WASM bridge objects are lightweight but still allocate. Reuse or use raw `{ x, y, z }` objects which Rapier accepts.
5. DO NOT skip disposal. `world.free()` is mandatory. WASM memory is not garbage-collected by the JS runtime. A leaked world holds all bodies/colliders in WASM heap memory indefinitely.
6. DO NOT disable body sleeping unless you have a specific reason. Sleeping is Rapier's primary performance optimization for settled bodies. Disabling it means every body is simulated every step.
7. DO NOT use convexHull colliders for flat/thin shapes. The hull computation may produce a degenerate result. Use a thin cuboid instead.
8. DO NOT apply forces to kinematic bodies. They are moved by `setNextKinematicTranslation`, not by forces. Applying force does nothing.
9. DO NOT sync transforms from Three.js back to Rapier for dynamic bodies. The physics world owns dynamic body positions. Writing mesh.position back to the body creates a teleport, breaking collision response.
10. DO NOT run more than 4 sub-steps per frame. If the physics cannot keep up, clamping the accumulator (dropping simulation time) is better than spiraling to 0fps.

## Integration notes

- **`three-js-fundamentals`**: Scene/renderer setup. Physics system plugs into the render loop.
- **`three-raycast-interaction`**: Use Three.js raycasting to identify which mesh was clicked, then look up its body in `bodyMap` to apply impulses at the intersection point.
- **`three-instanced-crowds`**: For thousands of physics-driven instances, sync Rapier body transforms to InstancedMesh matrices via `setMatrixAt`. Expensive at >500 bodies.
- **`three-postprocessing-stack`**: Physics does not interact with postprocessing. Both compete for frame time.
- **Known conflict**: `@react-three/rapier` manages its own world. Do not create a second manual Rapier world alongside it in the same scene.
- **Known conflict**: Rapier's Y-up coordinate system matches Three.js's default. If your scene uses a different up axis (Z-up from Blender), rotate the gravity vector.

## Ship checklist
- [ ] `await RAPIER.init()` called and awaited before any Rapier API usage
- [ ] Fixed-timestep accumulator implemented; `world.step()` never called with variable dt
- [ ] All dynamic colliders use primitives or convex hulls, not trimesh
- [ ] Body sleeping enabled (Rapier default; not explicitly disabled)
- [ ] Transform sync direction correct: physics -> mesh (not mesh -> physics) for dynamic bodies
- [ ] `world.free()` called on teardown; confirmed via memory profiling
- [ ] Character controller tested on slopes, steps, and against walls
- [ ] Debug wireframe available and toggleable for development
- [ ] Restitution/friction tuned with real interaction testing, not just default values
- [ ] Physics step time measured and within budget (< 4ms) at target body count
- [ ] `prefers-reduced-motion` settles the scene and freezes the simulation
- [ ] No WASM bridge objects (Vector3, Quaternion) created inside the render loop
