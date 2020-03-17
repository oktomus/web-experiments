import * as THREE from './../../js/threejs/build/three.module.js';
import { OBJLoader2 } from '../../js/threejs/examples/jsm/loaders/OBJLoader2.js';
import { OrbitControls } from '../../js/threejs/examples/jsm/controls/OrbitControls.js';
import { getShaderSource } from '../../js/webgl/shader.js'

async function go() {

	var renderer = new THREE.WebGLRenderer();
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.body.appendChild( renderer.domElement );

	// Camera
	var camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
	camera.position.z = 5;
	const controls = new OrbitControls (camera, renderer.domElement);

	// Shader.
	const vert_source = await getShaderSource('./facing_ratio.vert');
    const frag_source = await getShaderSource('./facing_ratio.frag');
    const facingRatioMaterial =
        new THREE.ShaderMaterial( {
	        vertexShader: vert_source,
            fragmentShader: frag_source});

	// 3D.
	var geometry = new THREE.BoxGeometry();
	var cube = new THREE.Mesh( geometry, facingRatioMaterial );

	var scene = new THREE.Scene();
	scene.add( cube );

	function animate() {
		controls.update();

		requestAnimationFrame( animate );
		renderer.render( scene, camera );
    }

    animate();
}

go();
