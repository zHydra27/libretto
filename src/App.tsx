import { useState } from "react";
import confetti from "canvas-confetti";
import { AppProvider, useApp } from "./store";
import type { Exam, ViewId } from "./types";
import { fmtGrade } from "./types";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Libretto } from "./components/Libretto";
import { Appelli } from "./components/Appelli";
import { SettingsView } from "./components/SettingsView";
import { ExamModal } from "./components/ExamModal";
import { IncomingBackup } from "./components/IncomingBackup";
import { Toasts } from "./components/Toasts";
import { Icon } from "./components/Icon";

interface ModalState {
  exam: Exam | null;
  preset?: "passed" | "booked";
}

function Shell() {
  const { addExam, updateExam, pushToast } = useApp();
  const [view, setView] = useState<ViewId>("dashboard");
  const [modal, setModal] = useState<ModalState | null>(null);
  const [drawer, setDrawer] = useState(false);

  const celebrate = () => {
    confetti({
      particleCount: 90,
      spread: 78,
      origin: { y: 0.7 },
      colors: ["#2e7d51", "#e39b26", "#33628c", "#efb34f"],
    });
  };

  const handleSubmit = (exam: Exam, isNew: boolean) => {
    const wasPassed = modal?.exam?.status === "passed";
    if (isNew) addExam(exam);
    else updateExam(exam.id, exam);
    setModal(null);

    if (exam.status === "passed" && !wasPassed) {
      celebrate();
      pushToast(`Superato! «${exam.name}» registrato: ${fmtGrade(exam)}/30`, {
        kind: "success",
      });
    } else {
      pushToast(
        isNew
          ? `«${exam.name}» aggiunto al libretto`
          : `«${exam.name}» aggiornato`,
        { kind: "success" },
      );
    }
  };

  return (
    <div className="min-h-screen">
      <Sidebar
        view={view}
        onNavigate={setView}
        open={drawer}
        onClose={() => setDrawer(false)}
      />

      {/* barra superiore (mobile) */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-pine-800 bg-pine-950 px-4 text-paper md:hidden">
        <button
          onClick={() => setDrawer(true)}
          aria-label="Apri menu"
          className="rounded-md p-1.5 transition hover:bg-pine-800 active:scale-90"
        >
          <Icon name="menu" size={20} />
        </button>
        <span className="flex items-center gap-2 font-display text-base font-bold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-amber-500 text-pine-950">
            <Icon name="cap" size={15} />
          </span>
          Libretto
        </span>
        <button
          onClick={() => setModal({ exam: null })}
          aria-label="Nuovo esame"
          className="ml-auto rounded-md bg-pine-800 p-2 text-amber-400 transition hover:bg-pine-700 active:scale-90"
        >
          <Icon name="plus" size={17} strokeWidth={2.5} />
        </button>
      </div>

      <main className="bg-dots min-h-screen md:pl-64">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-9">
          <div key={view}>
            {view === "dashboard" && (
              <Dashboard onNavigate={setView} onNew={() => setModal({ exam: null })} />
            )}
            {view === "libretto" && (
              <Libretto
                onNew={() => setModal({ exam: null })}
                onEdit={(e) => setModal({ exam: e })}
                onGrade={(e) => setModal({ exam: e, preset: "passed" })}
              />
            )}
            {view === "appelli" && (
              <Appelli
                onEdit={(e) => setModal({ exam: e })}
                onGrade={(e) => setModal({ exam: e, preset: "passed" })}
                onBook={(e) => setModal({ exam: e, preset: "booked" })}
              />
            )}
            {view === "settings" && <SettingsView />}
          </div>
        </div>
      </main>

      {modal && (
        <ExamModal
          key={`${modal.exam?.id ?? "new"}-${modal.preset ?? "std"}`}
          initial={modal.exam}
          preset={modal.preset}
          onClose={() => setModal(null)}
          onSubmit={handleSubmit}
        />
      )}

      <Toasts />
      <IncomingBackup />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
