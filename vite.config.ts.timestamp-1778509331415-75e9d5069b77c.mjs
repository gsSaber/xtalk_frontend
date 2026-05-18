// vite.config.ts
import Uni from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/@uni-helper+plugin-uni@0.1.0_@dcloudio+vite-plugin-uni@3.0.0-4070520250711001_@vueuse+core@13_gz4lvtapvkubo4oavtpfpvysiu/node_modules/@uni-helper/plugin-uni/src/index.js";
import UniHelperComponents from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-components@0.2.3_rollup@4.52.4/node_modules/@uni-helper/vite-plugin-uni-components/dist/index.mjs";
import UniHelperLayouts from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-layouts@0.1.11_rollup@4.52.4/node_modules/@uni-helper/vite-plugin-uni-layouts/dist/index.mjs";
import UniHelperManifest from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-manifest@0.2.9_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0_/node_modules/@uni-helper/vite-plugin-uni-manifest/dist/index.mjs";
import UniHelperPages from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-pages@0.3.19_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0_/node_modules/@uni-helper/vite-plugin-uni-pages/dist/index.mjs";
import UniPlatformModifier from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/@uni-helper+vite-plugin-uni-platform-modifier@0.0.2/node_modules/@uni-helper/vite-plugin-uni-platform-modifier/dist/index.mjs";
import UnoCSS from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/unocss@66.0.0_postcss@8.5.6_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0__vue@3.4.21_typescript@5.8.3_/node_modules/unocss/dist/vite.mjs";
import AutoImport from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/unplugin-auto-import@19.3.0_@vueuse+core@13.9.0_vue@3.4.21_typescript@5.8.3__/node_modules/unplugin-auto-import/dist/vite.js";
import { defineConfig } from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terser@5.44.0/node_modules/vite/dist/node/index.js";
import vueDevTools from "file:///D:/workspace/vite-uview-template/node_modules/.pnpm/vite-plugin-vue-devtools@7.7.9_rollup@4.52.4_vite@5.4.20_@types+node@24.7.2_sass@1.63.2_terse_axtbgoaieebpeuv54jzef4fv2e/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
var vite_config_default = defineConfig({
  server: {
    port: 7634,
    proxy: {
      "/api": {
        target: "https://xtalk.sjtuxlance.com/",
        changeOrigin: true,
        secure: false
      },
      "/ws": {
        target: "https://xtalk.sjtuxlance.com/",
        changeOrigin: true,
        ws: true,
        secure: false
      }
    }
  },
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
  },
  build: {
    sourcemap: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFx3b3Jrc3BhY2VcXFxcdml0ZS11dmlldy10ZW1wbGF0ZVwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiRDpcXFxcd29ya3NwYWNlXFxcXHZpdGUtdXZpZXctdGVtcGxhdGVcXFxcdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0Q6L3dvcmtzcGFjZS92aXRlLXV2aWV3LXRlbXBsYXRlL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IFVuaSBmcm9tICdAdW5pLWhlbHBlci9wbHVnaW4tdW5pJ1xyXG5pbXBvcnQgVW5pSGVscGVyQ29tcG9uZW50cyBmcm9tICdAdW5pLWhlbHBlci92aXRlLXBsdWdpbi11bmktY29tcG9uZW50cydcclxuaW1wb3J0IFVuaUhlbHBlckxheW91dHMgZnJvbSAnQHVuaS1oZWxwZXIvdml0ZS1wbHVnaW4tdW5pLWxheW91dHMnXHJcbmltcG9ydCBVbmlIZWxwZXJNYW5pZmVzdCBmcm9tICdAdW5pLWhlbHBlci92aXRlLXBsdWdpbi11bmktbWFuaWZlc3QnXHJcbmltcG9ydCBVbmlIZWxwZXJQYWdlcyBmcm9tICdAdW5pLWhlbHBlci92aXRlLXBsdWdpbi11bmktcGFnZXMnXHJcbmltcG9ydCBVbmlQbGF0Zm9ybU1vZGlmaWVyIGZyb20gJ0B1bmktaGVscGVyL3ZpdGUtcGx1Z2luLXVuaS1wbGF0Zm9ybS1tb2RpZmllcidcclxuaW1wb3J0IFVub0NTUyBmcm9tICd1bm9jc3Mvdml0ZSdcclxuaW1wb3J0IEF1dG9JbXBvcnQgZnJvbSAndW5wbHVnaW4tYXV0by1pbXBvcnQvdml0ZSdcclxuaW1wb3J0IHsgY29weUZpbGUsIG1rZGlyIH0gZnJvbSAnbm9kZTpmcy9wcm9taXNlcydcclxuaW1wb3J0IHBhdGggZnJvbSAnbm9kZTpwYXRoJ1xyXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIHR5cGUgUGx1Z2luLCB0eXBlIFJlc29sdmVkQ29uZmlnIH0gZnJvbSAndml0ZSdcclxuaW1wb3J0IHZ1ZURldlRvb2xzIGZyb20gJ3ZpdGUtcGx1Z2luLXZ1ZS1kZXZ0b29scydcclxuXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgICAgIHBvcnQ6IDc2MzQsXHJcbiAgICAgICAgcHJveHk6IHtcclxuICAgICAgICAnL2FwaSc6IHtcclxuICAgICAgICAgIHRhcmdldDogJ2h0dHBzOi8veHRhbGsuc2p0dXhsYW5jZS5jb20vJyxcclxuICAgICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcclxuICAgICAgICAgIHNlY3VyZTogZmFsc2UsXHJcbiAgICAgICAgfSxcclxuICAgICAgICAnL3dzJzoge1xyXG4gICAgICAgICAgdGFyZ2V0OiAnaHR0cHM6Ly94dGFsay5zanR1eGxhbmNlLmNvbS8nLFxyXG4gICAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxyXG4gICAgICAgICAgd3M6IHRydWUsXHJcbiAgICAgICAgICBzZWN1cmU6IGZhbHNlLFxyXG4gICAgICAgIH1cclxuICAgICAgfSxcclxuICAgIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgLy8gaHR0cHM6Ly91bmktaGVscGVyLmpzLm9yZy92aXRlLXBsdWdpbi11bmktbWFuaWZlc3RcclxuICAgIFVuaUhlbHBlck1hbmlmZXN0KCksXHJcbiAgICAvLyBodHRwczovL3VuaS1oZWxwZXIuanMub3JnL3ZpdGUtcGx1Z2luLXVuaS1wYWdlc1xyXG4gICAgVW5pSGVscGVyUGFnZXMoe1xyXG4gICAgICBkdHM6ICdzcmMvdW5pLXBhZ2VzLmQudHMnLFxyXG4gICAgfSksXHJcbiAgICAvLyBodHRwczovL3VuaS1oZWxwZXIuanMub3JnL3ZpdGUtcGx1Z2luLXVuaS1sYXlvdXRzXHJcbiAgICBVbmlIZWxwZXJMYXlvdXRzKCksXHJcbiAgICAvLyBodHRwczovL3VuaS1oZWxwZXIuanMub3JnL3ZpdGUtcGx1Z2luLXVuaS1jb21wb25lbnRzXHJcbiAgICBVbmlIZWxwZXJDb21wb25lbnRzKHtcclxuICAgICAgZHRzOiAnc3JjL2NvbXBvbmVudHMuZC50cycsXHJcbiAgICAgIGRpcmVjdG9yeUFzTmFtZXNwYWNlOiB0cnVlLFxyXG4gICAgfSksXHJcbiAgICAvLyBodHRwczovL3VuaS1oZWxwZXIuanMub3JnL3BsdWdpbi11bmlcclxuICAgIFVuaSgpLFxyXG4gICAgVW5pUGxhdGZvcm1Nb2RpZmllcigpLFxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3VucGx1Z2luLWF1dG8taW1wb3J0XHJcbiAgICBBdXRvSW1wb3J0KHtcclxuICAgICAgaW1wb3J0czogWyd2dWUnLCAnQHZ1ZXVzZS9jb3JlJywgJ3VuaS1hcHAnXSxcclxuICAgICAgZHRzOiAnc3JjL2F1dG8taW1wb3J0cy5kLnRzJyxcclxuICAgICAgZGlyczogWydzcmMvY29tcG9zYWJsZXMnLCAnc3JjL3N0b3JlcycsICdzcmMvdXRpbHMnXSxcclxuICAgICAgdnVlVGVtcGxhdGU6IHRydWUsXHJcbiAgICB9KSxcclxuICAgIHZ1ZURldlRvb2xzKHtcclxuICAgICAgbGF1bmNoRWRpdG9yOiAnY29kZScsXHJcbiAgICAgIGluamVjdEluRGV2OiBmYWxzZSxcclxuICAgIH0pLFxyXG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL2FudGZ1L3Vub2Nzc1xyXG4gICAgLy8gc2VlIHVub2Nzcy5jb25maWcudHMgZm9yIGNvbmZpZ1xyXG4gICAgVW5vQ1NTKCksXHJcbiAgXSxcclxuICBjc3M6IHtcclxuICAgIHByZXByb2Nlc3Nvck9wdGlvbnM6IHtcclxuICAgICAgc2Nzczoge1xyXG4gICAgICAgIC8vIFx1NTNENlx1NkQ4OHNhc3NcdTVFOUZcdTVGMDNBUElcdTc2ODRcdTYyQTVcdThCNjZcclxuICAgICAgICBzaWxlbmNlRGVwcmVjYXRpb25zOiBbJ2xlZ2FjeS1qcy1hcGknLCAnY29sb3ItZnVuY3Rpb25zJywgJ2ltcG9ydCddLFxyXG4gICAgICB9LFxyXG4gICAgfSxcclxuICB9LFxyXG4gIGJ1aWxkOiB7XHJcbiAgICBzb3VyY2VtYXA6IHRydWUsXHJcbiAgfSxcclxufSlcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUF3UixPQUFPLFNBQVM7QUFDeFMsT0FBTyx5QkFBeUI7QUFDaEMsT0FBTyxzQkFBc0I7QUFDN0IsT0FBTyx1QkFBdUI7QUFDOUIsT0FBTyxvQkFBb0I7QUFDM0IsT0FBTyx5QkFBeUI7QUFDaEMsT0FBTyxZQUFZO0FBQ25CLE9BQU8sZ0JBQWdCO0FBR3ZCLFNBQVMsb0JBQXNEO0FBQy9ELE9BQU8saUJBQWlCO0FBSXhCLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNGLE1BQU07QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNQLFFBQVE7QUFBQSxRQUNOLFFBQVE7QUFBQSxRQUNSLGNBQWM7QUFBQSxRQUNkLFFBQVE7QUFBQSxNQUNWO0FBQUEsTUFDQSxPQUFPO0FBQUEsUUFDTCxRQUFRO0FBQUEsUUFDUixjQUFjO0FBQUEsUUFDZCxJQUFJO0FBQUEsUUFDSixRQUFRO0FBQUEsTUFDVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDRixTQUFTO0FBQUE7QUFBQSxJQUVQLGtCQUFrQjtBQUFBO0FBQUEsSUFFbEIsZUFBZTtBQUFBLE1BQ2IsS0FBSztBQUFBLElBQ1AsQ0FBQztBQUFBO0FBQUEsSUFFRCxpQkFBaUI7QUFBQTtBQUFBLElBRWpCLG9CQUFvQjtBQUFBLE1BQ2xCLEtBQUs7QUFBQSxNQUNMLHNCQUFzQjtBQUFBLElBQ3hCLENBQUM7QUFBQTtBQUFBLElBRUQsSUFBSTtBQUFBLElBQ0osb0JBQW9CO0FBQUE7QUFBQSxJQUVwQixXQUFXO0FBQUEsTUFDVCxTQUFTLENBQUMsT0FBTyxnQkFBZ0IsU0FBUztBQUFBLE1BQzFDLEtBQUs7QUFBQSxNQUNMLE1BQU0sQ0FBQyxtQkFBbUIsY0FBYyxXQUFXO0FBQUEsTUFDbkQsYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBLElBQ0QsWUFBWTtBQUFBLE1BQ1YsY0FBYztBQUFBLE1BQ2QsYUFBYTtBQUFBLElBQ2YsQ0FBQztBQUFBO0FBQUE7QUFBQSxJQUdELE9BQU87QUFBQSxFQUNUO0FBQUEsRUFDQSxLQUFLO0FBQUEsSUFDSCxxQkFBcUI7QUFBQSxNQUNuQixNQUFNO0FBQUE7QUFBQSxRQUVKLHFCQUFxQixDQUFDLGlCQUFpQixtQkFBbUIsUUFBUTtBQUFBLE1BQ3BFO0FBQUEsSUFDRjtBQUFBLEVBQ0Y7QUFBQSxFQUNBLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxFQUNiO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
