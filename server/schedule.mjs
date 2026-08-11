const SESSION_DAYS = new Set([0, 6]);

export function isSessionDay(date) {
  const day = new Date(`${date}T12:00:00Z`).getUTCDay();
  return SESSION_DAYS.has(day);
}

export function isAttendanceOpen({ date, today, startDate }) {
  return date === today && date >= startDate && isSessionDay(date);
}

export function nextSessionDate(today, startDate) {
  let date = today < startDate ? startDate : today;
  for (let offset = 0; offset < 8; offset += 1) {
    const candidate = new Date(`${date}T12:00:00Z`);
    candidate.setUTCDate(candidate.getUTCDate() + offset);
    const value = candidate.toISOString().slice(0, 10);
    if (value >= startDate && isSessionDay(value)) return value;
  }
  return startDate;
}
