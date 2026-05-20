import React, { useState, useEffect } from 'react';
import baseData from './data.js';
import { Icon } from './icons.jsx';
import RosterScreen from './Roster.jsx';
import StudentDetail from './StudentDetail.jsx';
import ScheduleScreen from './Schedule.jsx';
import LogLessonModal from './LogLesson.jsx';
import LogPaymentModal from './LogPayment.jsx';
import AddStudentModal from './AddStudent.jsx';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor } from './tweaks.jsx';

const TWEAK_DEFAULTS = {
  theme: 'court',
  progress: 'bar',
  density: 'comfy',
  sort: 'default',
  accent: '#f8e25c',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DOWS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export default function App() {
  const [students, setStudents] = useState(baseData.students);
  const [sessions, setSessions] = useState(baseData.sessions);
  const [payments, setPayments] = useState(baseData.payments);
  const liveData = { ...baseData, students, sessions, payments };

  const [tab, setTab] = useState('roster');
  const [openStudent, setOpenStudent] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logPrefill, setLogPrefill] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const liveOpenStudent = openStudent
    ? students.find((s) => s.id === openStudent.id) || openStudent
    : null;

  const handleSaveLesson = ({ pid, dur, hours, note, focus, date, time }) => {
    const hr = hours ?? dur / 60;
    const lessonDate = date ? new Date(date + 'T00:00') : new Date();
    const dateStr = `${MONTHS[lessonDate.getMonth()]} ${String(lessonDate.getDate()).padStart(2, '0')}`;
    const student = students.find((s) => s.id === pid);
    const newSession = {
      id: 'l' + Date.now(),
      date: dateStr,
      dow: DOWS[lessonDate.getDay()],
      dur,
      time24: time,
      focus: focus || '—',
      note: note || '',
      amt: Math.round(hr * ((student && student.valuePer) || 80)),
    };
    setSessions((prev) => ({ ...prev, [pid]: [newSession, ...(prev[pid] || [])] }));
    setStudents((prev) =>
      prev.map((s) =>
        s.id === pid
          ? {
              ...s,
              remaining: Math.max(0, +(s.remaining - hr).toFixed(2)),
              used: +(s.used + hr).toFixed(2),
            }
          : s,
      ),
    );
    setLogOpen(false);
    setLogPrefill(null);
  };

  const handleUpdateStudent = (id, patch) => {
    setStudents((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const handleSavePayment = ({ pack, amt, date, method, size }) => {
    if (!liveOpenStudent) return;
    const payDate = date ? new Date(date + 'T00:00') : new Date();
    const dateStr = `${MONTHS[payDate.getMonth()]} ${String(payDate.getDate()).padStart(2, '0')}`;
    const newPayment = {
      id: 'p' + Date.now(),
      date: dateStr,
      label: pack,
      amt,
      method,
    };
    setPayments((prev) => ({
      ...prev,
      [liveOpenStudent.id]: [newPayment, ...((prev || {})[liveOpenStudent.id] || [])],
    }));
    setStudents((prev) =>
      prev.map((s) =>
        s.id === liveOpenStudent.id
          ? {
              ...s,
              pack,
              remaining: +(s.remaining + size).toFixed(2),
              size: s.size + size,
              valuePer: amt > 0 ? Math.round(amt / size) : s.valuePer,
            }
          : s,
      ),
    );
    setPaymentOpen(false);
  };

  const handleArchiveStudent = (id) => {
    setStudents((prev) =>
      prev.map((s) => (s.id === id ? { ...s, remaining: 0, used: s.size } : s)),
    );
    setOpenStudent(null);
  };

  const handleDeleteStudent = (id) => {
    setStudents((prev) => prev.filter((s) => s.id !== id));
    setOpenStudent(null);
  };

  const handleAddStudent = (entry) => {
    if (!entry.name || !entry.name.trim()) {
      setAddOpen(false);
      return;
    }
    const size = entry.pack === '5-hour' ? 5 : 10;
    const paid = parseFloat(entry.paid) || 0;
    const colors = ['c1', 'c2', 'c3', 'c4', 'c5', 'c6'];
    const now = new Date();
    const id = 'n' + Date.now();
    const joinedStr = `${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}, ${now.getFullYear()}`;
    const newStudent = {
      id,
      name: entry.name.trim(),
      color: colors[students.length % colors.length],
      pack: entry.pack,
      remaining: size,
      used: 0,
      size,
      lastNote: '',
      balance: 0,
      valuePer: paid > 0 ? Math.round(paid / size) : 80,
      joined: joinedStr,
    };
    setStudents([newStudent, ...students]);
    if (paid > 0) {
      const newPayment = {
        id: 'p' + Date.now(),
        date: `${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}`,
        label: entry.pack,
        amt: paid,
        method: entry.method || 'Venmo',
      };
      setPayments((prev) => ({ ...prev, [id]: [newPayment] }));
    }
    setAddOpen(false);
  };

  useEffect(() => {
    const root = document.querySelector('.app-root');
    if (!root) return;
    root.setAttribute('data-theme', tweaks.theme);
    root.setAttribute('data-density', tweaks.density);
    root.style.setProperty('--lemon', tweaks.accent);
  }, [tweaks]);

  const handleOpenStudent = (s) => setOpenStudent(s);
  const handleBack = () => setOpenStudent(null);

  let screen;
  if (liveOpenStudent) {
    screen = (
      <StudentDetail
        s={liveOpenStudent}
        data={liveData}
        onBack={handleBack}
        onOpenLog={() => {
          setLogPrefill(liveOpenStudent);
          setLogOpen(true);
        }}
        onOpenPayment={() => setPaymentOpen(true)}
        onDelete={handleDeleteStudent}
        onArchive={handleArchiveStudent}
        onUpdate={handleUpdateStudent}
      />
    );
  } else if (tab === 'roster') {
    screen = (
      <RosterScreen
        data={liveData}
        tweaks={tweaks}
        onOpenStudent={handleOpenStudent}
        onOpenLog={() => setLogOpen(true)}
        onAddStudent={() => setAddOpen(true)}
      />
    );
  } else if (tab === 'schedule') {
    screen = (
      <ScheduleScreen
        data={liveData}
        onOpenStudent={handleOpenStudent}
        onOpenLog={() => setLogOpen(true)}
      />
    );
  }

  return (
    <div className="app-root">
      {screen}

      <div className="tabbar">
        <div className="tabbar-inner">
          <button
            className={'tab' + (tab === 'roster' && !openStudent ? ' active' : '')}
            onClick={() => {
              setOpenStudent(null);
              setTab('roster');
            }}
          >
            <Icon.Roster /> Roster
          </button>
          <button
            className={'tab' + (tab === 'schedule' && !openStudent ? ' active' : '')}
            onClick={() => {
              setOpenStudent(null);
              setTab('schedule');
            }}
          >
            <Icon.Cal /> Today
          </button>
        </div>
      </div>

      {logOpen && (
        <LogLessonModal
          data={liveData}
          prefill={logPrefill}
          onClose={() => {
            setLogOpen(false);
            setLogPrefill(null);
          }}
          onSave={handleSaveLesson}
        />
      )}

      {addOpen && (
        <AddStudentModal onClose={() => setAddOpen(false)} onSave={handleAddStudent} />
      )}

      {paymentOpen && liveOpenStudent && (
        <LogPaymentModal
          student={liveOpenStudent}
          onClose={() => setPaymentOpen(false)}
          onSave={handleSavePayment}
        />
      )}

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme">
          <TweakRadio
            label="Palette"
            value={tweaks.theme}
            options={['court', 'cream', 'night']}
            onChange={(v) => setTweak('theme', v)}
          />
          <TweakColor
            label="Accent"
            value={tweaks.accent}
            options={['#f8e25c', '#e87454', '#9be88a', '#f3c5b8']}
            onChange={(v) => setTweak('accent', v)}
          />
        </TweakSection>

        <TweakSection label="Roster">
          <TweakRadio
            label="Progress"
            value={tweaks.progress}
            options={['bar', 'dots', 'stacked']}
            onChange={(v) => setTweak('progress', v)}
          />
          <TweakRadio
            label="Density"
            value={tweaks.density}
            options={['comfy', 'compact']}
            onChange={(v) => setTweak('density', v)}
          />
          <TweakRadio
            label="Sort by"
            value={tweaks.sort}
            options={['default', 'low', 'name']}
            onChange={(v) => setTweak('sort', v)}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}
