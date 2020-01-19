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