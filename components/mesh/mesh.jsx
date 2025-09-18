'use client';

import { useEffect, useRef } from 'react';
import GlassBars from './bars';

// COLORS AND SETTINGS
// const COLORS = ['#a960ee', '#ff333d', '#90e0ff', '#ffcb57']; // original
const COLORS = ['#06541d', '#341e60', '#dfe4e3', '#1ad67e']; // test
const DENSITY = [0.06, 0.16];
const ANGLE = 0;
const AMPLITUDE = 320;
const WIREFRAME = false;
const STATIC = false;

// SHADER CODE
const NOISE_SHADER = `//
vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v)
{
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

// First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 =   v - i + dot(i, C.xxx) ;

// Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

// Permutations
  i = mod289(i);
  vec4 p = permute( permute( permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0 ))
          + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

// Gradients: 7x7 points over a square, mapped onto an octahedron.
// The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

//Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

// Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
                                dot(p2,x2), dot(p3,x3) ) );
}
`;

const BLEND_SHADER = `//
// https://github.com/jamieowen/glsl-blend
//

// Normal

vec3 blendNormal(vec3 base, vec3 blend) {
    return blend;
}

vec3 blendNormal(vec3 base, vec3 blend, float opacity) {
    return (blendNormal(base, blend) * opacity + base * (1.0 - opacity));
}

// Screen

float blendScreen(float base, float blend) {
    return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
    return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
    return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}

// Multiply

vec3 blendMultiply(vec3 base, vec3 blend) {
    return base*blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
    return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}

// Overlay

float blendOverlay(float base, float blend) {
    return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
    return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
    return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

// Hard light

vec3 blendHardLight(vec3 base, vec3 blend) {
    return blendOverlay(blend,base);
}

vec3 blendHardLight(vec3 base, vec3 blend, float opacity) {
    return (blendHardLight(base, blend) * opacity + base * (1.0 - opacity));
}

// Soft light

float blendSoftLight(float base, float blend) {
    return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
    return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
    return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

// Color dodge

float blendColorDodge(float base, float blend) {
    return (blend==1.0)?blend:min(base/(1.0-blend),1.0);
}

vec3 blendColorDodge(vec3 base, vec3 blend) {
    return vec3(blendColorDodge(base.r,blend.r),blendColorDodge(base.g,blend.g),blendColorDodge(base.b,blend.b));
}

vec3 blendColorDodge(vec3 base, vec3 blend, float opacity) {
    return (blendColorDodge(base, blend) * opacity + base * (1.0 - opacity));
}

// Color burn

float blendColorBurn(float base, float blend) {
    return (blend==0.0)?blend:max((1.0-((1.0-base)/blend)),0.0);
}

vec3 blendColorBurn(vec3 base, vec3 blend) {
    return vec3(blendColorBurn(base.r,blend.r),blendColorBurn(base.g,blend.g),blendColorBurn(base.b,blend.b));
}

vec3 blendColorBurn(vec3 base, vec3 blend, float opacity) {
    return (blendColorBurn(base, blend) * opacity + base * (1.0 - opacity));
}

// Vivid Light

float blendVividLight(float base, float blend) {
    return (blend<0.5)?blendColorBurn(base,(2.0*blend)):blendColorDodge(base,(2.0*(blend-0.5)));
}

vec3 blendVividLight(vec3 base, vec3 blend) {
    return vec3(blendVividLight(base.r,blend.r),blendVividLight(base.g,blend.g),blendVividLight(base.b,blend.b));
}

vec3 blendVividLight(vec3 base, vec3 blend, float opacity) {
    return (blendVividLight(base, blend) * opacity + base * (1.0 - opacity));
}

// Lighten

float blendLighten(float base, float blend) {
    return max(blend,base);
}

vec3 blendLighten(vec3 base, vec3 blend) {
    return vec3(blendLighten(base.r,blend.r),blendLighten(base.g,blend.g),blendLighten(base.b,blend.b));
}

vec3 blendLighten(vec3 base, vec3 blend, float opacity) {
    return (blendLighten(base, blend) * opacity + base * (1.0 - opacity));
}

// Linear burn

float blendLinearBurn(float base, float blend) {
    // Note : Same implementation as BlendSubtractf
    return max(base+blend-1.0,0.0);
}

vec3 blendLinearBurn(vec3 base, vec3 blend) {
    // Note : Same implementation as BlendSubtract
    return max(base+blend-vec3(1.0),vec3(0.0));
}

vec3 blendLinearBurn(vec3 base, vec3 blend, float opacity) {
    return (blendLinearBurn(base, blend) * opacity + base * (1.0 - opacity));
}

// Linear dodge

float blendLinearDodge(float base, float blend) {
    // Note : Same implementation as BlendAddf
    return min(base+blend,1.0);
}

vec3 blendLinearDodge(vec3 base, vec3 blend) {
    // Note : Same implementation as BlendAdd
    return min(base+blend,vec3(1.0));
}

vec3 blendLinearDodge(vec3 base, vec3 blend, float opacity) {
    return (blendLinearDodge(base, blend) * opacity + base * (1.0 - opacity));
}

// Linear light

float blendLinearLight(float base, float blend) {
    return blend<0.5?blendLinearBurn(base,(2.0*blend)):blendLinearDodge(base,(2.0*(blend-0.5)));
}

vec3 blendLinearLight(vec3 base, vec3 blend) {
    return vec3(blendLinearLight(base.r,blend.r),blendLinearLight(base.g,blend.g),blendLinearLight(base.b,blend.b));
}

vec3 blendLinearLight(vec3 base, vec3 blend, float opacity) {
    return (blendLinearLight(base, blend) * opacity + base * (1.0 - opacity));
}
`;

const VERTEX_SHADER = `varying vec3 v_color;

void main() {
  float time = u_time * u_global.noiseSpeed;

  vec2 noiseCoord = resolution * uvNorm * u_global.noiseFreq;

  vec2 st = 1. - uvNorm.xy;

  //
  // Tilting the plane
  //

  // Front-to-back tilt
  float tilt = resolution.y / 2.0 * uvNorm.y;

  // Left-to-right angle
  float incline = resolution.x * uvNorm.x / 2.0 * u_vertDeform.incline;

  // Up-down shift to offset incline
  float offset = resolution.x / 2.0 * u_vertDeform.incline * mix(u_vertDeform.offsetBottom, u_vertDeform.offsetTop, uv.y);

  //
  // Vertex noise
  //

  float noise = snoise(vec3(
    noiseCoord.x * u_vertDeform.noiseFreq.x + time * u_vertDeform.noiseFlow,
    noiseCoord.y * u_vertDeform.noiseFreq.y,
    time * u_vertDeform.noiseSpeed + u_vertDeform.noiseSeed
  )) * u_vertDeform.noiseAmp;

  // Fade noise to zero at edges
  noise *= 1.0 - pow(abs(uvNorm.y), 2.0);

  // Clamp to 0
  noise = max(0.0, noise);

  vec3 pos = vec3(
    position.x,
    position.y + tilt + incline + noise - offset,
    position.z
  );

  //
  // Vertex color, to be passed to fragment shader
  //

  if (u_active_colors[0] == 1.) {
    v_color = u_baseColor;
  }

  for (int i = 0; i < u_waveLayers_length; i++) {
    if (u_active_colors[i + 1] == 1.) {
      WaveLayers layer = u_waveLayers[i];

      float noise = smoothstep(
        layer.noiseFloor,
        layer.noiseCeil,
        snoise(vec3(
          noiseCoord.x * layer.noiseFreq.x + time * layer.noiseFlow,
          noiseCoord.y * layer.noiseFreq.y,
          time * layer.noiseSpeed + layer.noiseSeed
        )) / 2.0 + 0.5
      );

      v_color = blendNormal(v_color, layer.color, pow(noise, 4.));
    }
  }

  //
  // Finish
  //

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FRAGMENT_SHADER = `varying vec3 v_color;

void main() {
    vec3 color = v_color;
    if (u_darken_top == 1.0) {
        vec2 st = gl_FragCoord.xy/resolution.xy;
        color.g -= pow(st.y + sin(-12.0) * st.x, u_shadow_power) * 0.4;
    }
    gl_FragColor = vec4(color, 1.0);
}
`;

// WEBGL CLASSES

class Uniform {
    constructor(minigl, type, value, properties = {}) {
        Object.assign(this, properties);
        this.gl = minigl;
        this.type = type;
        this.value = value;
        this.typeFn = this._typeMap[this.type] || this._typeMap.float;
        this.update();
    }

    _typeMap = {
        float: '1f',
        int: '1i',
        vec2: '2fv',
        vec3: '3fv',
        vec4: '4fv',
        mat4: 'Matrix4fv'
    };

    update(value) {
        if (this.value) {
            var paramB = this.value;
            var paramC = null;
            if (this.typeFn.indexOf('Matrix') === 0) {
                paramB = this.transpose;
                paramC = this.value;
            }
            this.gl.getContext()[`uniform${this.typeFn}`](value, paramB, paramC);
        }
    }

    getDeclaration(name, type, length) {
        if (this.excludeFrom !== type) {
            if (this.type === 'array') {
                return `${this.value[0].getDeclaration(name, type, this.value.length)}
const int ${name}_length = ${this.value.length};`;
            }
            if (this.type === 'struct') {
                let namePrefix = name.replace('u_', '');
                namePrefix = namePrefix.charAt(0).toUpperCase() + namePrefix.slice(1);
                const declaration = Object.entries(this.value).map(([name, uniform]) => {
                    return uniform.getDeclaration(name, type).replace(/^uniform/, '');
                }).join('');
                return `uniform struct ${namePrefix} {
    ${declaration}
} ${name}${length > 0 ? `[${length}]` : ''};`;
            }
            return `uniform ${this.type} ${name}${length > 0 ? `[${length}]` : ''};`
        }
    }
}

class Attribute {
    constructor(minigl, properties = {}) {
        Object.assign(this, properties);
        this.gl = minigl;
        this.type = this.gl.getContext().FLOAT;
        this.buffer = this.gl.getContext().createBuffer();
        this.normalized = false;
        this.update();
    }

    update() {
        if (this.values) {
            const context = this.gl.getContext();
            context.bindBuffer(this.target, this.buffer);
            context.bufferData(this.target, this.values, context.STATIC_DRAW);
        }
    }

    attach(e, t) {
        const context = this.gl.getContext();
        const n = context.getAttribLocation(t, e);
        if (this.target === context.ARRAY_BUFFER) {
            context.enableVertexAttribArray(n);
            context.vertexAttribPointer(n, this.size, this.type, this.normalized, 0, 0);
        }
        return n;
    }

    use(e) {
        const context = this.gl.getContext();
        context.bindBuffer(this.target, this.buffer);
        if (this.target === context.ARRAY_BUFFER) {
            context.enableVertexAttribArray(e);
            context.vertexAttribPointer(e, this.size, this.type, this.normalized, 0, 0);
        }
    }
}

class PlaneGeometry {
    constructor(minigl, width, height, n, i, orientation, properties = {}) {
        Object.assign(this, properties);
        this.gl = minigl;
        const context = this.gl.getContext();
        context.createBuffer();

        this.attributes = {
            position: new Attribute(this.gl, {
                target: context.ARRAY_BUFFER,
                size: 3
            }),
            uv: new Attribute(this.gl, {
                target: context.ARRAY_BUFFER,
                size: 2
            }),
            uvNorm: new Attribute(this.gl, {
                target: context.ARRAY_BUFFER,
                size: 2
            }),
            index: new Attribute(this.gl, {
                target: context.ELEMENT_ARRAY_BUFFER,
                size: 3,
                type: context.UNSIGNED_SHORT
            })
        };

        this.setTopology(n, i);
        this.setSize(width, height, orientation);
    }

    setTopology(e = 1, t = 1) {
        this.xSegCount = e;
        this.ySegCount = t;
        this.vertexCount = (this.xSegCount + 1) * (this.ySegCount + 1);
        this.quadCount = this.xSegCount * this.ySegCount * 2;
        this.attributes.uv.values = new Float32Array(2 * this.vertexCount);
        this.attributes.uvNorm.values = new Float32Array(2 * this.vertexCount);
        this.attributes.index.values = new Uint16Array(3 * this.quadCount);

        for (let e = 0; e <= this.ySegCount; e++) {
            for (let t = 0; t <= this.xSegCount; t++) {
                const i = e * (this.xSegCount + 1) + t;
                if (this.attributes.uv.values[2 * i] = t / this.xSegCount, this.attributes.uv.values[2 * i + 1] = 1 - e / this.ySegCount, this.attributes.uvNorm.values[2 * i] = t / this.xSegCount * 2 - 1, this.attributes.uvNorm.values[2 * i + 1] = 1 - e / this.ySegCount * 2, t < this.xSegCount && e < this.ySegCount) {
                    const s = e * this.xSegCount + t;
                    this.attributes.index.values[6 * s] = i, this.attributes.index.values[6 * s + 1] = i + 1 + this.xSegCount, this.attributes.index.values[6 * s + 2] = i + 1, this.attributes.index.values[6 * s + 3] = i + 1, this.attributes.index.values[6 * s + 4] = i + 1 + this.xSegCount, this.attributes.index.values[6 * s + 5] = i + 2 + this.xSegCount
                }
            }
        }

        this.attributes.uv.update();
        this.attributes.uvNorm.update();
        this.attributes.index.update();
    }

    setSize(width = 1, height = 1, orientation = 'xz') {
        this.width = width;
        this.height = height;
        this.orientation = orientation;

        this.attributes.position.values && this.attributes.position.values.length === 3 * this.vertexCount || (this.attributes.position.values = new Float32Array(3 * this.vertexCount));
        const o = width / -2;
        const r = height / -2;
        const segment_width = width / this.xSegCount;
        const segment_height = height / this.ySegCount;

        for (let yIndex = 0; yIndex <= this.ySegCount; yIndex++) {
            const t = r + yIndex * segment_height;
            for (let xIndex = 0; xIndex <= this.xSegCount; xIndex++) {
                const r = o + xIndex * segment_width;
                const l = yIndex * (this.xSegCount + 1) + xIndex;

                this.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[0])] = r;
                this.attributes.position.values[3 * l + 'xyz'.indexOf(orientation[1])] = -t;
            }
        }

        this.attributes.position.update();
    }
}

class Material {
    constructor(minigl, vertexShaders, fragments, uniforms = {}, properties = {}) {
        Object.assign(this, properties);
        this.gl = minigl;
        this.uniforms = uniforms;
        this.uniformInstances = [];

        const context = this.gl.getContext();
        const prefix = `precision highp float;`;

        this.vertexSource = `
            ${prefix}
            attribute vec4 position;
            attribute vec2 uv;
            attribute vec2 uvNorm;
            ${this._getUniformVariableDeclarations(this.gl.commonUniforms, "vertex")}
            ${this._getUniformVariableDeclarations(uniforms, "vertex")}
            ${vertexShaders}
        `;

        this.Source = `
            ${prefix}
            ${this._getUniformVariableDeclarations(this.gl.commonUniforms, "fragment")}
            ${this._getUniformVariableDeclarations(uniforms, "fragment")}
            ${fragments}
        `;

        this.vertexShader = this._getShaderByType(context.VERTEX_SHADER, this.vertexSource);
        this.fragmentShader = this._getShaderByType(context.FRAGMENT_SHADER, this.Source);
        this.program = context.createProgram();

        context.attachShader(this.program, this.vertexShader);
        context.attachShader(this.program, this.fragmentShader);
        context.linkProgram(this.program);
        context.getProgramParameter(this.program, context.LINK_STATUS) || console.error(context.getProgramInfoLog(this.program));
        context.useProgram(this.program);

        this.attachUniforms(void 0, this.gl.commonUniforms);
        this.attachUniforms(void 0, this.uniforms);
    }

    _getShaderByType(type, source) {
        const context = this.gl.getContext();
        const shader = context.createShader(type);
        context.shaderSource(shader, source);
        context.compileShader(shader);
        if (!context.getShaderParameter(shader, context.COMPILE_STATUS)) {
            console.error(context.getShaderInfoLog(shader));
        }
        return shader;
    }

    _getUniformVariableDeclarations(uniforms, type) {
        return Object.entries(uniforms).map(([uniform, value]) => {
            return value.getDeclaration(uniform, type);
        }).join("\n");
    }

    attachUniforms(name, uniforms) {
        if (!name) {
            Object.entries(uniforms).forEach(([name, uniform]) => {
                this.attachUniforms(name, uniform);
            });
        } else if (uniforms.type === 'array') {
            uniforms.value.forEach((uniform, i) => {
                this.attachUniforms(`${name}[${i}]`, uniform);
            });
        } else if (uniforms.type === 'struct') {
            Object.entries(uniforms.value).forEach(([uniform, i]) => {
                this.attachUniforms(`${name}.${uniform}`, i);
            });
        } else {
            this.uniformInstances.push({
                uniform: uniforms,
                location: this.gl.getContext().getUniformLocation(this.program, name)
            });
        }
    }
}

class Mesh {
    constructor(minigl, geometry, material, properties = {}) {
        Object.assign(this, properties);
        this.geometry = geometry;
        this.material = material;
        this.gl = minigl;
        this.wireframe = false;
        this.attributeInstances = [];

        Object.entries(this.geometry.attributes).forEach(([e, attribute]) => {
            this.attributeInstances.push({
                attribute: attribute,
                location: attribute.attach(e, this.material.program)
            });
        });

        this.gl.meshes.push(this);
    }

    draw() {
        const context = this.gl.getContext();
        context.useProgram(this.material.program);

        this.material.uniformInstances.forEach(({ uniform: uniform, location: location }) => {
            uniform.update(location);
        });

        this.attributeInstances.forEach(({ attribute: attribute, location: location }) => {
            attribute.use(location);
        });

        const mode = this.wireframe ? context.LINES : context.TRIANGLES;
        context.drawElements(mode, this.geometry.attributes.index.values.length, context.UNSIGNED_SHORT, 0);
    }

    remove() {
        this.gl.meshes = this.gl.meshes.filter(mesh => mesh != this);
    }
}

class MiniGL {
    constructor(canvas, width, height) {
        this.meshes = [];
        this.setCanvas(canvas);

        const matrix = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
        this.commonUniforms = {
            projectionMatrix: new Uniform(this, 'mat4', matrix),
            modelViewMatrix: new Uniform(this, 'mat4', matrix),
            resolution: new Uniform(this, 'vec2', [1, 1]),
            aspectRatio: new Uniform(this, 'float', 1)
        };

        this.setSize(width, height);
    }

    setCanvas(canvas) {
        this._canvas = canvas;
        this._context = canvas.getContext('webgl', { antialias: true });
    }

    getCanvas() {
        return this._canvas;
    }

    getContext() {
        return this._context;
    }

    setSize(width = 640, height = 480) {
        this.getCanvas().width = width;
        this.getCanvas().height = height;
        this.getContext().viewport(0, 0, width, height);
        this.commonUniforms.resolution.value = [width, height];
        this.commonUniforms.aspectRatio.value = width / height;
    }

    setOrthographicCamera(left = 0, right = 0, top = 0, bottom = -2000, distance = 2000) {
        this.commonUniforms.projectionMatrix.value = [
            2 / this.getCanvas().width,
            0, 0, 0, 0,
            2 / this.getCanvas().height,
            0, 0, 0, 0,
            2 / (bottom - distance),
            0, left, right, top, 1
        ];
    }

    render() {
        this.getContext().clearColor(0, 0, 0, 0);
        this.getContext().clearDepth(1);
        this.meshes.forEach(mesh => {
            mesh.draw();
        });
    }
}

class Gradient {
    static defaultOptions = {
        canvas: null,
        colors: ['#f00', '#0f0', '#00f'],
        wireframe: false,
        density: [.06, .16],
        angle: 0,
        amplitude: 320,
        static: false,
        loadedClass: 'is-loaded',
        zoom: 1,
        speed: 5,
        rotation: 0,
    };

    constructor(options) {
        this.options = options;
        this.time = 1253106;
        this.scrollingTimeout = null;
        this.scrollingRefreshDelay = 200;
        this.scrollObserver = null;
        this.width = null;
        this.minWidth = 1111;
        this.height = 600;
        this.xSegCount = null;
        this.ySegCount = null;
        this.freqX = 0.00014;
        this.freqY = 0.00029;
        this.freqDelta = 0.00001;
        this.activeColors = [1, 1, 1, 1];
        this.seed = Math.random() * 1000;

        this.shaderFiles = {
            vertex: VERTEX_SHADER,
            noise: NOISE_SHADER,
            blend: BLEND_SHADER,
            fragment: FRAGMENT_SHADER
        };

        this._flags = { playing: true };

        this.setCanvas(this.findCanvas(this.getOption('canvas')));

        if (!this.getCanvas()) {
            throw 'Missing Canvas. Pass the canvas to the Gradient constructor.';
        }

        this._minigl = new MiniGL(this.getCanvas(), this.getCanvas().offsetWidth, this.getCanvas().offsetHeight);
        this.init();
    }

    getOption(name, defaultValue = undefined) {
        if (defaultValue === undefined && name in Gradient.defaultOptions) {
            defaultValue = Gradient.defaultOptions[name];
        }
        return name in this.options ? this.options[name] : defaultValue;
    }

    findCanvas(selector) {
        const canvas = typeof selector === 'string' ? document.querySelector(selector) : selector;
        if (canvas instanceof HTMLCanvasElement) {
            return canvas;
        }
        return null;
    }

    setCanvas(canvas) {
        if (canvas) {
            this._canvas = canvas;
            this._context = canvas.getContext('webgl', { antialias: true });
        } else {
            this._canvas = null;
            this._context = null;
        }
    }

    getCanvas() {
        return this._canvas;
    }

    getContext() {
        return this._context;
    }

    setFlag(name, value) {
        return this._flags[name] = value;
    }

    getFlag(name, defaultValue = undefined) {
        return this._flags[name] || defaultValue;
    }

    resize() {
        const [densityX, densityY] = this.getOption('density');
        this.width = window.innerWidth;
        this._minigl.setSize(this.width, this.height);
        this._minigl.setOrthographicCamera();
        this.xSegCount = Math.ceil(this.width * densityX);
        this.ySegCount = Math.ceil(this.height * densityY);
        this.mesh.geometry.setTopology(this.xSegCount, this.ySegCount);
        this.mesh.geometry.setSize(this.width, this.height);
        this.mesh.material.uniforms.u_shadow_power.value = this.width < 600 ? 5 : 6;
    }

    animate(event = 0) {
        const shouldSkipFrame = !!window.document.hidden || (!this.getFlag('playing') || parseInt(event, 10) % 2 === 0);
        let lastFrame = this.getFlag('lastFrame', 0);

        if (!shouldSkipFrame) {
            this.time += Math.min(event - lastFrame, 1000 / 15);
            lastFrame = this.setFlag('lastFrame', event);
            this.mesh.material.uniforms.u_time.value = this.time;
            this._minigl.render();
        }

        if (lastFrame !== 0 && this.getOption('static')) {
            this._minigl.render();
            return this.disconnect();
        }

        if (this.getFlag('playing')) {
            requestAnimationFrame(this.animate.bind(this));
        }
    }

    pause() {
        this.setFlag('playing', false);
    }

    play() {
        requestAnimationFrame(this.animate.bind(this));
        this.setFlag('playing', true);
    }

    disconnect() {
        if (this.scrollObserver) {
            window.removeEventListener("scroll", this.handleScroll);
            this.scrollObserver.disconnect();
        }
        window.removeEventListener("resize", this.resize);
    }

    initMaterial() {
        const colors = this.getOption('colors').map(hex => {
            if (hex.length === 4) {
                const hexTemp = hex.substr(1).split('').map(hexTemp => hexTemp + hexTemp).join('');
                hex = `#${hexTemp}`
            }
            return hex && `0x${hex.substr(1)}`;
        }).filter(Boolean).map(this.normalizeColor);

        this.uniforms = {
            u_time: new Uniform(this._minigl, 'float', 0),
            u_shadow_power: new Uniform(this._minigl, 'float', 10),
            u_darken_top: new Uniform(this._minigl, 'float', this.getCanvas().dataset.jsDarkenTop ? 1 : 0),
            u_active_colors: new Uniform(this._minigl, 'vec4', this.activeColors),

            u_global: new Uniform(this._minigl, 'struct', {
                noiseFreq: new Uniform(this._minigl, 'vec2', [this.freqX, this.freqY]),
                noiseSpeed: new Uniform(this._minigl, 'float', 0.000005)
            }),

            u_vertDeform: new Uniform(this._minigl, 'struct', {
                incline: new Uniform(this._minigl, 'float', Math.sin(this.getOption('angle')) / Math.cos(this.getOption('angle'))),
                offsetTop: new Uniform(this._minigl, 'float', -0.5),
                offsetBottom: new Uniform(this._minigl, 'float', -0.5),
                noiseFreq: new Uniform(this._minigl, 'vec2', [3, 4]),
                noiseAmp: new Uniform(this._minigl, 'float', this.getOption('amplitude')),
                noiseSpeed: new Uniform(this._minigl, 'float', 10),
                noiseFlow: new Uniform(this._minigl, 'float', 3),
                noiseSeed: new Uniform(this._minigl, 'float', this.seed)
            }, {
                excludeFrom: 'fragment'
            }),

            u_baseColor: new Uniform(this._minigl, 'vec3', colors[0], {
                excludeFrom: 'fragment'
            }),

            u_waveLayers: new Uniform(this._minigl, 'array', [], {
                excludeFrom: 'fragment'
            })
        };

        for (let e = 1; e < colors.length; e += 1) {
            const waveLayerUniform = new Uniform(this._minigl, 'struct', {
                color: new Uniform(this._minigl, 'vec3', colors[e]),
                noiseFreq: new Uniform(this._minigl, 'vec2', [2 + e / colors.length, 3 + e / colors.length]),
                noiseSpeed: new Uniform(this._minigl, 'float', 11 + 0.3 * e),
                noiseFlow: new Uniform(this._minigl, 'float', 6.5 + 0.3 * e),
                noiseSeed: new Uniform(this._minigl, 'float', this.seed + 10 * e),
                noiseFloor: new Uniform(this._minigl, 'float', 0.1),
                noiseCeil: new Uniform(this._minigl, 'float', 0.63 + 0.07 * e)
            });

            this.uniforms.u_waveLayers.value.push(waveLayerUniform);
        }

        this.vertexShader = [
            this.shaderFiles.noise,
            this.shaderFiles.blend,
            this.shaderFiles.vertex
        ].join("\n\n");

        return new Material(this._minigl, this.vertexShader, this.shaderFiles.fragment, this.uniforms);
    }

    initMesh() {
        this.material = this.initMaterial();
        this.geometry = new PlaneGeometry(this._minigl);
        this.mesh = new Mesh(this._minigl, this.geometry, this.material);
        this.mesh.wireframe = this.getOption('wireframe');
    }

    init() {
        const loadedClass = this.getOption('loadedClass');
        if (loadedClass) {
            this.getCanvas().classList.add(loadedClass);
        }

        this.initMesh();
        this.resize();
        requestAnimationFrame(this.animate.bind(this));
        window.addEventListener('resize', this.resize.bind(this));
    }

    normalizeColor(hexCode) {
        return [
            (hexCode >> 16 & 255) / 255,
            (hexCode >> 8 & 255) / 255,
            (255 & hexCode) / 255
        ];
    }
}

// REACT COMPONENT
export default function MeshGradient() {
    const canvasRef = useRef(null);
    const gradientRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            gradientRef.current = new Gradient({
                canvas: canvasRef.current,
                colors: COLORS,
                wireframe: WIREFRAME,
                density: DENSITY,
                angle: ANGLE,
                amplitude: AMPLITUDE,
                static: STATIC
            });
        }

        return () => {
            if (gradientRef.current) {
                gradientRef.current.disconnect();
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', minHeight: '100vh' }}>
            {/* Background mesh gradient canvas */}
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    minHeight: '100vh',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    zIndex: 1
                }}
            />

            {/* Glass bars overlay component */}
            <GlassBars />
        </div>
    );
}
