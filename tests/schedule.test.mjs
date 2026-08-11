import test from "node:test";
import assert from "node:assert/strict";
import { isAttendanceOpen, nextSessionDate } from "../server/schedule.mjs";

const startDate = "2026-08-15";

test("attendance starts on Saturday 15 August 2026", () => {
  assert.equal(isAttendanceOpen({ date: "2026-08-15", today: "2026-08-15", startDate }), true);
});

test("attendance is open on Sundays after launch", () => {
  assert.equal(isAttendanceOpen({ date: "2026-08-16", today: "2026-08-16", startDate }), true);
});

test("attendance is closed before launch and on weekdays", () => {
  assert.equal(isAttendanceOpen({ date: "2026-08-09", today: "2026-08-09", startDate }), false);
  assert.equal(isAttendanceOpen({ date: "2026-08-17", today: "2026-08-17", startDate }), false);
});

test("teachers cannot write for a date other than today", () => {
  assert.equal(isAttendanceOpen({ date: "2026-08-16", today: "2026-08-15", startDate }), false);
});

test("next session resolves to launch Saturday from the current Tuesday", () => {
  assert.equal(nextSessionDate("2026-08-11", startDate), "2026-08-15");
});
