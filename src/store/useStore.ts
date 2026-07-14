import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { defaultFilters, type JobFilters, getCrawlerStatus, refreshJobs } from '@/data/dataApi'
import type { CrawlerStatus } from '@/data/types'

interface AppState {
  filters: JobFilters
  hotMetric: 'heat' | 'salary' | 'growth'
  favorites: string[]
  recentViews: string[]
  crawlerStatus: CrawlerStatus
  refreshKey: number
  nextRefreshIn: number
  setFilters: (filters: Partial<JobFilters>) => void
  resetFilters: () => void
  setHotMetric: (metric: 'heat' | 'salary' | 'growth') => void
  toggleFavorite: (jobId: string) => void
  isFavorite: (jobId: string) => boolean
  addRecentView: (jobId: string) => void
  triggerRefresh: () => void
  setNextRefreshIn: (s: number) => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      filters: { ...defaultFilters },
      hotMetric: 'heat',
      favorites: [],
      recentViews: [],
      crawlerStatus: getCrawlerStatus(),
      refreshKey: 0,
      nextRefreshIn: 3600,
      setFilters: (filters) =>
        set((state) => ({ filters: { ...state.filters, ...filters } })),
      resetFilters: () => set({ filters: { ...defaultFilters } }),
      setHotMetric: (metric) => set({ hotMetric: metric }),
      toggleFavorite: (jobId) =>
        set((state) => ({
          favorites: state.favorites.includes(jobId)
            ? state.favorites.filter((id) => id !== jobId)
            : [...state.favorites, jobId],
        })),
      isFavorite: (jobId) => get().favorites.includes(jobId),
      addRecentView: (jobId) =>
        set((state) => ({
          recentViews: [
            jobId,
            ...state.recentViews.filter((id) => id !== jobId),
          ].slice(0, 10),
        })),
      triggerRefresh: () => {
        const result = refreshJobs()
        set({
          crawlerStatus: getCrawlerStatus(),
          refreshKey: get().refreshKey + 1,
          nextRefreshIn: 3600,
        })
        return result
      },
      setNextRefreshIn: (s) => set({ nextRefreshIn: s }),
    }),
    {
      name: 'hrbp-intel-store',
      partialize: (state) => ({
        filters: state.filters,
        favorites: state.favorites,
        hotMetric: state.hotMetric,
        recentViews: state.recentViews,
      }),
    },
  ),
)
