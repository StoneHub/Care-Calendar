# Password Hash Tuning & Maintenance

This document summarizes the Raspberry Pi password hashing performance adjustments performed (Aug 2025) and provides guidance for future maintenance.

## Background

Initial deployment used Werkzeug's default PBKDF2 iteration count (≈600k at time of refactor). On a Raspberry Pi 2 this produced >20s login delays. We introduced a configurable `CARE_PWHASH_METHOD` environment variable (already supported in the code) and added tooling to:

1. Measure real login hash verification latency (log lines tagged `LOGIN diag ...`).
2. Manually re-hash existing users at a lower cost without forcing password resets.
3. Benchmark multiple iteration counts offline before applying.

## Tooling Added

| Artifact | Purpose |
|----------|---------|
| `scripts/rehash_user.py` | Re-hash (or create) a single user, auto-detect populated DB, measure verify time, benchmark multiple iteration counts. |
| README section "One-off Manual User Re-hash Helper" | Quick usage references for SSH operations. |

Script capabilities:

- Auto-selects `data/database.db` if `backend/database.db` is empty.
- `--pbkdf2-iter` to force a PBKDF2 cost.
- `--benchmark` to test several iteration counts without DB writes.
- `--method argon2` support (once `argon2-cffi` installed).
- Auto-initializes schema (runs `init_db()`) if `users` table missing.

## Final Chosen Setting

- Chosen PBKDF2 cost (current): `pbkdf2:sha256:80000` (iteration count can be lowered further if login hash time remains >1s; see recommendations below).
- Observed local verify time at 80,000 iterations on Pi 2: ~2965 ms (too high for ideal UX – consider reducing to 50k or 40k).

## Recommended Target

Aim for <1000 ms verification on lowest-performance target hardware (Pi 2). Select the highest iteration count still below this threshold. Typical sweet spot ranges:

| Iterations | Expected Verify (Pi 2 est.) |
|------------|-----------------------------|
| 120,000    | 4–5 s (too slow)            |
| 80,000     | ~3 s (still slow)           |
| 60,000     | ~2 s (borderline)           |
| 50,000     | ~1.4–1.6 s (better)         |
| 40,000     | ~1.0–1.2 s (acceptable)     |
| 30,000     | ~0.8–0.9 s (fast; lower bound trade-off) |

If security policy allows, prefer the highest value delivering <1s. Otherwise adopt Argon2 (memory-hard) and tune its `time_cost` and `memory_cost` later.

## Operational Procedure (Condensed)

1. Benchmark:
   `python scripts/rehash_user.py --benchmark 120000,80000,60000,50000,40000,30000`
2. Choose iteration count (highest under 1000 ms).
3. Update systemd unit: `Environment=CARE_PWHASH_METHOD=pbkdf2:sha256:<ITER>` then `daemon-reload` + restart.
4. Re-hash primary admin user:
   `python scripts/rehash_user.py --email admin@example.com --password 'Secret' --pbkdf2-iter <ITER>`
5. Perform a login; confirm log line shows `hash=<X>ms upgraded=True` once.
6. If still slow, repeat with lower ITER (no need to re-edit unit unless changing global method).

## Argon2 Option

Install: `pip install argon2-cffi`
Set: `Environment=CARE_PWHASH_METHOD=argon2`
Re-hash user with: `--method argon2`
Measure login timing; tune Argon2 parameters (future enhancement) if needed.

## Logging & Monitoring

Monitor recent login performance:

```bash
journalctl -u care-calendar.service -n 50 --no-pager | grep LOGIN
```

Capture median hash time after each iteration change and store in an ops log for baseline comparison.

## Security Considerations

- Minimum advised PBKDF2 iterations: 40k–50k on Pi 2, adjusting upwards on newer hardware (update `CARE_PWHASH_METHOD` during hardware refresh cycles).
- Consider migrating to Argon2 or scrypt if acceptable dependency footprint and memory overhead (future evaluation on Pi models with more RAM).
- Always enforce TLS termination upstream if exposed beyond LAN.

## Future Enhancements

1. Add automated nightly benchmark (cron + log) to detect performance regressions after OS/package updates.
2. Add optional JSON output mode to `rehash_user.py` for scripting.
3. Implement multi-user re-hash batch tool (iterate all users, upgrading any mismatched method silently).
4. Persist last hash upgrade timestamp in a new `users` column for auditing.
5. Add health endpoint exposing current hash method & average verify time (rolling window) for observability.

## Quick Reference Commands

```bash
# Benchmark iteration counts (no DB writes)
python scripts/rehash_user.py --benchmark 120000,80000,60000,50000,40000,30000

# Re-hash specific user at 50k iterations
python scripts/rehash_user.py --email admin@example.com --password 'Secret' --pbkdf2-iter 50000

# Switch to Argon2
pip install argon2-cffi
# Edit systemd: Environment=CARE_PWHASH_METHOD=argon2
python scripts/rehash_user.py --method argon2 --email admin@example.com --password 'Secret'
```

## Summary

Password hashing was a major login latency bottleneck. We operationalized a tunable approach, added tooling to safely adjust cost, and documented a repeatable procedure. Remaining task: finalize an iteration (or Argon2) that keeps Pi 2 logins sub-second without materially weakening resistance to offline cracking.

---
Last updated: Aug 2025
