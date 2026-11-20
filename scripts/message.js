// Pure message builders (no Discord / network), so they can be unit tested.

/** Number of periods always shown, even when empty. */
export const DEFAULT_PERIODS = 4;

export const TIMEZONE = "Asia/Tokyo";

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const pad = (n) => String(n).padStart(2, "0");

/**
 * JST calendar date "YYYY-MM-DD", `offsetDays` days from `now`.
 * Independent of the host time zone (Docker images usually run in UTC).
 */
export function jstDate(offsetDays = 0, now = new Date()) {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  jst.setUTCDate(jst.getUTCDate() + offsetDays);
  return `${jst.getUTCFullYear()}-${pad(jst.getUTCMonth() + 1)}-${pad(jst.getUTCDate())}`;
}

/** "YYYY-MM-DD HH:MM" in JST, for logs. */
export function jstDateTime(now = new Date()) {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return `${jstDate(0, now)} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}`;
}

/** "倫理 — 微分" / "倫理" / "微分" / "" for one period. Subject 0 means "no class". */
export function formatPeriod(period, subjects) {
  if (!period) return "";

  const subject =
    period.subject === 0
      ? ""
      : (subjects.find((s) => s.id === period.subject)?.name ??
        `#${period.subject}`);
  const content = period.content?.trim() ?? "";

  if (subject && content) return `${subject} — ${content}`;
  return subject || content;
}

/**
 * [2026-11-20の予定]
 * 1限: 倫理 — 微分
 * 2限: 数学A1
 * ...
 */
export function generateScheduleMessage(date, schedule, subjects) {
  const periods = schedule?.periods ?? {};
  const last = Math.max(
    DEFAULT_PERIODS,
    ...Object.keys(periods)
      .map(Number)
      .filter((n) => Number.isInteger(n)),
  );

  const lines = [`[${date}の予定]`];
  for (let i = 1; i <= last; i++) {
    lines.push(`${i}限: ${formatPeriod(periods[String(i)], subjects)}`);
  }

  return lines.join("\n").trim();
}
