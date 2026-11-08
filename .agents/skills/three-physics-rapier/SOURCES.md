# Sources

## Corpus files consulted

No directly relevant Rapier-specific corpus files were found. The corpus contains no `@dimforge/rapier3d` skills, tutorials, or integration patterns.

## Corpus files used for context

| File | Contribution |
|---|---|
| `_raw/MustBeSimo_cinematic-scroll-skill/references/3d-stack.md` | Frame budget allocation (physics must share the 16.67ms frame with rendering and JS), DPR clamping, reduced-motion discipline |
| `_raw/MustBeSimo_cinematic-scroll-skill/references/performance-budget.md` | Total frame budget breakdown, mobile degradation strategy |
| `_raw/AThevon_genjutsu/skills/_jutsu/threejs-r3f/SKILL.md` | R3F scene setup patterns, useFrame rules (no setState), disposal discipline |

## Existing skills cross-referenced

| Skill | Relationship |
|---|---|
| `primitives/three-js-fundamentals` | Scene/renderer setup, render loop, disposal |
| `primitives/react-three-fiber-drei` | R3F Canvas/useFrame; @react-three/rapier wraps this same Rapier WASM |
| `three/three-raycast-interaction` | Click-to-interact: raycast identifies mesh, bodyMap gets the Rapier body, applyImpulse at intersection point |
| `three/three-instanced-crowds` | Per-instance physics sync pattern for crowds |

## External documentation

- Rapier docs (rapier.rs): World, RigidBody, Collider, Joint, CharacterController API
- @dimforge/rapier3d-compat npm: WASM compat build, async init pattern
- @react-three/rapier docs: Declarative R3F wrapper for Rapier
