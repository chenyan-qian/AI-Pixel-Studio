# PixelVerse WebSocket load test

Independent Node.js/TypeScript client for the existing `/ws/artwork/{artworkId}` protocol. It never starts a server, connects to MySQL, changes PixelVerse code, saves versions, or deletes data. **It does send real pixel edits to the target backend.**

## Isolation requirements

Run only against a dedicated backend connected to an isolated MySQL database and a dedicated collaboration artwork. The tool requires `PIXELVERSE_LOAD_TEST_ISOLATED=YES` and accepts only loopback targets by default. For a remote staging host, add its exact hostname to `PIXELVERSE_LOAD_TEST_ALLOWED_HOSTS`. These checks prevent an accidental arbitrary host target; they cannot verify which database a backend uses, nor detect a localhost tunnel into production. Check the backend's effective datasource URL and deployment routing before setting the variable.

Do not use a production token, account, artwork, database, reverse proxy, or endpoint. The test does not contact any target when invoked with `--help`, during `npm run build`, or during `npm run unit`.

## Install and run

Requires Node.js 20+ and npm. From `load-test/`:

```powershell
npm ci
npm run unit
$env:PIXELVERSE_LOAD_TEST_ISOLATED = "YES"
npm run test -- --clients 5 --duration 60 --rate 1 --url ws://localhost:8080 --artworkId 123 --token "TEST_JWT"
```

Omit `--clients` to run 5, 10, 20, then 50 clients in separate stages. Each stage waits for all clients to receive `CANVAS_STATE` and `ROOM_STATE`, sends edits for a 10-second warmup, measures for `--duration` seconds (default 60), waits 10 seconds for late broadcasts, and closes all sockets before the next stage. If all clients cannot become ready, the stage aborts without sending edits and later stages do not run. `--rate` is per client and defaults to 1 message/second. The tool limits each stage to 50 clients and 1000 messages/second/client.

For distinct staging users, put one JWT per line in a local file (at least 50 for the default four stages) and use `--token-file .\tokens.txt` instead of `--token`. Do not pass both. A single `--token` deliberately shares one account across all connections; the server counts sockets, while the room's online user list deduplicates that account. If the staging backend requires an Origin header, pass `--origin http://localhost:3000` or another origin allowed by that deployment.

For a dedicated remote staging host, first confirm its database isolation, then set `PIXELVERSE_LOAD_TEST_ALLOWED_HOSTS=staging.example.test` and use `--url wss://staging.example.test`. The URL is a base address only; the tool appends the artwork path and JWT query parameter. No token is written to `results.json` or console output. Command-line tokens can still appear in OS process listings, so a local token file is preferable.

## Test artwork

In the isolated environment, prepare a work with a complete nonempty `pixelGrid` and at least 50 pixels if running the default stages. Enable `PUBLIC_COLLAB` and `allowEdit=true` for it. The WebSocket handler accepts a collaboration-enabled work even when it is not published; the normal browser community page additionally expects a published work. Use a disposable work belonging to a test account and do not invite normal users. Ensure the test JWT belongs to an active staging user. The tool assigns one distinct coordinate per client from the canvas dimensions, then uses a unique color per sent message to match broadcasts. It does not resolve concurrent edits from external users, so the room must be exclusive to this test.

## Reports and database audit

The console prints one report per stage. `results.json` in this directory is overwritten after each completed or aborted stage; it includes per-client timing, each submitted message's client ID, sequence, monotonic send timestamp, coordinate, color and receiving client IDs, expected and observed broadcasts, missing and duplicate deliveries, latency samples summarized by percentile, error categories and samples, and UTC test time bounds. Connection success means the WebSocket emitted `open`; `ready` additionally requires both initial states. A successful local `send()` call is counted as sent; the server does not acknowledge edits. The program records send callback errors separately. Latency uses `performance.now()` within this single test process and is measured from local send attempt to receipt by another local client.

No MySQL or JVM metrics are invented: `dataAudit.pixelOperationRows`, `onlineCountBefore/After`, and server resource fields are `null`. `submittedPixelChanges` is a client-side count, **not** a confirmed database row count. For an isolated MySQL database, record these read-only values before and after each stage using the exact test artwork ID:

```sql
SELECT COUNT(*) FROM pixel_operation WHERE artwork_id = 123;
SELECT online_count FROM artwork_collaboration_room WHERE artwork_id = 123;
```

Subtract the operation counts to obtain the actual rows created; check that the final online count returns to 0. Use the report's UTC time bounds to correlate application, JVM, host CPU, GC, and MySQL connection monitoring. Some SQL timestamps may use the server's local timezone, so verify timezone before filtering by time. Broadcast receipt is not proof of MySQL commit: the current backend broadcasts before inserting the operation rows.

The test never deletes database rows. After sockets are closed, clean only the dedicated staging work or reset the isolated database through your normal test-environment process. Deleting a work through its owner API cascades its collaboration room and pixel operation rows, but a work created via the application can also leave a generated preview file that needs separate staging cleanup.
