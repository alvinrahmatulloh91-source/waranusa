"use client";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { itemStatusColor } from "@/lib/api-client";
import { labelItemStatus, labelRole } from "@/lib/constants";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant="outline" className={cn("font-semibold", itemStatusColor(status), className)}>
      {labelItemStatus(status)}
    </Badge>
  );
}

export function RoleBadge({ role, className }: { role: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "font-semibold",
        {
          SUPER_ADMIN: "bg-violet-100 text-violet-800 border-violet-200",
          EDITOR: "bg-teal-100 text-teal-800 border-teal-200",
          REVIEWER: "bg-amber-100 text-amber-800 border-amber-200",
          CONTRIBUTOR: "bg-stone-100 text-stone-700 border-stone-200",
        }[role],
        className
      )}
    >
      {labelRole(role)}
    </Badge>
  );
}
