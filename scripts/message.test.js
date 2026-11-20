import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { fetchAssignments, fetchSchedule, fetchSubjects } from "./api.js";
import {
  formatDeadline,
  formatPeriod,
  formatRemaining,
  generateAssignmentsMessage,
  generateScheduleMessage,
  jstDate,
  jstDateTime,
  jstTimestamp,
} from "./message.js";

const subjects = [
  { id: 25, name: "倫理", color: "#fde68a", sort_order: 0, archived: false },
  { id: 21, name: "数学A1", color: "#bfdbfe", sort_order: 0, archived: false },
];

describe("jstDate", () => {
  // 2026-11-20 23:30 UTC = 2026-11-21 08:30 JST
  const now = new Date("2026-11-20T23:30:00Z");

  it("uses the JST calendar date, not the host one", () => {
    assert.equal(jstDate(0, now), "2026-11-21");
    assert.equal(jstDate(1, now), "2026-11-22");
    assert.equal(jstDateTime(now), "2026-11-21 08:30");
  });

  it("crosses month and year boundaries", () => {
    assert.equal(jstDate(1, new Date("2026-11-30T03:00:00Z")), "2026-12-01");
    assert.equal(jstDate(1, new Date("2026-12-31T03:00:00Z")), "2027-01-01");
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

describe("assignments message", () => {
  const now = new Date("2026-11-20T12:00:00+09:00");
  const assignments = [
    { id: 3, subject_id: 25, title: "C言語 演習 7", content: null, method: "WebClass", deadline: "2026-11-20 23:59:00" },
    { id: 1, subject_id: 21, title: "課題プリント 3", content: "p.12", method: null, deadline: "2026-11-27 23:59:00" },
    { id: 9, subject_id: 99, title: "謎の課題", content: null, method: null, deadline: "2026-11-20 12:30:00" },
  ];

  it("formats deadline and remaining time", () => {
    assert.equal(formatDeadline("2026-11-27 23:59:00"), "11/27(金) 23:59");
    assert.equal(formatRemaining("2026-11-20 12:30:00", now), "あと30分");
    assert.equal(formatRemaining("2026-11-20 23:59:00", now), "あと11時間");
    assert.equal(formatRemaining("2026-11-27 23:59:00", now), "あと7日");
    assert.equal(formatRemaining("2026-11-20 11:00:00", now), "締切済み");
  });

  it("lists assignments with subject names", () => {
    assert.equal(
      generateAssignmentsMessage(assignments, subjects, now),
      [
        "[締切が近い課題]",
        "・11/20(金) 23:59（⚠️ あと11時間）[倫理] C言語 演習 7 / WebClass",
        "・11/27(金) 23:59（あと7日）[数学A1] 課題プリント 3",
        "・11/20(金) 12:30（⚠️ あと30分）[#99] 謎の課題",
      ].join("\n"),
    );
  });

  it("says so when there is nothing due", () => {
    assert.equal(generateAssignmentsMessage([], subjects, now), "締切前の課題はありません 🎉");
  });

  it("builds the API query", async () => {
    let url;
    const fetcher = async (input) => {
      url = String(input);
      return new Response(JSON.stringify({ assignments }), { status: 200 });
    };
    assert.deepEqual(await fetchAssignments({ count: 3, since: "2026-11-20 12:00:00" }, fetcher), assignments);
    assert.match(url, /\/assignment\/data\?count=3&since=2026-11-20\+12%3A00%3A00$/);
  });

  it("formats the JST timestamp used as `since`", () => {
    assert.equal(jstTimestamp(new Date("2026-11-20T15:04:05Z")), "2026-11-21 00:04:05");
  });
});
