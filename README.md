# vite-uview-template

基于 `uni-app` 的 `vite` + `vue3` + `tailwindcss` + `uview` + `husky` + `eslint` + `pinia` 模板

## 特性

- ⚡️ [Vue 3](https://github.com/vuejs/core), [Vite](https://github.com/vitejs/vite), [pnpm](https://pnpm.io/) - 快 & 稳定

- 🎨 [TailwindCSS](https://tailwindcss.com/) - 世界上最流行，生态最好的原子化CSS框架

- 😃 [集成 Iconify](https://github.com/egoist/tailwindcss-icons) - [icones.js.org](https://icones.js.org/) 中的所有图标都为你所用

- 📥 [API 自动加载](https://github.com/antfu/unplugin-auto-import) - 直接使用 Composition API 无需引入

- 🧬 [uni-app 条件编译样式](https://weapp-tw.icebreaker.top/docs/quick-start/uni-app-css-macro) - 帮助你在多端更灵活的使用 `TailwindCSS`

- 🦾 [ESLint](https://eslint.org/) & [Stylelint](https://stylelint.io/) - 样式统一的校验与格式化规则，保证你的代码风格和质量

## 快速开始

> 请使用 `Node >=20(LTS)` 运行此项目!
>
> 另外谨慎升级 `package.json` 中锁定的 `pinia`/`vue`/`@vue/*` 相关包的版本，新版本可能 `uni-app` 没有兼容，造成一些奇怪的 bug

### vscode

使用 `vscode` 的开发者，请先安装 [Tailwind CSS IntelliSense](https://marketplace.visualstudio.com/items?itemName=bradlc.vscode-tailwindcss) 智能提示与感应插件

其他 IDE 请参考: <https://tw.icebreaker.top/docs/quick-start/intelliSense>

### weapp-ide-cli

本项目已经集成 `weapp-ide-cli` 可以通过 `cli` 对 `ide` 进行额外操作

- `pnpm open:dev` 打开微信开发者工具，引入 `dist/dev/mp-weixin`
- `pnpm open:build` 打开微信开发者工具，引入 `dist/build/mp-weixin`

[详细信息](https://www.npmjs.com/package/weapp-ide-cli)

### 更换 Appid

把 `src/manifest.json` 中的 `appid`, 更换为你自己的 `appid`, 比如 `uni-app` / `mp-weixin` 平台。

## 升级依赖

- `pnpm up:pkg` 升级除了 `uni-app` 相关的其他依赖
- `pnpm up:uniapp` 升级 `uni-app` 相关的依赖

推荐先使用 `pnpm up:pkg` 升级, 再使用 `pnpm up:uniapp` 进行升级，因为 `pnpm up:uniapp` 很有可能会进行版本的降级已达到和 `uni-app` 版本匹配的效果

## 单位转换

- `rem` -> `rpx` (默认开启, 见 `vite.config.js` 中 `uvtw` 插件的 `rem2rpx` 选项)
- `px` -> `rpx` (默认不开启，可在 `postcss.config.js` 中引入 `postcss-pxtransform` 开启配置)

## Tips

- 升级 `uni-app` 依赖的方式为 `npx @dcloudio/uvm` 后，选择对应的 `Package Manager` 即可。而升级其他包的方式，可以使用 `pnpm up -Li`，这个是 `pnpm` 自带的方式。
- 使用 `vscode` 记得安装官方插件 `eslint`,`stylelint`,`tailwindcss`, 已在 `.vscode/extensions.json` 中设置推荐
