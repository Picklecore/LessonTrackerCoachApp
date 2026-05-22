import React from 'react';

const TWEAKS_STYLE = `
  .twk-panel{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:280px;
    max-height:calc(100vh - 32px);display:flex;flex-direction:column;
    background:rgba(250,249,247,.78);color:#29261b;
    -webkit-backdrop-filter:blur(24px) saturate(160%);backdrop-filter:blur(24px) saturate(160%);
    border:.5px solid rgba(255,255,255,.6);border-radius:14px;
    box-shadow:0 1px 0 rgba(255,255,255,.5) inset,0 12px 40px rgba(0,0,0,.18);
    font:11.5px/1.4 ui-sans-serif,system-ui,-apple-system,sans-serif;overflow:hidden}
  .twk-hd{display:flex;align-items:center;justify-content:space-between;
    padding:10px 8px 10px 14px;cursor:move;user-select:none}
  .twk-hd b{font-size:12px;font-weight:600;letter-spacing:.01em}
  .twk-x{appearance:none;border:0;background:transparent;color:rgba(41,38,27,.55);
    width:22px;height:22px;border-radius:6px;cursor:default;font-size:13px;line-height:1}
  .twk-x:hover{background:rgba(0,0,0,.06);color:#29261b}
  .twk-body{padding:2px 14px 14px;display:flex;flex-direction:column;gap:10px;
    overflow-y:auto;overflow-x:hidden;min-height:0}
  .twk-row{display:flex;flex-direction:column;gap:5px}
  .twk-row-h{flex-direction:row;align-items:center;justify-content:space-between;gap:10px}
  .twk-lbl{display:flex;justify-content:space-between;align-items:baseline;color:rgba(41,38,27,.72)}
  .twk-lbl>span:first-child{font-weight:500}
  .twk-sect{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;
    color:rgba(41,38,27,.45);padding:10px 0 0}
  .twk-sect:first-child{padding-top:0}
  .twk-seg{position:relative;display:flex;padding:2px;border-radius:8px;background:rgba(0,0,0,.06);user-select:none}
  .twk-seg-thumb{position:absolute;top:2px;bottom:2px;border-radius:6px;background:rgba(255,255,255,.9);
    box-shadow:0 1px 2px rgba(0,0,0,.12);transition:left .15s cubic-bezier(.3,.7,.4,1),width .15s}
  .twk-seg button{appearance:none;position:relative;z-index:1;flex:1;border:0;background:transparent;
    color:inherit;font:inherit;font-weight:500;min-height:22px;border-radius:6px;cursor:default;
    padding:4px 6px;line-height:1.2;overflow-wrap:anywhere}
  .twk-chips{display:flex;gap:6px}
  .twk-chip{position:relative;appearance:none;flex:1;min-width:0;height:46px;padding:0;border:0;
    border-radius:6px;overflow:hidden;cursor:default;
    box-shadow:0 0 0 .5px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.06);
    transition:transform .12s cubic-bezier(.3,.7,.4,1),box-shadow .12s}
  .twk-chip:hover{transform:translateY(-1px);box-shadow:0 0 0 .5px rgba(0,0,0,.18),0 4px 10px rgba(0,0,0,.12)}
  .twk-chip[data-on="1"]{box-shadow:0 0 0 1.5px rgba(0,0,0,.85),0 2px 6px rgba(0,0,0,.15)}
  .twk-chip svg{position:absolute;top:6px;left:6px;width:13px;height:13px;
    filter:drop-shadow(0 1px 1px rgba(0,0,0,.3))}
  .twk-fab{position:fixed;right:16px;bottom:16px;z-index:2147483646;width:36px;height:36px;
    border-radius:50%;border:0;background:rgba(20,36,27,.78);color:#fff;font-size:16px;
    cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);
    -webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px)}
`;

export function useTweaks(defaults, storageKey) {
  const [values, setValues] = React.useState(() => {
    if (!storageKey || typeof window === 'undefined') return defaults;
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw == null) return defaults;
      return { ...defaults, ...JSON.parse(raw) };
    } catch {
      return defaults;
    }
  });
  React.useEffect(() => {
    if (!storageKey || typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(values));
    } catch {
      // ignore
    }
  }, [storageKey, values]);
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = typeof keyOrEdits === 'object' && keyOrEdits !== null
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
  }, []);
  return [values, setTweak];
}

export function TweaksPanel({ title = 'Tweaks', children }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <style>{TWEAKS_STYLE}</style>
      {!open && (
        <button className="twk-fab" aria-label="Open tweaks" onClick={() => setOpen(true)}>⚙</button>
      )}
      {open && (
        <div className="twk-panel">
          <div className="twk-hd">
            <b>{title}</b>
            <button className="twk-x" aria-label="Close tweaks" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="twk-body">{children}</div>
        </div>
      )}
    </>
  );
}

export function TweakSection({ label, children }) {
  return (
    <>
      <div className="twk-sect">{label}</div>
      {children}
    </>
  );
}

function TweakRow({ label, value, children }) {
  return (
    <div className="twk-row">
      <div className="twk-lbl">
        <span>{label}</span>
        {value != null && <span className="twk-val">{value}</span>}
      </div>
      {children}
    </div>
  );
}

export function TweakRadio({ label, value, options, onChange }) {
  const opts = options.map((o) => (typeof o === 'object' ? o : { value: o, label: o }));
  const idx = Math.max(0, opts.findIndex((o) => o.value === value));
  const n = opts.length;
  return (
    <TweakRow label={label}>
      <div role="radiogroup" className="twk-seg">
        <div className="twk-seg-thumb"
             style={{ left: `calc(2px + ${idx} * (100% - 4px) / ${n})`,
                      width: `calc((100% - 4px) / ${n})` }} />
        {opts.map((o) => (
          <button key={o.value} type="button" role="radio" aria-checked={o.value === value}
                  onClick={() => onChange(o.value)}>
            {o.label}
          </button>
        ))}
      </div>
    </TweakRow>
  );
}

function isLight(hex) {
  const h = String(hex).replace('#', '');
  const x = h.length === 3 ? h.replace(/./g, (c) => c + c) : h.padEnd(6, '0');
  const n = parseInt(x.slice(0, 6), 16);
  if (Number.isNaN(n)) return true;
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return r * 299 + g * 587 + b * 114 > 148000;
}

const Check = ({ light }) => (
  <svg viewBox="0 0 14 14" aria-hidden="true">
    <path d="M3 7.2 5.8 10 11 4.2" fill="none" strokeWidth="2.2"
          strokeLinecap="round" strokeLinejoin="round"
          stroke={light ? 'rgba(0,0,0,.78)' : '#fff'} />
  </svg>
);

export function TweakColor({ label, value, options, onChange }) {
  const cur = String(value).toLowerCase();
  return (
    <TweakRow label={label}>
      <div className="twk-chips" role="radiogroup">
        {options.map((o, i) => {
          const on = String(o).toLowerCase() === cur;
          return (
            <button key={i} type="button" className="twk-chip" role="radio"
                    aria-checked={on} data-on={on ? '1' : '0'}
                    aria-label={o} title={o}
                    style={{ background: o }}
                    onClick={() => onChange(o)}>
              {on && <Check light={isLight(o)} />}
            </button>
          );
        })}
      </div>
    </TweakRow>
  );
}
