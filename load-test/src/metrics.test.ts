import assert from "node:assert/strict";
import test from "node:test";
import { BroadcastTracker, fingerprint, summarize } from "./metrics.js";

test("counts only distinct non-sender recipients and reports missing broadcasts", () => {
  const tracker = new BroadcastTracker(3);
  tracker.register({ clientId: 0, sequence: 0, phase: "measurement", sendTimestamp: 100, x: 1, y: 2, color: "#AA0001" });
  tracker.receive(1, [{ x: 1, y: 2, color: "#aa0001" }], 105);
  tracker.receive(1, [{ x: 1, y: 2, color: "#AA0001" }], 106);
  tracker.receive(0, [{ x: 1, y: 2, color: "#AA0001" }], 107);
  assert.equal(tracker.report().expectedBroadcast, 2);
  assert.equal(tracker.report().actualBroadcast, 1);
  assert.equal(tracker.report().missing, 1);
  assert.equal(tracker.report().duplicate, 1);
  assert.equal(tracker.report().unexpected, 1);
  assert.equal(tracker.report().latency.minimum, 5);
});

test("warmup deliveries do not inflate measurement totals", () => {
  const tracker = new BroadcastTracker(2);
  tracker.register({ clientId: 0, sequence: 0, phase: "warmup", sendTimestamp: 1, x: 0, y: 0, color: "#000001" });
  tracker.receive(1, [{ x: 0, y: 0, color: "#000001" }], 2);
  assert.equal(tracker.report().sent, 0);
  assert.equal(tracker.report().actualBroadcast, 0);
  assert.equal(tracker.report().warmupBroadcast, 1);
});

test("percentiles use measured samples", () => {
  assert.equal(summarize([]).p95, null);
  assert.equal(summarize([1, 2, 3, 4, 5]).p50, 3);
  assert.equal(summarize([1, 2, 3, 4, 5]).p95, 4.8);
  assert.equal(fingerprint(1, 2, "#aa0001"), "1:2:#AA0001");
});
