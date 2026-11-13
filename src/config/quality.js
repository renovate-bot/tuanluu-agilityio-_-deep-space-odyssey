// Quality tiers. Asset-level numbers (counts, texture sizes) are read when a sector is built;
// render-level numbers (pixel ratio, bloom) can change live.
export const TIERS = {
  high: { label: 'HIGH', pixelRatioMax: 2, skyStars: 26000, fieldStars: 5200, dust: 900, planetTex: 2048, moonTex: 1024, galaxyStars: 170000, galaxyTex: 2048, nebulaDensity: 1.0, bloom: true, asteroids: 2700, atlas: 2048 },
  medium: { label: 'MEDIUM', pixelRatioMax: 1.5, skyStars: 18000, fieldStars: 3600, dust: 600, planetTex: 2048, moonTex: 512, galaxyStars: 100000, galaxyTex: 2048, nebulaDensity: 0.75, bloom: true, asteroids: 1800, atlas: 2048 },
  low: { label: 'LOW', pixelRatioMax: 1, skyStars: 10000, fieldStars: 2000, dust: 300, planetTex: 1024, moonTex: 512, galaxyStars: 50000, galaxyTex: 1024, nebulaDensity: 0.5, bloom: false, asteroids: 900, atlas: 1024 },
};

/** Pick a starting tier from coarse device hints. The adaptive controller refines it from measured frame times. */
export function detectTier(renderer) {
  const ua = navigator.userAgent || '';
  const mobile = /Android|iPhone|iPad|iPod|Mobile/i.test(ua) || (navigator.maxTouchPoints > 1 && Math.min(screen.width, screen.height) < 900);
  let gpu = '';
  try {
    const gl = renderer.getContext();
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : '';
  } catch (e) { /* ignore */ }
  const software = /SwiftShader|llvmpipe|Software|Basic Render/i.test(gpu);
  const weak = /Intel\(R\) (HD|UHD) Graphics [2-6]\d{2}\b|Mali-4|Adreno \(TM\) [2-5]\d\d/i.test(gpu);
  const maxTex = renderer.capabilities.maxTextureSize;
  if (software || maxTex < 4096) return 'low';
  if (mobile || weak || (navigator.deviceMemory && navigator.deviceMemory <= 4)) return 'medium';
  return 'high';
}
