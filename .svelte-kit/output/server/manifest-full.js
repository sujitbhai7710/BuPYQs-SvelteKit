export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["data/syllabus_data.json","data/website_data.json","favicon.ico","robots.txt"]),
	mimeTypes: {".json":"application/json",".txt":"text/plain"},
	_: {
		client: {start:"_app/immutable/entry/start.Btg1YTTd.js",app:"_app/immutable/entry/app.CcpxXomu.js",imports:["_app/immutable/entry/start.Btg1YTTd.js","_app/immutable/chunks/DSVl5qdP.js","_app/immutable/chunks/DLj6jG1V.js","_app/immutable/chunks/B8WFFBG1.js","_app/immutable/entry/app.CcpxXomu.js","_app/immutable/chunks/DLj6jG1V.js","_app/immutable/chunks/Ckmgd8H5.js","_app/immutable/chunks/Tx2g_jBa.js","_app/immutable/chunks/B8WFFBG1.js","_app/immutable/chunks/ZGQEj8Ut.js","_app/immutable/chunks/Bb62GkNa.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
