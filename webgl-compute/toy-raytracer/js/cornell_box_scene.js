import { Mesh } from './mesh.js';

const top_light_vertices = [
    -2.130000, 5.409224, -2.270000,
    -2.130000, 5.409224, -3.320000,
    -3.430000, 5.409224, -2.270000,
    -3.430000, 5.409224, -3.320000,
];
const top_light_triangles = [
    2, 1, 0,
    2, 3, 1,
];

const floor_vertices = [
    -5.496001, 0.000000, -5.591999,
    -5.528000, 0.000000, 0.000001,
    -0.000001, 0.000000, -5.592000,
    0.000000, 0.000000, 0.000000,
];
const floor_triangles = [
    0, 3, 2,
    0, 1, 3,
];

const small_box_vertices = [
    -1.295364, -0.000000, -0.663536,
    -1.295364, 1.650000, -0.663536,
    -2.876464, 1.650000, -1.135363,
    -2.876464, 0.000000, -1.135364,
    -0.823536, 0.000000, -2.244637,
    -0.823536, 1.650000, -2.244636,
    -2.404637, 1.650000, -2.716464,
    -2.404637, 0.000000, -2.716464,
];
const small_box_triangles = [
    5, 0, 4,
    6, 1, 5,
    7, 2, 6,
    4, 3, 7,
    1, 3, 0,
    6, 4, 7,
    5, 1, 0,
    6, 2, 1,
    7, 3, 2,
    4, 0, 3,
    1, 2, 3,
    6, 5, 4,
];

const tall_box_vertices = [
    -4.223526, 0.000000, -2.477610,
    -4.223526, 3.300000, -2.477610,
    -4.712390, 3.300000, -4.053527,
    -4.712390, 0.000000, -4.053526,
    -2.647610, 0.000000, -2.966473,
    -2.647610, 3.300000, -2.966474,
    -3.136474, 3.300000, -4.542390,
    -3.136474, 0.000000, -4.542390,
]
const tall_box_triangles = [
    5, 0, 4,
    6, 1, 5,
    7, 2, 6,
    4, 3, 7,
    1, 3, 0,
    6, 4, 7,
    5, 1, 0,
    6, 2, 1,
    7, 3, 2,
    4, 0, 3,
    1, 2, 3,
    6, 5, 4,
]

const background_vertices = [
    -5.496001, 0.000000, -5.591999,
    -0.000001, 0.000000, -5.592000,
    -0.000001, 5.488000, -5.592000,
    -5.560001, 5.488000, -5.591999,
]
const background_triangles = [
    2, 0, 1,
    2, 3, 0,
]

const ceilling_vertices = [
    0.000000, 5.488000, 0.000000,
    -0.000001, 5.488000, -5.592000,
    -5.560001, 5.488000, -5.591999,
    -5.560000, 5.488000, 0.000001,
]
const ceilling_triangles = [
    1, 3, 2,
    1, 0, 3,
]

const left_wall_vertices = [
    -5.496001, 0.000000, -5.591999,
    -5.528000, 0.000000, 0.000001,
    -5.560001, 5.488000, -5.591999,
    -5.560000, 5.488000, 0.000001,
]
const left_wall_triangles = [
    2, 1, 0,
    2, 3, 1,
]

const right_wall_vertices = [
    -0.000001, 0.000000, -5.592000,
    0.000000, 0.000000, 0.000000,
    0.000000, 5.488000, 0.000000,
    -0.000001, 5.488000, -5.592000,
]
const right_wall_triangles = [
    2, 0, 1,
    2, 3, 0,
]

var light = new Mesh("light", top_light_vertices, top_light_triangles);
var floor = new Mesh("floor", floor_vertices, floor_triangles);
var small_box = new Mesh("small_box", small_box_vertices, small_box_triangles);
var tall_box = new Mesh("tall_box", tall_box_vertices, tall_box_triangles);
var ceilling = new Mesh("ceilling", ceilling_vertices, ceilling_triangles);
var background = new Mesh("background", background_vertices, background_triangles);
var left_wall = new Mesh("left_wall", left_wall_vertices, left_wall_triangles);
var right_wall = new Mesh("right_wall", right_wall_vertices, right_wall_triangles);

right_wall.diffuse_color = glm.vec3(0.5, 0.0, 0.0);
left_wall.diffuse_color = glm.vec3(0.0, 0.5, 0.0);
light.emission = glm.vec3(1.0);
light.diffuse_color = glm.vec3(0.0);

export const cornell_box_scene = [light, floor, small_box, tall_box, ceilling, background, left_wall, right_wall];