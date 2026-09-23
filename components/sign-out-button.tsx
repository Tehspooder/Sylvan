import { signOut } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost" className="h-10 px-3 text-base">
        Sign out
      </Button>
    </form>
  );
}
