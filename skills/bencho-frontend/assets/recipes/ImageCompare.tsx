import { useId, useState } from 'react';
import type { CSSProperties } from 'react';
import './interaction.css';

type Props = { before: string; after: string; beforeAlt: string; afterAlt: string; label?: string };

/** Native range supplies keyboard and touch input; caller owns the image assets. */
export function ImageCompare({ before, after, beforeAlt, afterAlt, label = 'Image comparison' }: Props) {
  const [value, setValue] = useState(50);
  const id = useId();
  return <div className="bf-compare" style={{ '--bf-split': `${value}%` } as CSSProperties}>
    <div className="bf-compare-stage">
      <img src={after} alt={afterAlt} draggable={false} />
      <img className="bf-compare-before" src={before} alt={beforeAlt} draggable={false} />
      <span className="bf-compare-divider" aria-hidden="true" />
      <span className="bf-image-label bf-before-label" aria-hidden="true">Before</span>
      <span className="bf-image-label bf-after-label" aria-hidden="true">After</span>
    </div>
    <label className="bf-range-label" htmlFor={id}>{label} <output htmlFor={id}>{value}% before</output></label>
    <input id={id} className="bf-range" type="range" min={0} max={100} step={1} value={value} aria-valuetext={`${value}% before image, ${100 - value}% after image`} onChange={event => setValue(Number(event.currentTarget.value))} />
  </div>;
}
