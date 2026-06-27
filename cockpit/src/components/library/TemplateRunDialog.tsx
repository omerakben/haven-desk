"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateRunner } from "@/components/library/TemplateRunner";

export type DialogTemplate = { id: string; name: string; description?: string | null; variables: string };

/** Fill + run a template in a dialog. Shared by the Templates page and the library. */
export function TemplateRunDialog({
  template,
  open,
  onOpenChange,
  savedLabel = "Saved",
}: {
  template: DialogTemplate | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  savedLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template?.name}</DialogTitle>
          {template?.description && <DialogDescription>{template.description}</DialogDescription>}
        </DialogHeader>
        {template && <TemplateRunner template={template} savedLabel={savedLabel} />}
      </DialogContent>
    </Dialog>
  );
}
