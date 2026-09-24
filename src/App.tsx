import { useEffect } from "react";
import { ChurchView } from "./components/ChurchView";
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
  const stockTick = useGame((s) => s.stockTick);
  const mercsTick = useGame((s) => s.mercsTick);
  const regenTick = useGame((s) => s.regenTick);

  // доска, лавка и наёмники обновляются сами раз в 5-10 минут
  useEffect(() => {
    const t = setInterval(() => {
      boardTick();
      stockTick();
      mercsTick();
    }, 10000);
    return () => clearInterval(t);
  }, [boardTick, stockTick, mercsTick]);

  // отдых в городе: 1/300 макс. HP в секунду
  useEffect(() => {
    const t = setInterval(regenTick, 1000);
    regenTick();
    return () => clearInterval(t);
  }, [regenTick]);

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
            {view === "church" && <ChurchView />}
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
