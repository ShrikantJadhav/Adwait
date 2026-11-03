# Reddit review post — draft

Not posted anywhere. Fill in the demo/repo links once they exist, check each
subreddit's self-promotion rules, and only post after the app is hosted.

## Title options

1. I built a single-pane task list + pomodoro because I kept tab-hopping — would love feedback
2. Adwait — today's tasks and a pomodoro timer in one pane (local-first, no account)

## Body

I kept losing focus jumping between a task list and a separate pomodoro timer,
so I built **Adwait**: today's tasks on the left, a timer on the right, nothing
else to navigate to.

The name is from Sanskrit *advaita* (अद्वैत), "not two" — the work and the time
you spend on it are one place.

**What it does**

- Today view groups tasks into overdue, due today, in focus, later, and done.
- On-track colors come from due dates instead of manual priority: red overdue,
  amber due today, green future, gray no date.
- Buckets for projects. Drag to reorder within a bucket, or drop a task onto
  another bucket tab to move it.
- Pomodoro with focus/short/long breaks, pause/resume/cancel, and a chime.
- The timer uses timestamps, so refresh/sleep/background tabs don't drift.
- Completed sessions roll up into "time taken" for each task. A session can be
  linked to a task before or after it runs.
- Everything is local-first (`localStorage`), with JSON export/import. No
  account, no server, no analytics.

**Screenshots**

- Today: [link]
- Bucket view: [link]

**Try it:** [demo link] · **Code:** [repo link]

**What I'd like feedback on**

1. Does the Today grouping match how you actually plan a day, or is it too
   opinionated?
2. Is the due-date color scheme (red/amber/green) enough, or do you need
   estimates/effort to spot an unrealistic day?
3. For the timer: is auto-linking sessions to tasks useful, or is one extra
   click too much friction?
4. Anything in the task rows or timer you'd remove to make it calmer?
5. If you use buckets/projects: does drag-between-buckets feel natural?

I'm not selling anything and there's no signup. I'm mainly trying to find out
whether the "one pane" constraint actually helps other people focus or just
works for me.

## Subreddit notes

- **r/SideProject** — friendly to early projects; include screenshots and ask
  for specific feedback.
- **r/webdev** — use the Showoff Saturday thread; standalone promo posts get
  removed.
- **r/productivity** — check the self-promotion rules; feedback-oriented posts
  do better than launch announcements.
- **r/pomodoro** — small but relevant; focus the post on the timer/task link.
- **r/ProductivityApps** — good fit for the "what should I improve" angle.

Do not cross-post all at once. Pick one, answer comments, then adapt the post
for a second community a few days later.

## Before posting

- [ ] Deploy a demo (GitHub Pages, Netlify, or Vercel) and test the imported
      demo data in a fresh browser profile.
- [ ] Replace `[demo link]`, `[repo link]`, and screenshot links.
- [ ] Re-run `npm run demo` and retake screenshots so dates look current.
- [ ] Confirm the demo starts on Today and `#bucket=quic` opens the QUIC bucket.
- [ ] Add a license and a short "contributions/feedback welcome" line to the
      repo.
- [ ] Check the target subreddit's rules for self-promotion and link posts.
