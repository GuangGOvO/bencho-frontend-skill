# 交互模式选择

按用户的任务选择模式，再查 [来源索引](catalog.md)。下表是本包的设计建议，不是原站功能保证。

| 操作 | 适合的模式 | 状态与反馈 | 关键取舍 |
| --- | --- | --- | --- |
| 简单开关/收藏 | Like、Notify、Liquid toggle | 未选→已选，图形和文字一起变化 | 持久化失败时回滚；`aria-pressed` 或原生 checkbox |
| 高影响操作 | Inline confirm、Slide to confirm | 待确认→提交中→成功/失败 | 用操作名称确认；拖动提供键盘替代，不代替业务授权 |
| 比较两张图 | Image compare | 连续百分比，边界可达 | 原生 range 最易实现触控和键盘；图片需相同框架与尺寸 |
| 文本输入 | Label input、One-time code、Command bar | 空/聚焦/有值/错误/提交 | 标签始终可辨；验证码优先单输入保留粘贴与自动填充 |
| 多选/人员选择 | Assignees、Selection list | 未选→部分选择→提交 | 选择结果可读可撤销；选中状态不能仅靠颜色 |
| 范围与数值 | Time scrubber、Slosh slider、Wheel、Range dial | 跟手数值、释放吸附 | 先确定 min/max/step，文本可读；双手柄防止交叉 |
| 列表重排 | Reorder list | 抓取→经过邻项→释放 | 稳定 ID；提供上移/下移按钮，避免仅拖动 |
| 导航 | Icon bar、Magnifying dock、Canvas toolbar | 选中项、工具子选项记忆 | 活动页面用 `aria-current`；布局预留空间，避免推挤正文 |
| 内容展示 | Image accordion、Carousel | 局部展开、相邻对象避让 | 焦点触发与触屏等价；提供上一项/下一项，不强制自动轮播 |
| 操作菜单 | Create menu、Radial menu、Action node | 收起→展开→选择/关闭 | 焦点管理、Escape、点击外部关闭；区分 toolbar 与 menu 语义 |
| 进度与反馈 | Generate、Step player、Dynamic island | 开始→进行→完成/失败 | 业务进度来源真实；无进度时用不确定状态，不伪造 99% |
| 指针装饰 | Eye tracker、Particles、Tilt card、Glass bubble | 指针位移驱动局部形变 | 只作装饰；触屏与减少动效下静态呈现；控制 GPU/Canvas 成本 |
| 上传/录音 | Upload dropzone、Voice note | 输入→验证→处理中→结果 | 接入真实 API 前标明演示；失败、权限拒绝、超限都有出口 |

## 连续形态与反馈节奏

“收起控件变成展开控件”优先通过同一个容器、锚点和协调尺寸过渡表现；内容进出用短淡入/位移，不用整页突变。多处共享状态只保留一个权威值，动效只消费它。

建议起点：按压反馈 80–140ms，状态转换 160–240ms，较大展开 240–360ms，轻微按压 scale 0.97–0.99。它们是可调起点，**不是从原站测出的全局数值**。拖动期间不应用这些过渡；每帧跟随输入，释放后另设 settling。

液态融合只适用于少量装饰对象。SVG filter 或大范围 blur 可能影响文本清晰度和帧率；把文本置于未滤镜化的层上，以圆角/交叠作为低成本替代。

## 三个原创起点

- **InlineConfirm**：两步确认、真实异步回调、忙碌防重复、失败重试、Escape 取消，成功后显式重置。
- **ImageCompare**：原生 range 驱动 clip-path；保持键盘、触控与读屏数值；由调用方提供图片。
- **FloatingField**：原生 input 与稳定 label，不用 placeholder 充当标签。

这些例子提供小范围基础，不是原站源码副本。业务需要撤销时，先实现实际 undo 数据路径，再加入“撤销”按钮；不要用视觉恢复伪装业务恢复。
