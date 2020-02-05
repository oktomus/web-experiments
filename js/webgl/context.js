export function getContext(canvasId, contextType) {

    // Find canvas
    const canvas = document.getElementById(canvasId);
    const context = canvas ? canvas.getContext(contextType) : undefined;

    if (!canvas || !context)
    {
        document.getElementById("support").style.display = 'none';
        document.getElementById("no-support").style.display = 'block';

        return Promise.reject(contextType + ' not available for canvas ' + canvasId);
    }
    else
    {
        document.getElementById("support").style.display = 'block';
        document.getElementById("no-support").style.display = 'none';

        return Promise.resolve(context);
    }
}