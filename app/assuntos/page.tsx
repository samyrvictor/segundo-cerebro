import { redirect } from "next/navigation";

// Endereço antigo: o conteúdo agora mora em outra aba.
export default function Page() {
  redirect("/buscar");
}
