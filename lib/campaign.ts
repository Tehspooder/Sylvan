import { cache } from "react";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { isUuid } from "@/lib/format";
import type { Campaign, MemberRole } from "@/types";
import { isMemberRole } from "@/types";

export type CampaignContext = {
  supabase: Awaited<ReturnType<typeof requireUser>>["supabase"];
  user: Awaited<ReturnType<typeof requireUser>>["user"];
  campaign: Campaign;
  role: MemberRole;
  canWrite: boolean;
};

export const getCampaignContext = cache(
  async (campaignId: string): Promise<CampaignContext | null> => {
    if (!isUuid(campaignId)) return null;

    const { supabase, user } = await requireUser();
    const { data: campaign } = await supabase
      .from("campaigns")
      .select("id, owner_id, name, system, starting_date, created_at")
      .eq("id", campaignId)
      .maybeSingle();

    if (!campaign) return null;

    const { data: membership } = await supabase
      .from("campaign_members")
      .select("role")
      .eq("campaign_id", campaignId)
      .eq("user_id", user.id)
      .maybeSingle();

    const roleValue = membership?.role;
    if (typeof roleValue !== "string" || !isMemberRole(roleValue)) return null;

    return {
      supabase,
      user,
      campaign: campaign as Campaign,
      role: roleValue,
      canWrite: roleValue === "owner" || roleValue === "dm",
    };
  },
);

export async function requireCampaign(campaignId: string) {
  const context = await getCampaignContext(campaignId);
  if (!context) notFound();
  return context;
}
