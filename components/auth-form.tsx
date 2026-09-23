"use client";

import { useActionState, useState, type ReactNode } from "react";
import { signIn, signUp } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ActionState } from "@/types";

const initialState: ActionState = {};

export function AuthForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");

  return mode === "sign-in" ? (
    <SignInForm
      initialError={initialError}
      onSwitch={() => setMode("sign-up")}
    />
  ) : (
    <SignUpForm onSwitch={() => setMode("sign-in")} />
  );
}

function SignInForm({
  initialError,
  onSwitch,
}: {
  initialError?: string;
  onSwitch: () => void;
}) {
  const [state, action, pending] = useActionState(signIn, initialState);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 px-3 text-base md:text-base"
        />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="h-11 px-3 text-base md:text-base"
        />
      </Field>
      {initialError && !state.error ? <FormAlert>{initialError}</FormAlert> : null}
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      {state.message ? <FormStatus>{state.message}</FormStatus> : null}
      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
      <button
        type="button"
        onClick={onSwitch}
        className="text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        New here? Create an account
      </button>
    </form>
  );
}

function SignUpForm({ onSwitch }: { onSwitch: () => void }) {
  const [state, action, pending] = useActionState(signUp, initialState);

  return (
    <form action={action} className="grid gap-4">
      <Field label="Name at the table" htmlFor="display_name" hint="Optional. Shown only to you for now.">
        <Input
          id="display_name"
          name="display_name"
          autoComplete="name"
          className="h-11 px-3 text-base md:text-base"
        />
      </Field>
      <Field label="Email" htmlFor="signup-email">
        <Input
          id="signup-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="h-11 px-3 text-base md:text-base"
        />
      </Field>
      <Field label="Password" htmlFor="signup-password" hint="At least 8 characters.">
        <Input
          id="signup-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="h-11 px-3 text-base md:text-base"
        />
      </Field>
      {state.error ? <FormAlert>{state.error}</FormAlert> : null}
      {state.message ? <FormStatus>{state.message}</FormStatus> : null}
      <Button type="submit" disabled={pending} className="h-11 text-base">
        {pending ? "Creating account…" : "Create account"}
      </Button>
      <button
        type="button"
        onClick={onSwitch}
        className="text-left text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Already have an account? Sign in
      </button>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function FormAlert({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-sm text-destructive">
      {children}
    </p>
  );
}

function FormStatus({ children }: { children: ReactNode }) {
  return (
    <p role="status" className="text-sm text-foreground">
      {children}
    </p>
  );
}
