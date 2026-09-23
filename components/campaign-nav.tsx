"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "", label: "Chronicle", exact: true },
  { href: "/entries", label: "Entries", exact: false },
  { href: "/search", label: "Search", exact: false },
];

export function CampaignNav({ campaignId }: { campaignId: string }) {
  const pathname = usePathname();

  return (
    <nav className="mt-4 flex gap-2 overflow-x-auto pb-1" aria-label="Chronicle">
      {items.map((item) => {
        const href = `/app/${campaignId}${item.href}`;
        const active = item.exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-11 items-center rounded-full px-4 text-sm whitespace-nowrap",
              active
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
