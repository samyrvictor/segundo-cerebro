import { Pomodoro } from "@/components/Pomodoro";

export default function PomodoroPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 pb-24 pt-10 sm:px-8 sm:pt-14">
      <h1 className="text-center text-4xl font-bold tracking-[-0.03em]">Pomodoro</h1>
      <div className="mt-6">
        <Pomodoro />
      </div>
    </div>
  );
}
