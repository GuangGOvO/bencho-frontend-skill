import { useEffect, useId, useRef, useState } from 'react';
import './interaction.css';

type State = 'idle' | 'armed' | 'busy' | 'success' | 'error';
type Props = { label?: string; confirmLabel?: string; onConfirm: () => Promise<void>; disabled?: boolean };

/** Original two-step confirmation. The caller supplies the real business action. */
export function InlineConfirm({ label = 'Delete item', confirmLabel = 'Confirm deletion', onConfirm, disabled = false }: Props) {
  const [state, setState] = useState<State>('idle');
  const statusId = useId();
  const primary = useRef<HTMLButtonElement>(null);
  const mounted = useRef(true);
  const pending = useRef(false);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);

  function cancel() {
    if (pending.current) return;
    setState('idle');
    primary.current?.focus();
  }

  async function activate() {
    if (disabled || pending.current || state === 'success') return;
    if (state === 'idle') { setState('armed'); return; }
    pending.current = true;
    setState('busy');
    try {
      await onConfirm();
      if (mounted.current) setState('success');
    } catch {
      if (mounted.current) setState('error');
    } finally {
      pending.current = false;
    }
  }

  const text = state === 'idle' ? label : state === 'armed' ? confirmLabel : state === 'busy' ? 'Working…' : state === 'error' ? 'Retry confirmation' : 'Done';
  return <div className="bf-confirm" data-state={state} onKeyDown={event => {
    if (event.key === 'Escape' && (state === 'armed' || state === 'error')) { event.preventDefault(); cancel(); }
  }}>
    <div className="bf-confirm-actions">
      <button ref={primary} className="bf-button" type="button" disabled={disabled || state === 'busy' || state === 'success'} aria-describedby={statusId} onClick={() => { void activate(); }}>{text}</button>
      {(state === 'armed' || state === 'error') && <button className="bf-button bf-secondary" type="button" onClick={cancel}>Cancel</button>}
      {state === 'success' && <button className="bf-button bf-secondary" type="button" onClick={cancel}>Reset example</button>}
    </div>
    <span id={statusId} className="bf-status" role="status" aria-live="polite">{state === 'armed' ? 'Confirm this action or cancel.' : state === 'busy' ? 'Request in progress.' : state === 'error' ? 'The action failed. Retry or cancel.' : state === 'success' ? 'Action completed.' : ''}</span>
  </div>;
}
