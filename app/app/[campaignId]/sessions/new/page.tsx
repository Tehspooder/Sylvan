import type { Metadata } from "next";
import { createSession } from "@/actions/sessions";
import { SessionForm } from "@/components/session-form";
import { requireCampaign } from "@/lib/campaign";

export const metadata: Metadata = {
  title: "New session",
};

export default async function NewSessionPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = await params;
  const { canWrite } = await requireCampaign(campaignId);

  if (!canWrite) {
    return (
      <p className="text-muted-foreground">Only the owner or DM can record a session.</p>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2 className="font-heading text-3xl">Record a session</h2>
        <p className="mt-2 max-w-prose text-muted-foreground">
          Write the night as you remember it. Tagged lines become entries when you save.
        </p>
      </div>
      <SessionForm
        action={createSession.bind(null, campaignId)}
        submitLabel="Save session"
        values={{
          title: "",
          sessionDate: new Date().toISOString().slice(0, 10),
          summary: "",
          rawNotes: "",
        }}
      />
    </div>
  );
}
