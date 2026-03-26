import { memo } from "react";
import type { PersonRecord } from "../api/types.js";

const CARD_MIN_H = 152;
/** Row height incl. gap for virtualizer */
export const PROFILE_CARD_ESTIMATE_PX = CARD_MIN_H + 10;

type Props = {
  user: PersonRecord;
};

export const ProfileCard = memo(function ProfileCard({ user }: Props) {
  const name = `${user.first_name} ${user.last_name}`.trim();
  const top = user.hobbies.slice(0, 2);
  const rest = Math.max(0, user.hobbies.length - 2);

  return (
    <article
      className="rounded-xl border border-slate-700/90 bg-slate-900/90 p-4 shadow-md ring-1 ring-slate-800/60"
      style={{ minHeight: CARD_MIN_H }}
    >
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2">
        <img
          src={user.avatar}
          alt=""
          className="row-span-3 h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-slate-700"
          loading="lazy"
        />
        <h2 className="font-semibold leading-snug text-slate-50">{name}</h2>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm">
          <span className="text-slate-400">{user.nationality}</span>
          <span className="tabular-nums text-slate-500">
            {user.age} years old
          </span>
        </div>
        <div className="flex min-h-7 flex-wrap items-center gap-1.5 text-sm">
          {top.map((h) => (
            <span
              key={h}
              className="rounded-md bg-slate-800 px-2 py-0.5 text-slate-200"
            >
              {h}
            </span>
          ))}
          {rest > 0 ? (
            <span className="font-medium text-slate-500">+{rest}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
});
