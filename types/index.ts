export const ENTRY_TYPES = [
  "person",
  "place",
  "plot",
  "unresolved",
  "other",
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number];

export const ENTRY_TYPE_LABEL: Record<EntryType, string> = {
  person: "Person",
  place: "Place",
  plot: "Plot",
  unresolved: "Unresolved",
  other: "Other",
};

export const MEMBER_ROLES = ["owner", "dm", "player"] as const;

export type MemberRole = (typeof MEMBER_ROLES)[number];

export const ROLE_LABEL: Record<MemberRole, string> = {
  owner: "Owner",
  dm: "DM",
  player: "Player",
};

export type EntrySource = "parsed" | "manual";

export type Profile = {
  id: string;
  display_name: string | null;
  created_at: string;
};

export type Campaign = {
  id: string;
  owner_id: string;
  name: string;
  system: string;
  starting_date: string | null;
  created_at: string;
};

export type CampaignMember = {
  campaign_id: string;
  user_id: string;
  role: MemberRole;
};

export type Session = {
  id: string;
  campaign_id: string;
  session_date: string;
  title: string;
  raw_notes: string;
  summary: string | null;
  created_at: string;
};

export type Entry = {
  id: string;
  campaign_id: string;
  session_id: string | null;
  type: EntryType;
  title: string;
  body: string;
  source: EntrySource;
  created_at: string;
  updated_at: string;
};

export type ParsedEntry = {
  type: EntryType;
  title: string;
  body: string;
};

export type ActionState = {
  error?: string;
  message?: string;
};

export function isEntryType(value: string): value is EntryType {
  return (ENTRY_TYPES as readonly string[]).includes(value);
}

export function isMemberRole(value: string): value is MemberRole {
  return (MEMBER_ROLES as readonly string[]).includes(value);
}
