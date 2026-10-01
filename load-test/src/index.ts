import { randomInt } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";
import WebSocket, { type RawData } from "ws";
import { BroadcastTracker, summarize, type Phase } from "./metrics.js";

const DEFAULT_STAGES = [5, 10, 20, 50];
const WARMUP_SECONDS = 10;
const DRAIN_SECONDS = 10;
const CONNECT_TIMEOUT_MS = 20_000;
const CLOSE_TIMEOUT_MS = 5_000;
const MAX_SAMPLES = 100;

interface Options {
  clients: number[];
  duration: number;
  rate: number;
  baseUrl: URL;
  artworkId: number;
  tokens: string[];
  origin?: string;
}

interface Timing {
  clientId: number;
  connectStart: string;
  socketOpenMs: number | null;
  canvasStateMs: number | null;
  roomStateMs: number | null;
  readyMs: number | null;
  closeCode: number | null;
}

class Errors {
  total = 0;
  readonly byType: Record<string, number> = {};
  readonly samples: string[] = [];

  add(type: string, detail: string): void {
    this.total++;
    this.byType[type] = (this.byType[type] ?? 0) + 1;
    if (this.samples.length < MAX_SAMPLES) this.samples.push(`${type}: ${detail}`);
  }

  report() { return { total: this.total, byType: this.byType, samples: this.samples }; }
}

let stopRequested = false;
process.on("SIGINT", () => { stopRequested = true; });
process.on("SIGTERM", () => { stopRequested = true; });

function usage(): string {
  return `Usage: npm run test -- --url ws://localhost:8080 --artworkId 123 --token JWT [options]

Options:
  --clients N       Run one stage (1-50). Omit for 5, 10, 20, 50 stages.
  --duration SEC    Measurement length per stage (default: 60).
  --rate N          Messages per second per client (default: 1).
  --url URL         Isolated WebSocket base URL, without /ws/artwork or query.
  --artworkId ID    Dedicated collaboration artwork ID.
  --token JWT       Reuse one real JWT for all clients.
  --token-file PATH One JWT per line; requires at least as many as the largest stage.
  --origin ORIGIN   Optional Origin header if the isolated server requires it.
  --help            Show this help without connecting.

Set PIXELVERSE_LOAD_TEST_ISOLATED=YES after checking the target backend uses an
isolated database. Only loopback hosts are allowed unless the exact hostname
appears in PIXELVERSE_LOAD_TEST_ALLOWED_HOSTS (comma-separated).`;
}

function numeric(value: string | undefined, flag: string, integer = false): number {
  const parsed = Number(value);
  if (value === undefined || !Number.isFinite(parsed) || parsed <= 0 || (integer && !Number.isSafeInteger(parsed))) {
    throw new Error(`${flag} must be a positive ${integer ? "integer" : "number"}`);
  }
  return parsed;
}

async function parseOptions(args: string[]): Promise<Options | null> {
  if (args.includes("--help")) { console.log(usage()); return null; }
  const allowed = new Set(["--clients", "--duration", "--rate", "--url", "--artworkId", "--token", "--token-file", "--origin"]);
  const values = new Map<string, string>();
  for (let index = 0; index < args.length; index += 2) {
    const flag = args[index];
    const value = args[index + 1];
    if (!allowed.has(flag) || !value || value.startsWith("--") || values.has(flag)) throw new Error(`Invalid or repeated argument: ${flag}`);
    values.set(flag, value);
  }
  if (process.env.PIXELVERSE_LOAD_TEST_ISOLATED !== "YES") {
    throw new Error("Set PIXELVERSE_LOAD_TEST_ISOLATED=YES only after verifying the backend and database are isolated");
  }
  const rawUrl = values.get("--url");
  if (!rawUrl) throw new Error("--url is required; there is no default target");
  const baseUrl = new URL(rawUrl);
  if (!["ws:", "wss:"].includes(baseUrl.protocol) || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash || baseUrl.pathname !== "/") {
    throw new Error("--url must be a ws:// or wss:// base address with no credentials, path or query");
  }
  const hostname = baseUrl.hostname.toLowerCase();
  const allowlist = (process.env.PIXELVERSE_LOAD_TEST_ALLOWED_HOSTS ?? "").split(",").map((host) => host.trim().toLowerCase());
  if (!["localhost", "127.0.0.1", "[::1]", "::1"].includes(hostname) && !allowlist.includes(hostname)) {
    throw new Error(`Host ${hostname} is not loopback or in PIXELVERSE_LOAD_TEST_ALLOWED_HOSTS`);
  }
  const artworkId = numeric(values.get("--artworkId"), "--artworkId", true);
  const clients = values.has("--clients") ? [numeric(values.get("--clients"), "--clients", true)] : DEFAULT_STAGES;
  if (clients.some((count) => count > 50)) throw new Error("--clients is limited to 50");
  const duration = values.has("--duration") ? numeric(values.get("--duration"), "--duration") : 60;
  const rate = values.has("--rate") ? numeric(values.get("--rate"), "--rate") : 1;
  if (rate > 1000) throw new Error("--rate is limited to 1000 messages/s/client");
  if (values.has("--token") === values.has("--token-file")) throw new Error("Provide exactly one of --token and --token-file");
  const tokens = values.has("--token")
    ? [values.get("--token")!]
    : (await readFile(values.get("--token-file")!, "utf8")).split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  if (tokens.length < (values.has("--token") ? 1 : Math.max(...clients))) throw new Error("Token file has fewer tokens than requested clients");
  const origin = values.get("--origin");
  if (origin) {
    const parsedOrigin = new URL(origin);
    if (!["http:", "https:"].includes(parsedOrigin.protocol) || parsedOrigin.origin !== origin || parsedOrigin.username || parsedOrigin.password) {
      throw new Error("--origin must be an HTTP(S) origin without credentials, path or query");
    }
  }
  return { clients, duration, rate, baseUrl, artworkId, tokens, origin };
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function waitUntil(deadline: number): Promise<void> {
  while (!stopRequested && performance.now() < deadline) await sleep(Math.min(500, deadline - performance.now()));
}

class VirtualClient {
  readonly socket: WebSocket;
  readonly timing: Timing;
  readonly ready: Promise<boolean>;
  readonly closed: Promise<void>;
  width: number | null = null;
  height: number | null = null;
  sequence = 0;
  x = 0;
  y = 0;
  closing = false;
  receivedFrames = 0;
  readonly receivedByType: Record<string, number> = {};
  private readonly start = performance.now();
  private resolveReady!: (value: boolean) => void;
  private resolveClosed!: () => void;
  private settled = false;
  private timeout: NodeJS.Timeout;

  constructor(
    readonly id: number,
    url: string,
    origin: string | undefined,
    private readonly artworkId: number,
    private readonly tracker: BroadcastTracker,
    private readonly errors: Errors,
  ) {
    this.timing = { clientId: id, connectStart: new Date().toISOString(), socketOpenMs: null, canvasStateMs: null, roomStateMs: null, readyMs: null, closeCode: null };
    this.ready = new Promise((resolve) => { this.resolveReady = resolve; });
    this.closed = new Promise((resolve) => { this.resolveClosed = resolve; });
    this.socket = new WebSocket(url, { ...(origin ? { origin } : {}), handshakeTimeout: CONNECT_TIMEOUT_MS });
    this.socket.on("open", () => { this.timing.socketOpenMs = performance.now() - this.start; });
    this.socket.on("message", (data: RawData) => this.onMessage(data));
    this.socket.on("error", (error: Error) => this.errors.add("socket_error", `client ${id}: ${error.message}`));
    this.socket.on("close", (code: number) => {
      this.timing.closeCode = code;
      if (!this.closing) this.errors.add("unexpected_close", `client ${id}: code ${code}`);
      this.finishReady(false);
      this.resolveClosed();
    });
    this.timeout = setTimeout(() => {
      if (this.settled) return;
      this.errors.add("ready_timeout", `client ${id} did not receive both initial states within ${CONNECT_TIMEOUT_MS}ms`);
      this.socket.terminate();
      this.finishReady(false);
    }, CONNECT_TIMEOUT_MS);
  }

  private finishReady(value: boolean): void {
    if (this.settled) return;
    this.settled = true;
    clearTimeout(this.timeout);
    if (value) this.timing.readyMs = performance.now() - this.start;
    this.resolveReady(value);
  }

  private onMessage(data: RawData): void {
    let event: Record<string, unknown>;
    try {
      const parsed: unknown = JSON.parse(data.toString());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("expected a JSON object");
      event = parsed as Record<string, unknown>;
    } catch {
      this.errors.add("invalid_json", `client ${this.id} received an invalid JSON message`);
      return;
    }
    this.receivedFrames++;
    const type = typeof event.type === "string" ? event.type : "UNKNOWN";
    this.receivedByType[type] = (this.receivedByType[type] ?? 0) + 1;
    if (type === "CURSOR_UPDATE") return;
    if (event.artworkId !== this.artworkId) {
      this.errors.add("wrong_artwork", `client ${this.id} received artworkId ${String(event.artworkId)}`);
      return;
    }
    const now = performance.now();
    if (event.type === "CANVAS_STATE" && this.timing.canvasStateMs === null) {
      const grid = event.pixelGrid;
      if (!Array.isArray(grid) || !grid.length || !Array.isArray(grid[0]) || !grid[0].length || !grid.every((row) => Array.isArray(row) && row.length === grid[0].length)) {
        this.errors.add("invalid_canvas", `client ${this.id} received an unusable canvas`);
        return;
      }
      this.width = grid[0].length;
      this.height = grid.length;
      this.timing.canvasStateMs = now - this.start;
    } else if (event.type === "ROOM_STATE" && this.timing.roomStateMs === null) {
      if (!Array.isArray(event.onlineUsers)) {
        this.errors.add("invalid_room_state", `client ${this.id} received an invalid room state`);
        return;
      }
      this.timing.roomStateMs = now - this.start;
    } else if (event.type === "PIXEL_BATCH") {
      this.tracker.receive(this.id, event.changes, now);
    }
    if (this.timing.canvasStateMs !== null && this.timing.roomStateMs !== null) this.finishReady(true);
  }
}

function assignCoordinates(clients: VirtualClient[], errors: Errors): boolean {
  const width = clients[0].width;
  const height = clients[0].height;
  if (width === null || height === null || !Number.isSafeInteger(width * height) || width * height < clients.length) {
    errors.add("canvas_too_small", `canvas has fewer than ${clients.length} usable coordinates`);
    return false;
  }
  if (clients.some((client) => client.width !== width || client.height !== height)) {
    errors.add("canvas_mismatch", "clients received different canvas dimensions");
    return false;
  }
  for (const client of clients) {
    const cell = Math.floor(((client.id + 0.5) * width * height) / clients.length);
    client.x = cell % width;
    client.y = Math.floor(cell / width);
  }
  return true;
}

async function sendPhase(clients: VirtualClient[], phase: Phase, seconds: number, rate: number, artworkId: number, tracker: BroadcastTracker, errors: Errors, colorSeed: number): Promise<void> {
  const start = performance.now();
  const deadline = start + seconds * 1000;
  await Promise.all([
    waitUntil(deadline),
    ...clients.map(async (client) => {
      for (let slot = 0; !stopRequested; slot++) {
        const due = start + (slot * 1000) / rate;
        if (due >= deadline) break;
        await waitUntil(due);
        if (stopRequested || performance.now() >= deadline) break;
        if (client.socket.readyState !== WebSocket.OPEN) {
          errors.add("send_closed", `client ${client.id} closed before scheduled send`);
          break;
        }
        const sequence = client.sequence++;
        const ordinal = sequence * clients.length + client.id;
        if (ordinal >= 0x1000000) {
          errors.add("color_exhausted", `client ${client.id} exhausted unique colors`);
          break;
        }
        const color = `#${((colorSeed + ordinal) & 0xffffff).toString(16).toUpperCase().padStart(6, "0")}`;
        const sendTimestamp = performance.now();
        tracker.register({ clientId: client.id, sequence, phase, sendTimestamp, x: client.x, y: client.y, color });
        try {
          client.socket.send(JSON.stringify({ type: "PIXEL_BATCH", artworkId, changes: [{ x: client.x, y: client.y, color, softness: 0, overridden: true }] }), (error?: Error) => {
            if (error) errors.add("send_callback_error", `client ${client.id}: ${error.message}`);
          });
        } catch (error) {
          tracker.cancel(client.x, client.y, color);
          errors.add("send_exception", `client ${client.id}: ${error instanceof Error ? error.message : String(error)}`);
          break;
        }
      }
    }),
  ]);
}

async function closeAll(clients: VirtualClient[], errors: Errors): Promise<boolean> {
  for (const client of clients) {
    client.closing = true;
    if (client.socket.readyState === WebSocket.OPEN) client.socket.close(1000, "load test complete");
    else if (client.socket.readyState === WebSocket.CONNECTING) client.socket.terminate();
  }
  await Promise.race([Promise.all(clients.map((client) => client.closed)), sleep(CLOSE_TIMEOUT_MS)]);
  for (const client of clients) if (client.socket.readyState !== WebSocket.CLOSED) client.socket.terminate();
  await Promise.race([Promise.all(clients.map((client) => client.closed)), sleep(1000)]);
  const allClosed = clients.every((client) => client.socket.readyState === WebSocket.CLOSED);
  if (!allClosed) errors.add("close_timeout", "at least one WebSocket did not close locally");
  return allClosed;
}

function numberText(value: number | null): string { return value === null ? "N/A" : value.toFixed(2); }

function printStage(stage: Awaited<ReturnType<typeof runStage>>): void {
  console.log(`\n==============================\nWebSocket Load Test\nClients: ${stage.clients}\nDuration: ${stage.duration}s\nRate: ${stage.rate} msg/s/client\nStatus: ${stage.status}\n==============================`);
  console.log(`Connections:\nAttempts: ${stage.connections.attempts}\nSuccess (socket open): ${stage.connections.success}\nFailed: ${stage.connections.failed}\nSuccess Rate: ${stage.connections.successRate.toFixed(2)}%\nReady: ${stage.connections.ready}`);
  console.log(`Connection timing (ms):\nOpen average: ${numberText(stage.connections.establishMs.average)}\nOpen P95: ${numberText(stage.connections.establishMs.p95)}\nFirst canvas average: ${numberText(stage.connections.canvasStateMs.average)}\nFirst room state average: ${numberText(stage.connections.roomStateMs.average)}\nReady average: ${numberText(stage.connections.readyMs.average)}`);
  console.log(`Messages:\nSent (measurement): ${stage.messages.sent}\nSent (warmup): ${stage.messages.warmupSent}\nExpected Broadcast: ${stage.expectedBroadcast}\nReceived: ${stage.actualBroadcast}\nAll inbound frames: ${stage.messages.receivedFrames}\nMissing: ${stage.missing}\nDuplicate: ${stage.duplicate}\nUnexpected: ${stage.messages.unexpected}`);
  console.log(`Latency (ms):\nMin: ${numberText(stage.latency.minimum)}\nAverage: ${numberText(stage.latency.average)}\nP50: ${numberText(stage.latency.p50)}\nP95: ${numberText(stage.latency.p95)}\nP99: ${numberText(stage.latency.p99)}\nMax: ${numberText(stage.latency.maximum)}`);
  console.log(`Errors: ${stage.errors.total} ${JSON.stringify(stage.errors.byType)}\nDatabase pixel_operation rows: not collected; sent pixel changes: ${stage.dataAudit.submittedPixelChanges}\nOnline count change: not collected`);
}

async function runStage(options: Options, count: number) {
  const stageStart = new Date().toISOString();
  const errors = new Errors();
  const tracker = new BroadcastTracker(count);
  const clients: VirtualClient[] = [];
  console.log(`Starting ${count}-client stage against ${options.baseUrl.host}, artwork ${options.artworkId}`);
  for (let id = 0; id < count; id++) {
    const url = new URL(`/ws/artwork/${options.artworkId}`, options.baseUrl);
    url.searchParams.set("token", options.tokens.length === 1 ? options.tokens[0] : options.tokens[id]);
    try { clients.push(new VirtualClient(id, url.toString(), options.origin, options.artworkId, tracker, errors)); }
    catch (error) { errors.add("connect_exception", `client ${id}: ${error instanceof Error ? error.message : String(error)}`); }
  }
  const readyResults = await Promise.all(clients.map((client) => client.ready));
  const ready = readyResults.filter(Boolean).length;
  let status = "completed";
  let measurementStart: string | null = null;
  let measurementEnd: string | null = null;
  if (ready !== count || !assignCoordinates(clients, errors) || stopRequested) {
    status = "aborted_before_load";
  } else {
    const colorSeed = randomInt(0x1000000);
    console.log(`All ${count} clients ready; warming up for ${WARMUP_SECONDS}s`);
    await sendPhase(clients, "warmup", WARMUP_SECONDS, options.rate, options.artworkId, tracker, errors, colorSeed);
    if (!stopRequested) {
      measurementStart = new Date().toISOString();
      console.log(`Measuring for ${options.duration}s`);
      await sendPhase(clients, "measurement", options.duration, options.rate, options.artworkId, tracker, errors, colorSeed);
      measurementEnd = new Date().toISOString();
      if (!stopRequested) await waitUntil(performance.now() + DRAIN_SECONDS * 1000);
    }
    if (stopRequested) status = "interrupted";
  }
  const allClosed = await closeAll(clients, errors);
  if (!allClosed) status = "close_failed";
  const messageReport = tracker.report();
  const opened = clients.filter((client) => client.timing.socketOpenMs !== null).length;
  const connectionTimes = clients.flatMap((client) => client.timing.socketOpenMs === null ? [] : [client.timing.socketOpenMs]);
  const receivedByType: Record<string, number> = {};
  for (const client of clients) for (const [type, quantity] of Object.entries(client.receivedByType)) receivedByType[type] = (receivedByType[type] ?? 0) + quantity;
  const stage = {
    status,
    clients: count,
    duration: options.duration,
    rate: options.rate,
    artworkId: options.artworkId,
    testStartedAt: stageStart,
    measurementStartedAt: measurementStart,
    measurementEndedAt: measurementEnd,
    testEndedAt: new Date().toISOString(),
    connections: {
      attempts: count,
      success: opened,
      failed: count - opened,
      successRate: (opened / count) * 100,
      ready,
      establishMs: summarize(connectionTimes),
      canvasStateMs: summarize(clients.flatMap((client) => client.timing.canvasStateMs === null ? [] : [client.timing.canvasStateMs])),
      roomStateMs: summarize(clients.flatMap((client) => client.timing.roomStateMs === null ? [] : [client.timing.roomStateMs])),
      readyMs: summarize(clients.flatMap((client) => client.timing.readyMs === null ? [] : [client.timing.readyMs])),
      perClient: clients.map((client) => client.timing),
    },
    messages: { sent: messageReport.sent, warmupSent: messageReport.warmupSent, receivedFrames: clients.reduce((sum, client) => sum + client.receivedFrames, 0), receivedByType, rawPixelChanges: messageReport.rawPixelChanges, unexpected: messageReport.unexpected, warmupBroadcast: messageReport.warmupBroadcast, warmupDuplicate: messageReport.warmupDuplicate },
    sentRecords: tracker.sentRecords(),
    expectedBroadcast: messageReport.expectedBroadcast,
    actualBroadcast: messageReport.actualBroadcast,
    missing: messageReport.missing,
    duplicate: messageReport.duplicate,
    latency: messageReport.latency,
    errors: errors.report(),
    dataAudit: { pixelOperationRows: null, submittedPixelChanges: messageReport.sent + messageReport.warmupSent, onlineCountBefore: null, onlineCountAfter: null, note: "No database connection. Compare isolated MySQL rows before and after this time range." },
    serverResources: { cpu: null, jvmHeap: null, gc: null, mysqlConnections: null, note: "Not collected through the WebSocket protocol." },
  };
  printStage(stage);
  return stage;
}

async function main(): Promise<void> {
  const options = await parseOptions(process.argv.slice(2));
  if (!options) return;
  const report = { target: { url: options.baseUrl.origin, artworkId: options.artworkId }, startedAt: new Date().toISOString(), endedAt: null as string | null, stages: [] as Awaited<ReturnType<typeof runStage>>[] };
  for (const count of options.clients) {
    const stage = await runStage(options, count);
    report.stages.push(stage);
    report.endedAt = new Date().toISOString();
    await writeFile("results.json", JSON.stringify(report, null, 2) + "\n", { mode: 0o600 });
    if (stage.status !== "completed") break;
  }
  console.log(`Results written to results.json (${report.stages.length} stage(s)); no database cleanup was attempted.`);
  if (report.stages.some((stage) => stage.status !== "completed" || stage.connections.failed || stage.missing || stage.errors.total)) process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
