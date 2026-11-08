import RAPIER from "@dimforge/rapier3d-compat";
import { Object3D } from "three";
import { beforeAll, describe, expect, it } from "vite-plus/test";
import { PhysicsWorld } from "../src/game/physics/PhysicsWorld";

function simulate(physics: PhysicsWorld, seconds: number) {
  const frames = Math.ceil(seconds * 60);
  for (let frame = 0; frame < frames; frame += 1) {
    physics.step(1 / 60);
  }
}

describe("PhysicsWorld", () => {
  beforeAll(async () => {
    await RAPIER.init();
  });

  it("aplica gravedad y apoya una caja sobre el suelo", () => {
    const physics = new PhysicsWorld();
    physics.addStaticGround([20, 20]);

    const body = physics.addDynamicBox({
      id: "falling-crate",
      position: [0, 4, 0],
      size: [1, 1, 1],
      color: "#ffffff",
    });

    simulate(physics, 4);

    const { y } = body.translation();
    expect(y).toBeGreaterThan(0.45);
    expect(y).toBeLessThan(0.55);

    physics.dispose();
  });

  it("detiene una caja sobre una plataforma estática", () => {
    const physics = new PhysicsWorld();
    physics.addStaticGround([20, 20]);
    physics.addStaticBlock({
      id: "test-platform",
      position: [0, 0.5, 0],
      size: [4, 1, 4],
      color: "#ffffff",
    });

    const body = physics.addDynamicBox({
      id: "platform-crate",
      position: [0, 3, 0],
      size: [1, 1, 1],
      color: "#ffffff",
    });

    simulate(physics, 4);

    const { y } = body.translation();
    expect(y).toBeGreaterThan(1.45);
    expect(y).toBeLessThan(1.55);

    physics.dispose();
  });

  it("sincroniza la malla con la posición del cuerpo físico", () => {
    const physics = new PhysicsWorld();
    physics.addStaticGround([20, 20]);

    const mesh = new Object3D();
    const body = physics.addDynamicBox(
      {
        id: "synced-crate",
        position: [0, 4, 0],
        size: [1, 1, 1],
        color: "#ffffff",
      },
      mesh,
    );

    simulate(physics, 3);

    const translation = body.translation();
    const rotation = body.rotation();

    expect(mesh.position.x).toBeCloseTo(translation.x, 5);
    expect(mesh.position.y).toBeCloseTo(translation.y, 5);
    expect(mesh.position.z).toBeCloseTo(translation.z, 5);
    expect(mesh.quaternion.x).toBeCloseTo(rotation.x, 5);
    expect(mesh.quaternion.y).toBeCloseTo(rotation.y, 5);
    expect(mesh.quaternion.z).toBeCloseTo(rotation.z, 5);
    expect(mesh.quaternion.w).toBeCloseTo(rotation.w, 5);
    expect(mesh.position.y).toBeLessThan(0.55);

    physics.dispose();
  });
});
