import React, { useState, useEffect } from 'react';
import { useClerk } from '@clerk/clerk-react';
import baseData from './data.js';
import { useCoachData } from './useCoachData.js';
import { Icon } from './icons.jsx';
import RosterScreen from './Roster.jsx';
import StudentDetail from './StudentDetail.jsx';
import ScheduleScreen from './Schedule.jsx';
import LogLessonModal from './LogLesson.jsx';
import LogPaymentModal from './LogPayment.jsx';
import AddStudentModal from './AddStudent.jsx';
import { useTweaks } from './tweaks.jsx';

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
  const {
    students,
    sessions,
    payments,
    status,
    error,
    reload,
    addStudent,
    updateStudent,
    archiveStudent,
    deleteStudent,
    logLesson,
    logPayment,
    deleteSession,
    deletePayment,
  } = useCoachData();
  const liveData = { ...baseData, students, sessions, payments };

  const [tab, setTab] = useState('roster');
  const [openStudent, setOpenStudent] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [logPrefill, setLogPrefill] = useState(null);
  const [addOpen, setAddOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [tweaks] = useTweaks(TWEAK_DEFAULTS, 'lesson-tracker:v1:tweaks');
  const { signOut } = useClerk();

  const liveOpenStudent = openStudent
    ? students.find((s) => s.id === openStudent.id) || openStudent
    : null;

  const handleSaveLesson = ({ pid, dur, hours, note, focus, date, time }) => {
    const hr = hours ?? dur / 60;
    const lessonDate = date ? new Date(date + 'T00:00') : new Date();
    const dateStr = `${MONTHS[lessonDate.getMonth()]} ${String(lessonDate.getDate()).padStart(2, '0')}`;
    const pad = (n) => String(n).padStart(2, '0');
    const dateIso = date || `${lessonDate.getFullYear()}-${pad(lessonDate.getMonth() + 1)}-${pad(lessonDate.getDate())}`;
    const student = students.find((s) => s.id === pid);
    const newSession = {
      id: 'l' + Date.now(),
      studentId: pid,
      date: dateStr,
      dateIso,
      dow: DOWS[lessonDate.getDay()],
      dur,
      time24: time,
      focus: focus || '—',
      note: note || '',
      amt: Math.round(hr * ((student && student.valuePer) || 80)),
    };
    logLesson(newSession, hr);
    setLogOpen(false);
    setLogPrefill(null);
  };

  const handleUpdateStudent = (id, patch) => {
    updateStudent(id, patch);
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
    logPayment({
      payment: newPayment,
      studentId: liveOpenStudent.id,
      packSize: size,
      pack,
      valuePer: amt > 0 ? Math.round(amt / size) : liveOpenStudent.valuePer,
    });
    setPaymentOpen(false);
  };

  const handleDeleteSession = (studentId, sessionId) => {
    deleteSession(studentId, sessionId);
  };

  const handleDeletePayment = (studentId, paymentId) => {
    deletePayment(studentId, paymentId);
  };

  const handleArchiveStudent = (id) => {
    archiveStudent(id);
    setOpenStudent(null);
  };

  const handleDeleteStudent = (id) => {
    deleteStudent(id);
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
    let payment = null;
    if (paid > 0) {
      payment = {
        id: 'p' + Date.now(),
        date: `${MONTHS[now.getMonth()]} ${String(now.getDate()).padStart(2, '0')}`,
        label: entry.pack,
        amt: paid,
        method: entry.method || 'Venmo',
      };
    }
    addStudent(newStudent, payment);
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
  const [swipeProgress, setSwipeProgress] = useState(0);

  if (status === 'loading' && students.length === 0) {
    return (
      <div className="app-root">
        <div style={{ margin: 'auto', color: 'var(--ink-3)', fontSize: 14 }}>Loading…</div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="app-root">
        <div style={{ margin: 'auto', textAlign: 'center', padding: 24 }}>
          <div className="serif" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 8 }}>
            Couldn't load your data
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16, maxWidth: 320 }}>
            {String(error?.message || error || 'Unknown error')}
          </div>
          <button className="btn primary" onClick={reload}>Retry</button>
          <button
            className="btn ghost"
            style={{ marginLeft: 8 }}
            onClick={() => signOut()}
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const baseScreen =
    tab === 'schedule' ? (
      <ScheduleScreen
        data={liveData}
        onOpenStudent={handleOpenStudent}
        onOpenLog={() => setLogOpen(true)}
      />
    ) : (
      <RosterScreen
        data={liveData}
        tweaks={tweaks}
        onOpenStudent={handleOpenStudent}
        onOpenLog={() => setLogOpen(true)}
        onAddStudent={() => setAddOpen(true)}
      />
    );

  const detailScreen = liveOpenStudent ? (
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
      onDeleteSession={handleDeleteSession}
      onDeletePayment={handleDeletePayment}
      onSwipeProgress={setSwipeProgress}
    />
  ) : null;

  return (
    <div className="app-root">
      <div
        className="screen-layer screen-base"
        style={{
          transform: liveOpenStudent
            ? `translate3d(${(swipeProgress - 1) * 30}%, 0, 0)`
            : 'none',
          transition:
            liveOpenStudent && (swipeProgress === 0 || swipeProgress === 1)
              ? 'transform 0.34s cubic-bezier(0.32, 0.72, 0, 1)'
              : 'none',
          filter: liveOpenStudent ? `brightness(${0.85 + swipeProgress * 0.15})` : 'none',
        }}
      >
        {baseScreen}
      </div>

      {detailScreen && (
        <div className="screen-layer screen-overlay">{detailScreen}</div>
      )}

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
    </div>
  );
}
