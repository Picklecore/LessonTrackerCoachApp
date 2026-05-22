import React, { useRef, useState } from 'react';
import { Icon } from './icons.jsx';

export default function StudentDetail({
  s,
  data,
  onBack,
  onOpenLog,
  onOpenPayment,
  onArchive,
  onUpdate,
  onDeleteSession,
  onDeletePayment,
}) {
  const sessions = data.sessions[s.id] || [];
  const payments = data.payments[s.id] || [];
  const [tab, setTab] = useState('sessions');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [openSessionId, setOpenSessionId] = useState(null);
  const [openPaymentId, setOpenPaymentId] = useState(null);
  const [dragX, setDragX] = useState(0);
  const touchStart = useRef(null);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };
  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    if (touchStart.current.x < 40 && Math.abs(dx) > Math.abs(dy) && dx > 0) {
      setDragX(Math.min(dx, 240));
    }
  };
  const onTouchEnd = () => {
    if (touchStart.current && touchStart.current.x < 40 && dragX > 90) {
      onBack();
    }
    setDragX(0);
    touchStart.current = null;
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        transform: dragX > 0 ? `translateX(${dragX}px)` : '',
        transition: dragX > 0 ? 'none' : 'transform 0.18s ease',
        background: 'var(--paper)',
        boxShadow: dragX > 0 ? '-12px 0 24px rgba(20,36,27,0.18)' : 'none',
        overflowY: 'auto',
      }}
    >
      <div className="detail-hero">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button className="back" onClick={onBack}>
            <Icon.Back />
          </button>
          <button
            className="back"
            onClick={() => setConfirmRemove(true)}
            aria-label="Archive student"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3h18v5H3z" />
              <path d="M5 8v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8" />
              <path d="M10 12h4" />
            </svg>
          </button>
        </div>
        <h1 className="detail-name serif">{s.name}</h1>
        <div className="detail-sub">
          <span>Started {s.joined}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>${s.valuePer}/hr</span>
        </div>
      </div>

      <div className="pack-card">
        <h3>{s.pack}</h3>
        <div className="pack-big">
          <div className="pack-big-num">
            <span className="num serif">{s.remaining}</span>
            {s.size > 1 && <span className="of serif">of {s.size}</span>}
          </div>
          <span className="label">
            hours
            <br />
            remaining
          </span>
        </div>
        {s.size > 1 && (
          <div
            className="pack-dots"
            style={{ gridTemplateColumns: `repeat(${Math.min(s.size, 20)}, 1fr)` }}
          >
            {Array.from({ length: Math.min(s.size, 20) }).map((_, i) => {
              const stepsPerCell = s.size / Math.min(s.size, 20);
              const filledHere =
                Math.max(0, Math.min(stepsPerCell, s.remaining - i * stepsPerCell)) / stepsPerCell;
              return (
                <div key={i} className="d">
                  <div className="d-fill" style={{ width: `${filledHere * 100}%` }} />
                </div>
              );
            })}
          </div>
        )}
        <div className="pack-foot">
          <span>
            Value <span className="val">${Math.round(s.remaining * s.valuePer)} left</span>
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, padding: '14px 16px 0' }}>
        <button className="btn primary" style={{ flex: 1 }} onClick={onOpenLog}>
          <Icon.Plus style={{ width: 16, height: 16 }} /> Log lesson
        </button>
        <button className="btn lemon" style={{ flex: 1 }} onClick={onOpenPayment}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          Log payment
        </button>
      </div>

      <div
        style={{
          padding: '18px 16px 0',
          display: 'flex',
          gap: 4,
          borderBottom: '1px solid var(--line)',
        }}
      >
        {[
          ['sessions', 'Sessions'],
          ['payments', 'Payments'],
          ['notes', 'Notes'],
        ].map(([k, l]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '10px 12px',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              color: tab === k ? 'var(--ink)' : 'var(--ink-3)',
              borderBottom:
                tab === k ? '2px solid var(--court-green-soft)' : '2px solid transparent',
              marginBottom: -1,
            }}
          >
            {l}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div className="card" style={{ margin: '12px 16px 0' }}>
          {sessions.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
              No sessions logged yet.
            </div>
          )}
          {sessions.map((l) => (
            <div
              className={'card-row session-row' + (openSessionId === l.id ? ' open' : '')}
              key={l.id}
              onClick={() => setOpenSessionId(openSessionId === l.id ? null : l.id)}
            >
              <div className="date">
                <div className="m">{l.date.split(' ')[0]}</div>
                <div className="d serif">{l.date.split(' ')[1]}</div>
              </div>
              <div className="meta">
                <div className="ttl">{l.focus}</div>
                <div className="sub">
                  {l.dow} · {l.dur} min
                </div>
                {l.note && <div className="note">{l.note}</div>}
              </div>
              {openSessionId === l.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteSession && onDeleteSession(s.id, l.id);
                    setOpenSessionId(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'var(--coral)',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                  Delete
                </button>
              ) : (
                <div className="amt">${l.amt}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'payments' && (
        <div className="card" style={{ margin: '12px 16px 0' }}>
          {payments.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>
              No payments yet.
            </div>
          )}
          {payments.map((p) => (
            <div
              className={'card-row session-row' + (openPaymentId === p.id ? ' open' : '')}
              key={p.id}
              onClick={() => setOpenPaymentId(openPaymentId === p.id ? null : p.id)}
            >
              <div className="date">
                <div className="m">{p.date.split(' ')[0]}</div>
                <div className="d serif">{p.date.split(' ')[1]}</div>
              </div>
              <div className="meta">
                <div className="ttl">{p.label}</div>
                <div className="sub">Paid via {p.method}</div>
              </div>
              {openPaymentId === p.id ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePayment && onDeletePayment(s.id, p.id);
                    setOpenPaymentId(null);
                  }}
                  style={{
                    border: 'none',
                    background: 'var(--coral)',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                  </svg>
                  Delete
                </button>
              ) : (
                <div className="amt pos">+${p.amt}</div>
              )}
            </div>
          ))}
          <div className="card-row" style={{ background: 'var(--court-line)' }}>
            <div
              style={{
                flex: 1,
                fontSize: 12,
                color: 'var(--ink-3)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              Lifetime
            </div>
            <div className="amt serif" style={{ fontSize: 18 }}>
              ${payments.reduce((a, p) => a + p.amt, 0)}
            </div>
          </div>
        </div>
      )}

      {tab === 'notes' && (
        <div className="card" style={{ margin: '12px 16px 0', padding: '18px' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              marginBottom: 8,
            }}
          >
            Coaching notes
          </div>
          <textarea
            className="inline-edit"
            defaultValue={s.lastNote || ''}
            placeholder="Add a coaching note…"
            onBlur={(e) => onUpdate && onUpdate(s.id, { lastNote: e.target.value })}
          />
          <div
            style={{
              marginTop: 16,
              padding: 14,
              borderRadius: 12,
              background: 'var(--court-line)',
            }}
          >
            <strong
              style={{
                display: 'block',
                marginBottom: 6,
                fontSize: 13,
                color: 'var(--ink)',
              }}
            >
              Current focus
            </strong>
            <textarea
              className="inline-edit on-court"
              defaultValue={s.focusNote || ''}
              placeholder="What are you working on this month?"
              onBlur={(e) => onUpdate && onUpdate(s.id, { focusNote: e.target.value })}
            />
          </div>
        </div>
      )}

      <div style={{ height: 80 }} />

      {confirmRemove && (
        <div className="modal-back" onClick={() => setConfirmRemove(false)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              margin: 'auto',
              background: 'var(--paper-2)',
              borderRadius: 22,
              padding: 22,
              width: '82%',
              maxWidth: 340,
              boxShadow: '0 24px 50px rgba(20,36,27,0.35)',
            }}
          >
            <div style={{ fontSize: 20, marginBottom: 8 }} className="serif">
              Archive {s.name}?
            </div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--ink-3)',
                lineHeight: 1.5,
                marginBottom: 18,
              }}
            >
              {s.name} will move to the Completed list. Their session history and payments stay on
              file. You can un-archive any time by logging a new lesson.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn ghost"
                style={{ flex: 1 }}
                onClick={() => setConfirmRemove(false)}
              >
                Cancel
              </button>
              <button
                className="btn primary"
                style={{ flex: 1 }}
                onClick={() => {
                  setConfirmRemove(false);
                  onArchive && onArchive(s.id);
                }}
              >
                Archive
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
