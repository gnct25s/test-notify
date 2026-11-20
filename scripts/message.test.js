import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchSchedule, fetchSubjects } from "./api.js";
import {
  formatDate,
  formatPeriod,
  generateScheduleMessage,
} from "./message.js";

const subjects = [
  { id: 25, name: "倫理", color: "#fde68a", sort_order: 0, archived: false },
  { id: 21, name: "数学A1", color: "#bfdbfe", sort_order: 0, archived: false },
];

describe("formatDate", () => {
  it("zero-pads", () => {
    assert.equal(formatDate(new Date(2026, 0, 5)), "2026-01-05");
  });
});

describe("formatPeriod", () => {
  it("combines subject and content", () => {
    assert.equal(formatPeriod({ subject: 25, content: "微分" }, subjects), "倫理 — 微分");
    assert.equal(formatPeriod({ subject: 21, content: "" }, subjects), "数学A1");
    assert.equal(formatPeriod({ subject: 0, content: "集会" }, subjects), "集会");
    assert.equal(formatPeriod({ subject: 99, content: "" }, subjects), "#99");
    assert.equal(formatPeriod(undefined, subjects), "");
  });
});

describe("generateScheduleMessage", () => {
  it("lists 4 periods by default", () => {
    const schedule = {
      schedule_date: "2026-11-20",
      periods: { 1: { subject: 25, content: "微分" }, 2: { subject: 21, content: "" } },
    };
    assert.equal(
      generateScheduleMessage("2026-11-20", schedule, subjects),
      "[2026-11-20の予定]\n1限: 倫理 — 微分\n2限: 数学A1\n3限: \n4限:",
    );
  });

  it("shows a 5th period when registered", () => {
    const schedule = { periods: { 5: { subject: 21, content: "補講" } } };
    assert.match(generateScheduleMessage("2026-11-20", schedule, subjects), /5限: 数学A1 — 補講$/);
  });
});

describe("api", () => {
  const mock = (status, body) => async () =>
    new Response(JSON.stringify(body), { status });

  it("returns null for an unregistered day", async () => {
    assert.equal(await fetchSchedule("2026-11-21", mock(404, { error: "schedule not found" })), null);
  });

  it("throws on other errors", async () => {
    await assert.rejects(fetchSchedule("2026-11-21", mock(500, {})));
  });

  it("reads subjects", async () => {
    assert.deepEqual(await fetchSubjects(mock(200, { subjects })), subjects);
  });
});
