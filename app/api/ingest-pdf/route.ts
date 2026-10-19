import { NextRequest } from "next/server";
import { extractText, getDocumentProxy } from "unpdf";
import { salvarTextoBruto } from "@/lib/wiki";

export const runtime = "nodejs";

const MAX_BYTES = 4 * 1024 * 1024; // a Vercel recusa corpos acima de ~4,5 MB

export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  const arquivo = form?.get("arquivo");
  const assunto = form?.get("assunto");

  if (!(arquivo instanceof File) || arquivo.type !== "application/pdf") {
    return Response.json({ error: "Envie um arquivo PDF." }, { status: 400 });
  }
  if (arquivo.size > MAX_BYTES) {
    return Response.json({ error: "O PDF passa de 4 MB." }, { status: 400 });
  }

  try {
    const pdf = await getDocumentProxy(new Uint8Array(await arquivo.arrayBuffer()));
    const { text } = await extractText(pdf, { mergePages: true });
    if (!text.trim()) {
      return Response.json({ error: "Esse PDF não tem texto legível." }, { status: 400 });
    }

    const { slug } = await salvarTextoBruto({
      texto: text,
      titulo: arquivo.name.replace(/\.pdf$/i, ""),
      plataforma: "pdf",
      assunto: typeof assunto === "string" && assunto ? assunto : undefined,
    });
    return Response.json({ slug });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : "Não consegui ler o PDF." },
      { status: 500 }
    );
  }
}
