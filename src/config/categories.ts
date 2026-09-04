// ---------------------------------------------------------------------------
// Category list shown on the landing screen ("What is this about?").
//
// EDIT ME: this is the only place you need to touch to add/remove/rename a
// category. `id` is used internally (case records, video mapping keys, URLs)
// so keep it a stable lowercase-dash slug once you're in production — if you
// rename an `id` later, old cases in the DB will keep the old value.
// `label` is what admins see on the button. `description` is optional helper
// text shown under the label.
// ---------------------------------------------------------------------------

export type Category = {
  id: string;
  label: string;
  description?: string;
};

export const CATEGORIES: Category[] = [
  {
    id: "admissions",
    label: "Admissions",
    description: "New student applications, enrollment packets",
  },
  {
    id: "dropouts",
    label: "Dropouts",
    description: "Withdrawals, leaver codes, exit records",
  },
  {
    id: "behavior",
    label: "Behavior",
    description: "Incidents, discipline logs, referrals",
  },
  {
    id: "attendance",
    label: "Attendance",
    description: "Daily attendance, codes, corrections",
  },
  {
    id: "grades",
    label: "Grades",
    description: "Gradebook, report cards, transcripts",
  },
  {
    id: "enrollment",
    label: "Enrollment",
    description: "Registration, transfers, student records",
  },
  {
    id: "scheduling",
    label: "Scheduling",
    description: "Course requests, master schedule, rosters",
  },
  {
    id: "reports",
    label: "Reports",
    description: "State reporting, custom reports, exports",
  },
  {
    id: "other",
    label: "Other",
    description: "Anything that doesn't fit the categories above",
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}
