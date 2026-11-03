# Contributing

Bug reports and pull requests are welcome.

- **Bugs:** open an issue with your Chrome version, the Meet URL shape
  (`meet.google.com/abc-defg-hij` or `meet.google.com/meet/...`, no real
  meeting codes needed), and what `greminder()` prints in the DevTools console
  (switch the context dropdown to gReminder first).
- **Code:** keep it TypeScript, keep the permissions as they are (`storage`
  plus Meet only), and run `npm run check` before opening a PR. CI runs the
  same thing.
- **Privacy:** gReminder never sends data anywhere. Changes that add network
  requests, analytics or new permissions won't be accepted.
