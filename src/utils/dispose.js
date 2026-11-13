/** Recursively free GPU resources owned by an Object3D tree. */
export function disposeObject(root) {
  if (!root) return;
  root.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      for (const key in m) {
        const v = m[key];
        if (v && v.isTexture) v.dispose();
      }
      if (m.uniforms) {
        for (const k in m.uniforms) {
          const v = m.uniforms[k] && m.uniforms[k].value;
          if (v && v.isTexture) v.dispose();
        }
      }
      m.dispose();
    }
  });
  if (root.parent) root.parent.remove(root);
}
