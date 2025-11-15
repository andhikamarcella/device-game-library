"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import { Device } from "@/lib/types";
import { loadDevices, saveDevices } from "@/lib/storage";

export type DeviceStoreContextValue = {
  devices: Device[];
  addDevice: (device: Omit<Device, "id" | "createdAt">) => void;
  updateDevice: (id: string, updates: Partial<Device>) => void;
  deleteDevice: (id: string) => void;
  toggleFavoriteDevice: (id: string) => void;
  replaceDevices: (items: Device[]) => void;
};

const DeviceStoreContext = createContext<DeviceStoreContextValue | undefined>(undefined);

export function DeviceProvider({ children }: { children: ReactNode }) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const loaded = loadDevices();
    setDevices(loaded);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    saveDevices(devices);
  }, [devices, initialized]);

  const addDevice = (device: Omit<Device, "id" | "createdAt">) => {
    setDevices((prev) => [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...device,
      },
      ...prev,
    ]);
  };

  const updateDevice = (id: string, updates: Partial<Device>) => {
    setDevices((prev) => prev.map((device) => (device.id === id ? { ...device, ...updates } : device)));
  };

  const deleteDevice = (id: string) => {
    setDevices((prev) => prev.filter((device) => device.id !== id));
  };

  const toggleFavoriteDevice = (id: string) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === id
          ? {
              ...device,
              favorite: !device.favorite,
            }
          : device,
      ),
    );
  };

  const replaceDevices = (items: Device[]) => {
    setDevices(items);
  };

  const value = useMemo(
    () => ({ devices, addDevice, updateDevice, deleteDevice, toggleFavoriteDevice, replaceDevices }),
    [devices],
  );

  return <DeviceStoreContext.Provider value={value}>{children}</DeviceStoreContext.Provider>;
}

export function useDeviceStore() {
  const context = useContext(DeviceStoreContext);
  if (!context) {
    throw new Error("useDeviceStore must be used within a DeviceProvider");
  }
  return context;
}
