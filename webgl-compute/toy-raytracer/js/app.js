import { Renderer } from './renderer.js';

async function run() {

  let renderer = new Renderer();
  window.renderer = renderer;
  
  if (await renderer.init("raytrace-canvas", "ray-metrics", "progressive-rendering"))
  {
    document.getElementById("support").style.display = 'block';
    document.getElementById("no-support").style.display = 'none';

    renderer.attach_mouse_events();

    let animationFrame = function() {
      renderer.render();

      window.requestAnimationFrame(animationFrame);
    }

    window.requestAnimationFrame(animationFrame);
  }
  else
  {
    document.getElementById("support").style.display = 'none';
    document.getElementById("no-support").style.display = 'block';
  }
};

run();