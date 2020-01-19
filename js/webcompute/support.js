export function getComputeContext(canvasId, antialias = false) {

  const canvas = document.getElementById(canvasId);
  const context = canvas.getContext('webgl2-compute', { antialias });

  if (context)
  {
    document.getElementById("support").style.display = 'block';
    document.getElementById("no-support").style.display = 'none';

    return { context, canvas };
  }
  else
  {
    document.getElementById("support").style.display = 'none';
    document.getElementById("no-support").style.display = 'block';

    console.error("Cannot start webgl2 compute context.");

    return { context: null, canvas: null };
  }
};