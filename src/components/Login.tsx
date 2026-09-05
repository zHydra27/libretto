import { useState, type FormEvent } from "react";
import { useApp } from "../store";
import { Icon } from "./Icon";

export function Login() {
  const { login } = useApp();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setErr(null);
    const res = await login(email.trim(), password);
    if (res) setErr(res);
    setBusy(false);
  };

  return (
    <div className="grid min-h-screen place-items-center bg-pine-950 px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-pine-800 bg-pine-950 p-6 shadow-2xl"
      >
        <div className="mb-6 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-md bg-amber-500 text-pine-950">
            <Icon name="cap" size={20} />
          </span>
          <div>
            <h1 className="font-display text-lg font-bold text-paper">Libretto</h1>
            <p className="text-xs opacity-60 text-paper">Accedi per sincronizzare i tuoi dati</p>
          </div>
        </div>

        <label className="mb-1 block text-xs font-semibold text-paper" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded-md border border-pine-800 bg-pine-800 px-3 py-2 text-sm text-paper outline-none focus:border-amber-500"
          placeholder="latua@email.com"
        />

        <label className="mb-1 block text-xs font-semibold text-paper" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded-md border border-pine-800 bg-pine-800 px-3 py-2 text-sm text-paper outline-none focus:border-amber-500"
          placeholder="••••••••"
        />

        {err && (
          <p className="mb-3 rounded-md bg-coral-100 px-3 py-2 text-xs font-semibold text-coral-700">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-md bg-amber-500 py-2.5 text-sm font-bold text-pine-950 transition hover:bg-amber-400 active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Accesso in corso…" : "Accedi"}
        </button>
      </form>
    </div>
  );
}
