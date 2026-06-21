// Prevent a known macOS crash when a browser probe is launched from a Codex
// Seatbelt process. Chrome aborts in HIServices/TransformProcessType before
// Playwright can connect; headless-shell traps on denied power notifications.
// Full-access Codex sessions and normal terminals are unaffected.
if (process.env.CODEX_SANDBOX === 'seatbelt') {
  console.error(
    'PROBE BLOCKED: browser processes cannot launch inside Codex Seatbelt on macOS. ' +
    'Restart Codex with default_permissions=":danger-full-access", or run this probe in a normal terminal.'
  );
  process.exit(2);
}
