import { FazendoAgora } from "@/components/inicio/FazendoAgora";
import { FraseDoDia } from "@/components/inicio/FraseDoDia";
import { Hoje } from "@/components/inicio/Hoje";
import { SemanaEditavel } from "@/components/inicio/SemanaEditavel";
import { TOTAL_DIAS } from "@/lib/ingles/plano";
import { lerLinhasSemana } from "@/lib/rotina";

export const dynamic = "force-dynamic";

export default async function Home() {
  const semana = await lerLinhasSemana();

  return (
    <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-10 sm:px-10 sm:pt-16">
      <Hoje totalDiasIngles={TOTAL_DIAS} aoLado={<FazendoAgora />} />
      <div className="mt-5">
        <FraseDoDia />
      </div>
      <div className="mt-5">
        <SemanaEditavel linhasIniciais={semana} />
      </div>
    </div>
  );
}
