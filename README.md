# Three.js AI 首页第三阶段

这是一个可独立运行的 Three.js 静态网页原型。第三阶段在第二阶段粒子银河基础上加入作品集标题 UI、火箭探索按钮和银河布局切换：

- 深蓝黑宇宙背景、背景星点和紫白金空间漂浮粒子
- 中心 `AI` 呼吸光圈点击后收缩，并触发同一批粒子的爆炸、回缩、再次展开
- 粒子完全展开后形成持续缓慢旋转的银河雏形
- 银河形成后自动平滑移到右侧，为左侧标题让位
- 左侧显示 `韩宝鹏的 / AIGC作品集 / 探索`
- `探索` 后接入依据给定 PDF 整理的小火箭按钮，按钮带蓝紫闪烁和悬停增强发光
- 点击火箭后标题向左淡出，银河在 3 秒内回到中心，左侧出现半透明返回箭头

## 文件用途

- `index.html`：页面入口、WebGL 画布和第三阶段 HTML 覆盖层。
- `styles.css`：宇宙底色、标题排版、火箭按钮、返回箭头和淡入淡出效果。
- `js/main.js`：Three.js 场景、AI 光圈、银河粒子状态机、银河位移动画和 UI 控制接口。
- `assets/rocket-source.pdf`：用户给定火箭 PDF 的项目内源素材备份。
- `assets/rocket-mark.svg`：从火箭 PDF 图形整理出的轻量按钮矢量素材。

## UI 层与 3D 层协同

- HTML/CSS 负责 `portfolio-title`、火箭按钮和返回箭头的可见状态与过渡效果。
- Three.js 负责粒子状态机、银河慢旋转和银河 x 方向平滑位移。
- `createOverlayUI()` 只把按钮点击转为命令。
- `showPortfolioTitle()`、`hidePortfolioTitle()` 管 UI。
- `moveGalaxyToRight()`、`moveGalaxyToCenter()` 和 `updateGalaxyPosition()` 管 3D 银河布局。

## 第三阶段新增接口

- `revealPortfolioScene()`：银河进入 `galaxyFormed` 后显示标题并把银河移到右侧。
- `getGalaxyRightOffset()`：根据屏幕比例控制右侧银河目标点。
- `updateGalaxyPosition()`：集中处理银河位移缓动。
- 第四阶段球形 UI 预留点已写在 `index.html` 的 `overlay-ui` 注释和 `js/main.js` 的 `revealPortfolioScene()` 注释中。

## 运行方式

该项目使用 ES Module，建议通过本地静态服务打开。

```powershell
python -m http.server 4173
```

然后在浏览器打开：

```text
http://localhost:4173
```

当前阶段仍不实现黑洞交互、5 个球形 UI 和球形 UI 的点击聚焦动画。
