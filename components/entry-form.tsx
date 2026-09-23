"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ENTRY_TYPES, ENTRY_TYPE_LABEL, type ActionState, type EntryType } from "@/types";

const initialState: ActionState = {};

export type EntryFormValues = {
  type: EntryType;
  title: string;
  body: string;
  sessionId: string;
};

export function EntryForm({
  action,
  submitLabel,
  values,
  sessions,
  hint,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  values: EntryFormValues;
  sessions: { id: string; title: string; session_date: string }[];
  hint?: string;
}) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState(values.type);
  const [sessionId, setSessionId] = useState(values.sessionId);
  const [title, setTitle] = useState(values.title);
  const [body, setBody] = useState(values.body);

  return (
    <form action={formAction} className="grid gap-5">
      {hint ? <p className="text-sm leading-relaxed text-muted-foreground">{hint}</p> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="type">Type</Label>
          <select
            id="type"
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as EntryFormValues["type"])}
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {ENTRY_TYPES.map((type) => (
              <option key={type} value={type}>
                {ENTRY_TYPE_LABEL[type]}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="session_id">Session</Label>
          <select
            id="session_id"
            name="session_id"
            value={sessionId}
            onChange={(event) => setSessionId(event.target.value)}
            className="h-11 w-full rounded-lg border border-input bg-transparent px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">No session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.session_date} · {session.title}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="h-11 px-3 text-base md:text-base"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="body">Notes</Label>
        <Textarea
          id="body"
          name="body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          className="min-h-48 text-base leading-relaxed md:text-base"
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
