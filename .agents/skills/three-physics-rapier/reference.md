# Rapier Physics Reference

## Rapier 3D API quick reference

### World

| Method | Signature | Note |
|---|---|---|
| `new RAPIER.World(gravity)` | constructor | gravity is `{ x, y, z }` |
| `world.step()` | method | Advance one timestep (uses world's internal dt, default 1/60) |
| `world.gravity` | property | Read/write `{ x, y, z }` |
| `world.integrationParameters` | property | dt, erp, stabilization params |
| `world.debugRender()` | method | Returns `{ vertices: Float32Array, colors: Float32Array }` for wireframe |
| `world.free()` | method | Release all WASM memory. Mandatory on teardown. |

### RigidBodyDesc

| Factory | Behavior |
|---|---|
| `RAPIER.RigidBodyDesc.dynamic()` | Affected by gravity and forces |
| `RAPIER.RigidBodyDesc.fixed()` | Immovable, infinite mass |
| `RAPIER.RigidBodyDesc.kinematicPositionBased()` | Moved by code, pushes dynamic bodies |
| `RAPIER.RigidBodyDesc.kinematicVelocityBased()` | Moved by velocity, pushes dynamic bodies |

| Setter | Parameter |
|---|---|
| `.setTranslation(x, y, z)` | Initial position |
| `.setRotation({ x, y, z, w })` | Initial rotation (quaternion) |
| `.setLinearDamping(d)` | Air resistance (0 = none) |
| `.setAngularDamping(d)` | Rotational resistance |
| `.setCcdEnabled(bool)` | Continuous collision detection |
| `.setCanSleep(bool)` | Allow sleeping when settled |

### RigidBody

| Method | Note |
|---|---|
| `body.translation()` | Returns `{ x, y, z }` |
| `body.rotation()` | Returns `{ x, y, z, w }` quaternion |
| `body.linvel()` | Linear velocity `{ x, y, z }` |
| `body.angvel()` | Angular velocity `{ x, y, z }` |
| `body.applyImpulse({ x, y, z }, wakeUp)` | Instantaneous velocity change |
| `body.addForce({ x, y, z }, wakeUp)` | Continuous force (cleared each step) |
| `body.addTorque({ x, y, z }, wakeUp)` | Rotational force |
| `body.setNextKinematicTranslation(pos)` | Move kinematic body (position-based) |
| `body.setNextKinematicRotation(rot)` | Rotate kinematic body |
| `body.isSleeping()` | Check if body is asleep |
| `body.wakeUp()` | Force body awake |
| `body.isDynamic()` | Type check |
| `body.isKinematic()` | Type check |
| `body.isFixed()` | Type check |
| `body.collider(index)` | Get attached collider by index |
| `body.handle` | Numeric handle for identity |

### ColliderDesc

| Factory | Shape | Parameters |
|---|---|---|
| `.cuboid(hx, hy, hz)` | Box | Half-extents |
| `.ball(radius)` | Sphere | Radius |
| `.capsule(halfHeight, radius)` | Capsule | Half-height of cylinder part, radius |
| `.cylinder(halfHeight, radius)` | Cylinder | Half-height, radius |
| `.cone(halfHeight, radius)` | Cone | Half-height, base radius |
| `.trimesh(vertices, indices)` | Triangle mesh | Float32Array vertices, Uint32Array indices. FIXED BODIES ONLY. |
| `.convexHull(points)` | Convex hull | Float32Array of points |
| `.heightfield(nrows, ncols, heights, scale)` | Terrain | Height map |

| Setter | Effect |
|---|---|
| `.setRestitution(r)` | Bounciness 0-1 |
| `.setFriction(f)` | Surface friction 0-1+ |
| `.setDensity(d)` | Density (mass = density * volume) |
| `.setMass(m)` | Override computed mass |
| `.setSensor(bool)` | Detect overlap without physical response |
| `.setActiveEvents(events)` | Enable collision/contact events |
| `.setCollisionGroups(groups)` | Bitmask for collision filtering |

### Collision events

```js
// Enable events on collider
colliderDesc.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS)

// In step loop, drain event queue
const eventQueue = new RAPIER.EventQueue(true)
world.step(eventQueue)
eventQueue.drainCollisionEvents((handle1, handle2, started) => {
  // handle1, handle2 are collider handles
  // started: true = collision began, false = ended
})
```

### Contact force events

```js
colliderDesc.setActiveEvents(RAPIER.ActiveEvents.CONTACT_FORCE_EVENTS)
world.step(eventQueue)
eventQueue.drainContactForceEvents((event) => {
  // event.collider1(), event.collider2() - collider handles
  // event.totalForceMagnitude() - contact force
  // event.maxForceDirection() - { x, y, z }
})
```

### JointData

| Factory | Type | Parameters |
|---|---|---|
| `.revolute(anchorA, anchorB, axis)` | Hinge | Rotates around axis |
| `.prismatic(anchorA, anchorB, axis)` | Slider | Translates along axis |
| `.spherical(anchorA, anchorB)` | Ball socket | Full rotation |
| `.fixed(anchorA, frameA, anchorB, frameB)` | Weld | No relative motion |
| `.rope(anchorA, anchorB, maxDist)` | Rope | Max distance constraint |
| `.spring(anchorA, anchorB, restLength, stiffness, damping)` | Spring | Elastic |

### KinematicCharacterController

| Method | Note |
|---|---|
| `world.createCharacterController(offset)` | Create with skin width |
| `cc.setUp({ x, y, z })` | Define up direction |
| `cc.setMaxSlopeClimbAngle(radians)` | Slopes above this are walls |
| `cc.setMinSlopeSlideAngle(radians)` | Slopes above this cause sliding |
| `cc.enableAutostep(maxHeight, minWidth, includeDynamic)` | Step climbing |
| `cc.enableSnapToGround(distance)` | Stay grounded on slopes |
| `cc.computeColliderMovement(collider, desiredMovement)` | Compute corrected movement |
| `cc.computedMovement()` | Get corrected `{ x, y, z }` after collision |

## Physics material presets

| Material | Restitution | Friction | Feel |
|---|---|---|---|
| Rubber | 0.8 | 0.9 | Bouncy, grippy |
| Wood | 0.3 | 0.6 | Moderate bounce, good grip |
| Metal | 0.2 | 0.4 | Low bounce, moderate grip |
| Ice | 0.1 | 0.05 | Very slippery |
| Concrete | 0.1 | 0.8 | Low bounce, high grip |
| Soft body (approximation) | 0.0 | 0.9 | No bounce, sticks |

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `null function or function signature mismatch` | RAPIER.init() not awaited | Ensure async init completes before API calls |
| Objects fall through floor | Variable timestep or no CCD | Fixed timestep accumulator; enable CCD |
| Objects jitter/vibrate | Overlapping colliders on init | Space initial positions so colliders do not overlap |
| Objects never sleep | Damping too low or continuous force applied | Increase damping; stop applying force when not needed |
| Kinematic body does not push dynamic bodies | Using `setTranslation` instead of `setNextKinematicTranslation` | Use the `setNext*` methods for proper collision response |
| Character floats above ground | Controller offset too large | Reduce offset (0.01 default is usually fine) |
| Character clips through thin walls | Wall collider too thin or controller moves too fast | Thicken wall colliders or reduce movement speed per step |
| Memory grows on navigation | Missing world.free() | Call physics.dispose() which calls world.free() |
| Collision events not firing | ActiveEvents not set on collider | Set RAPIER.ActiveEvents.COLLISION_EVENTS on colliderDesc |
| Joint breaks under force | No joint limits set | Add limits to prevent joints from reaching extreme angles |
