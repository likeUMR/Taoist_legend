### HTML → Cocos(Canvas) 低成本移植：一页纸（按你的需求）

适用：**固定屏幕大小**；大多静态 UI；少量滚动列表；一个战斗界面需要移动/拉伸动画。

---

### 选型（每个需求只选一种实现方式）

- **静态 UI/菜单/面板** → **DOM 子集**
- **滚动列表** → **DOM 子集（自实现滚动，不用原生滚动）**
- **战斗/移动/特效（高频刷新）** → **canvas**

---

### DOM 子集（用于静态 UI + 滚动列表）

- **要做**
  - 任何布局方式都行（absolute / flex / grid），但最终必须能导出固化的 `x,y,w,h`。
  - 节点只用：图片、纯色块、简单圆角/描边、基础文本。
  - 状态/动画只动：`transform/opacity`（移植到 Cocos 直接 tween）。

- **别做**
  - **不要用原生滚动**：`overflow:auto/scroll`、滚轮 `wheel`、滚动条样式。
  - **不要让文本驱动关键布局**：依赖自动换行/字体度量撑开容器并推动周围排版（移植后不稳定）。
  - 不要用：`input/textarea/contenteditable`、复杂 `filter/backdrop-filter`、复杂 `clip-path/mask-image`、`::before/::after` 生成内容。

---

### 滚动列表（DOM 子集的具体做法）

- **要做**：`viewport(overflow:hidden)` + `content(transform: translateY)` + pointer 拖拽（可加惯性/回弹）。
- **条目很多**：做“复用/虚拟列表”（只渲染可见条目），HTML 与 Cocos 同策略。

---

### canvas（用于战斗/移动/特效）

- **要做**
  - 把绘制封装成 `Renderer`（HTML 实现一份，Cocos 实现一份），业务逻辑不直接调用 Canvas API。
  - 每帧只更新“对象的数值状态”（位置/缩放/朝向），渲染层根据状态画。
  - 拉伸/奔跑等动画：用 `scaleX/scaleY/opacity` 补间。

- **别做**
  - 不要每帧读 DOM 布局（如 `getBoundingClientRect/offset*`）或用会触发重排的属性做动画。
