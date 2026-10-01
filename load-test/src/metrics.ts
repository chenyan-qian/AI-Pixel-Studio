export type Phase = "warmup" | "measurement";

export interface SendRecord {
  clientId: number;
  sequence: number;
  phase: Phase;
  sendTimestamp: number;
  x: number;
  y: number;
  color: string;
  receivedBy: Set<number>;
}

export interface LatencyStats {
  minimum: number | null;
  average: number | null;
  p50: number | null;
  p95: number | null;
  p99: number | null;
  maximum: number | null;
  samples: number;
}

export function fingerprint(x: number, y: number, color: string): string {
  return `${x}:${y}:${color.toUpperCase()}`;
}

export function percentile(sorted: number[], fraction: number): number | null {
  if (!sorted.length) return null;
  const index = (sorted.length - 1) * fraction;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (index - lower);
}

export function summarize(values: number[]): LatencyStats {
  if (!values.length) return { minimum: null, average: null, p50: null, p95: null, p99: null, maximum: null, samples: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  return {
    minimum: sorted[0],
    average: values.reduce((sum, value) => sum + value, 0) / values.length,
    p50: percentile(sorted, 0.5),
    p95: percentile(sorted, 0.95),
    p99: percentile(sorted, 0.99),
    maximum: sorted[sorted.length - 1],
    samples: values.length,
  };
}

export class BroadcastTracker {
  private readonly sent = new Map<string, SendRecord>();
  private readonly latencies: number[] = [];
  private readonly warmupLatencies: number[] = [];
  warmupSent = 0;
  measurementSent = 0;
  actualBroadcast = 0;
  warmupBroadcast = 0;
  duplicate = 0;
  warmupDuplicate = 0;
  unexpected = 0;
  rawPixelChanges = 0;

  constructor(private readonly clients: number) {}

  register(record: Omit<SendRecord, "receivedBy">): void {
    const key = fingerprint(record.x, record.y, record.color);
    if (this.sent.has(key)) throw new Error(`Duplicate test fingerprint: ${key}`);
    this.sent.set(key, { ...record, receivedBy: new Set<number>() });
    if (record.phase === "measurement") this.measurementSent++;
    else this.warmupSent++;
  }

  cancel(x: number, y: number, color: string): void {
    const key = fingerprint(x, y, color);
    const record = this.sent.get(key);
    if (!record) return;
    this.sent.delete(key);
    if (record.phase === "measurement") this.measurementSent--;
    else this.warmupSent--;
  }

  receive(clientId: number, changes: unknown, receiveTimestamp: number): void {
    if (!Array.isArray(changes)) {
      this.unexpected++;
      return;
    }
    for (const value of changes) {
      this.rawPixelChanges++;
      if (!value || typeof value !== "object") { this.unexpected++; continue; }
      const change = value as Record<string, unknown>;
      if (!Number.isInteger(change.x) || !Number.isInteger(change.y) || typeof change.color !== "string") {
        this.unexpected++;
        continue;
      }
      const record = this.sent.get(fingerprint(change.x as number, change.y as number, change.color));
      if (!record || record.clientId === clientId || clientId < 0 || clientId >= this.clients) {
        this.unexpected++;
        continue;
      }
      if (record.receivedBy.has(clientId)) {
        if (record.phase === "measurement") this.duplicate++;
        else this.warmupDuplicate++;
        continue;
      }
      record.receivedBy.add(clientId);
      const latency = receiveTimestamp - record.sendTimestamp;
      if (record.phase === "measurement") {
        this.actualBroadcast++;
        this.latencies.push(latency);
      } else {
        this.warmupBroadcast++;
        this.warmupLatencies.push(latency);
      }
    }
  }

  sentRecords() {
    return [...this.sent.values()].map(({ clientId, sequence, phase, sendTimestamp, x, y, color, receivedBy }) => ({
      clientId, sequence, phase, sendTimestamp, x, y, color, receivedBy: [...receivedBy].sort((a, b) => a - b),
    }));
  }

  report() {
    const expectedBroadcast = this.measurementSent * (this.clients - 1);
    return {
      sent: this.measurementSent,
      warmupSent: this.warmupSent,
      expectedBroadcast,
      actualBroadcast: this.actualBroadcast,
      missing: expectedBroadcast - this.actualBroadcast,
      duplicate: this.duplicate,
      warmupDuplicate: this.warmupDuplicate,
      unexpected: this.unexpected,
      rawPixelChanges: this.rawPixelChanges,
      warmupBroadcast: this.warmupBroadcast,
      latency: summarize(this.latencies),
    };
  }
}
