"use client";

import { useEffect } from "react";
import { Icon } from "./Icon";

export function Toast({
  msg,
  onDone,
}: {
  msg: string | null;
  onDone: () => void;
}) {
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(onDone, 1800);
    return () => clearTimeout(t);
  }, [msg, onDone]);

  if (!msg) return null;

  return (
    <div className="toast">
      <span className="check"><Icon.Check /></span>
      <span>{msg}</span>
    </div>
  );
}
