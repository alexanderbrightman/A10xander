const fs = require('fs')
const path = require('path')

// Patch three.js package.json to export webgpu and tsl paths
const threeDir = path.join(__dirname, '../node_modules/three')
const threePackagePath = path.join(threeDir, 'package.json')

if (fs.existsSync(threePackagePath)) {
  const packageJson = JSON.parse(fs.readFileSync(threePackagePath, 'utf8'))
  
  // Add exports for webgpu and tsl if they don't exist
  if (packageJson.exports) {
    if (!packageJson.exports['./webgpu']) {
      packageJson.exports['./webgpu'] = './webgpu.js'
    }
    if (!packageJson.exports['./tsl']) {
      packageJson.exports['./tsl'] = './tsl.js'
    }
    
    fs.writeFileSync(threePackagePath, JSON.stringify(packageJson, null, 2))
    
    // Create stub files with proper exports
    const webgpuStub = path.join(threeDir, 'webgpu.js')
    const tslStub = path.join(threeDir, 'tsl.js')
    
    // WebGPU stub - exports classes that three-globe expects
    const webgpuContent = `// Stub for three/webgpu - WebGPU features not available in this three.js version
export class StorageInstancedBufferAttribute {
  constructor(data, type, count) {
    this.data = data;
    this.type = type;
    this.count = count;
  }
}

export class WebGPURenderer {
  computeAsync(node) {
    return Promise.reject(new Error('WebGPU not supported'));
  }
  getArrayBufferAsync(attr) {
    return Promise.reject(new Error('WebGPU not supported'));
  }
}
`
    
    // TSL stub - exports template shader language functions
    // Using function stubs that return objects with methods to match TSL API
    const tslContent = `// Stub for three/tsl - Template Shader Language not available in this three.js version
// These are used for advanced features like heatmaps, but basic globe rendering doesn't require them

class TSLStub {
  constructor(name) {
    this.name = name;
  }
  mul() { return this; }
  div() { return this; }
  add() { return this; }
  sub() { return this; }
  addAssign() { return this; }
  lessThan() { return false; }
}

function createStub(name) {
  return function(...args) {
    if (name === 'float' || name === 'uniform' || name === 'storage') {
      return new TSLStub(name);
    }
    return function() {
      throw new Error(\`TSL function \${name} not available - WebGPU/TSL features require three.js r160+\`);
    };
  };
}

export function Fn(fn) { return { compute: () => ({}) }; }
export function If(condition, fn) { return {}; }
export function uniform(value) { return new TSLStub('uniform'); }
export function storage(attr, type, count) { return new TSLStub('storage'); }
export function float(value) { return new TSLStub('float'); }
export const instanceIndex = new TSLStub('instanceIndex');
export function Loop(count, fn) { return {}; }
export function sqrt(value) { return new TSLStub('sqrt'); }
export function sin(value) { return new TSLStub('sin'); }
export function cos(value) { return new TSLStub('cos'); }
export function asin(value) { return new TSLStub('asin'); }
export function exp(value) { return new TSLStub('exp'); }
export function negate(value) { return new TSLStub('negate'); }
`
    
    // Always write stub files (they may have been overwritten)
    fs.writeFileSync(webgpuStub, webgpuContent)
    fs.writeFileSync(tslStub, tslContent)
    
    console.log('✓ Patched three.js package.json and created stub files for webgpu and tsl')
  }
} else {
  console.log('⚠ three.js package.json not found, skipping patch')
}

