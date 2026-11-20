// Pure message builders (no Discord / network), so they can be unit tested.

/** Number of periods always shown, even when empty. */
export const DEFAULT_PERIODS = 4;

/** Date -> "YYYY-MM-DD" using the Date's local fields. */
export function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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
