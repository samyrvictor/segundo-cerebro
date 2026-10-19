// O template é recriado a cada troca de página: cada tela entra com um fade suave.
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="entrada">{children}</div>;
}
