// Plan morning-digest § 1. The contract section 2 builds against; the reader comes later.

export type RunStatus = 'ok' | 'retry' | 'fail';

// One line of runs/<night>.jsonl, after parsing.
export type RunLine = {
  at: string;
  job: string;
  status: RunStatus;
  owner: string | null;
  error?: string;
};

// One row per job for the night. Times keep the log's offset, never converted to UTC.
export type DigestRow = {
  job: string;
  owner: string | null; // null renders as `—`
  runs: number; // lines for this job, any status
  retries: number; // lines with status `retry`
  lastStatus: RunStatus;
  lastError: string | null; // `error` of the last line that had one
  firstAt: string;
  lastAt: string;
};

export type DigestNight = {
  night: string; // YYYY-MM-DD
  rows: DigestRow[]; // sorted by job
  badLines: number; // lines that didn't parse: counted, never thrown
};

// null when runs/<night>.jsonl doesn't exist (the page answers 404). An empty file gives
// `rows: []`.
export type ReadNight = (runsDir: string, night: string) => DigestNight | null;
