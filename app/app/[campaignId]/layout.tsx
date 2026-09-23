import type { ReactNode } from "react";
import { CampaignNav } from "@/components/campaign-nav";
import { requireCampaign } from "@/lib/campaign";
import { formatDate } from "@/lib/format";
import { ROLE_LABEL } from "@/types";

export default async function CampaignLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const { campaign, role, canWrite } = await requireCampaign(campaignId);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
      <header>
        <p className="text-sm text-muted-foreground">
          {campaign.system}
          {campaign.starting_date ? ` · began ${formatDate(campaign.starting_date)}` : ""}
          {" · "}
          {ROLE_LABEL[role]}
          {canWrite ? "" : " · read only"}
        </p>
        <h1 className="mt-1 font-heading text-4xl tracking-tight">{campaign.name}</h1>
        <CampaignNav campaignId={campaign.id} />
      </header>
      <div className="mt-8">{children}</div>
    </div>
  );
}
