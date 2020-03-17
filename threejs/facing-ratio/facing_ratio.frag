varying vec3 frag_pos;
varying vec3 frag_norm;

const vec3 MATERIAL_BASE_COLOR = vec3(0.8, 0.8, 0.8);
const float MATERIAL_DIFFUSE_FACTOR = 0.4;
const float MATERIAL_SPECULAR_FACTOR = 0.15;
const float MATERIAL_SHININESS = 32.0;

void main()
{
    vec3 norm = normalize(frag_norm);

    vec3 view_dir = normalize(-frag_pos);
    vec3 reflect_dir = reflect(-view_dir, norm);

    float diffuse_ratio = max(0.0, dot(view_dir, norm));
    float specular_ratio = pow(max(0.0, dot(view_dir, reflect_dir)), MATERIAL_SHININESS);

    vec3 diffuse = MATERIAL_DIFFUSE_FACTOR * MATERIAL_BASE_COLOR * diffuse_ratio;
    vec3 specular = MATERIAL_SPECULAR_FACTOR * MATERIAL_BASE_COLOR * specular_ratio;

    gl_FragColor = vec4(diffuse + specular, 1.0);
}
