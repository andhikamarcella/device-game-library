"use client";

import { useMemo, useState } from "react";
import { Plus, Star, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/Card";
import { Modal } from "@/components/Modal";
import { useDeviceStore } from "@/hooks/useDeviceStore";
import { useGameStore } from "@/hooks/useGameStore";
import { Device } from "@/lib/types";
import { cn } from "@/lib/utils";

const deviceTypes = ["console", "handheld", "pc", "emulator", "other"];

type DeviceFormState = {
  name: string;
  type: string;
  manufacturer?: string;
  notes?: string;
  favorite?: boolean;
};

const emptyForm: DeviceFormState = {
  name: "",
  type: "console",
  manufacturer: "",
  notes: "",
  favorite: false,
};

function DeviceForm({
  value,
  onChange,
}: {
  value: DeviceFormState;
  onChange: (value: DeviceFormState) => void;
}) {
  const fieldClass =
    "w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100";

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</label>
        <input
          value={value.name}
          onChange={(event) => onChange({ ...value, name: event.target.value })}
          placeholder="Nintendo Switch"
          className={fieldClass}
          required
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Type</label>
        <select
          value={value.type}
          onChange={(event) => onChange({ ...value, type: event.target.value })}
          className={fieldClass}
        >
          {deviceTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Manufacturer</label>
        <input
          value={value.manufacturer}
          onChange={(event) => onChange({ ...value, manufacturer: event.target.value })}
          placeholder="Nintendo"
          className={fieldClass}
        />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Notes</label>
        <textarea
          value={value.notes}
          onChange={(event) => onChange({ ...value, notes: event.target.value })}
          rows={3}
          placeholder="Custom firmware, storage upgrades, etc."
          className={fieldClass}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          checked={value.favorite}
          onChange={(event) => onChange({ ...value, favorite: event.target.checked })}
          className="h-4 w-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900 dark:text-emerald-400"
        />
        Mark as favorite
      </label>
    </div>
  );
}

export default function DevicesPage() {
  const { devices, addDevice, updateDevice, deleteDevice, toggleFavoriteDevice } = useDeviceStore();
  const { games } = useGameStore();
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [formState, setFormState] = useState<DeviceFormState>(emptyForm);

  const filteredDevices = useMemo(() => {
    return devices.filter((device) => {
      const matchesType = typeFilter === "all" || device.type === typeFilter;
      const matchesSearch = device.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  }, [devices, typeFilter, searchTerm]);

  const openAddModal = () => {
    setEditingDevice(null);
    setFormState(emptyForm);
    setIsModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setFormState({
      name: device.name,
      type: device.type,
      manufacturer: device.manufacturer ?? "",
      notes: device.notes ?? "",
      favorite: device.favorite ?? false,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = () => {
    if (!formState.name.trim()) return;
    if (editingDevice) {
      updateDevice(editingDevice.id, {
        ...formState,
      });
    } else {
      addDevice({
        ...formState,
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (device: Device) => {
    if (window.confirm(`Delete ${device.name}? This will keep associated games but remove the device.`)) {
      deleteDevice(device.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Devices</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">Manage consoles, PCs, and emulators used in your library.</p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
        >
          <Plus className="h-4 w-4" /> Add device
        </button>
      </div>

      <Card>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 dark:text-slate-300">Type</label>
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            >
              <option value="all">All</option>
              {deviceTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search devices..."
              className="w-full rounded-xl border border-slate-200 bg-white/95 px-4 py-2 text-sm text-slate-900 shadow-sm focus:border-emerald-500 focus:ring-emerald-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 shadow-sm shadow-slate-900/10 dark:border-slate-800">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
            <thead className="bg-slate-100/80 text-slate-600 dark:bg-slate-900/80 dark:text-slate-300">
              <tr className="text-left text-xs uppercase tracking-wider">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Manufacturer</th>
                <th className="px-4 py-3">Games</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800/70">
              {filteredDevices.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-600 dark:text-slate-400">
                    No devices match the current filters.
                  </td>
                </tr>
              ) : (
                filteredDevices.map((device) => {
                  const gameCount = games.filter((game) => game.platformId === device.id).length;
                  return (
                    <tr key={device.id} className="transition hover:bg-emerald-500/5 dark:hover:bg-slate-900/60">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => toggleFavoriteDevice(device.id)}
                            className={cn(
                              "rounded-full p-1 transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:focus-visible:ring-offset-slate-900",
                              device.favorite
                                ? "text-amber-500 dark:text-amber-400"
                                : "text-slate-400 hover:-translate-y-0.5 hover:text-amber-400",
                            )}
                            aria-label="Toggle favorite"
                          >
                            <Star className="h-4 w-4 fill-current" />
                          </button>
                          <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{device.name}</p>
                            {device.notes ? <p className="text-xs text-slate-500 dark:text-slate-400">{device.notes}</p> : null}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm capitalize text-slate-600 dark:text-slate-300">{device.type}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">{device.manufacturer ?? "—"}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-emerald-600 dark:text-emerald-300">{gameCount}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(device)}
                            className="rounded-xl border border-slate-200 bg-white/80 p-2 text-slate-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-500/60 hover:text-emerald-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
                            aria-label="Edit device"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(device)}
                            className="rounded-xl border border-rose-400/60 bg-rose-500/10 p-2 text-rose-500 transition-transform duration-200 hover:-translate-y-0.5 hover:border-rose-400 hover:text-rose-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-rose-500/60 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:text-rose-100 dark:focus-visible:ring-offset-slate-900"
                            aria-label="Delete device"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        title={editingDevice ? "Edit device" : "Add device"}
        description="Keep track of the hardware and environments you use."
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:text-white dark:focus-visible:ring-offset-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="rounded-xl border border-emerald-500/40 bg-emerald-500/90 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 dark:border-emerald-500/60 dark:bg-emerald-500/30 dark:text-emerald-100 dark:hover:text-emerald-50 dark:focus-visible:ring-offset-slate-900"
            >
              {editingDevice ? "Save changes" : "Add device"}
            </button>
          </>
        }
      >
        <DeviceForm value={formState} onChange={setFormState} />
      </Modal>
    </div>
  );
}
