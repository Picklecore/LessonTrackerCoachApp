import React, { useState } from 'react';
import { Icon } from './icons.jsx';

const METHODS = ['Venmo', 'Cash', 'Card', 'Zelle', 'Check'];

export default function AddStudentModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const lastHoursDefault = (() => {
    const v = parseInt(localStorage.getItem('lt:lastAddHours') || '', 10);
    return Number.isFinite(v) && v > 0 ? v : 5;
  })();
  const [hours, setHours] = useState(String(lastHoursDefault));
  const [paid, setPaid] = useState('');
  const [method, setMethod] = useState('Venmo');

  const hoursNum = Math.max(1, parseInt(hours, 10) || 0);

  return (
    <div className="modal-back" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-grab" />
        <div className="modal-head">
          <h2 className="serif">New student</h2>
          <button className="x" onClick={onClose}>
            <Icon.X />
          </button>
        </div>

        <div className="field">
          <label>Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
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

        <div style={{ display: 'flex' }}>
          <div className="field" style={{ flex: 1 }}>
            <label>Total paid</label>
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
                value={paid}
                type="number"
                onChange={(e) => setPaid(e.target.value)}
                style={{ paddingLeft: 28 }}
              />
            </div>
            <div style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 6 }}>
              {paid && hoursNum
                ? `$${Math.round((parseFloat(paid) || 0) / hoursNum)}/hour`
                : ' '}
            </div>
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

        <div style={{ padding: 18, display: 'flex', gap: 8 }}>
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn primary"
            style={{ flex: 2 }}
            onClick={() => {
              localStorage.setItem('lt:lastAddHours', String(hoursNum));
              onSave({ name, hours: hoursNum, paid, method });
            }}
          >
            Add student
          </button>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
