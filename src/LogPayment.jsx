import React, { useState } from 'react';
import { Icon, Avatar } from './icons.jsx';

const METHODS = ['Venmo', 'Cash', 'Card', 'Zelle', 'Check'];

export default function LogPaymentModal({ student, onClose, onSave }) {
  const today = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const lastHoursDefault = (() => {
    const v = parseInt(localStorage.getItem('lt:lastAddHours') || '', 10);
    return Number.isFinite(v) && v > 0 ? v : 5;
  })();
  const [hours, setHours] = useState(String(lastHoursDefault));
  const [amt, setAmt] = useState('');
  const [date, setDate] = useState(
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`,
  );
  const [method, setMethod] = useState('Venmo');

  const hoursNum = Math.max(1, parseInt(hours, 10) || 0);
  const perHour = amt ? Math.round((parseFloat(amt) || 0) / hoursNum) : null;

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grab" />
        <div className="modal-head">
          <h2 className="serif">Log a payment</h2>
          <button className="x" onClick={onClose}>
            <Icon.X />
          </button>
        </div>

        <div className="field" style={{ paddingBottom: 4 }}>
          <label>Student</label>
        </div>
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
            <Avatar name={student.name} color={student.color} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{student.name}</div>
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(241,236,219,0.65)',
                  marginTop: 2,
                }}
              >
                {student.pack} · {student.remaining}/{student.size} hrs left
              </div>
            </div>
          </div>
        </div>

        <div className="field">
          <label>Package hours</label>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            value={hours}
            onChange={(e) => setHours(e.target.value.replace(/[^0-9]/g, ''))}
          />
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>
            {hoursNum} {hoursNum === 1 ? 'hour' : 'hours'}
          </div>
        </div>

        <div className="field">
          <label>Amount paid</label>
          <div style={{ position: 'relative' }}>
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 15,
                color: 'var(--ink-3)',
                pointerEvents: 'none',
              }}
            >
              $
            </span>
            <input
              value={amt}
              type="number"
              inputMode="decimal"
              onChange={(e) => setAmt(e.target.value)}
              style={{ paddingLeft: 28 }}
              placeholder="0"
            />
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>
            {perHour ? `$${perHour}/hour` : ' '}
          </div>
        </div>

        <div style={{ display: 'flex' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}>
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ padding: '4px 18px 0' }}>
          <div
            style={{
              background: 'var(--lemon)',
              borderRadius: 14,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: '#2a2308',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 99,
                background: '#2a2308',
                color: 'var(--lemon)',
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
                <path d="M12 5v14M5 12h14" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>
                {student.remaining} → {+(student.remaining + hoursNum).toFixed(2)} hours remaining
              </div>
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>
                Adds {hoursNum} hour{hoursNum === 1 ? '' : 's'} on top of the current balance
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
            onClick={() => {
              localStorage.setItem('lt:lastAddHours', String(hoursNum));
              onSave({
                pack: `${hoursNum}-hour`,
                amt: parseFloat(amt) || 0,
                date,
                method,
                size: hoursNum,
              });
            }}
          >
            Log payment
          </button>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
