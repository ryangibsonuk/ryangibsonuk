"use client";

import { GrokChat } from "@/components/GrokChat";
import { useHq } from "@/components/HqState";
import { Card, Eyebrow } from "@/components/ui";
import type { IntegrationStatus } from "@/lib/types";

export function GrokBoard({ status }: { status: IntegrationStatus }) {
  const { addEvent } = useHq();
  return (
    <div className="flex flex-col gap-6">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-copper">
          Teammate
        </p>
        <h1 className="display mt-2 text-4xl">Grok</h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-ink-soft">
          This is the xAI chat inside HQ. Grok Bot is the separate named
          teammate with a cloud computer — point that bot at this repo.
        </p>
      </header>
      <Card className="min-h-[28rem]">
        <Eyebrow>{status.grok ? "Connected" : "Waiting for XAI_API_KEY"}</Eyebrow>
        <div className="mt-4">
          <GrokChat
            grokReady={status.grok}
            model={status.model}
            onLog={addEvent}
          />
        </div>
      </Card>
    </div>
  );
}
