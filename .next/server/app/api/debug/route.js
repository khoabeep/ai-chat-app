/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/debug/route";
exports.ids = ["app/api/debug/route"];
exports.modules = {

/***/ "(rsc)/./app/api/debug/route.ts":
/*!********************************!*\
  !*** ./app/api/debug/route.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   GET: () => (/* binding */ GET)\n/* harmony export */ });\nasync function GET() {\n    const key = process.env.GEMINI_API_KEY;\n    if (!key) {\n        return Response.json({\n            ok: false,\n            error: 'GEMINI_API_KEY not found in environment'\n        });\n    }\n    // First, list available models for this key\n    const listUrl = `https://generativelanguage.googleapis.com/v1/models?key=${key}`;\n    const listRes = await fetch(listUrl);\n    const listData = await listRes.json();\n    // Find models that support generateContent\n    const availableModels = listData.models?.filter((m)=>m.supportedGenerationMethods?.includes('generateContent'))?.map((m)=>m.name) || [];\n    // Try first available model\n    const testModel = availableModels[0]?.replace('models/', '') || 'gemini-1.5-flash';\n    const url = `https://generativelanguage.googleapis.com/v1/models/${testModel}:generateContent?key=${key}`;\n    const res = await fetch(url, {\n        method: 'POST',\n        headers: {\n            'Content-Type': 'application/json'\n        },\n        body: JSON.stringify({\n            contents: [\n                {\n                    role: 'user',\n                    parts: [\n                        {\n                            text: 'Reply with just: OK'\n                        }\n                    ]\n                }\n            ]\n        })\n    });\n    const data = await res.json();\n    return Response.json({\n        ok: res.ok,\n        status: res.status,\n        keyPrefix: key.slice(0, 12) + '...',\n        testedModel: testModel,\n        availableModels,\n        data\n    });\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL2RlYnVnL3JvdXRlLnRzIiwibWFwcGluZ3MiOiI7Ozs7QUFBTyxlQUFlQTtJQUNsQixNQUFNQyxNQUFNQyxRQUFRQyxHQUFHLENBQUNDLGNBQWM7SUFDdEMsSUFBSSxDQUFDSCxLQUFLO1FBQ04sT0FBT0ksU0FBU0MsSUFBSSxDQUFDO1lBQUVDLElBQUk7WUFBT0MsT0FBTztRQUEwQztJQUN2RjtJQUVBLDRDQUE0QztJQUM1QyxNQUFNQyxVQUFVLENBQUMsd0RBQXdELEVBQUVSLEtBQUs7SUFDaEYsTUFBTVMsVUFBVSxNQUFNQyxNQUFNRjtJQUM1QixNQUFNRyxXQUFXLE1BQU1GLFFBQVFKLElBQUk7SUFFbkMsMkNBQTJDO0lBQzNDLE1BQU1PLGtCQUFrQkQsU0FBU0UsTUFBTSxFQUNqQ0MsT0FBTyxDQUFDQyxJQUFXQSxFQUFFQywwQkFBMEIsRUFBRUMsU0FBUyxxQkFDMURDLElBQUksQ0FBQ0gsSUFBV0EsRUFBRUksSUFBSSxLQUNyQixFQUFFO0lBRVQsNEJBQTRCO0lBQzVCLE1BQU1DLFlBQVlSLGVBQWUsQ0FBQyxFQUFFLEVBQUVTLFFBQVEsV0FBVyxPQUFPO0lBQ2hFLE1BQU1DLE1BQU0sQ0FBQyxvREFBb0QsRUFBRUYsVUFBVSxxQkFBcUIsRUFBRXBCLEtBQUs7SUFFekcsTUFBTXVCLE1BQU0sTUFBTWIsTUFBTVksS0FBSztRQUN6QkUsUUFBUTtRQUNSQyxTQUFTO1lBQUUsZ0JBQWdCO1FBQW1CO1FBQzlDQyxNQUFNQyxLQUFLQyxTQUFTLENBQUM7WUFDakJDLFVBQVU7Z0JBQUM7b0JBQUVDLE1BQU07b0JBQVFDLE9BQU87d0JBQUM7NEJBQUVDLE1BQU07d0JBQXNCO3FCQUFFO2dCQUFDO2FBQUU7UUFDMUU7SUFDSjtJQUVBLE1BQU1DLE9BQU8sTUFBTVYsSUFBSWxCLElBQUk7SUFDM0IsT0FBT0QsU0FBU0MsSUFBSSxDQUFDO1FBQ2pCQyxJQUFJaUIsSUFBSWpCLEVBQUU7UUFDVjRCLFFBQVFYLElBQUlXLE1BQU07UUFDbEJDLFdBQVduQyxJQUFJb0MsS0FBSyxDQUFDLEdBQUcsTUFBTTtRQUM5QkMsYUFBYWpCO1FBQ2JSO1FBQ0FxQjtJQUNKO0FBQ0oiLCJzb3VyY2VzIjpbIkM6XFxXZXBBcHBfMjAyNlxca25vd2xlZGdlLWh1YlxcYXBwXFxhcGlcXGRlYnVnXFxyb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgYXN5bmMgZnVuY3Rpb24gR0VUKCkge1xuICAgIGNvbnN0IGtleSA9IHByb2Nlc3MuZW52LkdFTUlOSV9BUElfS0VZO1xuICAgIGlmICgha2V5KSB7XG4gICAgICAgIHJldHVybiBSZXNwb25zZS5qc29uKHsgb2s6IGZhbHNlLCBlcnJvcjogJ0dFTUlOSV9BUElfS0VZIG5vdCBmb3VuZCBpbiBlbnZpcm9ubWVudCcgfSk7XG4gICAgfVxuXG4gICAgLy8gRmlyc3QsIGxpc3QgYXZhaWxhYmxlIG1vZGVscyBmb3IgdGhpcyBrZXlcbiAgICBjb25zdCBsaXN0VXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxL21vZGVscz9rZXk9JHtrZXl9YDtcbiAgICBjb25zdCBsaXN0UmVzID0gYXdhaXQgZmV0Y2gobGlzdFVybCk7XG4gICAgY29uc3QgbGlzdERhdGEgPSBhd2FpdCBsaXN0UmVzLmpzb24oKTtcblxuICAgIC8vIEZpbmQgbW9kZWxzIHRoYXQgc3VwcG9ydCBnZW5lcmF0ZUNvbnRlbnRcbiAgICBjb25zdCBhdmFpbGFibGVNb2RlbHMgPSBsaXN0RGF0YS5tb2RlbHNcbiAgICAgICAgPy5maWx0ZXIoKG06IGFueSkgPT4gbS5zdXBwb3J0ZWRHZW5lcmF0aW9uTWV0aG9kcz8uaW5jbHVkZXMoJ2dlbmVyYXRlQ29udGVudCcpKVxuICAgICAgICA/Lm1hcCgobTogYW55KSA9PiBtLm5hbWUpXG4gICAgICAgIHx8IFtdO1xuXG4gICAgLy8gVHJ5IGZpcnN0IGF2YWlsYWJsZSBtb2RlbFxuICAgIGNvbnN0IHRlc3RNb2RlbCA9IGF2YWlsYWJsZU1vZGVsc1swXT8ucmVwbGFjZSgnbW9kZWxzLycsICcnKSB8fCAnZ2VtaW5pLTEuNS1mbGFzaCc7XG4gICAgY29uc3QgdXJsID0gYGh0dHBzOi8vZ2VuZXJhdGl2ZWxhbmd1YWdlLmdvb2dsZWFwaXMuY29tL3YxL21vZGVscy8ke3Rlc3RNb2RlbH06Z2VuZXJhdGVDb250ZW50P2tleT0ke2tleX1gO1xuXG4gICAgY29uc3QgcmVzID0gYXdhaXQgZmV0Y2godXJsLCB7XG4gICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24vanNvbicgfSxcbiAgICAgICAgYm9keTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgICAgY29udGVudHM6IFt7IHJvbGU6ICd1c2VyJywgcGFydHM6IFt7IHRleHQ6ICdSZXBseSB3aXRoIGp1c3Q6IE9LJyB9XSB9XVxuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlcy5qc29uKCk7XG4gICAgcmV0dXJuIFJlc3BvbnNlLmpzb24oe1xuICAgICAgICBvazogcmVzLm9rLFxuICAgICAgICBzdGF0dXM6IHJlcy5zdGF0dXMsXG4gICAgICAgIGtleVByZWZpeDoga2V5LnNsaWNlKDAsIDEyKSArICcuLi4nLFxuICAgICAgICB0ZXN0ZWRNb2RlbDogdGVzdE1vZGVsLFxuICAgICAgICBhdmFpbGFibGVNb2RlbHMsXG4gICAgICAgIGRhdGFcbiAgICB9KTtcbn1cbiJdLCJuYW1lcyI6WyJHRVQiLCJrZXkiLCJwcm9jZXNzIiwiZW52IiwiR0VNSU5JX0FQSV9LRVkiLCJSZXNwb25zZSIsImpzb24iLCJvayIsImVycm9yIiwibGlzdFVybCIsImxpc3RSZXMiLCJmZXRjaCIsImxpc3REYXRhIiwiYXZhaWxhYmxlTW9kZWxzIiwibW9kZWxzIiwiZmlsdGVyIiwibSIsInN1cHBvcnRlZEdlbmVyYXRpb25NZXRob2RzIiwiaW5jbHVkZXMiLCJtYXAiLCJuYW1lIiwidGVzdE1vZGVsIiwicmVwbGFjZSIsInVybCIsInJlcyIsIm1ldGhvZCIsImhlYWRlcnMiLCJib2R5IiwiSlNPTiIsInN0cmluZ2lmeSIsImNvbnRlbnRzIiwicm9sZSIsInBhcnRzIiwidGV4dCIsImRhdGEiLCJzdGF0dXMiLCJrZXlQcmVmaXgiLCJzbGljZSIsInRlc3RlZE1vZGVsIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./app/api/debug/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdebug%2Froute&page=%2Fapi%2Fdebug%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdebug%2Froute.ts&appDir=C%3A%5CWepApp_2026%5Cknowledge-hub%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CWepApp_2026%5Cknowledge-hub&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdebug%2Froute&page=%2Fapi%2Fdebug%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdebug%2Froute.ts&appDir=C%3A%5CWepApp_2026%5Cknowledge-hub%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CWepApp_2026%5Cknowledge-hub&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*********************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_WepApp_2026_knowledge_hub_app_api_debug_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/debug/route.ts */ \"(rsc)/./app/api/debug/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/debug/route\",\n        pathname: \"/api/debug\",\n        filename: \"route\",\n        bundlePath: \"app/api/debug/route\"\n    },\n    resolvedPagePath: \"C:\\\\WepApp_2026\\\\knowledge-hub\\\\app\\\\api\\\\debug\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_WepApp_2026_knowledge_hub_app_api_debug_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZkZWJ1ZyUyRnJvdXRlJnBhZ2U9JTJGYXBpJTJGZGVidWclMkZyb3V0ZSZhcHBQYXRocz0mcGFnZVBhdGg9cHJpdmF0ZS1uZXh0LWFwcC1kaXIlMkZhcGklMkZkZWJ1ZyUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDV2VwQXBwXzIwMjYlNUNrbm93bGVkZ2UtaHViJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDV2VwQXBwXzIwMjYlNUNrbm93bGVkZ2UtaHViJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNTO0FBQ3RGO0FBQ0E7QUFDQTtBQUNBLHdCQUF3Qix5R0FBbUI7QUFDM0M7QUFDQSxjQUFjLGtFQUFTO0FBQ3ZCO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQ0E7QUFDQSxZQUFZO0FBQ1osQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBLFFBQVEsc0RBQXNEO0FBQzlEO0FBQ0EsV0FBVyw0RUFBVztBQUN0QjtBQUNBO0FBQ0EsS0FBSztBQUNMO0FBQzBGOztBQUUxRiIsInNvdXJjZXMiOlsiIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFwcFJvdXRlUm91dGVNb2R1bGUgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1tb2R1bGVzL2FwcC1yb3V0ZS9tb2R1bGUuY29tcGlsZWRcIjtcbmltcG9ydCB7IFJvdXRlS2luZCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLWtpbmRcIjtcbmltcG9ydCB7IHBhdGNoRmV0Y2ggYXMgX3BhdGNoRmV0Y2ggfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9saWIvcGF0Y2gtZmV0Y2hcIjtcbmltcG9ydCAqIGFzIHVzZXJsYW5kIGZyb20gXCJDOlxcXFxXZXBBcHBfMjAyNlxcXFxrbm93bGVkZ2UtaHViXFxcXGFwcFxcXFxhcGlcXFxcZGVidWdcXFxccm91dGUudHNcIjtcbi8vIFdlIGluamVjdCB0aGUgbmV4dENvbmZpZ091dHB1dCBoZXJlIHNvIHRoYXQgd2UgY2FuIHVzZSB0aGVtIGluIHRoZSByb3V0ZVxuLy8gbW9kdWxlLlxuY29uc3QgbmV4dENvbmZpZ091dHB1dCA9IFwiXCJcbmNvbnN0IHJvdXRlTW9kdWxlID0gbmV3IEFwcFJvdXRlUm91dGVNb2R1bGUoe1xuICAgIGRlZmluaXRpb246IHtcbiAgICAgICAga2luZDogUm91dGVLaW5kLkFQUF9ST1VURSxcbiAgICAgICAgcGFnZTogXCIvYXBpL2RlYnVnL3JvdXRlXCIsXG4gICAgICAgIHBhdGhuYW1lOiBcIi9hcGkvZGVidWdcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL2RlYnVnL3JvdXRlXCJcbiAgICB9LFxuICAgIHJlc29sdmVkUGFnZVBhdGg6IFwiQzpcXFxcV2VwQXBwXzIwMjZcXFxca25vd2xlZGdlLWh1YlxcXFxhcHBcXFxcYXBpXFxcXGRlYnVnXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdebug%2Froute&page=%2Fapi%2Fdebug%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdebug%2Froute.ts&appDir=C%3A%5CWepApp_2026%5Cknowledge-hub%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CWepApp_2026%5Cknowledge-hub&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next","vendor-chunks/@opentelemetry"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdebug%2Froute&page=%2Fapi%2Fdebug%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdebug%2Froute.ts&appDir=C%3A%5CWepApp_2026%5Cknowledge-hub%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CWepApp_2026%5Cknowledge-hub&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();