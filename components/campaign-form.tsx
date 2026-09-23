"use client";

import { useActionState } from "react";
import { createCampaign } from "@/actions/campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function CampaignForm() {
  const [state, action, pending] = useActionState(createCampaign, initialState);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Curse of Strahd"
          className="h-11 px-3 text-base md:text-base"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="system">System</Label>
          <Input
            id="system"
            name="system"
            list="game-systems"
            defaultValue="D&D 5e"
            className="h-11 px-3 text-base md:text-base"
          />
          <datalist id="game-systems">
            <option value="D&D 5e" />
            <option value="Dungeon World" />
            <option value="Blades in the Dark" />
            <option value="Call of Cthulhu" />
          </datalist>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="starting_date">Starting date</Label>
          <Input
            id="starting_date"
            name="starting_date"
            type="date"
            className="h-11 px-3 text-base md:text-base"
          />
        </div>
      </div>
      {state.error ? (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-11 w-fit px-4 text-base">
        {pending ? "Creating…" : "Create chronicle"}
      </Button>
    </form>
  );
}
