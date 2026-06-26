"use client";

import { useState } from "react";
import { Menu, ShieldCheck, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

/**
 * Below md: a slim top bar with a hamburger that opens the sidebar content as
 * a left drawer. Built on the Radix Dialog like every other overlay in the app
 * — focus trap, scroll lock, aria-modal, Esc, and focus-return come for free.
 * The content itself is server-rendered and passed in.
 */
export function MobileSidebar({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <div className="flex items-center gap-1 border-b border-border bg-card px-2 py-2">
        <Button variant="ghost" size="sm" aria-label="Open menu" onClick={() => setOpen(true)}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <ShieldCheck className="h-[18px] w-[18px] text-muted-foreground" />
          Haven Desk
        </span>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose={false}
          aria-describedby={undefined}
          className="left-0 top-0 flex h-full w-72 max-w-[85vw] translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-r border-border bg-card p-0 sm:rounded-none"
        >
          <DialogTitle className="sr-only">Mobile navigation</DialogTitle>
          <div className="flex justify-end px-2 pt-2">
            <Button variant="ghost" size="sm" aria-label="Close menu" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          {/* The content is server-rendered, so close-on-navigate is handled
              by delegation: any link click inside the drawer closes it. */}
          <div
            className="flex min-h-0 flex-1 flex-col"
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {children}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
