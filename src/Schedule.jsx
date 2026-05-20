import React, { useState } from 'react';
import { Icon } from './icons.jsx';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DOW_LETTERS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function daysInMonth(year, monthIdx) {
  return new Date(year, monthIdx + 1, 0).getDate();
}
function firstDow(year, monthIdx) {
  return new Date(year, monthIdx, 1).getDay();
}

function RangeSpark({ data, labels, selected, onSelect }) {
  const max = Math.max(...data, 1);
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${data.length},1fr)`,
        gap: 6,
        alignItems: 'end',
        height: 80,
      }}
    >
      {data.map((v, i) => (
        <button
          key={i}
          onClick={() => onSelect && onSelect(i)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <div
            style={{
              width: '100%',
              height: `${(v / max) * 56 + 4}px`,
              background: i === selected ? 'var(--lemon)' : 'var(--court-green)',
              borderRadius: 6,
              transition: 'background 0.15s',
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: i === selected ? 'var(--ink)' : 'var(--ink-3)',
              fontWeight: i === selected ? 700 : 600,
              letterSpacing: '0.06em',
            }}
          >
            {labels[i]}
          </div>
        </button>
      ))}
    </div>
  );
}

export default function ScheduleScreen({ data, onOpenStudent, onOpenLog }) {
  const [year, setYear] = useState(2026);
  const [monthIdx, setMonthIdx] = useState(4);
  const [day, setDay] = useState(19);
  const [range, setRange] = useState('week');

  const yearData = [42, 38, 55, 60, 62, 58, 40, 48, 62, 68, 58, 57];
  const monthData = [8, 12, 14, 15, 13];
  const weekData = data.week.map((d) => d.count);
  const yearLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
  const monthLabels = ['W1', 'W2', 'W3', 'W4', 'W5'];
  const weekLabels = data.week.map((d) => d.dow[0]);

  const defaultIdx = { week: 2, month: 2, year: 4 };
  const [selWeek, setSelWeek] = useState(defaultIdx.week);
  const [selMonth, setSelMonth] = useState(defaultIdx.month);
  const [selYear, setSelYear] = useState(defaultIdx.year);

  const barData = range === 'week' ? weekData : range === 'month' ? monthData : yearData;
  const barLabels =
    range === 'week' ? weekLabels : range === 'month' ? monthLabels : yearLabels;
  const selIdx = range === 'week' ? selWeek : range === 'month' ? selMonth : selYear;
  const setSel = range === 'week' ? setSelWeek : range === 'month' ? setSelMonth : setSelYear;

  const periodLabels = {
    week: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
      (d, i) => `${d}, May ${17 + i}`,
    ),
    month: ['Apr 27–May 3', 'May 4–10', 'May 11–17', 'May 18–24', 'May 25–31'],
    year: MONTHS_LONG.map((m) => `${m} 2026`),
  };

  const total = daysInMonth(year, monthIdx);
  const offset = firstDow(year, monthIdx);

  function lessonsForDate(y, mIdx, d) {
    const monthAbbrev = MONTHS[mIdx];
    const isMay2026 = y === 2026 && mIdx === 4;
    const scheduled = isMay2026 && data.schedule[d] ? data.schedule[d] : [];
    const logged = [];
    Object.entries(data.sessions || {}).forEach(([pid, list]) => {
      const student = data.students.find((s) => s.id === pid);
      if (!student) return;
      list.forEach((sess) => {
        const [m, dd] = sess.date.split(' ');
        if (m === monthAbbrev && parseInt(dd, 10) === d) {
          let time = sess.time || '—';
          let ampm = sess.ampm || '';
          if (sess.time24) {
            const [hh, mm] = sess.time24.split(':').map(Number);
            ampm = hh >= 12 ? 'PM' : 'AM';
            const h12 = ((hh + 11) % 12) + 1;
            time = `${h12}:${String(mm).padStart(2, '0')}`;
          }
          logged.push({
            time,
            ampm,
            dur: sess.dur,
            student: student.name,
            pid: student.id,
            focus: sess.focus,
            logged: true,
          });
        }
      });
    });
    return [...scheduled, ...logged];
  }

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push({ blank: true });
  for (let d = 1; d <= total; d++) {
    const count = lessonsForDate(year, monthIdx, d).length;
    cells.push({ d, count, today: year === 2026 && monthIdx === 4 && d === 19 });
  }
  while (cells.length % 7 !== 0) cells.push({ blank: true });

  const lessons = lessonsForDate(year, monthIdx, day);

  const goPrev = () => {
    if (monthIdx === 0) {
      setMonthIdx(11);
      setYear(year - 1);
    } else setMonthIdx(monthIdx - 1);
    setDay(1);
  };
  const goNext = () => {
    if (monthIdx === 11) {
      setMonthIdx(0);
      setYear(year + 1);
    } else setMonthIdx(monthIdx + 1);
    setDay(1);
  };
  const goToday = () => {
    setYear(2026);
    setMonthIdx(4);
    setDay(19);
  };

  const selectedDate = new Date(year, monthIdx, day);
  const dowLabel = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][selectedDate.getDay()];

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-row">
          <div>
            <p className="top-greet">
              {dowLabel} · {MONTHS[monthIdx]} {day}
            </p>
            <h1 className="top-title serif">Schedule</h1>
          </div>
          <button
            className="top-pill"
            onClick={onOpenLog}
            style={{ border: 'none', cursor: 'pointer' }}
          >
            <Icon.Plus style={{ width: 12, height: 12 }} /> Lesson
          </button>
        </div>
      </div>

      <div className="scroll">
        <div className="cal-head">
          <button className="cal-nav" onClick={goPrev} aria-label="Previous month">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
          <div className="cal-title">
            <span className="serif">{MONTHS_LONG[monthIdx]}</span>
            <span className="yr">{year}</span>
          </div>
          <button className="cal-nav" onClick={goNext} aria-label="Next month">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </div>

        <div className="cal-today-row">
          <button className="cal-today" onClick={goToday}>
            Today
          </button>
        </div>

        <div className="month-grid">
          <div className="month-head">
            {DOW_LETTERS.map((l, i) => (
              <div key={i} className="mh">
                {l}
              </div>
            ))}
          </div>
          <div className="month-days">
            {cells.map((c, i) =>
              c.blank ? (
                <div key={i} className="mday blank" />
              ) : (
                <button
                  key={i}
                  className={
                    'mday' +
                    (c.d === day ? ' sel' : '') +
                    (c.today ? ' today' : '') +
                    (c.count === 0 ? ' nolesson' : '')
                  }
                  onClick={() => setDay(c.d)}
                >
                  <span className="serif">{c.d}</span>
                  {c.count > 0 && <span className="mpip" />}
                </button>
              ),
            )}
          </div>
        </div>

        <div
          style={{
            padding: '20px 20px 6px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div
            style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 600 }}
            className="serif"
          >
            <span style={{ fontSize: 18 }}>
              {dowLabel}, {MONTHS_LONG[monthIdx]} {day}
            </span>
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-4)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              fontWeight: 600,
            }}
          >
            {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}
          </div>
        </div>

        <div className="agenda" style={{ marginTop: 4 }}>
          {lessons.map((l, i) => {
            const student = data.students.find((s) => s.id === l.pid);
            const remaining = student ? student.remaining : null;
            return (
              <React.Fragment key={i}>
                {l.now && (
                  <div className="now-line">
                    <span>Now · 4:18 PM</span>
                    <span className="l" />
                  </div>
                )}
                <div className="lesson" onClick={() => student && onOpenStudent(student)}>
                  <div className="time">
                    {l.time === '—' ? (
                      <div
                        className="dur"
                        style={{ fontSize: 13, color: 'var(--ink-2)' }}
                      >
                        {l.dur}m
                      </div>
                    ) : (
                      <>
                        <div className="h serif">
                          {l.time}
                          <span
                            style={{ fontSize: 12, marginLeft: 2, color: 'var(--ink-3)' }}
                          >
                            {l.ampm}
                          </span>
                        </div>
                        <div className="dur">{l.dur} min</div>
                      </>
                    )}
                  </div>
                  <div className="body">
                    <div className="who">
                      {l.student}
                      {l.logged && (
                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: 10,
                            color: 'var(--court-green-soft)',
                            letterSpacing: '0.06em',
                            textTransform: 'uppercase',
                            fontWeight: 700,
                          }}
                        >
                          · Logged
                        </span>
                      )}
                    </div>
                    <div className="where">
                      {l.focus ? (
                        <span style={{ color: 'var(--ink-3)' }}>{l.focus}</span>
                      ) : student ? (
                        `${remaining} hrs left`
                      ) : (
                        ''
                      )}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })}
          {lessons.length === 0 && (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                color: 'var(--ink-4)',
                fontSize: 13,
              }}
            >
              <div style={{ fontSize: 38, marginBottom: 6 }} className="serif">
                —
              </div>
              No lessons.
            </div>
          )}
        </div>

        <div
          style={{
            padding: '28px 20px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: 'var(--ink-3)',
              fontWeight: 600,
            }}
          >
            {periodLabels[range][selIdx]}
          </div>
          <div className="range-toggle">
            {[
              ['week', 'W'],
              ['month', 'M'],
              ['year', 'Y'],
            ].map(([k, l]) => (
              <button
                key={k}
                className={range === k ? 'on' : ''}
                onClick={() => setRange(k)}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div
          style={{
            padding: '4px 20px 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
          }}
        >
          <div style={{ fontSize: 26 }} className="serif">
            {barData[selIdx]}{' '}
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>lessons</span>
          </div>
          <div style={{ fontSize: 22, color: 'var(--ink-2)' }} className="serif">
            ${(barData[selIdx] * 80).toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '12px 20px 8px' }}>
          <RangeSpark
            data={barData}
            labels={barLabels}
            selected={selIdx}
            onSelect={setSel}
          />
        </div>

        <div style={{ height: 28 }} />
      </div>
    </>
  );
}
