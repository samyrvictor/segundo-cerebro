"use client";

import { useState } from "react";
import { PdfUpload } from "./PdfUpload";
import { TextCaptureForm } from "./TextCaptureForm";
import { VideosFila } from "./VideosFila";

export function Captura() {
  const [versao, setVersao] = useState(0);
  return (
    <div className="flex flex-col gap-6">
      <TextCaptureForm aoSalvar={() => setVersao((v) => v + 1)} />
      <PdfUpload />
      <VideosFila versao={versao} />
    </div>
  );
}
