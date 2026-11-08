---
name: three-physics-rapier-eval
description: Use when verifying that three-physics-rapier was actually implemented correctly. Adversarial audit, not a summary.
pairs_with: three-physics-rapier
---

# Eval: Rapier Physics in Three.js

## What this audits
The most common shipped failure is a physics simulation that uses variable-timestep stepping (passing raw delta to `world.step()`), causing objects to tunnel through floors on low frame rates and jitter on high frame rates. The second most common: WASM memory leaks because `world.free()` is never called, growing heap by megabytes per route change.

## Evidence required
- Source file containing the PhysicsSystem class or Rapier world setup
- Console log confirming `await RAPIER.init()` completed before body creation
- Evidence of fixed-timestep accumulator (not raw delta passed to step)
- DevTools Memory snapshot before init, during simulation, and after dispose
- Physics step time measured via `performance.now()` bracketing
- Screenshot showing objects interacting physically (falling, bouncing, colliding)

## Automated checks

```js
const src = await fs.readFile('src/physics.js', 'utf8')

// Must await RAPIER.init()
const hasInit = /await\s+RAPIER\s*\.\s*init\s*\(\s*\)/.test(src)
console.assert(hasInit, 'FAIL: RAPIER.init() must be awaited before any API usage')

// Must not pass variable dt to world.step()
const hasVarStep = /world\s*\.\s*step\s*\(\s*(delta|dt|d)\s*\)/.test(src)
console.assert(!hasVarStep, 'FAIL: world.step() must not receive a variable delta time. Use fixed timestep accumulator.')

// Must have world.free() in disposal
const hasFree = /world\s*(\?\.|\.)free\s*\(\s*\)/.test(src)
console.assert(hasFree, 'FAIL: world.free() must be called on disposal to release WASM memory')

// Must not use trimesh for dynamic bodies
const hasDynamicTrimesh = /dynamic[\s\S]{0,200}trimesh|trimesh[\s\S]{0,200}dynamic/i.test(src)
if (hasDynamicTrimesh) {
  console.warn('WARN: Possible dynamic trimesh usage detected. Rapier does not support dynamic trimesh colliders.')
}

// Must have accumulator pattern
const hasAccumulator = /accumulator|_accumulator|fixedDt|_fixedDt|subStep/i.test(src)
console.assert(hasAccumulator, 'FAIL: No fixed-timestep accumulator pattern found')

// Runtime: verify physics is running
const bodyCount = await page.evaluate(() => {
  if (window.__physicsWorld) return window.__physicsWorld.bodies.len()
  return null
})
if (bodyCount !== null) {
  console.assert(bodyCount > 0, 'FAIL: Physics world has zero bodies')
}
```

## Manual inspection protocol

1. Open the page and observe objects falling under gravity. FAIL if objects remain static or fall through the ground plane.
2. Throttle CPU 6x in DevTools. FAIL if objects tunnel through the floor (indicates missing CCD or variable timestep).
3. Set frame rate to 30fps via CPU throttle. FAIL if physics speed changes (objects fall faster/slower than at 60fps, indicating delta-dependent stepping).
4. Trigger a route change / unmount. Open DevTools Memory tab, take a heap snapshot. FAIL if Rapier-related ArrayBuffer allocations remain and grow on repeated navigation.
5. Bracket `physics.step()` with `performance.now()`. FAIL if step time exceeds 4ms at the target body count.
6. If debug wireframes exist, enable them. FAIL if collider shapes do not match visible mesh shapes (misaligned colliders).
7. If a character controller exists, walk it into a wall. FAIL if it clips through or vibrates.
8. Set `prefers-reduced-motion: reduce`. FAIL if physics simulation continues running per frame instead of settling and freezing.

## Scoring rubric

| # | Criterion | Weight | 0 (fail) | 1 (partial) | 2 (pass) |
|---|---|---|---|---|---|
| 1 | WASM initialization | 2 | No await RAPIER.init() | Init called but not awaited | Properly awaited before any API call |
| 2 | Fixed timestep | 3 | Variable dt passed to step | Accumulator exists but no sub-step cap | Accumulator with max sub-steps and spiral-of-death guard |
| 3 | Collider shape correctness | 2 | Trimesh on dynamic bodies | Shapes work but poorly matched to mesh | Primitives/convex hull for dynamic, trimesh only for fixed |
| 4 | Transform sync direction | 3 | Mesh -> body (backward) | Correct direction but allocates per sync | Physics -> mesh, zero allocation per frame |
| 5 | WASM disposal | 3 | No world.free() | Free called but bodies not removed first | All bodies/joints removed, then world.free() |
| 6 | Physics step time | 2 | > 8ms at target count | 4-8ms | < 4ms |
| 7 | Body sleeping | 1 | Explicitly disabled | Default (enabled) | Enabled with verified settling behavior |
| 8 | Debug visualization | 1 | None | Exists but not toggleable | world.debugRender() wired and toggleable |
| 9 | Character controller | 1 | Not applicable or broken | Works but clips on steps | Proper slope/step/snap configuration |
| 10 | Reduced motion | 1 | Not handled | Checked but simulation still runs | Pre-settle and freeze |

**Total: 38 points. Ship threshold: 30+.**

## Common false passes

1. **"Physics is working"** -- objects fall and bounce, but the timestep is variable. At 30fps the simulation runs at half speed; at 144fps it runs at 2.4x speed. Verify by throttling CPU.
2. **"Memory is cleaned up"** -- `world.free()` called but individual body handles were not removed first. Rapier may hold orphaned body references in WASM memory.
3. **"Colliders match meshes"** -- developer eyeballed alignment but the collider half-extents do not account for mesh scale. A mesh scaled to 2x with a 0.5 half-extent collider is physically half the visual size.
4. **"CCD prevents tunneling"** -- CCD enabled on some bodies but not on the fast-moving ones that actually need it. Test with a high-velocity body hitting a thin wall.
5. **"Character controller works"** -- tested on flat ground only. Breaks on slopes above 45 degrees or steps taller than the configured autostep height.
6. **"Debug wireframes are correct"** -- wireframes rendered but never compared against the visual meshes. A misaligned collider looks fine in isolation.

## Required fixes by failure mode

| Failure | Root cause | Fix |
|---|---|---|
| Objects tunnel through floor | Variable timestep or missing CCD | Implement fixed-timestep accumulator; enable CCD on fast bodies |
| Physics speed varies with frame rate | Raw delta passed to world.step() | Use accumulator: world.step() with no argument (uses world's internal dt) |
| WASM memory leak | Missing world.free() | Call dispose() which removes all bodies, joints, then world.free() |
| Collider smaller than mesh | halfExtents not accounting for mesh scale | Multiply halfExtents by mesh.scale |
| Objects never stop moving | Body sleeping disabled or damping too low | Ensure sleeping is enabled (default); increase linear/angular damping |
| Character clips through walls | Offset too small or collision groups wrong | Increase controller offset; verify collision groups include static geometry |

## Verdict format

```
RAPIER PHYSICS AUDIT
Score: XX / 38
Ship threshold: 30

| # | Criterion | Score | Note |
|---|-----------|-------|------|
| 1 | WASM init | X/4 | ... |
...

Blocking issues:
- (list any criterion scoring 0)

Verdict: SHIP / NO SHIP
```
