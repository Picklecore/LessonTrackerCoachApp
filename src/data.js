const data = {
  coach: { name: 'Coach', initials: 'C' },

  students: [],

  sessions: {},

  payments: {},

  week: [
    { dow: 'Sun', d: 17, count: 0 },
    { dow: 'Mon', d: 18, count: 0 },
    { dow: 'Tue', d: 19, count: 0, today: true },
    { dow: 'Wed', d: 20, count: 0 },
    { dow: 'Thu', d: 21, count: 0 },
    { dow: 'Fri', d: 22, count: 0 },
    { dow: 'Sat', d: 23, count: 0 },
  ],

  schedule: {},
};

export default data;
