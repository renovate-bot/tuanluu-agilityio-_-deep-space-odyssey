// Procedural surface definitions. Each body provides two GLSL functions evaluated on the unit sphere:
//   vec4 surface(vec3 p) → rgb = albedo (linear), a = height 0..1
//   vec4 extra(vec3 p)   → r = specular/ocean mask, g = emissive mask, b = cloud density, a = spare
// They are baked once into equirect textures by PlanetBaker.

export const SURFACES = {
  earth: /* glsl */ `
    float landField(vec3 p){
      vec3 q = p + 0.22 * vec3(fbm(p * 2.1 + 1.7, 4), fbm(p * 2.1 + 5.2, 4), fbm(p * 2.1 + 9.1, 4));
      return fbm(q * 1.35 + 3.0, 7) + 0.07 * snoise(p * 0.9 + 2.0) + 0.02;
    }
    vec4 surface(vec3 p){
      float n = landField(p);
      float land = smoothstep(0.0, 0.035, n);
      float lat = abs(p.y);
      float h = max(n, 0.0);
      float mountains = ridged(p * 5.0 + 2.0, 5) * smoothstep(0.08, 0.3, h);
      float moisture = fbm(p * 2.6 + 11.0, 5) * 0.5 + 0.5;
      float aridBelt = exp(-pow((lat - 0.36) / 0.16, 2.0));
      vec3 forest = mix(vec3(0.035, 0.11, 0.03), vec3(0.09, 0.19, 0.05), moisture);
      vec3 desert = mix(vec3(0.36, 0.27, 0.15), vec3(0.5, 0.4, 0.24), fbm(p * 9.0, 3) * 0.5 + 0.5);
      vec3 landCol = mix(forest, desert, clamp(aridBelt * 1.25 - moisture * 0.7 + 0.15, 0.0, 1.0));
      landCol = mix(landCol, vec3(0.13, 0.16, 0.09), smoothstep(0.55, 0.8, lat) * 0.8); // tundra
      landCol = mix(landCol, vec3(0.3, 0.27, 0.24), smoothstep(0.35, 0.8, mountains));
      landCol = mix(landCol, vec3(0.9), smoothstep(0.7, 0.95, mountains + lat * 0.3));
      vec3 ocean = mix(vec3(0.004, 0.022, 0.085), vec3(0.01, 0.1, 0.2), smoothstep(-0.25, 0.0, n));
      vec3 col = mix(ocean, landCol, land);
      float ice = smoothstep(0.83, 0.9, lat + 0.06 * fbm(p * 6.0, 4));
      col = mix(col, vec3(0.88, 0.92, 0.96), ice);
      float height = land * (0.25 + 0.3 * h + 0.45 * mountains) * (1.0 - ice * 0.6);
      return vec4(col, height);
    }
    vec4 extra(vec3 p){
      float n = landField(p);
      float land = smoothstep(0.0, 0.035, n);
      float lat = abs(p.y);
      float ice = smoothstep(0.83, 0.9, lat + 0.06 * fbm(p * 6.0, 4));
      // city lights: clustered along coasts and temperate land
      float pop = smoothstep(0.45, 0.8, fbm(p * 4.0 + 30.0, 4) * 0.5 + 0.5) * smoothstep(0.22, 0.0, n) * (1.0 - smoothstep(0.55, 0.75, lat));
      // fine speckle (towns) strung along thin filaments (roads, coasts)
      float web = pow(1.0 - abs(snoise(p * 34.0 + 3.0)), 9.0);
      float grain = smoothstep(0.62, 0.95, snoise(p * 210.0) * 0.5 + 0.5) * (0.35 + 0.65 * smoothstep(0.4, 0.8, snoise(p * 60.0) * 0.5 + 0.5)) + web * 0.6;
      float lights = land * (1.0 - ice) * pop * grain;
      // clouds: swirled fbm with clearer subtropics
      vec3 w = p + 0.35 * vec3(fbm(p * 1.8 + 40.0, 4), fbm(p * 1.8 + 44.0, 4), fbm(p * 1.8 + 48.0, 4));
      float c = fbm(w * 2.4 + vec3(0.0, p.y * 2.0, 0.0), 7) * 0.5 + 0.5;
      float fronts = ridged(w * 1.6 + 60.0, 4);
      float clouds = smoothstep(0.5, 0.8, c + 0.16 * fronts - 0.1 * exp(-pow((lat - 0.3) / 0.14, 2.0)));
      return vec4((1.0 - land) * (1.0 - ice), lights, clouds, 1.0);
    }`,

  mars: /* glsl */ `
    float marsH(vec3 p){
      float base = fbm(p * 1.5 + 7.0, 7) * 0.5 + 0.5;
      float rough = ridged(p * 4.0 + 3.0, 5) * 0.25;
      float cr = craters(p, 5.0, 0.5) * 0.14 + craters(p, 13.0, 0.6) * 0.07 + craters(p, 31.0, 0.6) * 0.03;
      // one long equatorial canyon system
      float lon = atan(p.z, p.x);
      float canyon = exp(-pow((p.y + 0.12 + 0.05 * sin(lon * 3.0) + 0.03 * snoise(p * 6.0)) / 0.025, 2.0)) * smoothstep(-1.2, -0.6, lon) * (1.0 - smoothstep(0.5, 1.1, lon));
      // a giant shield volcano
      float vol = exp(-pow(distance(p, normalize(vec3(-0.6, 0.32, 0.72))) / 0.16, 2.0));
      return clamp(base * 0.55 + rough + cr - canyon * 0.35 + vol * 0.4 + 0.12, 0.0, 1.0);
    }
    vec4 surface(vec3 p){
      float h = marsH(p);
      float tone = fbm(p * 2.2 + 20.0, 5) * 0.5 + 0.5;
      vec3 rust = mix(vec3(0.42, 0.16, 0.07), vec3(0.62, 0.31, 0.15), tone);
      vec3 basalt = vec3(0.17, 0.085, 0.06);
      float dark = smoothstep(0.52, 0.72, fbm(p * 1.1 + 33.0, 5) * 0.5 + 0.5 + (0.5 - h) * 0.3);
      vec3 col = mix(rust, basalt, dark * 0.8);
      col = mix(col, vec3(0.74, 0.5, 0.32), smoothstep(0.6, 0.95, h) * 0.5); // dusty highlands
      float cap = smoothstep(0.86, 0.93, abs(p.y) + 0.05 * fbm(p * 7.0, 4));
      col = mix(col, vec3(0.9, 0.86, 0.82), cap);
      return vec4(col, h);
    }
    vec4 extra(vec3 p){
      float haze = smoothstep(0.55, 0.9, fbm(p * 2.0 + 80.0, 5) * 0.5 + 0.5) * 0.35;
      return vec4(0.0, 0.0, haze, 1.0);
    }`,

  moon: /* glsl */ `
    vec4 surface(vec3 p){
      float maria = smoothstep(0.5, 0.68, fbm(p * 1.2 + 4.0, 5) * 0.5 + 0.5);
      float cr = craters(p, 4.0, 0.55) * 0.3 + craters(p, 10.0, 0.7) * 0.16 + craters(p, 24.0, 0.7) * 0.08 + craters(p, 55.0, 0.7) * 0.04;
      float h = clamp(0.5 + cr + 0.12 * fbm(p * 6.0, 5) - maria * 0.1, 0.0, 1.0);
      vec3 col = mix(vec3(0.44, 0.43, 0.41), vec3(0.15, 0.15, 0.16), maria);
      col *= 0.8 + 0.5 * (h - 0.5);
      col += max(cr, 0.0) * 0.25;
      return vec4(col, h);
    }
    vec4 extra(vec3 p){ return vec4(0.0, 0.0, 0.0, 1.0); }`,

  jupiter: /* glsl */ `
    vec4 surface(vec3 p){
      float lon = atan(p.z, p.x);
      // Great Red Spot in the southern hemisphere
      vec2 sp = vec2(mod(lon + 3.14159 - 1.0, 6.28318) - 3.14159, asin(clamp(p.y, -1.0, 1.0)) + 0.38);
      float spot = length(sp / vec2(0.2, 0.115));
      float spotMask = 1.0 - smoothstep(0.75, 1.05, spot);
      float deflect = exp(-spot * spot * 0.45) * sign(sp.y) * 0.035;
      vec3 w = p + 0.03 * vec3(snoise(p * vec3(5.0, 14.0, 5.0)), 0.0, snoise(p * vec3(5.0, 14.0, 5.0) + 9.0));
      float turb = fbm(w * vec3(3.0, 11.0, 3.0) + 3.0, 6);
      float y = p.y + deflect + 0.03 * turb + 0.012 * fbm(p * vec3(11.0, 34.0, 11.0) + 7.0, 5);
      // irregular belt/zone widths from 1-D noise in latitude, sharpened into distinct bands
      float bands = snoise(vec3(1.7, y * 5.5, 3.1)) * 0.62 + snoise(vec3(4.2, y * 13.0, 0.5)) * 0.3 + snoise(vec3(8.1, y * 33.0, 2.2)) * 0.12;
      float t = smoothstep(0.22, 0.78, bands * 0.5 + 0.5);
      vec3 cream = vec3(0.86, 0.76, 0.6), tan_ = vec3(0.66, 0.47, 0.3), brown = vec3(0.4, 0.22, 0.13), white = vec3(0.93, 0.9, 0.84);
      vec3 col = mix(brown, tan_, smoothstep(0.0, 0.4, t));
      col = mix(col, cream, smoothstep(0.35, 0.7, t));
      col = mix(col, white, smoothstep(0.75, 1.0, t) * 0.8);
      // festoons and small ovals along the belts
      float fest = smoothstep(0.55, 0.9, fbm(w * vec3(9.0, 30.0, 9.0) + 15.0, 5) * 0.5 + 0.5);
      col = mix(col, col * vec3(0.7, 0.72, 0.85), fest * 0.45);
      col = mix(col, vec3(0.42, 0.44, 0.5), smoothstep(0.78, 0.98, abs(p.y)) * 0.6); // bluish-grey poles
      float swirl = fbm(vec3(sp * 9.0, 2.0) + vec3(spot * 3.0), 4) * 0.5 + 0.5;
      vec3 spotCol = mix(vec3(0.55, 0.13, 0.06), vec3(0.74, 0.3, 0.16), swirl * (0.3 + 0.7 * spot));
      // pale collar around the storm
      col = mix(col, vec3(0.9, 0.84, 0.74), (1.0 - smoothstep(1.0, 1.45, spot)) * 0.55);
      col = mix(col, spotCol, spotMask);
      return vec4(col, 0.5 + 0.2 * turb);
    }
    vec4 extra(vec3 p){ return vec4(0.0, 0.0, 0.0, 1.0); }`,

  saturn: /* glsl */ `
    vec4 surface(vec3 p){
      float turb = fbm(p * vec3(2.5, 9.0, 2.5) + 6.0, 5);
      float y = p.y + 0.012 * turb;
      float bands = sin(y * 15.0) * 0.5 + sin(y * 33.0 + 0.7) * 0.22 + sin(y * 61.0) * 0.08;
      float t = bands * 0.5 + 0.5;
      vec3 col = mix(vec3(0.6, 0.47, 0.28), vec3(0.86, 0.76, 0.52), smoothstep(0.1, 0.6, t));
      col = mix(col, vec3(0.93, 0.88, 0.72), smoothstep(0.65, 1.0, t) * 0.7);
      // north polar hexagon (a real, long-lived jet-stream feature)
      vec2 q = p.xz / max(sqrt(1.0 - min(p.y * p.y, 0.999)), 1e-3);
      float ang = atan(q.y, q.x);
      float polar = acos(clamp(p.y, -1.0, 1.0));
      float hexR = 0.24 / cos(mod(ang, 1.0471976) - 0.5235988);
      float hex = 1.0 - smoothstep(hexR - 0.025, hexR + 0.01, polar);
      col = mix(col, vec3(0.5, 0.46, 0.34), hex * 0.5);
      col = mix(col, vec3(0.6, 0.6, 0.5), smoothstep(0.8, 1.0, -p.y) * 0.4);
      return vec4(col, 0.5 + 0.15 * turb);
    }
    vec4 extra(vec3 p){ return vec4(0.0, 0.0, 0.0, 1.0); }`,

  io: /* glsl */ `
    vec4 surface(vec3 p){
      float n = fbm(p * 2.5, 6) * 0.5 + 0.5;
      vec3 col = mix(vec3(0.78, 0.66, 0.2), vec3(0.9, 0.82, 0.5), n);
      col = mix(col, vec3(0.75, 0.35, 0.1), smoothstep(0.6, 0.85, fbm(p * 4.0 + 9.0, 5) * 0.5 + 0.5));
      float vents = smoothstep(0.2, 0.0, abs(craters(p, 7.0, 0.3)) - 0.02) * step(0.001, abs(craters(p, 7.0, 0.3)));
      col = mix(col, vec3(0.08, 0.06, 0.05), vents * 0.7);
      return vec4(col, n);
    }
    vec4 extra(vec3 p){ return vec4(0.0); }`,

  europa: /* glsl */ `
    vec4 surface(vec3 p){
      float cracks = pow(1.0 - abs(snoise(p * 4.0 + fbm(p * 2.0, 3))), 14.0) + 0.7 * pow(1.0 - abs(snoise(p * 9.0 + 5.0)), 18.0);
      vec3 col = mix(vec3(0.82, 0.8, 0.74), vec3(0.62, 0.56, 0.48), fbm(p * 2.0 + 3.0, 5) * 0.5 + 0.5);
      col = mix(col, vec3(0.45, 0.22, 0.14), clamp(cracks, 0.0, 1.0) * 0.8);
      return vec4(col, 0.5 - 0.3 * clamp(cracks, 0.0, 1.0));
    }
    vec4 extra(vec3 p){ return vec4(0.3, 0.0, 0.0, 1.0); }`,

  ganymede: /* glsl */ `
    vec4 surface(vec3 p){
      float t = smoothstep(0.4, 0.6, fbm(p * 1.6 + 2.0, 5) * 0.5 + 0.5);
      float groove = pow(1.0 - abs(snoise(p * 7.0)), 6.0) * t;
      float cr = craters(p, 8.0, 0.6) * 0.2 + craters(p, 20.0, 0.6) * 0.1;
      vec3 col = mix(vec3(0.24, 0.21, 0.19), vec3(0.55, 0.52, 0.48), t);
      col += groove * 0.12 + max(cr, 0.0) * 0.5;
      return vec4(col, clamp(0.5 + cr + groove * 0.1, 0.0, 1.0));
    }
    vec4 extra(vec3 p){ return vec4(0.0); }`,

  callisto: /* glsl */ `
    vec4 surface(vec3 p){
      float cr = craters(p, 6.0, 0.8) * 0.25 + craters(p, 15.0, 0.9) * 0.15 + craters(p, 36.0, 0.9) * 0.08;
      vec3 col = vec3(0.2, 0.17, 0.15) * (0.8 + 0.4 * fbm(p * 3.0, 5));
      col += max(cr, 0.0) * 1.1;
      return vec4(col, clamp(0.5 + cr, 0.0, 1.0));
    }
    vec4 extra(vec3 p){ return vec4(0.0); }`,

  titan: /* glsl */ `
    vec4 surface(vec3 p){
      float b = fbm(p * vec3(1.5, 5.0, 1.5), 5) * 0.5 + 0.5;
      vec3 col = mix(vec3(0.72, 0.48, 0.16), vec3(0.86, 0.64, 0.28), b);
      col = mix(col, vec3(0.5, 0.36, 0.2), smoothstep(0.6, 1.0, p.y) * 0.5);
      return vec4(col, 0.5);
    }
    vec4 extra(vec3 p){ return vec4(0.0); }`,

  // Fictional exoplanet: violet seas, obsidian continents, glowing mineral veins.
  exo: /* glsl */ `
    float exoLand(vec3 p){
      vec3 q = p + 0.3 * vec3(fbm(p * 1.7 + 3.0, 4), fbm(p * 1.7 + 8.0, 4), fbm(p * 1.7 + 13.0, 4));
      return fbm(q * 1.1 + 50.0, 7) - 0.03;
    }
    vec4 surface(vec3 p){
      float n = exoLand(p);
      float land = smoothstep(0.0, 0.03, n);
      float peaks = ridged(p * 3.2 + 5.0, 6) * smoothstep(0.02, 0.3, n);
      vec3 sea = mix(vec3(0.07, 0.01, 0.2), vec3(0.03, 0.2, 0.33), smoothstep(-0.35, 0.0, n));
      sea = mix(sea, vec3(0.2, 0.06, 0.4), smoothstep(0.3, 0.8, fbm(p * 3.0 + 70.0, 4) * 0.5 + 0.5) * 0.6);
      vec3 rock = mix(vec3(0.05, 0.045, 0.08), vec3(0.17, 0.1, 0.2), fbm(p * 5.0, 4) * 0.5 + 0.5);
      rock = mix(rock, vec3(0.42, 0.36, 0.52), smoothstep(0.45, 0.9, peaks));
      rock = mix(rock, vec3(0.85, 0.9, 1.0), smoothstep(0.82, 1.0, peaks));
      vec3 col = mix(sea, rock, land);
      return vec4(col, land * (0.2 + 0.8 * peaks));
    }
    vec4 extra(vec3 p){
      float n = exoLand(p);
      float land = smoothstep(0.0, 0.03, n);
      float veins = pow(1.0 - abs(snoise(p * 6.0 + 2.0 * fbm(p * 3.0, 3))), 10.0) + 0.6 * pow(1.0 - abs(snoise(p * 14.0 + 9.0)), 12.0);
      float shore = exp(-pow(n / 0.02, 2.0)); // glowing shallows
      float glow = land * veins + (1.0 - land) * shore * 0.9 + (1.0 - land) * 0.25 * smoothstep(0.5, 0.9, fbm(p * 8.0 + 4.0, 4) * 0.5 + 0.5);
      vec3 w = p + 0.4 * vec3(fbm(p * 1.5 + 90.0, 4), 0.0, fbm(p * 1.5 + 95.0, 4));
      float clouds = smoothstep(0.5, 0.85, fbm(w * vec3(2.0, 5.0, 2.0) + 12.0, 6) * 0.5 + 0.5);
      return vec4(1.0 - land, clamp(glow, 0.0, 1.0), clouds, 1.0);
    }`,

  exoMoonIce: /* glsl */ `
    vec4 surface(vec3 p){
      float cracks = pow(1.0 - abs(snoise(p * 5.0 + fbm(p * 2.0, 3))), 10.0);
      float cr = craters(p, 9.0, 0.4) * 0.2;
      vec3 col = mix(vec3(0.55, 0.75, 0.82), vec3(0.85, 0.95, 1.0), fbm(p * 3.0, 5) * 0.5 + 0.5);
      col = mix(col, vec3(0.15, 0.4, 0.55), cracks * 0.7);
      return vec4(col, clamp(0.5 + cr - cracks * 0.2, 0.0, 1.0));
    }
    vec4 extra(vec3 p){ return vec4(0.5, 0.0, 0.0, 1.0); }`,

  exoMoonRust: /* glsl */ `
    vec4 surface(vec3 p){
      float cr = craters(p, 5.0, 0.6) * 0.3 + craters(p, 14.0, 0.7) * 0.12;
      float n = fbm(p * 2.5 + 8.0, 6) * 0.5 + 0.5;
      vec3 col = mix(vec3(0.3, 0.13, 0.12), vec3(0.6, 0.34, 0.26), n);
      return vec4(col * (0.9 + cr), clamp(0.5 + cr + 0.2 * (n - 0.5), 0.0, 1.0));
    }
    vec4 extra(vec3 p){ return vec4(0.0); }`,
};
