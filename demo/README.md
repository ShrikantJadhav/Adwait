# Demo data

`adwait-demo.json` is a ready-to-import Adwait backup with QUIC-flavoured tasks,
five buckets, completed tasks, and focus sessions — useful for screenshots or a
quick tour.

## Import it

1. Open Adwait.
2. Export your current data first if you care about it (**Export** in the header).
3. Click **Import**, choose `demo/adwait-demo.json`, and confirm.

Importing **replaces** the current tasks, buckets, and sessions.

## Regenerate it

Dates are relative to the day you generate the file, so regenerate before
taking fresh screenshots:

```bash
npm run demo
```

The script is `scripts/generate-demo.mjs`.
