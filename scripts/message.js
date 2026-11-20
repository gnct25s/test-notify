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

/** "YYYY-MM-DD HH:MM:SS" in JST (the API's timestamp format). */
export function jstTimestamp(now = new Date()) {
  const jst = new Date(now.getTime() + JST_OFFSET_MS);
  return `${jstDate(0, now)} ${pad(jst.getUTCHours())}:${pad(jst.getUTCMinutes())}:${pad(jst.getUTCSeconds())}`;
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

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

/** JST "YYYY-MM-DD HH:MM[:SS]" from the API -> absolute Date. */
export function parseJst(value) {
  const [date, time = "00:00:00"] = value.split(" ");
  const [h = "00", m = "00", s = "00"] = time.split(":");
  return new Date(`${date}T${h}:${m}:${s}+09:00`);
}

/** "2026-11-27 23:59:00" -> "11/27(金) 23:59" */
export function formatDeadline(deadline) {
  const [date, time = "00:00"] = deadline.split(" ");
  const [y, mo, d] = date.split("-").map(Number);
  const weekday = WEEKDAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return `${pad(mo)}/${pad(d)}(${weekday}) ${time.slice(0, 5)}`;
}

/** "あと3日" / "あと5時間" / "あと20分" / "締切済み" */
export function formatRemaining(deadline, now = new Date()) {
  const diff = parseJst(deadline).getTime() - now.getTime();
  if (diff < 0) return "締切済み";

  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `あと${Math.max(1, minutes)}分`;
  if (minutes < 24 * 60) return `あと${Math.floor(minutes / 60)}時間`;
  return `あと${Math.floor(minutes / (24 * 60))}日`;
}

/**
 * [締切が近い課題]
 * ・11/20(金) 23:59（あと2時間）[情報処理1] C言語 演習 7 / WebClass
 */
export function generateAssignmentsMessage(assignments, subjects, now = new Date()) {
  if (assignments.length === 0) return "締切前の課題はありません 🎉";

  const lines = ["[締切が近い課題]"];
  for (const a of assignments) {
    const subject =
      subjects.find((s) => s.id === a.subject_id)?.name ?? `#${a.subject_id}`;
    const urgent = parseJst(a.deadline).getTime() - now.getTime() < 24 * 60 * 60 * 1000;
    const method = a.method ? ` / ${a.method}` : "";

    lines.push(
      `・${formatDeadline(a.deadline)}（${urgent ? "⚠️ " : ""}${formatRemaining(a.deadline, now)}）[${subject}] ${a.title}${method}`,
    );
  }

  return lines.join("\n");
}
