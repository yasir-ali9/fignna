"use client";

import { useEditorEngine } from "@/lib/stores/editor/hooks";
import { observer } from "mobx-react-lite";
import { Canvas } from "./canvas";

export const CentralArea = observer(() => {
  const editorEngine = useEditorEngine();

  return (
    <div className="w-full h-full relative">
      <Canvas />
    </div>
  );
});
