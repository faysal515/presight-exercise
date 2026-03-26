import { useVirtualizer } from "@tanstack/react-virtual";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PersonRecord } from "../api/types.js";
import { fetchUserFilters, fetchUsersList } from "../api/usersApi.js";
import { FilterSidebar } from "../components/FilterSidebar.js";
import { PROFILE_CARD_ESTIMATE_PX, ProfileCard } from "../components/ProfileCard.js";
import { SearchBar } from "../components/SearchBar.js";
import { useDebouncedValue } from "../hooks/useDebouncedValue.js";

const PAGE_SIZE = 20;

export function UsersPage() {
  const [users, setUsers] = useState<PersonRecord[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const debouncedSearch = useDebouncedValue(searchInput, 400);
  const [selectedNationalities, setSelectedNationalities] = useState<string[]>(
    []
  );
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);

  const [filterNationalities, setFilterNationalities] = useState<
    { nationality: string; count: number }[]
  >([]);
  const [filterHobbies, setFilterHobbies] = useState<
    { hobby: string; count: number }[]
  >([]);

  const parentRef = useRef<HTMLDivElement>(null);
  const loadGuard = useRef(false);

  const filterKey = useMemo(
    () =>
      [
        debouncedSearch,
        [...selectedNationalities].sort().join("|"),
        [...selectedHobbies].sort().join("|"),
      ].join("::"),
    [debouncedSearch, selectedNationalities, selectedHobbies]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchUserFilters();
        if (cancelled) return;
        setFilterNationalities(data.nationalities);
        setFilterHobbies(data.hobbies);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load filters");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    loadGuard.current = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPage(1);
      setHasMore(true);
      setUsers([]);
      try {
        const { users: rows, meta } = await fetchUsersList({
          page: 1,
          limit: PAGE_SIZE,
          search: debouncedSearch,
          nationalities:
            selectedNationalities.length > 0
              ? selectedNationalities
              : undefined,
          hobbies:
            selectedHobbies.length > 0 ? selectedHobbies : undefined,
        });
        if (cancelled) return;
        setUsers(rows);
        setHasMore(meta.hasMore);
        setPage(meta.page);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load users");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [filterKey]);

  useEffect(() => {
    parentRef.current?.scrollTo({ top: 0 });
  }, [filterKey]);

  const loadMore = useCallback(async () => {
    if (!hasMore || loading || loadingMore || loadGuard.current) return;
    loadGuard.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const next = page + 1;
      const { users: rows, meta } = await fetchUsersList({
        page: next,
        limit: PAGE_SIZE,
        search: debouncedSearch,
        nationalities:
          selectedNationalities.length > 0
            ? selectedNationalities
            : undefined,
        hobbies: selectedHobbies.length > 0 ? selectedHobbies : undefined,
      });
      setUsers((prev) => [...prev, ...rows]);
      setHasMore(meta.hasMore);
      setPage(meta.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
      loadGuard.current = false;
    }
  }, [
    hasMore,
    loading,
    loadingMore,
    page,
    debouncedSearch,
    selectedNationalities,
    selectedHobbies,
  ]);

  useEffect(() => {
    const el = parentRef.current;
    if (!el) return;

    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = el;
      if (scrollHeight - scrollTop - clientHeight < 240) {
        void loadMore();
      }
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [loadMore]);

  const virtualizer = useVirtualizer({
    count: users.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => PROFILE_CARD_ESTIMATE_PX,
    overscan: 6,
  });

  const toggleNationality = useCallback((n: string) => {
    setSelectedNationalities((prev) =>
      prev.includes(n) ? prev.filter((x) => x !== n) : [...prev, n]
    );
  }, []);

  const toggleHobby = useCallback((h: string) => {
    setSelectedHobbies((prev) =>
      prev.includes(h) ? prev.filter((x) => x !== h) : [...prev, h]
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSelectedNationalities([]);
    setSelectedHobbies([]);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-4 sm:px-6">
      <div className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-4 overflow-hidden lg:flex-row lg:gap-8">
        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden lg:order-2">
          <div className="shrink-0 space-y-3 border-b border-slate-800/80 pb-3">
            <SearchBar value={searchInput} onChange={setSearchInput} />
            <p className="text-xs text-slate-500">
              {loading
                ? "Loading…"
                : `${users.length} loaded${hasMore ? " · scroll for more" : ""}`}
            </p>
          </div>

          {error ? (
            <div
              role="alert"
              className="mt-3 shrink-0 rounded-lg border border-red-900/60 bg-red-950/40 px-3 py-2 text-sm text-red-200"
            >
              {error}
            </div>
          ) : null}

          <div
            ref={parentRef}
            className="mt-3 flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden rounded-xl border border-slate-800 bg-slate-950/40 pr-1"
          >
          {users.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 text-sm text-slate-500">
              {loading ? "Loading…" : "No users match your filters."}
            </div>
          ) : (
            <div
              className="relative w-full shrink-0 p-2 sm:p-3"
              style={{ height: virtualizer.getTotalSize() }}
            >
              {virtualizer.getVirtualItems().map((vItem) => {
                const user = users[vItem.index];
                if (!user) return null;
                return (
                  <div
                    key={user.id ?? `${vItem.index}-${user.avatar}`}
                    className="absolute left-0 top-0 w-full px-1 pb-2 sm:px-2"
                    style={{
                      transform: `translateY(${vItem.start}px)`,
                    }}
                  >
                    <ProfileCard user={user} />
                  </div>
                );
              })}
            </div>
          )}
          {loadingMore && users.length > 0 ? (
            <div className="shrink-0 border-t border-slate-800 py-3 text-center text-sm text-slate-500">
              Loading more…
            </div>
          ) : null}
          </div>
        </div>

      <div className="order-2 flex min-h-0 w-full shrink-0 flex-col lg:order-1 lg:w-80 lg:self-stretch">
        <FilterSidebar
          nationalities={filterNationalities}
          hobbies={filterHobbies}
          selectedNationalities={selectedNationalities}
          selectedHobbies={selectedHobbies}
          onToggleNationality={toggleNationality}
          onToggleHobby={toggleHobby}
          onClearFilters={clearFilters}
        />
      </div>
      </div>
    </div>
  );
}
