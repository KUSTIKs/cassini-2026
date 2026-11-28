"use client";

import { Button } from "@/components/ui/Button";

/** The paper copy for when the network is down (Flow 3, step 3). */
export const PrintButton = () => (
  <Button size="sm" onClick={() => window.print()}>Print list</Button>
);
