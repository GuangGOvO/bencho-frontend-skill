import { useId } from 'react';
import type { InputHTMLAttributes } from 'react';
import './interaction.css';

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'placeholder' | 'id'> & { label: string; error?: string; id?: string };

export function FloatingField({ label, error, id: explicitId, ...props }: Props) {
  const generatedId = useId();
  const id = explicitId ?? generatedId;
  const description = [props['aria-describedby'], error ? `${id}-error` : undefined].filter(Boolean).join(' ') || undefined;
  return <div className="bf-field-group">
    <div className="bf-field" data-error={Boolean(error)}>
      <input {...props} id={id} placeholder=" " aria-invalid={error ? true : props['aria-invalid']} aria-describedby={description} />
      <label htmlFor={id}>{label}</label>
    </div>
    {error && <p className="bf-field-error" id={`${id}-error`}>{error}</p>}
  </div>;
}
