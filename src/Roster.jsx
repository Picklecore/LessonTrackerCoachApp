import React, { useState, useMemo } from 'react';
import { UserButton } from '@clerk/clerk-react';
import { Icon, Avatar, Progress } from './icons.jsx';

function RosterRow({ s, onOpen, progStyle }) {
  const cls = s.remaining === 0 ? 'pkg-empty' : s.remaining <= 2 ? 'pkg-low' : '';
  return (
    <div className={`roster-row ${cls}`} onClick={() => onOpen(s)}>
      <span className="status-flag" />
      <Avatar name={s.name} color={s.color} />
      <div>
        <div className="r-name">
          {s.name}
          {s.remaining === 0 && s.size > 1 && <span className="flag-pill empty">Renew</span>}
        </div>
      </div>
      <div className="pkg">
        <div className="pkg-num">
          <span>{s.remaining}</span>
          <span className="of">/{s.size}</span>
        </div>
        <div className="pkg-label">hrs left</div>
        <Progress used={s.used} size={s.size} low={s.remaining <= 2} style={progStyle} />
      </div>
    </div>
  );
}

export default function RosterScreen({ data, tweaks, onOpenStudent, onAddStudent }) {
  const [filter, setFilter] = useState('progress');
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const filtered = useMemo(() => {
    let r = data.students;
    if (filter === 'progress') r = r.filter((s) => s.remaining > 0);
    if (filter === 'completed') r = r.filter((s) => s.remaining === 0);
    if (query) r = r.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

    const lastLessonDate = (s) => {
      const sess = (data.sessions || {})[s.id];
      if (!sess || sess.length === 0) return '';
      return sess[0].dateIso || '';
    };

    if (tweaks.sort === 'low') r = [...r].sort((a, b) => a.remaining - b.remaining);
    else if (tweaks.sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    else
      r = [...r].sort((a, b) =>
        (lastLessonDate(b) || '').localeCompare(lastLessonDate(a) || ''),
      );

    return r;
  }, [data.students, data.sessions, filter, query, tweaks.sort]);

  const counts = {
    progress: data.students.filter((s) => s.remaining > 0).length,
    completed: data.students.filter((s) => s.remaining === 0).length,
  };

  const activeSessions = data.students.reduce((a, s) => a + s.remaining, 0);
  const inProgress = counts.progress;

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-row">
          <div>
            <p className="top-greet">{(() => {
              const t = new Date();
              const dows = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
              const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
              return `${dows[t.getDay()]} · ${months[t.getMonth()]} ${t.getDate()}`;
            })()}</p>
            <h1 className="top-title serif">Roster</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="icon-btn"
              onClick={() => setSearchOpen((o) => !o)}
              style={{
                background: searchOpen ? 'var(--lemon)' : 'rgba(241,236,219,0.15)',
                color: searchOpen ? '#2a2308' : 'var(--court-line)',
              }}
            >
              <Icon.Search />
            </button>
            <button
              className="top-pill"
              onClick={onAddStudent}
              style={{ border: 'none', cursor: 'pointer' }}
            >
              <Icon.Plus style={{ width: 12, height: 12 }} /> Add student
            </button>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
        {searchOpen && (
          <div className="search-wrap">
            <Icon.Search />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search students…"
              className="search-input"
            />
            {query && (
              <button className="search-clear" onClick={() => setQuery('')}>
                <Icon.X />
              </button>
            )}
          </div>
        )}
      </div>
      <div className="stat-strip">
        <div className="stat-cell">
          <div className="stat-num serif">{inProgress}</div>
          <div className="stat-label">In progress</div>
        </div>
        <div className="stat-cell">
          <div className="stat-num serif">{activeSessions}</div>
          <div className="stat-label">Hours remaining</div>
        </div>
      </div>

      <div className="scroll">
        <div className="chips">
          {[
            ['progress', 'In progress', counts.progress],
            ['completed', 'Completed', counts.completed],
          ].map(([k, label, n]) => (
            <button
              key={k}
              className={'chip' + (filter === k ? ' active' : '')}
              onClick={() => setFilter(k)}
            >
              {label}
              <span className="count">{n}</span>
            </button>
          ))}
        </div>

        <div className="roster">
          {filtered.map((s) => (
            <RosterRow key={s.id} s={s} onOpen={onOpenStudent} progStyle={tweaks.progress} />
          ))}
          {data.students.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div
                className="serif"
                style={{ fontSize: 28, color: 'var(--ink)', marginBottom: 6 }}
              >
                No students yet
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--ink-3)',
                  lineHeight: 1.5,
                  marginBottom: 18,
                }}
              >
                Add your first student to start tracking their package and lesson history.
              </div>
              <button className="btn primary" onClick={onAddStudent}>
                <Icon.Plus style={{ width: 14, height: 14 }} /> Add student
              </button>
            </div>
          )}
          {data.students.length > 0 && filtered.length === 0 && (
            <div
              style={{
                padding: 30,
                textAlign: 'center',
                color: 'var(--ink-4)',
                fontSize: 13,
              }}
            >
              No students in this view.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
