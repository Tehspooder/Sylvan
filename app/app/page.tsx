import type { Metadata } from "next";
import Link from "next/link";
import { CampaignForm } from "@/components/campaign-form";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { asCampaigns } from "@/lib/rows";

export const metadata: Metadata = {
  title: "Chronicles",
};

export default async function CampaignListPage() {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("campaigns")
    .select("id, owner_id, name, system, starting_date, created_at")
    .order("created_at", { ascending: false });

  const campaigns = asCampaigns(data);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-10 px-4 py-8 sm:px-6">
      <div>
        <h1 className="font-heading text-4xl">Chronicles</h1>
        <p className="mt-2 max-w-prose text-muted-foreground">
          One shelf for each table. Open a chronicle to record sessions and keep the people, places, and open threads.
        </p>
      </div>

      {error ? (
        <p role="alert" className="text-destructive">
          {error.message}
        </p>
      ) : null}

      {campaigns.length === 0 ? (
        <EmptyState
          title="No chronicles yet"
          body="Create the first one with a name, the game system, and the date you started. Curse of Strahd is a fine place to begin."
        />
      ) : (
        <ul className="grid gap-3">
          {campaigns.map((campaign) => (
            <li key={campaign.id}>
              <Link
                href={`/app/${campaign.id}`}
                className="block rounded-xl border border-border bg-card px-5 py-4 hover:border-primary/60"
              >
                <span className="font-heading text-2xl">{campaign.name}</span>
                <span className="mt-1 block text-sm text-muted-foreground">
                  {campaign.system}
                  {campaign.starting_date ? ` · began ${formatDate(campaign.starting_date)}` : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Card className="text-base">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">New chronicle</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignForm />
        </CardContent>
      </Card>
    </div>
  );
}
