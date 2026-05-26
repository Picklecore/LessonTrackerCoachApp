import React, { useEffect, useRef, useState } from 'react';
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
  onSwipeProgress,
}) {
  const sessions = data.sessions[s.id] || [];
  const payments = data.payments[s.id] || [];
  const [tab, setTab] = useState('sessions');
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [openSessionId, setOpenSessionId] = useState(null);
  const [openPaymentId, setOpenPaymentId] = useState(null);
  // Swipe-back state. `dragX` follows the finger 1:1 while active;
  // `snap` flips on to animate to the next resting position on release.
  const [dragX, setDragX] = useState(0);
  const [snap, setSnap] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const touchStart = useRef(null);
  const tracking = useRef(false);
  const lastMove = useRef(null);
  const containerRef = useRef(null);

  const screenWidth = () => (containerRef.current ? containerRef.current.offsetWidth : 402);

  const onTouchStart = (e) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, time: Date.now() };
    tracking.current = false;
    lastMove.current = { x: t.clientX, time: Date.now() };
    setSnap(false);
  };
  const onTouchMove = (e) => {
    if (!touchStart.current) return;
    const t = e.touches[0];
    handleMove(t.clientX, t.clientY, e);
  };
  const onTouchEnd = () => handleEnd();

  const onMouseDown = (e) => {
    if (e.clientX > 40) return;
    touchStart.current = { x: e.clientX, y: e.clientY, time: Date.now() };
    tracking.current = false;
    lastMove.current = { x: e.clientX, time: Date.now() };
    setSnap(false);
    e.preventDefault();
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!touchStart.current) return;
      handleMove(e.clientX, e.clientY, e);
    };
    const onUp = () => {
      if (touchStart.current) handleEnd();
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [dragX]);

  function handleMove(clientX, clientY, ev) {
    const dx = clientX - touchStart.current.x;
    const dy = clientY - touchStart.current.y;
    if (!tracking.current) {
      if (touchStart.current.x < 40 && dx > 4 && Math.abs(dx) > Math.abs(dy)) {
        tracking.current = true;
      } else if (Math.abs(dy) > 10 || touchStart.current.x >= 40) {
        touchStart.current = null;
        return;
      }
    }
    if (tracking.current) {
      const w = screenWidth();
      const x = dx <= w ? dx : w + Math.pow(dx - w, 0.7);
      const clamped = Math.max(0, x);
      setDragX(clamped);
      onSwipeProgress && onSwipeProgress(Math.min(1, clamped / w));
      lastMove.current = { x: clientX, time: Date.now() };
      if (ev && ev.preventDefault) ev.preventDefault();
    }
  }

  function handleEnd() {
    if (!tracking.current) {
      touchStart.current = null;
      return;
    }
    const w = screenWidth();
    const now = Date.now();
    const vx = lastMove.current
      ? (lastMove.current.x - touchStart.current.x) / Math.max(1, now - touchStart.current.time)
      : 0;
    const shouldDismiss = dragX > w * 0.4 || vx > 0.5;
    setSnap(true);
    if (shouldDismiss) {
      setDismissing(true);
      setDragX(w);
      onSwipeProgress && onSwipeProgress(1);
      setTimeout(() => {
        onSwipeProgress && onSwipeProgress(0);
        onBack();
      }, 280);
    } else {
      setDragX(0);
      onSwipeProgress && onSwipeProgress(0);
    }
    tracking.current = false;
    touchStart.current = null;
  }

  return (
    <div
      ref={containerRef}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
      onMouseDown={onMouseDown}
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        height: '100%',
        transform: `translate3d(${dragX}px, 0, 0)`,
        transition: snap
          ? dismissing
            ? 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)'
            : 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)'
          : 'none',
        willChange: 'transform',
        background: 'var(--paper)',
        boxShadow: '-16px 0 36px rgba(20, 36, 27, 0.22)',
        overflowY: 'scroll',
        overscrollBehaviorY: 'contain',
        WebkitOverflowScrolling: 'touch',
        touchAction: 'pan-y',
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
        <h1
          className="detail-name serif"
          contentEditable
          suppressContentEditableWarning
          spellCheck={false}
          onBlur={(e) => {
            const v = e.currentTarget.textContent.trim();
            if (v && v !== s.name) onUpdate && onUpdate(s.id, { name: v });
            else if (!v) e.currentTarget.textContent = s.name;
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              e.currentTarget.blur();
            }
          }}
        >
          {s.name}
        </h1>
        <div className="detail-sub">
          <span>Started {s.joined}</span>
          <span style={{ opacity: 0.4 }}>·</span>
          <span>${s.valuePer}/hr</span>
        </div>
      </div>

      <div className="pack-card">
        <h3>Hours</h3>
        <div className="pack-big">
          <div className="pack-big-num">
            <span
              className="num serif"
              style={{ color: s.remaining < 0 ? 'var(--coral)' : undefined }}
            >
              {s.remaining < 0 ? '−' : ''}
              {Math.abs(s.remaining)}
            </span>
            <span className="of serif">{s.remaining < 0 ? 'owed' : 'remaining'}</span>
          </div>
        </div>
        <div className="pack-foot">
          <span>
            Value{' '}
            <span className="val">
              ${Math.round(s.remaining * s.valuePer)}
              {s.remaining < 0 ? ' owed' : ' left'}
            </span>
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
