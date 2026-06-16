/**
 * server/src/utils/polyfills.js
 *
 * MUST be the very first import in server.js — before any other module loads.
 *
 * WHY: pdfjs-dist evaluates DOMMatrix / ImageData / Path2D at module scope
 * (top-level, not inside a function). Vercel's Node.js Lambda runtime does
 * not expose these browser globals, so the process exits with code 1 before
 * a single request is handled.
 *
 * In ESM, static imports are evaluated depth-first / left-to-right, so
 * placing this as the first import in server.js guarantees it runs before
 * pdfjs-dist is evaluated through the pdf-parse transitive dependency chain.
 *
 * These stubs only need to be good enough for text-extraction use (no
 * canvas rendering); pdfjs-dist will still warn about @napi-rs/canvas
 * not being installed, but that warning is harmless for text parsing.
 */

// ─── DOMMatrix ────────────────────────────────────────────────────────────────
if (typeof globalThis.DOMMatrix === 'undefined') {
  globalThis.DOMMatrix = class DOMMatrix {
    constructor(_init) {
      // 2D affine fields
      this.a = 1;   this.b = 0;   this.c = 0;   this.d = 1;
      this.e = 0;   this.f = 0;
      // 4×4 fields
      this.m11 = 1; this.m12 = 0; this.m13 = 0; this.m14 = 0;
      this.m21 = 0; this.m22 = 1; this.m23 = 0; this.m24 = 0;
      this.m31 = 0; this.m32 = 0; this.m33 = 1; this.m34 = 0;
      this.m41 = 0; this.m42 = 0; this.m43 = 0; this.m44 = 1;
      this.is2D      = true;
      this.isIdentity = true;
    }

    multiply()          { return new DOMMatrix(); }
    translate()         { return new DOMMatrix(); }
    scale()             { return new DOMMatrix(); }
    scale3d()           { return new DOMMatrix(); }
    scaleNonUniform()   { return new DOMMatrix(); }
    rotate()            { return new DOMMatrix(); }
    rotateFromVector()  { return new DOMMatrix(); }
    rotateAxisAngle()   { return new DOMMatrix(); }
    skewX()             { return new DOMMatrix(); }
    skewY()             { return new DOMMatrix(); }
    flipX()             { return new DOMMatrix(); }
    flipY()             { return new DOMMatrix(); }
    inverse()           { return new DOMMatrix(); }
    transformPoint(p)   { return p ?? { x: 0, y: 0, z: 0, w: 1 }; }
    toFloat32Array()    { return new Float32Array(16); }
    toFloat64Array()    { return new Float64Array(16); }
    toString()          {
      return `matrix(${this.a},${this.b},${this.c},${this.d},${this.e},${this.f})`;
    }

    static fromMatrix()        { return new DOMMatrix(); }
    static fromFloat32Array()  { return new DOMMatrix(); }
    static fromFloat64Array()  { return new DOMMatrix(); }
  };
}

// ─── ImageData ────────────────────────────────────────────────────────────────
if (typeof globalThis.ImageData === 'undefined') {
  globalThis.ImageData = class ImageData {
    /**
     * Supports both signatures:
     *   new ImageData(width, height)
     *   new ImageData(Uint8ClampedArray, width[, height])
     */
    constructor(dataOrWidth, widthOrHeight, height) {
      if (typeof dataOrWidth === 'number') {
        this.width  = dataOrWidth;
        this.height = widthOrHeight;
        this.data   = new Uint8ClampedArray(dataOrWidth * widthOrHeight * 4);
      } else {
        this.data   = dataOrWidth;
        this.width  = widthOrHeight;
        this.height = height ?? (dataOrWidth.length / 4 / widthOrHeight);
      }
      this.colorSpace = 'srgb';
    }
  };
}

// ─── Path2D ───────────────────────────────────────────────────────────────────
if (typeof globalThis.Path2D === 'undefined') {
  globalThis.Path2D = class Path2D {
    constructor(_path) {}
    addPath()           {}
    closePath()         {}
    moveTo()            {}
    lineTo()            {}
    bezierCurveTo()     {}
    quadraticCurveTo()  {}
    arc()               {}
    arcTo()             {}
    ellipse()           {}
    rect()              {}
    roundRect()         {}
  };
}