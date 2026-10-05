import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import { InlineConfirm } from '../skills/bencho-frontend/assets/recipes/InlineConfirm';
import { ImageCompare } from '../skills/bencho-frontend/assets/recipes/ImageCompare';
import { FloatingField } from '../skills/bencho-frontend/assets/recipes/FloatingField';
import './preview.css';

function image(fill: string, accent: string) {
  return 'data:image/svg+xml,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480"><rect width="640" height="480" fill="${fill}"/><circle cx="360" cy="230" r="132" fill="${accent}"/><path d="M0 440L210 180L520 480H0" fill="#17181a" opacity=".14"/></svg>`);
}

function App() {
  const [fail, setFail] = useState(false);
  const [calls, setCalls] = useState(0);
  return <main>
    <header><p className="eyebrow">INDEPENDENT SKILL · v0.1.0</p><h1>让反馈跟得上操作。</h1><p className="intro">Bencho Frontend 的三个原创起点：状态清楚、动效克制，键盘和触屏都能完成任务。</p></header>
    <section className="cards" aria-label="原创组件预览">
      <article><div className="stage"><InlineConfirm label="Delete item" onConfirm={async () => { setCalls(n => n + 1); await new Promise(resolve => setTimeout(resolve, 700)); if (fail) throw new Error('Demo error'); }} /></div><div className="caption"><h2>01 · Inline confirmation</h2><p>先确认，再执行；请求失败仍可重试。</p><label className="demo-option"><input type="checkbox" checked={fail} onChange={e => setFail(e.currentTarget.checked)} /> 模拟请求失败</label><p className="counter">回调调用次数：<output>{calls}</output></p></div></article>
      <article><div className="stage"><ImageCompare before={image('#c7d5e8', '#52749b')} after={image('#e9d7be', '#b78351')} beforeAlt="蓝色几何示例图" afterAlt="暖色几何示例图" label="Compare images" /></div><div className="caption"><h2>02 · Image comparison</h2><p>拖动或用方向键调节。图像为原创 SVG。</p></div></article>
      <article><div className="stage"><FloatingField label="Email" type="email" autoComplete="email" /></div><div className="caption"><h2>03 · Floating label</h2><p>聚焦与输入都有反馈，标签始终可辨。</p></div></article>
    </section>
    <footer>独立维护，与 Bencho 无官方关联。这里的请求是本地演示，未连接业务后端。</footer>
  </main>;
}
createRoot(document.getElementById('root')!).render(<App />);
