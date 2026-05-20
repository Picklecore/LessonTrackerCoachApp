import React, { useState } from 'react';
import { Icon } from './icons.jsx';

const PACKS = [
  { id: '5-hour', label: '5 hours', size: 5 },
  { id: '10-hour', label: '10 hours', size: 10 },
];
const METHODS = ['Venmo', 'Cash', 'Card', 'Zelle', 'Check'];

export default function AddStudentModal({ onClose, onSave }) {
  const [name, setName] = useState('');
  const [pack, setPack] = useState('5-hour');
  const [paid, setPaid] = useState('');
  const [method, setMethod] = useState('Venmo');

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

        <div className="field" style={{ paddingBottom: 4, marginTop: 4 }}>
          <label>Package</label>
        </div>
        <div
          style={{
            padding: '0 18px 8px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          {PACKS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPack(p.id)}
              style={{
                background: p.id === pack ? 'var(--court-green)' : 'var(--paper-2)',
                color: p.id === pack ? 'var(--court-line)' : 'var(--ink)',
                border:
                  '1px solid ' + (p.id === pack ? 'var(--court-green)' : 'var(--line-strong)'),
                borderRadius: 12,
                padding: '12px 14px',
                textAlign: 'left',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 600 }}>{p.label}</div>
            </button>
          ))}
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
              {pack && paid
                ? `$${Math.round((paid || 0) / (pack === '5-hour' ? 5 : 10))}/hour`
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
            onClick={() => onSave({ name, pack, paid, method })}
          >
            Add student
          </button>
        </div>
        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
