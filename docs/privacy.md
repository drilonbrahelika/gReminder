---
title: gReminder privacy policy
---

# gReminder privacy policy

_Last updated: November 1, 2026_

gReminder: Meeting End Timer for Google Meet ("gReminder") is a Chrome extension that shows a
banner in a Google Meet call a few minutes before the scheduled meeting ends.
This policy explains what it reads, what it stores, and what it shares.

## In short

gReminder does not collect, transmit, sell or share any personal data. It
has no servers, no analytics and no advertising. Everything it does happens
inside your own browser.

## What gReminder reads

gReminder runs only on pages at `https://meet.google.com/`. On those pages it
reads two things, and only to find out when the current meeting is scheduled
to end:

- **The meeting's scheduled start and end time** from the calendar event
  information that Google Meet itself loads for the meeting. gReminder reads
  only the start and end timestamps from that response. It does not read or
  keep the meeting title, description, attendees or any other field.
- **The schedule line in Meet's meeting-details panel** ("Thu, Sep 10, 2026
  10:00 AM – 10:30 AM"), if you open that panel yourself.

It also reads the meeting code from the page address, so that it can tell one
meeting from the next.

This information is used only in memory, in that browser tab, to decide when
to show the banner. It is never saved, logged or sent anywhere, and it is gone
when you leave the call or close the tab.

gReminder does not read your camera, microphone, chat messages, captions,
participant list, contacts, email or Google account details, and it does not
use the Google Calendar API or ask you to sign in.

## What gReminder stores

One setting: how many minutes before the end the banner should appear (5, 10,
15, 20 or 30). It is saved with Chrome's `chrome.storage.sync`, so Chrome may
sync it between your own signed-in Chrome browsers, as it does for other
extension settings. No other data is stored.

## What gReminder shares

Nothing. gReminder makes no network requests of its own, and no data is sent
to the developer or to any third party.

## Permissions

- **Access to meet.google.com**: needed to show the banner in the call and to
  read the meeting's scheduled time, as described above.
- **Storage**: needed to remember your reminder time.

## Children

gReminder is not directed at children and collects no data from anyone.

## Changes

If this policy changes, the new version will be posted at this address with a
new "Last updated" date. A change that adds any collection of data would also
be stated in the extension's Chrome Web Store listing before it ships.

## Contact

Questions about this policy: open an issue at <https://github.com/drilonbrahelika/gReminder/issues>.
