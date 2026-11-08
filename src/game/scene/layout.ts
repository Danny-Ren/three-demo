export type Vector3 = [number, number, number];

export interface Block {
  id: string;
  position: Vector3;
  size: Vector3;
  color: string;
  rotation?: Vector3;
}

export interface Pillar {
  id: string;
  position: Vector3;
  radius: number;
  height: number;
  color: string;
}

export const ground = {
  size: [80, 80] as [number, number],
};

export const platforms: Block[] = [
  { id: "platform-left", position: [-7, 0.6, -5], size: [7, 1.2, 7], color: "#34476f" },
  { id: "platform-right", position: [6.5, 1.1, -7], size: [6, 2.2, 6], color: "#3e5488" },
  { id: "platform-back", position: [0, 0.4, -12], size: [11, 0.8, 4], color: "#2f4066" },
];

export const ramps: Block[] = [
  {
    id: "ramp-left",
    position: [-7, 0.62, 0.2],
    size: [3.2, 0.3, 6],
    color: "#48619a",
    rotation: [0.22, 0, 0],
  },
  {
    id: "ramp-right",
    position: [6.5, 1.12, -2.6],
    size: [3, 0.3, 5.2],
    color: "#48619a",
    rotation: [0.44, 0, 0],
  },
];

export const crates: Block[] = [
  { id: "crate-orange", position: [-3, 0.5, 3], size: [1, 1, 1], color: "#ff9f5a" },
  { id: "crate-teal", position: [-3, 1.6, 3], size: [1, 1, 1], color: "#4fd1c5" },
  {
    id: "crate-violet",
    position: [-3.3, 2.7, 3.2],
    size: [0.9, 0.9, 0.9],
    color: "#8b7cf6",
    rotation: [0, 0.5, 0],
  },
  { id: "crate-big", position: [3, 0.6, 2.2], size: [1.2, 1.2, 1.2], color: "#ff9f5a" },
  { id: "crate-teal-2", position: [4.6, 2.4, 3.6], size: [1, 1, 1], color: "#4fd1c5" },
  { id: "crate-right-platform", position: [5.4, 4, -6.4], size: [1, 1, 1], color: "#ff9f5a" },
  { id: "crate-left-platform", position: [-8.4, 3, -4.4], size: [1, 1, 1], color: "#8b7cf6" },
];

export const walls: Block[] = [
  { id: "wall-left", position: [-10.5, 0.9, 5.5], size: [4, 1.8, 0.6], color: "#2f4066" },
  { id: "wall-right", position: [10, 0.6, 1.5], size: [0.6, 1.2, 5], color: "#2f4066" },
];

export const pillars: Pillar[] = [
  { id: "pillar-left", position: [-12, 1.6, -1], radius: 0.8, height: 3.2, color: "#4a6190" },
  { id: "pillar-right", position: [12, 1.6, -3], radius: 0.8, height: 3.2, color: "#4a6190" },
  { id: "pillar-front", position: [0, 0.8, 8], radius: 0.6, height: 1.6, color: "#4a6190" },
];
