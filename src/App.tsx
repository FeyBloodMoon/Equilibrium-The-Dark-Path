import { useEffect } from "react";
import { CityView } from "./components/CityView";
import { CombatView } from "./components/CombatView";
import { CharacterPanel } from "./components/CharacterPanel";
import { ForestView } from "./components/ForestView";
import { GuildView } from "./components/GuildView";
import { InventoryPanel } from "./components/InventoryPanel";
import { IntroView } from "./components/IntroView";
import { ShopView } from "./components/ShopView";
import { Toaster } from "./components/Toaster";
import { TopBar } from "./components/TopBar";
import { useGame } from "./game/store";

export default function App() {
  const started = useGame((s) => s.started);
  const view = useGame((s) => s.view);
  const boardTick = useGame((s) => s.boardTick);

  // доска заданий обновляется сама каждые 5 минут после последнего изменения
  useEffect(() => {
    const t = setInterval(boardTick, 10000);
    return () => clearInterval(t);
  }, [boardTick]);

  if (!started || view === "intro") {
    return (
      <div className="noise min-h-screen bg-ink-950">
        <IntroView />
        <Toaster />
      </div>
    );
  }

  return (
    <div className="noise min-h-screen bg-ink-950">
      <TopBar />
      <main className="mx-auto max-w-[1500px] px-3 py-4 sm:px-5 sm:py-6">
        <div className="grid gap-4 lg:grid-cols-[290px_minmax(0,1fr)_330px] lg:items-start">
          <aside className="order-2 lg:order-1 lg:sticky lg:top-[68px]">
            <CharacterPanel />
          </aside>
          <section className="order-1 min-w-0 lg:order-2">
            {view === "city" && <CityView />}
            {view === "shop" && <ShopView />}
            {view === "guild" && <GuildView />}
            {view === "forest" && <ForestView />}
            {view === "combat" && <CombatView />}
          </section>
          <aside className="order-3 lg:sticky lg:top-[68px] lg:max-h-[calc(100vh-86px)]">
            <InventoryPanel />
          </aside>
        </div>
      </main>
      <Toaster />
    </div>
  );
}
