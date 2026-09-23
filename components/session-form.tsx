"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export type SessionFormValues = {
  title: string;
  sessionDate: string;
  summary: string;
  rawNotes: string;
};

export function SessionForm({
  action,
  submitLabel,
  values,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  values: SessionFormValues;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="grid gap-5">
      <div className="grid gap-4 sm:grid-cols-[1fr_11rem]">
        <div className="grid gap-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            name="title"
            required
            defaultValue={values.title}
            placeholder="The mists"
            className="h-11 px-3 text-base md:text-base"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="session_date">Date</Label>
          <Input
            id="session_date"
            name="session_date"
            type="date"
            required
            defaultValue={values.sessionDate}
            className="h-11 px-3 text-base md:text-base"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="summary">Last time on…</Label>
        <Textarea
          id="summary"
          name="summary"
          defaultValue={values.summary}
          rows={3}
          placeholder="Optional. Leave blank to use the opening of the notes."
          className="min-h-24 text-base md:text-base"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="raw_notes">Notes</Label>
        <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm leading-relaxed">
          <p className="font-medium text-foreground">Tag a line to add it to the chronicle</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            <li>
              <code className="text-foreground">@person Name — notes</code>
            </li>
            <li>
              <code className="text-foreground">@place Name — notes</code>
            </li>
            <li>
              <code className="text-foreground">@plot Title — notes</code>
            </li>
            <li>
              <code className="text-foreground">@open Title — notes</code> for an unresolved thread
            </li>
          </ul>
          <p className="mt-2 text-muted-foreground">
            A colon or spaced hyphen works too. Following lines stay with that entry until a blank line.
            The notes themselves are stored unchanged.
          </p>
        </div>
        <Textarea
          id="raw_notes"
          name="raw_notes"
          defaultValue={values.rawNotes}
          placeholder={"@person Ireena Kolyana — She asked the party for an escort.\n@place Village of Barovia — Fog, locked doors, a church that will not hold."}
          className="min-h-[24rem] text-base leading-relaxed md:text-base"
        />
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-11 w-fit px-4 text-base">
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
