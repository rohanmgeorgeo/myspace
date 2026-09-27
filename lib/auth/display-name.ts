import type { User } from "@supabase/supabase-js";

import type { Profile } from "@/lib/supabase/types";

/** Name shown in the UI, falling back to the email, then to "there". */
export function getDisplayName(
  user: Pick<User, "email" | "user_metadata"> | null,
  profile: Profile | null,
): string {
  const metadataName = user?.user_metadata?.display_name;
  if (typeof metadataName === "string" && metadataName.trim()) {
    return metadataName.trim();
  }

  if (profile?.display_name?.trim()) {
    return profile.display_name.trim();
  }

  if (user?.email) {
    return user.email.split("@")[0];
  }

  return "there";
}

/** Initials for the avatar fallback, e.g. "Rohan George" -> "RG". */
export function getInitials(value: string): string {
  const parts = value
    .split(/[\s._-]+/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  const letters = parts.slice(0, 2).map((part) => part[0]);
  return letters.join("").toUpperCase();
}
