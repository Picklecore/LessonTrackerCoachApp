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
const DOWS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [monthIdx, setMonthIdx] = useState(today.getMonth());
  const [day, setDay] = useState(today.getDate());
  const [range, setRange] = useState('week');

  const valuePerStudent = (pid) => {
    const stu = data.students.find((s) => s.id === pid);
    return stu ? stu.valuePer : 0;
  };
  function bucketSessions(get) {
    const buckets = [];
    for (let i = 0; i < get.length; i++) buckets.push({ count: 0, revenue: 0 });
    Object.entries(data.sessions || {}).forEach(([pid, list]) => {
      list.forEach((sess) => {
        const idx = get.fn(sess);
        if (idx == null || idx < 0 || idx >= get.length) return;
        const hrs = (sess.dur || 60) / 60;
        buckets[idx].count += 1;
        buckets[idx].revenue += Math.round(hrs * valuePerStudent(pid));
      });
    });
    return buckets;
  }

  const todayObj = new Date();
  todayObj.setHours(0, 0, 0, 0);

  const weekBuckets = bucketSessions({
    length: 7,
    fn: (sess) => {
      const [m, dd] = sess.date.split(' ');
      const mi = MONTHS.indexOf(m);
      if (mi < 0) return null;
      const d = new Date(todayObj.getFullYear(), mi, parseInt(dd, 10));
      const diffDays = Math.round((todayObj - d) / 86400000);
      return 6 - diffDays;
    },
  });

  const monthLen = daysInMonth(todayObj.getFullYear(), todayObj.getMonth());
  const monthBuckets = bucketSessions({
    length: monthLen,
    fn: (sess) => {
      const [m, dd] = sess.date.split(' ');
      const mi = MONTHS.indexOf(m);
      if (mi !== todayObj.getMonth()) return null;
      return parseInt(dd, 10) - 1;
    },
  });

  const yearBuckets = bucketSessions({
    length: 12,
    fn: (sess) => MONTHS.indexOf(sess.date.split(' ')[0]),
  });

  const weekLabels = (() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(todayObj);
      d.setDate(d.getDate() - i);
      out.push(DOWS_SHORT[d.getDay()]);
    }
    return out;
  })();
  const monthLabels = Array.from({ length: monthLen }, (_, i) => String(i + 1));
  const yearLabels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];

  const [selWeek, setSelWeek] = useState(null);
  const [selMonth, setSelMonth] = useState(null);
  const [selYear, setSelYear] = useState(null);

  const barBuckets =
    range === 'week' ? weekBuckets : range === 'month' ? monthBuckets : yearBuckets;
  const barData = barBuckets.map((b) => b.count);
  const barLabels = range === 'week' ? weekLabels : range === 'month' ? monthLabels : yearLabels;
  const selIdx = range === 'week' ? selWeek : range === 'month' ? selMonth : selYear;
  const setSel = range === 'week' ? setSelWeek : range === 'month' ? setSelMonth : setSelYear;
  const totalBucket = barBuckets.reduce(
    (acc, b) => ({ count: acc.count + b.count, revenue: acc.revenue + b.revenue }),
    { count: 0, revenue: 0 },
  );
  const selBucket = selIdx == null ? totalBucket : barBuckets[selIdx] || { count: 0, revenue: 0 };

  const rangeOverviewLabel = (() => {
    if (range === 'week') return 'Last 7 days';
    if (range === 'month') return `${MONTHS_LONG[todayObj.getMonth()]} ${todayObj.getFullYear()}`;
    return `${todayObj.getFullYear()}`;
  })();

  const periodLabels = (() => {
    if (range === 'week') {
      const out = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayObj);
        d.setDate(d.getDate() - i);
        out.push(`${DOWS_SHORT[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}`);
      }
      return out;
    }
    if (range === 'month') {
      return monthLabels.map((d) => `${MONTHS_LONG[todayObj.getMonth()]} ${d}`);
    }
    return MONTHS_LONG.map((m) => `${m} ${todayObj.getFullYear()}`);
  })();

  const total = daysInMonth(year, monthIdx);
  const offset = firstDow(year, monthIdx);

  function lessonsForDate(y, mIdx, d) {
    const monthAbbrev = MONTHS[mIdx];
    const logged = [];
    Object.entries(data.sessions || {}).forEach(([pid, list]) => {
      const student = data.students.find((s) => s.id === pid);
      if (!student) return;
      list.forEach((sess) => {
        const [m, dd] = sess.date.split(' ');
        if (m === monthAbbrev && parseInt(dd, 10) === d) {
          let time = '—';
          let ampm = '';
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
    return logged;
  }

  const cells = [];
  for (let i = 0; i < offset; i++) cells.push({ blank: true });
  for (let d = 1; d <= total; d++) {
    const count = lessonsForDate(year, monthIdx, d).length;
    const t = new Date();
    const isToday =
      t.getFullYear() === year && t.getMonth() === monthIdx && t.getDate() === d;
    cells.push({ d, count, today: isToday });
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
    const t = new Date();
    setYear(t.getFullYear());
    setMonthIdx(t.getMonth());
    setDay(t.getDate());
  };

  const selectedDate = new Date(year, monthIdx, day);
  const dowLabel = DOWS_SHORT[selectedDate.getDay()];

  return (
    <>
      <div className="top-bar">
        <div className="top-bar-row">
          <div>
            <p className="top-greet">{(() => {
              const t = new Date();
              return `${DOWS_SHORT[t.getDay()]}, ${MONTHS_LONG[t.getMonth()]} ${t.getDate()}`;
            })()}</p>
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
              <div
                key={i}
                className="lesson"
                onClick={() => student && onOpenStudent(student)}
              >
                <div className="time">
                  {l.time === '—' ? (
                    <div className="dur" style={{ fontSize: 13, color: 'var(--ink-2)' }}>
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
            {selIdx == null ? rangeOverviewLabel : periodLabels[selIdx]}
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
                onClick={() => {
                  setRange(k);
                  setSelWeek(null);
                  setSelMonth(null);
                  setSelYear(null);
                }}
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
            {selBucket.count}{' '}
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              lesson{selBucket.count === 1 ? '' : 's'}
            </span>
          </div>
          <div style={{ fontSize: 22, color: 'var(--ink-2)' }} className="serif">
            ${selBucket.revenue.toLocaleString()}
          </div>
        </div>
        <div style={{ padding: '12px 20px 8px' }}>
          <RangeSpark
            data={barData}
            labels={barLabels}
            selected={selIdx}
            onSelect={(i) => setSel(selIdx === i ? null : i)}
          />
        </div>

        <div style={{ height: 28 }} />
      </div>
    </>
  );
}
