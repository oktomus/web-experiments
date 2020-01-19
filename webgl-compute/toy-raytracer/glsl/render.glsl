#version 310 es
precision highp float;
precision highp int;
precision mediump image2DArray;

//
// Mesh
//

struct Mesh
{
    int offset;
    int triangle_count;
    vec3 diffuse;
    vec3 emission;
};

//
// Layout
//
// Useful links to understand memory layout:
// - https://www.khronos.org/opengl/wiki/Shader_Storage_Buffer_Object
// - https://www.khronos.org/opengl/wiki/Layout_Qualifier_(GLSL)#Binding_points
// - https://groups.google.com/forum/#!msg/webgl-dev-list/rccKP94Taa4/yFayqtLDHgAJ
// - https://groups.google.com/forum/#!msg/webgl-dev-list/rccKP94Taa4/dJXZAUbXAQAJ
// - https://community.khronos.org/t/size-of-elements-of-arrays-in-shader-storage-buffer-objects/69803#post366983
// 

layout (local_size_x = 16, local_size_y = 16, local_size_z = 1) in;

layout (rgba8, binding = 0) writeonly uniform highp image2D frameTex;
layout (rgba8, binding = 1) readonly uniform highp image2D accumulatedTex;

layout (std430, binding = 1) readonly buffer Vertices {
    vec3 vertices[];
};

layout (std430, binding = 2) readonly buffer Triangles {
    int triangles[];
};

layout (std430, binding = 3) readonly buffer Meshes {
    Mesh meshes[];
};

//
// Uniform
//

uniform float uInitialSeed;
uniform int uSamples;
uniform mat4 uCameraToWorld;
uniform mat4 uCameraInverseProjection;

//
// Math
//

#define M_PI 3.14159265358979323846
#define M_TWO_PI 6.28318530718
#define EPSILON 1e-3
#define zero3 vec3(0.0)
#define MAX_FLOAT 3.402823466e+30F

//
// Pseudo random numbers generator.
//
// References:
// - http://blog.three-eyed-games.com/2018/05/12/gpu-path-tracing-in-unity-part-2/
//

float rand(inout float seed, vec2 pixel)
{
    float result = fract(sin(seed / 100.0f * dot(pixel, vec2(12.9898f, 78.233f))) * 43758.5453f);
    seed += 1.0f;
    return result;
}

vec2 rand2(inout float seed, vec2 pixel)
{
    return vec2(rand(seed, pixel), rand(seed, pixel));
}

// Generate a random direction in the unit sphere.
vec3 rand3(inout float seed, vec2 pixel)
{
    vec3 p;
    //do {
        p = 2.0 * vec3(rand(seed, pixel), rand(seed, pixel), rand(seed, pixel)) - vec3(1.0);
    //} while (length(p) > 1.0);
    return normalize(p);
}

vec3 sample_sphere_uniform(vec2 s)
{
    float phi = M_TWO_PI * s.x;
    float cos_theta = 1.0 - 2.0 * s.y;
    float sin_theta = sqrt(1.0 - cos_theta * cos_theta);

    return vec3(
        cos(phi) * sin_theta,
        cos_theta,
        sin(phi) * sin_theta);
}

//
// Ray
//

struct Ray {
    vec3 origin;
    vec3 direction;
};

vec3 ray_at(Ray r, float t)
{
    return r.origin + r.direction * t;
}

//
// Triangle intersection
//

// Test intersection between a ray and a triangle using Möller–Trumbore algorithm.
bool hit_triangle_mt(Ray r, vec3 v0, vec3 v1, vec3 v2, out float t)
{
    vec3 e1 = v1 - v0;
    vec3 e2 = v2 - v0;
    vec3 h = cross(r.direction, e2);
    float a = dot(e1, h);

    if (a < EPSILON && a > EPSILON)
        return false;

    float f = 1.0 / a;
    vec3 s = r.origin - v0;
    float u = f * dot(s, h);

    if (u < 0.0 || u > 1.0)
        return false;

    vec3 q = cross(s, e1);
    float v = f * dot(r.direction, q);
    if (v < 0.0 || u + v > 1.0)
        return false;
    
    t = f * dot(e2, q);
    if (t > EPSILON)
    {
        return true;
    }

    return false;
}

//
// Shading
//

bool hit_world(Ray r, float t_min, float t_max, inout float t, inout int mesh_indice, inout vec3 n)
{
    bool does_hit = false;
    t = 0.0;
    float best_min_t = t_max;

    mesh_indice = -1;

    for (int i = 0; i < meshes.length(); ++i)
    {
        Mesh mesh = meshes[i];

        for (int j = 0; j < mesh.triangle_count * 3; j += 3)
        {
            vec3 v0 = vertices[triangles[mesh.offset + j]];
            vec3 v1 = vertices[triangles[mesh.offset + j + 1]];
            vec3 v2 = vertices[triangles[mesh.offset + j + 2]];

            if (hit_triangle_mt(r, v0, v1, v2, t) && t >= t_min && t < t_max && t < best_min_t)
            {
                best_min_t = t;
                does_hit = true;
                mesh_indice = i;
                n = normalize(cross(v1 - v0, v2 - v0));
            }

        }
    }

    if (does_hit)
    {
        t = best_min_t;
    }

    return does_hit;
}

vec3 random_point_on_mesh(Mesh m, inout float seed, vec2 pixel, out float p)
{
    // Pick a random triangle.
    int triangle = min(int(rand(seed, pixel) * float(m.triangle_count)), m.triangle_count - 1);

    // Pick vertices.
    vec3 v0 = vertices[triangles[m.offset + triangle]];
    vec3 v1 = vertices[triangles[m.offset + triangle + 1]];
    vec3 v2 = vertices[triangles[m.offset + triangle + 2]];

    float r = rand(seed, pixel);
    float s = rand(seed, pixel);

    if (r + s > 1.0)
    {
        r = 1.0 - r;
        s = 1.0 - s;
    }

    float t = 1.0 - r - s;
    
    float triangle_area = length(cross(v1 - v0, v2 - v0)) * 0.5;

    p = (1.0 / float(m.triangle_count)) / triangle_area;

    return v0 * r + v1 * s + v2 * t;
}

// Compute the color for a given ray.
vec3 color(Ray r, inout float seed, vec2 pixel)
{
    float t;
    vec3 n;
    int max_depth = 5;
    int depth = 0;
    int mesh_indice;

    vec3 res = vec3(0.0);

    int light_mesh_indice = 0;
    Mesh light = meshes[light_mesh_indice];
    int light_count = light.triangle_count;

    while (depth < max_depth 
        && hit_world(r, EPSILON, MAX_FLOAT, t, mesh_indice, n) 
        && t > 0.0)
    {
        Mesh mesh = meshes[mesh_indice];
        vec3 surface_normal = n;

        // Primary ray hit a light, stop.
        if (mesh.emission != vec3(0.0) && depth == 0)
        {
            return mesh.emission;
        }

        vec3 hit_point = ray_at(r, t);

        // Consider hit.
        if (mesh.emission == vec3(0.0))
        {
            float light_pdf = 0.0;

            // Generate a point on the light.
            vec3 light_point = random_point_on_mesh(light, seed, pixel, light_pdf);

            vec3 lh = light_point - hit_point;
            float dist = length(lh);

            // Trace a shadow ray.
            Ray shadow_ray;
            shadow_ray.origin = hit_point;
            shadow_ray.direction = normalize(lh);

            if (!hit_world(shadow_ray, EPSILON, dist, t, mesh_indice, n) 
                || mesh_indice == light_mesh_indice)
            {
                // Direct lighting contribution.
                res += light_pdf * mesh.diffuse * light.emission * abs(dot(surface_normal, shadow_ray.direction));
            }
        }

        // Bounce.
        vec2 s = rand2(seed, pixel);
        vec3 target = hit_point + n + sample_sphere_uniform(s);
        r.origin = hit_point;
        r.direction = normalize(target - r.origin);

        depth++;
    }

    return res / float(depth);
}

//
// Camera
//

Ray create_camera_ray(vec2 uv)
{
    vec3 origin = (uCameraToWorld * vec4(0.0, 0.0, 0.0, 1.0)).xyz;

    vec3 direction = (uCameraInverseProjection * vec4(uv, 0.0, 1.0)).xyz;
    direction = (uCameraToWorld * vec4(direction, 0.0)).xyz;
    direction = normalize(direction);

    Ray res;
    res.origin = origin;
    res.direction = direction;
    return res;
}

//
// Main kernel.
//

void main() {
    // gl_LocalInvocationId: local index of the worker in its group.
    // gl_WorkGroupId : index of the current working group.
    // gl_WorkGroupSize : local size of a work group. here it is 16x16x1.
    // gl_GlovalInvocationId : global exectuion index of the current worker.
    // gl_GlobalInvocationId = gl_WorkGroupID * gl_WorkGroupSize + gl_LocalInvocationID

    ivec2 storePos = ivec2(gl_GlobalInvocationID.xy);
    ivec2 imageSize = ivec2(gl_NumWorkGroups.xy * gl_WorkGroupSize.xy);
    vec2 uv = vec2(storePos) / vec2(imageSize);
    float seed = uInitialSeed;

    vec2 sample_pos = (vec2(storePos) + rand2(seed, uv)) / vec2(imageSize);

    // Generate a camera ray.
    Ray r = create_camera_ray(sample_pos);

    // Shade the sample.
    vec3 finalColor = color(r, seed, uv);

    // Merge this sample with previous samples.
    vec4 color;
    if (uSamples == 0)
    {
        color = vec4(finalColor, 1.0);
    }
    else
    {
        // Fetch the previous pixel value.
        vec3 initial = imageLoad(accumulatedTex, storePos).rgb;

        color = vec4(initial + (finalColor - initial) / float(uSamples), 1.0);
    }

    // Write the pixel.
    imageStore(frameTex, storePos, color);
}