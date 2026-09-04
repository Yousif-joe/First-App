// ---------------------------------------------------------------------------
// The 5 PowerSchool admins allowed to use this portal.
//
// Configure via the ADMIN_LIST env var as a JSON array, e.g.:
//   ADMIN_LIST=[{"name":"Jane Doe","email":"jane.doe@alsamaproject.com"}, ...]
//
// This is intentionally NOT a password/OAuth system — the portal is only
// reachable by people with the internal link, and this list is just used to
// (a) show a "pick your name" login gate and (b) attach an identity to each
// case for the email + case history. See src/lib/session.ts for the gate.
// ---------------------------------------------------------------------------

export type Admin = {
  name: string;
  email: string;
};

const FALLBACK_ADMINS: Admin[] = [
  { name: "Admin 1", email: "admin1@alsamaproject.com" },
  { name: "Admin 2", email: "admin2@alsamaproject.com" },
  { name: "Admin 3", email: "admin3@alsamaproject.com" },
  { name: "Admin 4", email: "admin4@alsamaproject.com" },
  { name: "Admin 5", email: "admin5@alsamaproject.com" },
];

let cached: Admin[] | null = null;

export function getAdmins(): Admin[] {
  if (cached) return cached;

  const raw = process.env.ADMIN_LIST;
  if (!raw) {
    console.warn(
      "[admins] ADMIN_LIST env var is not set — using placeholder admin names. " +
        "Set ADMIN_LIST to a JSON array of {name, email} for the real 5 admins."
    );
    cached = FALLBACK_ADMINS;
    return cached;
  }

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error("ADMIN_LIST must be a non-empty JSON array");
    }
    for (const entry of parsed) {
      if (!entry?.name || !entry?.email) {
        throw new Error("Each ADMIN_LIST entry needs a name and email");
      }
    }
    cached = parsed as Admin[];
  } catch (err) {
    console.error(
      "[admins] Failed to parse ADMIN_LIST, falling back to placeholders:",
      err
    );
    cached = FALLBACK_ADMINS;
  }

  return cached;
}

export function findAdminByEmail(email: string): Admin | undefined {
  return getAdmins().find(
    (a) => a.email.toLowerCase() === email.toLowerCase()
  );
}
