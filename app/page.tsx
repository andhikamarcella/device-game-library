"use client";

import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";
import { TagPill } from "@/components/TagPill";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import { formatDateTime } from "@/lib/utils";
import { GameStatus } from "@/lib/types";

const statusLabels: GameStatus[] = ["backlog", "playing", "completed", "dropped"];

export default function DashboardPage() {
  const { devices } = useDeviceStore();
  const { games } = useGameStore();

  const statusCounts = statusLabels.map((status) => ({
    status,
    count: games.filter((game) => game.status === status).length,
  }));

  const totalGames = games.length || 1;
  const recentGames = [...games]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const playingGames = games.filter((game) => game.status === "playing");

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card title="Devices" description="Tracked consoles & devices">
          <p className="text-3xl font-semibold text-white">{devices.length}</p>
        </Card>
        <Card title="Games" description="Total items in your library">
          <p className="text-3xl font-semibold text-white">{games.length}</p>
        </Card>
        <Card title="Playing" description="Currently active playthroughs">
          <p className="text-3xl font-semibold text-white">{playingGames.length}</p>
        </Card>
        <Card title="Completed" description="Finished games">
          <p className="text-3xl font-semibold text-white">
            {statusCounts.find((item) => item.status === "completed")?.count ?? 0}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card
          title="Games by status"
          description="Quick overview of your backlog progress"
          className="lg:col-span-2"
        >
          <div className="space-y-4">
            {statusCounts.map((item) => {
              const percentage = Math.round((item.count / totalGames) * 100);
              return (
                <div key={item.status} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span className="capitalize">{item.status}</span>
                    <span>{percentage}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500/80 to-emerald-400/80"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card title="Currently playing" description="Stay focused on your active titles">
          <div className="space-y-4">
            {playingGames.length === 0 ? (
              <p className="text-sm text-slate-400">No games are marked as playing right now.</p>
            ) : (
              playingGames.map((game) => (
                <div key={game.id} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{game.title}</p>
                      <p className="text-xs text-slate-400">{game.platformName}</p>
                    </div>
                    <StatusBadge status={game.status} />
                  </div>
                  {game.tags.length ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {game.tags.slice(0, 4).map((tag) => (
                        <TagPill key={tag} label={tag} />
                      ))}
                    </div>
                  ) : null}
                  {game.lastPlayedAt ? (
                    <p className="mt-3 text-xs text-slate-500">Last played {formatDateTime(game.lastPlayedAt)}</p>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recently added" description="Latest games added to your collection">
          <div className="space-y-3">
            {recentGames.length === 0 ? (
              <p className="text-sm text-slate-400">No games added yet.</p>
            ) : (
              recentGames.map((game) => (
                <div key={game.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{game.title}</p>
                    <p className="text-xs text-slate-400">{game.platformName}</p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDateTime(game.createdAt)}</span>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card title="Favorite platforms" description="Devices with the largest libraries">
          <div className="space-y-3">
            {devices.length === 0 ? (
              <p className="text-sm text-slate-400">Add your first device to begin tracking.</p>
            ) : (
              devices
                .map((device) => ({
                  device,
                  count: games.filter((game) => game.platformId === device.id).length,
                }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 4)
                .map(({ device, count }) => (
                  <div key={device.id} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-3">
                    <div>
                      <p className="text-sm font-semibold text-white">{device.name}</p>
                      <p className="text-xs text-slate-400">{device.type}</p>
                    </div>
                    <span className="text-sm font-semibold text-emerald-300">{count}</span>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
