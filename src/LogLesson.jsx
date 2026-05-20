import React, { useState } from 'react';
import { Icon, Avatar } from './icons.jsx';

export default function LogLessonModal({ data, prefill, onClose, onSave }) {
  if (!prefill && data.students.length === 0) {
    return (
      <div className="modal-back" onClick={onClose}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-grab" />
          <div className="modal-head">
            <h2 className="serif">Log a lesson</h2>
            <button className="x" onClick={onClose}>
              <Icon.X />
            </button>
          </div>
          <div style={{ padding: '12px 24px 32px', textAlign: 'center' }}>
            <div
              className="serif"
              style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}
            >
              No students yet
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              Add a student first to start logging lessons.
            </div>
          </div>
        </div>
      </div>
    );
  }

  const [pid, setPid] = useState(prefill?.id || data.students[0].id);
  const [dur, setDur] = useState(60);
  const [note, setNote] = useState('');
  const [focus, setFocus] = useState('');
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const [date, setDate] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  );
  const [time, setTime] = useState('16:00');

  const s = data.students.find((x) => x.id === pid);
  const hours = dur / 60;
  const newRemaining = Math.max(0, s.remaining - hours);
  const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grab" />
        <div className="modal-head">
          <h2 className="serif">Log a lesson</h2>
          <button className="x" onClick={onClose}>
            <Icon.X />
          </button>
        </div>

        <div className="field" style={{ paddingBottom: 4 }}>
          <label>Student</label>
        </div>
        {prefill ? (
          <div style={{ padding: '0 18px 8px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: 'var(--court-green)',
                color: 'var(--court-line)',
                padding: '12px 14px',
                borderRadius: 14,
              }}
            >
              <Avatar name={s.name} color={s.color} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600 }}>{s.name}</div>
                <div
                  style={{
                    fontSize: 11,
                    color: 'rgba(241,236,219,0.65)',
                    marginTop: 2,
                  }}
                >
                  {s.pack} · {fmt(s.remaining)}/{s.size} hrs left
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="student-pick">
            {data.students.slice(0, 12).map((st) => (
              <div
                key={st.id}
                className={'spick' + (st.id === pid ? ' on' : '')}
                onClick={() => setPid(st.id)}
              >
                <Avatar name={st.name} color={st.color} className="av" />
                <div>
                  <div className="nm">{st.name.split(' ')[0]}</div>
                  <div className="sub">
                    {fmt(st.remaining)}/{st.size} hrs
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 0 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>

        <div className="field" style={{ paddingBottom: 4 }}>
          <label>Duration</label>
        </div>
        <div className="duration-pick">
          {[
            [60, '1 hr'],
            [90, '1.5 hr'],
            [120, '2 hr'],
            [150, '2.5 hr'],
          ].map(([d, label]) => (
            <button key={d} className={d === dur ? 'on' : ''} onClick={() => setDur(d)}>
              {label}
            </button>
          ))}
        </div>

        <div className="field">
          <label>Focus</label>
          <input
            value={focus}
            onChange={(e) => setFocus(e.target.value)}
            placeholder="e.g. Third-shot drops"
          />
        </div>

        <div className="field">
          <label>Notes</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="What worked, what to drill next time…"
          />
        </div>

        <div style={{ padding: '4px 18px 0' }}>
          <div
            style={{
              background: 'var(--court-line)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 99,
                background: 'var(--court-green)',
                color: 'var(--court-line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                {s.pack} · {fmt(s.remaining)} → {fmt(newRemaining)} hours remaining
              </div>
              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                {fmt(hours)} hour{hours === 1 ? '' : 's'} will be deducted on save
              </div>
            </div>
          </div>
        </div>

        <div style={{ padding: 18, display: 'flex', gap: 8 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            style={{ flex: 2 }}
            onClick={() => onSave({ pid, dur, hours, note, focus, date, time })}
          >
            Save lesson
          </button>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
