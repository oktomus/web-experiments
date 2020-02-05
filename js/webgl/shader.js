export function getShaderSource(url) {
  var result = new Promise((resolve, reject) => {

    var req = new XMLHttpRequest();
    
    req.onload = () => {
        resolve(req.responseText);
    };
    
    req.onerror = () => {
        console.error("Failed to get shader source for " + relativePath + ": " + this.statusText);
        reject(req);
    }
      
    req.open("GET", url, true);
    req.send(null);
  });    

  return result;
}; 

export async function getVertFragShaderProgram(gl, vert_url, frag_url) {

    const vert_source = await getShaderSource(vert_url);
    const frag_source = await getShaderSource(frag_url);

    // Create a vertex shader object
    var vert_shader = gl.createShader(gl.VERTEX_SHADER);

    // Attach vertex shader source code
    gl.shaderSource(vert_shader, vert_source);

    // Compile the vertex shader
    gl.compileShader(vert_shader);

    if (!gl.getShaderParameter(vert_shader, gl.COMPILE_STATUS)) {
        console.error("vertex shader build failed", vert_url);
        console.error(gl.getShaderInfoLog(vert_shader));
        return null;
    }

    // Create fragment shader object
    var frag_shader = gl.createShader(gl.FRAGMENT_SHADER);

    // Attach fragment shader source code
    gl.shaderSource(frag_shader, frag_source);

    // Compile the fragmentt shader
    gl.compileShader(frag_shader);

    if (!gl.getShaderParameter(frag_shader, gl.COMPILE_STATUS)) {
        console.error("fragment shader build failed", frag_url);
        console.error(gl.getShaderInfoLog(frag_shader));
        return null;
    }

    // Create a shader program object to store
    // the combined shader program
    var program = gl.createProgram();

    // Attach a vertex shader
    gl.attachShader(program, vert_shader);

    // Attach a fragment shader
    gl.attachShader(program, frag_shader);

    // Link both the programs
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("program initialization failed.");
        console.error(gl.getProgramInfoLog(program));
        return;
    }

    return program;
}