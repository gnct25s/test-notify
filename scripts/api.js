// Client for test-notice-api v2 (https://github.com/gnct25s/test-notice-api).

export const API_ENDPOINT =
  process.env.API_ENDPOINT ||
  "https://test-notice-worker.sora81dev.workers.dev/api/v2";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

async function getJson(path, fetcher = fetch) {
  const res = await fetcher(`${API_ENDPOINT}${path}`);

  if (!res.ok) {
    let message = `${res.status} ${res.statusText}`;
    try {
      const json = await res.json();
      if (typeof json?.error === "string") message = json.error;
    } catch {
      // non-JSON error body
    }
    throw new ApiError(res.status, message);
  }

  return res.json();
}

/**
 * Schedule of one day ("YYYY-MM-DD").
 * @returns {Promise<{ schedule_date: string, periods: Record<string, { subject: number, content: string }> } | null>}
 *   `null` when nothing is registered for that day.
 */
export async function fetchSchedule(date, fetcher = fetch) {
  try {
    return await getJson(
      `/schedule/date?date=${encodeURIComponent(date)}`,
      fetcher,
    );
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

/**
 * All subjects, including archived ones (old schedules may still use them).
 * @returns {Promise<Array<{ id: number, name: string, color: string, sort_order: number, archived: boolean }>>}
 */
export async function fetchSubjects(fetcher = fetch) {
  const json = await getJson("/subject?include_archived=1", fetcher);
  return json.subjects;
}
