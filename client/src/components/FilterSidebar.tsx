import type { RankedHobby, RankedNationality } from "../api/types.js";

type Props = {
  nationalities: RankedNationality[];
  hobbies: RankedHobby[];
  selectedNationalities: string[];
  selectedHobbies: string[];
  onToggleNationality: (nationality: string) => void;
  onToggleHobby: (hobby: string) => void;
  onClearFilters: () => void;
};

const checkboxBase =
  "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-600 bg-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500/80";

export function FilterSidebar({
  nationalities,
  hobbies,
  selectedNationalities,
  selectedHobbies,
  onToggleNationality,
  onToggleHobby,
  onClearFilters,
}: Props) {
  const hasSelection =
    selectedNationalities.length > 0 || selectedHobbies.length > 0;

  return (
    <aside className="flex h-full min-h-0 w-full flex-col gap-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 lg:sticky lg:top-4 lg:max-h-[min(100%,calc(100dvh-5.5rem))] lg:min-w-[min(100%,18rem)] lg:max-w-sm lg:shrink-0 lg:overflow-y-auto">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Filters
        </h2>
        {hasSelection ? (
          <button
            type="button"
            onClick={onClearFilters}
            className="text-xs font-medium text-sky-400 hover:text-sky-300"
          >
            Clear
          </button>
        ) : null}
      </div>

      <section aria-labelledby="filters-nationality-heading">
        <h3
          id="filters-nationality-heading"
          className="mb-2 text-xs font-medium text-slate-500"
        >
          Nationality (top 20)
        </h3>
        <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto pr-1 sm:max-h-none">
          {nationalities.map((n) => {
            const id = `nat-${encodeURIComponent(n.nationality)}`;
            const checked = selectedNationalities.includes(n.nationality);
            return (
              <li key={n.nationality}>
                <label
                  htmlFor={id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
                    checked
                      ? "bg-sky-950/50 ring-1 ring-sky-800/80"
                      : "hover:bg-slate-800/60"
                  }`}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleNationality(n.nationality)}
                    className={`${checkboxBase} accent-sky-500`}
                  />
                  <span className="min-w-0 flex-1 text-sm leading-snug text-slate-200">
                    <span className="line-clamp-2">{n.nationality}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-slate-500">
                    {n.count}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="filters-hobby-heading">
        <h3
          id="filters-hobby-heading"
          className="mb-2 text-xs font-medium text-slate-500"
        >
          Hobbies (top 20)
        </h3>
        <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto pr-1 sm:max-h-none">
          {hobbies.map((h) => {
            const id = `hobby-${encodeURIComponent(h.hobby)}`;
            const checked = selectedHobbies.includes(h.hobby);
            return (
              <li key={h.hobby}>
                <label
                  htmlFor={id}
                  className={`flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 transition-colors ${
                    checked
                      ? "bg-emerald-950/40 ring-1 ring-emerald-800/70"
                      : "hover:bg-slate-800/60"
                  }`}
                >
                  <input
                    id={id}
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleHobby(h.hobby)}
                    className={`${checkboxBase} accent-emerald-500`}
                  />
                  <span className="min-w-0 flex-1 text-sm leading-snug text-slate-200">
                    <span className="line-clamp-2">{h.hobby}</span>
                  </span>
                  <span className="shrink-0 tabular-nums text-xs text-slate-500">
                    {h.count}
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
