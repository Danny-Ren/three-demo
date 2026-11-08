import RAPIER from "@dimforge/rapier3d-compat";
import { Euler, Quaternion } from "three";
import type { Object3D } from "three";
import type { Block, Pillar, Vector3 } from "../scene/layout";

const FIXED_TIMESTEP = 1 / 60;
const MAX_FRAME_DELTA = 0.25;
const MAX_STEPS_PER_FRAME = 5;

interface TrackedBody {
  body: RAPIER.RigidBody;
  mesh: Object3D;
}

function toQuaternion(rotation?: Vector3) {
  if (!rotation) {
    return { x: 0, y: 0, z: 0, w: 1 };
  }

  const quaternion = new Quaternion().setFromEuler(new Euler(...rotation, "XYZ"));
  return { x: quaternion.x, y: quaternion.y, z: quaternion.z, w: quaternion.w };
}

/**
 * Envoltorio de Rapier con paso fijo. El render y la física comparten el
 * bucle de TresJS: `step` se llama una vez por frame y aquí se acumula el
 * tiempo para ejecutar como máximo unos pocos pasos de simulación.
 */
export class PhysicsWorld {
  private readonly world: RAPIER.World;
  private readonly trackedBodies: TrackedBody[] = [];
  private accumulator = 0;

  constructor(gravity = -9.81) {
    this.world = new RAPIER.World({ x: 0, y: gravity, z: 0 });
    this.world.timestep = FIXED_TIMESTEP;
  }

  addStaticGround([width, depth]: [number, number], top = 0) {
    const halfHeight = 0.5;
    const collider = RAPIER.ColliderDesc.cuboid(width / 2, halfHeight, depth / 2)
      .setTranslation(0, top - halfHeight, 0)
      .setFriction(0.9);

    this.world.createCollider(collider);
  }

  addStaticBlock(block: Block) {
    const [width, height, depth] = block.size;
    const collider = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
      .setTranslation(...block.position)
      .setRotation(toQuaternion(block.rotation))
      .setFriction(0.9);

    this.world.createCollider(collider);
  }

  addStaticPillar(pillar: Pillar) {
    const collider = RAPIER.ColliderDesc.cylinder(pillar.height / 2, pillar.radius)
      .setTranslation(...pillar.position)
      .setFriction(0.9);

    this.world.createCollider(collider);
  }

  addDynamicBox(block: Block, mesh?: Object3D): RAPIER.RigidBody {
    const [width, height, depth] = block.size;
    const body = this.world.createRigidBody(
      RAPIER.RigidBodyDesc.dynamic()
        .setTranslation(...block.position)
        .setRotation(toQuaternion(block.rotation))
        .setLinearDamping(0.15)
        .setAngularDamping(0.35),
    );

    const collider = RAPIER.ColliderDesc.cuboid(width / 2, height / 2, depth / 2)
      .setFriction(0.7)
      .setRestitution(0.1)
      .setDensity(1);

    this.world.createCollider(collider, body);

    if (mesh) {
      this.trackedBodies.push({ body, mesh });
    }

    return body;
  }

  step(deltaSeconds: number) {
    this.accumulator = Math.min(this.accumulator + Math.max(deltaSeconds, 0), MAX_FRAME_DELTA);

    let steps = 0;
    while (this.accumulator >= FIXED_TIMESTEP && steps < MAX_STEPS_PER_FRAME) {
      this.world.step();
      this.accumulator -= FIXED_TIMESTEP;
      steps += 1;
    }

    if (steps === 0) return;

    for (const { body, mesh } of this.trackedBodies) {
      const translation = body.translation();
      const rotation = body.rotation();

      mesh.position.set(translation.x, translation.y, translation.z);
      mesh.quaternion.set(rotation.x, rotation.y, rotation.z, rotation.w);
    }
  }

  dispose() {
    this.trackedBodies.length = 0;
    this.world.free();
  }
}
