# Chrome Web Store submission: gReminder

Everything to paste into the Chrome Web Store Developer Dashboard, field by
field. Images are in `store/images/` (regenerate with `npm run build && npm run
store:assets`). The upload zip is made with `npm run store:zip`.

---

## Package

- **Zip to upload:** `store/greminder-1.0.0.zip` (built `dist/`, `manifest.json` at the root)
- **Version:** 1.0.0. Every later upload needs a higher version in `package.json`.

## Store listing tab

**Name** (from the manifest, 44 of 75 characters)

    gReminder: Meeting End Timer for Google Meet

**Summary** (from the manifest, 130 of 132 characters)

    A countdown banner in Google Meet that warns you 5 to 30 minutes before the scheduled end, so meetings finish on time. No sign-in.

**Description**

    gReminder is a meeting timer for Google Meet that tells you when your call is about to run out of time. When 5 minutes are left in a scheduled meeting, a countdown banner appears at the top of the Meet call, so you can wrap up, agree next steps and end on time instead of running over into your next meeting.

    WHAT IT DOES
    • Shows a meeting end reminder in Google Meet 5, 10, 15, 20 or 30 minutes before the scheduled end time. You choose.
    • Live countdown timer with the time left and the meeting's scheduled end time.
    • Turns red in the final minute, then shows "Meeting time is up" when the time runs out.
    • Works automatically for any Google Meet call that comes from a Google Calendar invite. Nothing to start or set up per meeting.
    • Dismiss it with ✕ and it stays hidden for that meeting. If the meeting is extended to a later end time, the reminder comes back for the new one.

    WHO IT'S FOR
    Anyone who runs back-to-back meetings: team leads keeping stand-ups and syncs on schedule, teachers and trainers ending classes on time, consultants and sales teams with tight client calls, and anyone presenting who can't keep checking the clock.

    CHOOSE YOUR REMINDER TIME
    Click the gReminder icon in Chrome's toolbar and pick how early the warning appears. The setting is saved at once, syncs with your Chrome profile, and open Meet tabs pick it up without a reload.

    LOOKS LIKE PART OF GOOGLE MEET
    The banner uses Meet's own dark colours, fonts and icons, sits above the video grid, and adds nothing to Meet's toolbar or control bar.

    PRIVATE BY DESIGN
    • No sign-in, no consent screen, no access to your Google account or Google Calendar.
    • It reads only the meeting's scheduled start and end time from the Meet page you already have open.
    • Nothing is sent anywhere: no servers, no analytics, no tracking.
    • The only thing it saves is your reminder time.

    GOOD TO KNOW
    • Instant meetings started with "New meeting" have no scheduled end time, so no reminder is shown for them.
    • The reminder appears in your own browser. Other participants see it only if they also have gReminder installed.

    gReminder is an independent extension. It is not made, affiliated with or endorsed by Google. Google Meet is a trademark of Google LLC.

**Category:** Productivity → Workflow & Planning (Communication also fits)

**Language:** English

**Graphic assets**

| Field | File |
| --- | --- |
| Store icon (128x128) | `store/images/store-icon-128.png` |
| Screenshot 1 (1280x800) | `store/images/screenshot-1-banner.png` |
| Screenshot 2 | `store/images/screenshot-2-final-minute.png` |
| Screenshot 3 | `store/images/screenshot-3-settings.png` |
| Screenshot 4 | `store/images/screenshot-4-privacy.png` |
| Small promo tile (440x280) | `store/images/promo-small-440x280.png` |
| Marquee promo tile (1400x560, optional) | `store/images/promo-marquee-1400x560.png` |

**Homepage URL:** https://github.com/drilonbrahelika/gReminder

**Support URL:** https://github.com/drilonbrahelika/gReminder/issues

**Mature content:** No.

## Search (SEO) notes

The store's search weighs the name most, then the summary, then the
description. Nobody searches for "gReminder" yet, so the name carries the
words people do type: "meeting", "timer" and "Google Meet". The summary adds
"countdown", "reminder" and "end on time"; the description works in the
phrases "meeting timer for Google Meet", "meeting end reminder", "countdown
timer", "time left", "back-to-back meetings" and "Google Calendar invite" in
plain sentences. Google's spam policy rejects keyword lists and repeated
keywords, so there are none. Ratings, installs and the click-through from
screenshots also lift ranking, so the first screenshot shows the banner at a
size that reads in the search results carousel.

## Privacy practices tab

**Single purpose description**

    gReminder has one purpose: to remind people in a Google Meet call that the scheduled meeting is about to end, by showing a banner in the call a few minutes before the scheduled end time.

**Permission justification: storage**

    Saves one setting, how many minutes before the end of the meeting the reminder banner appears (5, 10, 15, 20 or 30), chosen in the extension's popup. Nothing else is stored.

**Host permission justification** (meet.google.com, from the content scripts)

    The extension's only job happens on Google Meet, so its content scripts run on https://meet.google.com/* only. There they show the reminder banner inside the call, and read the meeting's scheduled start and end time from the Meet page so the banner appears at the right moment. It runs on no other site.

    Note for the reviewer: Meet does not put the scheduled end time in the page's DOM until the user opens the meeting-details panel. Meet does load it when a scheduled meeting is joined, through its own MeetingCalendarAgendaService/FetchCalendarEvent request. A small script in the page's MAIN world (page.js, source src/page/tap.ts) wraps fetch and XMLHttpRequest, reads a clone of that one response only, decodes just the start and end timestamps, and hands them to the isolated content script with window.postMessage. Every request and response passes through unchanged; no request is made, modified or blocked, and nothing leaves the browser. The isolated content script re-checks origin, meeting code and plausibility before using the times. If the user opens the details panel, the schedule text there is used as a fallback.

**Remote code:** No, I am not using remote code. (All JavaScript is bundled in the package. No eval, no remote scripts.)

**Data usage: what user data do you collect?**
Tick **Website content** only. gReminder reads the meeting's scheduled start and end time from the Meet page, and the store counts reading and using page content as handling user data, even when nothing leaves the browser. Leave every other box unchecked. The times stay in memory in the tab and are never stored or sent; the one setting saved is the reminder time.

**Certifications** (tick all three)

- I do not sell or transfer user data to third parties, outside of the approved use cases.
- I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://drilonbrahelika.github.io/gReminder/privacy.html (GitHub Pages, serving `docs/` from `main`)

## Distribution tab

- **Visibility:** Public (or Unlisted to share by link only while testing)
- **Regions:** All regions
- **Pricing:** Free
