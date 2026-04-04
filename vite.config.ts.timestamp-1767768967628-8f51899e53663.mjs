// vite.config.ts
import Uni from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/@uni-helper+plugin-uni@0.1.0_@dcloudio+vite-plugin-uni@3.0.0-4070520250711001_@vueuse+core@13_gz4lvtapvkubo4oavtpfpvysiu/node_modules/@uni-helper/plugin-uni/src/index.js";
import UniHelperComponents from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-components@0.2.3_rollup@4.52.4/node_modules/@uni-helper/vite-plugin-uni-components/dist/index.mjs";
import UniHelperLayouts from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-layouts@0.1.11_rollup@4.52.4/node_modules/@uni-helper/vite-plugin-uni-layouts/dist/index.mjs";
import UniHelperManifest from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-manifest@0.2.9_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0_/node_modules/@uni-helper/vite-plugin-uni-manifest/dist/index.mjs";
import UniHelperPages from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-pages@0.3.19_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0_/node_modules/@uni-helper/vite-plugin-uni-pages/dist/index.mjs";
import UniPlatformModifier from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-platform-modifier@0.0.2/node_modules/@uni-helper/vite-plugin-uni-platform-modifier/dist/index.mjs";
import UnoCSS from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/unocss@66.0.0_postcss@8.5.6_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0__vue@3.4.21_typescript@5.8.3_/node_modules/unocss/dist/vite.mjs";
import AutoImport from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/unplugin-auto-import@19.3.0_@vueuse+core@13.9.0_vue@3.4.21_typescript@5.8.3__/node_modules/unplugin-auto-import/dist/vite.js";
import { defineConfig } from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0/node_modules/vite/dist/node/index.js";
import UniPolyfill from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/vite-plugin-uni-polyfill@0.1.0/node_modules/vite-plugin-uni-polyfill/dist/index.mjs";
import vueDevTools from "file:///D:/develop/company/MoBan/vite-uview-template/node_modules/.pnpm/vite-plugin-vue-devtools@7.7.9_rollup@4.52.4_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terse_axtbgoaieebpeuv54jzef4fv2e/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var vite_config_default = defineConfig({
  plugins: [
    // https://uni-helper.js.org/vite-plugin-uni-manifest
    UniHelperManifest(),
    // https://uni-helper.js.org/vite-plugin-uni-pages
    UniHelperPages({
      dts: "src/uni-pages.d.ts"
    }),
    // https://uni-helper.js.org/vite-plugin-uni-layouts
    UniHelperLayouts(),
    // https://uni-helper.js.org/vite-plugin-uni-components
    UniHelperComponents({
      dts: "src/components.d.ts",
      directoryAsNamespace: true
    }),
    // https://uni-helper.js.org/plugin-uni
    Uni(),
    UniPlatformModifier(),
    UniPolyfill(),
    // https://github.com/antfu/unplugin-auto-import
    AutoImport({
      imports: ["vue", "@vueuse/core", "uni-app"],
      dts: "src/auto-imports.d.ts",
      dirs: ["src/composables", "src/stores", "src/utils"],
      vueTemplate: true
    }),
    vueDevTools({
      launchEditor: "code",
      injectInDev: false
    }),
    // https://github.com/antfu/unocss
    // see unocss.config.ts for config
    UnoCSS()
  ],
  css: {
    preprocessorOptions: {
      scss: {
        // 取消sass废弃API的报警
        silenceDeprecations: ["legacy-js-api", "color-functions", "import"]
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxkZXZlbG9wXFxcXGNvbXBhbnlcXFxcTW9CYW5cXFxcdml0ZS11dmlldy10ZW1wbGF0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcZGV2ZWxvcFxcXFxjb21wYW55XFxcXE1vQmFuXFxcXHZpdGUtdXZpZXctdGVtcGxhdGVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L2RldmVsb3AvY29tcGFueS9Nb0Jhbi92aXRlLXV2aWV3LXRlbXBsYXRlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IFVuaSBmcm9tICdAdW5pLWhlbHBlci9wbHVnaW4tdW5pJ1xuaW1wb3J0IFVuaUhlbHBlckNvbXBvbmVudHMgZnJvbSAnQHVuaS1oZWxwZXIvdml0ZS1wbHVnaW4tdW5pLWNvbXBvbmVudHMnXG5pbXBvcnQgVW5pSGVscGVyTGF5b3V0cyBmcm9tICdAdW5pLWhlbHBlci92aXRlLXBsdWdpbi11bmktbGF5b3V0cydcbmltcG9ydCBVbmlIZWxwZXJNYW5pZmVzdCBmcm9tICdAdW5pLWhlbHBlci92aXRlLXBsdWdpbi11bmktbWFuaWZlc3QnXG5pbXBvcnQgVW5pSGVscGVyUGFnZXMgZnJvbSAnQHVuaS1oZWxwZXIvdml0ZS1wbHVnaW4tdW5pLXBhZ2VzJ1xuaW1wb3J0IFVuaVBsYXRmb3JtTW9kaWZpZXIgZnJvbSAnQHVuaS1oZWxwZXIvdml0ZS1wbHVnaW4tdW5pLXBsYXRmb3JtLW1vZGlmaWVyJ1xuaW1wb3J0IFVub0NTUyBmcm9tICd1bm9jc3Mvdml0ZSdcbmltcG9ydCBBdXRvSW1wb3J0IGZyb20gJ3VucGx1Z2luLWF1dG8taW1wb3J0L3ZpdGUnXG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IFVuaVBvbHlmaWxsIGZyb20gJ3ZpdGUtcGx1Z2luLXVuaS1wb2x5ZmlsbCdcbmltcG9ydCB2dWVEZXZUb29scyBmcm9tICd2aXRlLXBsdWdpbi12dWUtZGV2dG9vbHMnXG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgLy8gaHR0cHM6Ly91bmktaGVscGVyLmpzLm9yZy92aXRlLXBsdWdpbi11bmktbWFuaWZlc3RcbiAgICBVbmlIZWxwZXJNYW5pZmVzdCgpLFxuICAgIC8vIGh0dHBzOi8vdW5pLWhlbHBlci5qcy5vcmcvdml0ZS1wbHVnaW4tdW5pLXBhZ2VzXG4gICAgVW5pSGVscGVyUGFnZXMoe1xuICAgICAgZHRzOiAnc3JjL3VuaS1wYWdlcy5kLnRzJyxcbiAgICB9KSxcbiAgICAvLyBodHRwczovL3VuaS1oZWxwZXIuanMub3JnL3ZpdGUtcGx1Z2luLXVuaS1sYXlvdXRzXG4gICAgVW5pSGVscGVyTGF5b3V0cygpLFxuICAgIC8vIGh0dHBzOi8vdW5pLWhlbHBlci5qcy5vcmcvdml0ZS1wbHVnaW4tdW5pLWNvbXBvbmVudHNcbiAgICBVbmlIZWxwZXJDb21wb25lbnRzKHtcbiAgICAgIGR0czogJ3NyYy9jb21wb25lbnRzLmQudHMnLFxuICAgICAgZGlyZWN0b3J5QXNOYW1lc3BhY2U6IHRydWUsXG4gICAgfSksXG4gICAgLy8gaHR0cHM6Ly91bmktaGVscGVyLmpzLm9yZy9wbHVnaW4tdW5pXG4gICAgVW5pKCksXG4gICAgVW5pUGxhdGZvcm1Nb2RpZmllcigpLFxuICAgIFVuaVBvbHlmaWxsKCksXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3VucGx1Z2luLWF1dG8taW1wb3J0XG4gICAgQXV0b0ltcG9ydCh7XG4gICAgICBpbXBvcnRzOiBbJ3Z1ZScsICdAdnVldXNlL2NvcmUnLCAndW5pLWFwcCddLFxuICAgICAgZHRzOiAnc3JjL2F1dG8taW1wb3J0cy5kLnRzJyxcbiAgICAgIGRpcnM6IFsnc3JjL2NvbXBvc2FibGVzJywgJ3NyYy9zdG9yZXMnLCAnc3JjL3V0aWxzJ10sXG4gICAgICB2dWVUZW1wbGF0ZTogdHJ1ZSxcbiAgICB9KSxcbiAgICB2dWVEZXZUb29scyh7XG4gICAgICBsYXVuY2hFZGl0b3I6ICdjb2RlJyxcbiAgICAgIGluamVjdEluRGV2OiBmYWxzZSxcbiAgICB9KSxcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vYW50ZnUvdW5vY3NzXG4gICAgLy8gc2VlIHVub2Nzcy5jb25maWcudHMgZm9yIGNvbmZpZ1xuICAgIFVub0NTUygpLFxuICBdLFxuICBjc3M6IHtcbiAgICBwcmVwcm9jZXNzb3JPcHRpb25zOiB7XG4gICAgICBzY3NzOiB7XG4gICAgICAgIC8vIFx1NTNENlx1NkQ4OHNhc3NcdTVFOUZcdTVGMDNBUElcdTc2ODRcdTYyQTVcdThCNjZcbiAgICAgICAgc2lsZW5jZURlcHJlY2F0aW9uczogWydsZWdhY3ktanMtYXBpJywgJ2NvbG9yLWZ1bmN0aW9ucycsICdpbXBvcnQnXSxcbiAgICAgIH0sXG4gICAgfSxcbiAgfSxcbn0pXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQWdVLE9BQU8sU0FBUztBQUNoVixPQUFPLHlCQUF5QjtBQUNoQyxPQUFPLHNCQUFzQjtBQUM3QixPQUFPLHVCQUF1QjtBQUM5QixPQUFPLG9CQUFvQjtBQUMzQixPQUFPLHlCQUF5QjtBQUNoQyxPQUFPLFlBQVk7QUFDbkIsT0FBTyxnQkFBZ0I7QUFDdkIsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxpQkFBaUI7QUFDeEIsT0FBTyxpQkFBaUI7QUFHeEIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDMUIsU0FBUztBQUFBO0FBQUEsSUFFUCxrQkFBa0I7QUFBQTtBQUFBLElBRWxCLGVBQWU7QUFBQSxNQUNiLEtBQUs7QUFBQSxJQUNQLENBQUM7QUFBQTtBQUFBLElBRUQsaUJBQWlCO0FBQUE7QUFBQSxJQUVqQixvQkFBb0I7QUFBQSxNQUNsQixLQUFLO0FBQUEsTUFDTCxzQkFBc0I7QUFBQSxJQUN4QixDQUFDO0FBQUE7QUFBQSxJQUVELElBQUk7QUFBQSxJQUNKLG9CQUFvQjtBQUFBLElBQ3BCLFlBQVk7QUFBQTtBQUFBLElBRVosV0FBVztBQUFBLE1BQ1QsU0FBUyxDQUFDLE9BQU8sZ0JBQWdCLFNBQVM7QUFBQSxNQUMxQyxLQUFLO0FBQUEsTUFDTCxNQUFNLENBQUMsbUJBQW1CLGNBQWMsV0FBVztBQUFBLE1BQ25ELGFBQWE7QUFBQSxJQUNmLENBQUM7QUFBQSxJQUNELFlBQVk7QUFBQSxNQUNWLGNBQWM7QUFBQSxNQUNkLGFBQWE7QUFBQSxJQUNmLENBQUM7QUFBQTtBQUFBO0FBQUEsSUFHRCxPQUFPO0FBQUEsRUFDVDtBQUFBLEVBQ0EsS0FBSztBQUFBLElBQ0gscUJBQXFCO0FBQUEsTUFDbkIsTUFBTTtBQUFBO0FBQUEsUUFFSixxQkFBcUIsQ0FBQyxpQkFBaUIsbUJBQW1CLFFBQVE7QUFBQSxNQUNwRTtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
