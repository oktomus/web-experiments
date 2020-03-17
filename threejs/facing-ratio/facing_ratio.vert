
varying vec3 frag_pos;
varying vec3 frag_norm;

void main() {

    vec4 world_pos = modelViewMatrix * vec4(position, 1.0);
    frag_pos = world_pos.xyz;

    frag_norm = normalMatrix * normal;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0 );
}
