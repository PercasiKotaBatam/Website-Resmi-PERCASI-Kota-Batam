# Firestore Security Specification — Portal PERCASI Kota Batam

## 1. Data Invariants
1. **Default-Deny Catch-All**: Every unspecified path under `/databases/{database}/documents` is denied for both reads and writes.
2. **Verified Admin Gate**: Only authenticated users with `request.auth.token.email_verified == true` AND either the bootstrapped email `percasikotabatam01@gmail.com` or an existing `/admins/{uid}` document can create, update, or delete `/portalMeta`, `/athletes`, `/tournaments`, `/news`, or `/admins`.
3. **PII / Admin Isolation**: `/admins/{adminUid}` records contain admin email/UID metadata and are strictly restricted (`get`, `list`, `create`, `update`, `delete`) to verified admins (`isAdmin()`). Unauthenticated and non-admin callers are always denied.
4. **Public Sports Catalog Safety**: Public visitors can read (`/portalMeta`, `/athletes`, `/tournaments`, `/news`) so the portal renders identically on AI Studio and GitHub Pages, while all writes remain locked behind `isAdmin()` + schema validation helpers.
5. **Path-Payload ID Binding & Strict Key Allowlists**: Every document under `/athletes/{athleteId}`, `/tournaments/{tournamentId}`, `/news/{newsId}`, and `/admins/{adminUid}` must pass `isValidId()` on its path variable, enforce exact required + allowed key sets (`hasAll` + `hasOnly`), enforce `id == pathId`, enforce bounded `.size()` limits on every string and array, and check immutable creator/timestamp fields where applicable.

## 2. "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Write**: Anonymous client sends `setDoc` to `/athletes/ath-hack` -> MUST return `PERMISSION_DENIED`.
2. **Non-Admin Signed-In User**: Authenticated user with `evil@gmail.com` (`email_verified: true`) writes to `/tournaments/trn-1` -> MUST return `PERMISSION_DENIED`.
3. **Unverified Admin Email Spoof**: Caller with `email: 'percasikotabatam01@gmail.com'` and `email_verified: false` attempts write -> MUST return `PERMISSION_DENIED`.
4. **Self-Privilege Escalation**: Non-admin signed-in user attempts `setDoc` on `/admins/<uid>` -> MUST return `PERMISSION_DENIED`.
5. **Admin List Scraping**: Unauthenticated user calls `getDocs(collection(db, 'admins'))` -> MUST return `PERMISSION_DENIED`.
6. **Shadow Field Injection**: Even an admin sends `{ ...validAthlete, isSuperAdmin: true }` -> MUST fail `keys().hasOnly(...)` and return `PERMISSION_DENIED`.
7. **Resource / ID Poisoning**: Payload sets `athleteId = "../bad/id"` or a 500-char ID string -> MUST fail `isValidId()` (`^[a-zA-Z0-9_\-]+$`, `<= 128`).
8. **Document ID / Field Mismatch**: Path `/athletes/ath-01` written with `data.id = "ath-999"` -> MUST fail `data.id == athleteId`.
9. **Oversized String DoS**: `athlete.bio` or `tournament.description` exceeds `maxLength` -> MUST fail `.size()` validation.
10. **Invalid Enum / Value Poisoning**: `athlete.title` set to `"FAKE_GM"`, `athlete.coachTitle` set to `"FAKE_COACH"`, `athlete.arbiterTitle` set to `"FAKE_ARB"`, or `athlete.ratings.standard` set to `"NaN"` string -> MUST fail type/enum checks.
11. **Timestamp Forgery / Unaudited Meta**: `/portalMeta/state` written with `updatedByUid` !== `request.auth.uid` or invalid `updatedAt` -> MUST fail identity binding.
12. **Unbounded Array Bomb**: `athlete.tournamentHistory` exceeds 100 items or `tournament.pairings` exceeds 5000 items -> MUST fail `.size()` upper bound.
