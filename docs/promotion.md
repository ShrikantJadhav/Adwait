# Promotion

Everything here is about getting the right first 50 users, not a launch-day
spike. One channel every few days; reply to every comment.

## Tagged links

Use the tagged URL for each channel so traffic is attributable (Netlify analytics
and any later analytics tool will pick up the `utm_*` parameters; the pages'
canonical tags stay clean, so SEO is unaffected).

| Channel | Link |
| --- | --- |
| Show HN | `https://adwait-app.netlify.app/?utm_source=hn&utm_medium=social&utm_campaign=show-hn` |
| Reddit — r/SideProject | `https://adwait-app.netlify.app/?utm_source=reddit&utm_medium=social&utm_campaign=sideproject` |
| Reddit — r/ADHD_Programmers | `https://adwait-app.netlify.app/?utm_source=reddit&utm_medium=social&utm_campaign=adhd_programmers` |
| Reddit — r/gtd | `https://adwait-app.netlify.app/?utm_source=reddit&utm_medium=social&utm_campaign=gtd` |
| Reddit — r/pomodoro | `https://adwait-app.netlify.app/?utm_source=reddit&utm_medium=social&utm_campaign=pomodoro` |
| Reddit — r/webdev (Showoff Saturday) | `https://adwait-app.netlify.app/?utm_source=reddit&utm_medium=social&utm_campaign=webdev` |
| Product Hunt | `https://adwait-app.netlify.app/?utm_source=producthunt&utm_medium=social&utm_campaign=launch` |
| Indie Hackers | `https://adwait-app.netlify.app/?utm_source=indiehackers&utm_medium=social&utm_campaign=buildlog` |
| Local-First Discord | `https://adwait-app.netlify.app/?utm_source=localfirst&utm_medium=community&utm_campaign=intro` |
| dev.to | `https://adwait-app.netlify.app/?utm_source=devto&utm_medium=article&utm_campaign=timer-engine` |
| Bluesky / Mastodon | `https://adwait-app.netlify.app/?utm_source=social&utm_medium=social&utm_campaign=buildinpublic` |
| GitHub | `https://adwait-app.netlify.app/?utm_source=github&utm_medium=readme&utm_campaign=repo` |
| Newsletter mention | `https://adwait-app.netlify.app/?utm_source=newsletter&utm_medium=email&utm_campaign=<name>` |

Keep one row per post. If a channel sends nothing after two attempts, drop it
instead of repeating it.

## Order of attack

1. **Show HN** — best fit for a local-first, no-account tool. Post Tue–Thu around
   8–10am US Eastern, then stay in the thread. Title:
   `Show HN: Adwait – tasks and a pomodoro timer in one pane, no account`.
2. **Local-First Discord** (`localfirstweb.dev`) — your differentiator is the
   topic of the room. Ask for critique, not upvotes.
3. **r/ADHD_Programmers, r/gtd, r/pomodoro** — highest intent. Read the sidebar
   rules first; assume direct links are restricted until proven otherwise.
4. **r/SideProject, r/indiehackers, Indie Hackers** — forgiving, low traffic,
   useful for feedback and quotes.
5. **Product Hunt** — after you have testimonials. Launch 12:01am PT, Tue–Thu.
6. **dev.to article** — "Building a pomodoro timer that survives sleep and tab
   throttling". Technical, links to the source, not a sales pitch.

## Rules that keep you out of trouble

- Contribute 9 useful comments before dropping 1 link. Mods and HN readers check
  post history.
- Never ask for upvotes; never post the same text to five subreddits the same
  hour. Rewrite each one for its audience.
- Lead with the constraint (no account, no server), not the feature list.
- If someone says "why not just use X", answer honestly — it's the best
  advertisement a small app can get.

## What counts as working

- 10+ sessions a day from a channel, or
- 5+ people importing the demo data, or
- one substantive thread with strangers asking for features.

Anything less and the message is wrong, not the channel. Fix the pitch before
adding channels.

## SEO pages

Static pages that need no JavaScript, listed in `public/sitemap.xml`:

- `/pomodoro-without-signup/`
- `/local-first-task-manager/`
- `/pomodoro-and-todo-list-in-one-window/`
- `/adwait-vs-pomofocus/`
- `/adwait-vs-todoist/`

Submit `https://adwait-app.netlify.app/sitemap.xml` in Google Search Console and
Bing Webmaster Tools, then check the Queries report after two to four weeks
instead of guessing at keywords. Add one new page only when you have a query
worth answering.
