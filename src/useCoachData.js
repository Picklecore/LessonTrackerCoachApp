import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const EMPTY = { students: [], sessions: {}, payments: {} };

export function useCoachData() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [data, setData] = useState(EMPTY);
  const [status, setStatus] = useState('idle'); // idle | loading | ready | error
  const [error, setError] = useState(null);
  const aliveRef = useRef(true);

  const authedFetch = useCallback(
    async (path, options = {}) => {
      const token = await getToken();
      const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(path, { ...options, headers });
      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`${res.status} ${text || res.statusText}`);
      }
      return res.status === 204 ? null : res.json();
    },
    [getToken],
  );

  const reload = useCallback(async () => {
    if (!isSignedIn) return;
    setStatus((s) => (s === 'ready' ? 'ready' : 'loading'));
    try {
      const fresh = await authedFetch('/api/bootstrap');
      if (!aliveRef.current) return;
      setData({
        students: fresh.students || [],
        sessions: fresh.sessions || {},
        payments: fresh.payments || {},
      });
      setStatus('ready');
      setError(null);
    } catch (err) {
      if (!aliveRef.current) return;
      setError(err);
      setStatus('error');
    }
  }, [authedFetch, isSignedIn]);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Initial load
  useEffect(() => {
    if (isLoaded && isSignedIn) reload();
  }, [isLoaded, isSignedIn, reload]);

  // Refresh on focus
  useEffect(() => {
    function onFocus() {
      if (isLoaded && isSignedIn) reload();
    }
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') onFocus();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [reload, isLoaded, isSignedIn]);

  const addStudent = useCallback(
    async (student, payment) => {
      setData((d) => ({
        ...d,
        students: [student, ...d.students],
        payments: payment
          ? { ...d.payments, [student.id]: [payment, ...(d.payments[student.id] || [])] }
          : d.payments,
      }));
      try {
        await authedFetch('/api/add-student', {
          method: 'POST',
          body: JSON.stringify({ student, payment }),
        });
      } catch (err) {
        setError(err);
        reload();
      }
    },
    [authedFetch, reload],
  );

  const updateStudent = useCallback(
    async (id, patch) => {
      setData((d) => ({
        ...d,
        students: d.students.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
      try {
        await authedFetch('/api/update-student', {
          method: 'POST',
          body: JSON.stringify({ id, patch }),
        });
      } catch (err) {
        setError(err);
        reload();
      }
    },
    [authedFetch, reload],
  );

  const archiveStudent = useCallback(
    async (id) => {
      const target = data.students.find((s) => s.id === id);
      if (!target) return;
      await updateStudent(id, { remaining: 0, used: target.size });
    },
    [data.students, updateStudent],
  );

  const deleteStudent = useCallback(
    async (id) => {
      setData((d) => {
        const { [id]: _s, ...sessions } = d.sessions;
        const { [id]: _p, ...payments } = d.payments;
        return {
          students: d.students.filter((s) => s.id !== id),
          sessions,
          payments,
        };
      });
      try {
        await authedFetch('/api/delete-student', {
          method: 'POST',
          body: JSON.stringify({ id }),
        });
      } catch (err) {
        setError(err);
        reload();
      }
    },
    [authedFetch, reload],
  );

  const logLesson = useCallback(
    async (session, hours) => {
      const hr = Number(hours ?? (session.dur ?? 60) / 60);
      setData((d) => {
        const next = [session, ...(d.sessions[session.studentId] || [])];
        next.sort((a, b) => (b.dateIso || '').localeCompare(a.dateIso || ''));
        return {
          ...d,
          sessions: { ...d.sessions, [session.studentId]: next },
          students: d.students.map((s) =>
            s.id === session.studentId
              ? {
                  ...s,
                  remaining: +(Number(s.remaining) - hr).toFixed(2),
                  used: +(Number(s.used) + hr).toFixed(2),
                }
              : s,
          ),
        };
      });
      try {
        await authedFetch('/api/log-lesson', {
          method: 'POST',
          body: JSON.stringify({ session, hours: hr }),
        });
      } catch (err) {
        setError(err);
        reload();
      }
    },
    [authedFetch, reload],
  );

  const deleteSession = useCallback(
    async (studentId, sessionId) => {
      const list = data.sessions[studentId] || [];
      const target = list.find((x) => x.id === sessionId);
      if (!target) return;
      const hr = Number(target.dur ?? 60) / 60;
      setData((d) => ({
        ...d,
        sessions: {
          ...d.sessions,
          [studentId]: (d.sessions[studentId] || []).filter((x) => x.id !== sessionId),
        },
        students: d.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                remaining: +(Number(s.remaining) + hr).toFixed(2),
                used: +Math.max(0, Number(s.used) - hr).toFixed(2),
              }
            : s,
        ),
      }));
      try {
        await authedFetch('/api/delete-session', {
          method: 'POST',
          body: JSON.stringify({ id: sessionId, studentId, hours: hr }),
        });
      } catch (err) {
        setError(err);
        reload();
      }
    },
    [authedFetch, data.sessions, reload],
  );

  const deletePayment = useCallback(
    async (studentId, paymentId) => {
      const list = data.payments[studentId] || [];
      const target = list.find((x) => x.id === paymentId);
      if (!target) return;
      const size = target.label && String(target.label).startsWith('5') ? 5 : 10;
      setData((d) => ({
        ...d,
        payments: {
          ...d.payments,
          [studentId]: (d.payments[studentId] || []).filter((x) => x.id !== paymentId),
        },
        students: d.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                remaining: +(Number(s.remaining) - size).toFixed(2),
                size: Math.max(0, Number(s.size) - size),
              }
            : s,
        ),
      }));
      try {
        await authedFetch('/api/delete-payment', {
          method: 'POST',
          body: JSON.stringify({ id: paymentId, studentId, packSize: size }),
        });
      } catch (err) {
        setError(err);
        reload();
      }
    },
    [authedFetch, data.payments, reload],
  );

  const logPayment = useCallback(
    async ({ payment, studentId, packSize, valuePer, pack }) => {
      setData((d) => ({
        ...d,
        payments: {
          ...d.payments,
          [studentId]: [payment, ...(d.payments[studentId] || [])],
        },
        students: d.students.map((s) =>
          s.id === studentId
            ? {
                ...s,
                pack: pack ?? s.pack,
                valuePer: valuePer ?? s.valuePer,
                remaining: +(Number(s.remaining) + Number(packSize)).toFixed(2),
                size: s.size + Number(packSize),
              }
            : s,
        ),
      }));
      try {
        await authedFetch('/api/log-payment', {
          method: 'POST',
          body: JSON.stringify({ payment, studentId, packSize, valuePer, pack }),
        });
      } catch (err) {
        setError(err);
        reload();
      }
    },
    [authedFetch, reload],
  );

  return {
    status,
    error,
    students: data.students,
    sessions: data.sessions,
    payments: data.payments,
    reload,
    addStudent,
    updateStudent,
    archiveStudent,
    deleteStudent,
    logLesson,
    logPayment,
    deleteSession,
    deletePayment,
  };
}
