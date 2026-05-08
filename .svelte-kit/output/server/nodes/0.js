

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/fallbacks/layout.svelte.js')).default;
export const universal = {
  "prerender": true,
  "ssr": false
};
export const universal_id = "src/routes/+layout.ts";
export const imports = ["_app/immutable/nodes/0.CZS5Jnvg.js","_app/immutable/chunks/Tx2g_jBa.js","_app/immutable/chunks/DLj6jG1V.js","_app/immutable/chunks/Bb62GkNa.js"];
export const stylesheets = [];
export const fonts = [];
