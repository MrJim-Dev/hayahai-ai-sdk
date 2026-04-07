"use client";

import React, { useEffect, useRef, useState, useMemo, useCallback, FormEvent, CSSProperties } from "react";
import { IconBot, IconSend, IconSparkles, IconShip, IconClock, IconArrowRight, IconUsers, IconFormInput, IconLoader, IconChevronLeft, IconChevronRight, IconX } from "./icons";
import { mergeTheme } from "../theme";
import type { TripSearchWidgetProps, HayahAITheme, TripData, RouteData, QuickReplyOption, BookingContext, AgentConfig } from "../types";

// ─── Keyframes ───────────────────────────────────────────────────────────────
let styleInjected = false;
function injectKeyframes() {
  if (styleInjected || typeof document === "undefined") return;
  const style = document.createElement("style");
  style.textContent = `
    @keyframes hayahai-spin { to { transform: rotate(360deg); } }
    @keyframes hayahai-fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  `;
  document.head.appendChild(style);
  styleInjected = true;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  interactive?: { type: string; data: unknown };
  tripResults?: TripData[];
}

type PortInfo = { code: string; name: string; id: number };

const TEST_INDICATORS = [
  "test", "fake", "sample", "demo", "xxx", "asdf", "qwerty",
  "heaven", "hell", "neverland", "hogwarts",
  "example", "1port", "2port", "anti lock",
  "kyoto", "tokyo", "osaka", "paris", "london",
  "arnel", "judiel", "ceven", "juds", "james",
];
const isRealPort = (name: string) =>
  !TEST_INDICATORS.some((t) => name.toLowerCase().includes(t));

const getUniqueOriginPorts = (routes: RouteData[]): PortInfo[] => {
  const map = new Map<string, PortInfo>();
  for (const r of routes) {
    if (!map.has(r.src_port_code) && isRealPort(r.src_port_name)) {
      map.set(r.src_port_code, { code: r.src_port_code, name: r.src_port_name, id: r.src_port_id });
    }
  }
  return Array.from(map.values())
    .filter((origin) => getDestinationsForOrigin(routes, origin.code).length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
};

const getDestinationsForOrigin = (routes: RouteData[], originCode: string): PortInfo[] => {
  const map = new Map<string, PortInfo>();
  for (const r of routes) {
    if (r.src_port_code === originCode && !map.has(r.dest_port_code) && isRealPort(r.dest_port_name)) {
      map.set(r.dest_port_code, { code: r.dest_port_code, name: r.dest_port_name, id: r.dest_port_id });
    }
  }
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

const findRouteByPorts = (routes: RouteData[], o: string, d: string) =>
  routes.find((r) => r.src_port_code === o && r.dest_port_code === d);

/** Fuzzy port name lookup across all routes */
const findPortInRoutes = (query: string, routeList: RouteData[]): PortInfo | null => {
  const q = query.toLowerCase().trim();
  const portMap = new Map<string, PortInfo>();
  for (const r of routeList) {
    portMap.set(r.src_port_code, { code: r.src_port_code, name: r.src_port_name, id: r.src_port_id });
    portMap.set(r.dest_port_code, { code: r.dest_port_code, name: r.dest_port_name, id: r.dest_port_id });
  }
  const ports = Array.from(portMap.values());
  // exact substring match
  let match = ports.find((p) => p.name.toLowerCase().includes(q) || q.includes(p.name.toLowerCase()));
  if (match) return match;
  // word-overlap fallback (e.g. "talisay" inside "Talisay, Cebu")
  const words = q.split(/\s+/);
  match = ports.find((p) => words.some((w) => w.length >= 4 && p.name.toLowerCase().includes(w)));
  return match ?? null;
};

/** Parse "Apr. 11, 2026" / "Apr 11, 2026" / "2026-04-11" → "YYYY-MM-DD" or null */
const parseDateHint = (hint: string): string | null => {
  const MONTHS: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  if (/^\d{4}-\d{2}-\d{2}$/.test(hint)) return hint;
  const m = hint.match(/([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s+(\d{4})/);
  if (m) {
    const mo = MONTHS[m[1].toLowerCase().slice(0, 3)];
    if (mo !== undefined) {
      const day = parseInt(m[2], 10);
      const year = parseInt(m[3], 10);
      return `${year}-${String(mo + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
  }
  return null;
};

/** Detect "from X to Y [at/on DATE]" intent from free-form text */
const detectTypedRoute = (text: string): { src: string; dest: string; parsedDate: string | null } | null => {
  const t = text.toLowerCase();
  // Strip trailing date phrase so it doesn't bleed into dest name
  const stripped = t.replace(/\s+(?:at|on)\s+[\w,.\s]+\d{4}.*$/, "").trim();
  const fromTo = stripped.match(/from\s+(.+?)\s+to\s+(.+?)(?:\?|$)/);
  if (!fromTo) return null;
  // Extract date from original text
  const dateMatch = text.match(/(\d{4}-\d{2}-\d{2})|([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4})/);
  const parsedDate = dateMatch ? parseDateHint(dateMatch[0]) : null;
  return { src: fromTo[1].trim(), dest: fromTo[2].trim(), parsedDate };
};

const buildContextSummary = (ctx: BookingContext): string => {
  const parts: string[] = [];
  if (ctx.originPort) parts.push(`Origin: ${ctx.originPort.name}`);
  if (ctx.destinationPort) parts.push(`Destination: ${ctx.destinationPort.name}`);
  if (ctx.departureDate) parts.push(`Date: ${ctx.departureDate}`);
  if (ctx.passengerCount) parts.push(`Passengers: ${ctx.passengerCount}`);
  return parts.length ? `[CONTEXT: ${parts.join(", ")}]` : "";
};

// ─── Component ───────────────────────────────────────────────────────────────
export default function TripSearchWidget({
  chatApiUrl = "/api/chat-booking",
  routesApiUrl = "/api/routes",
  tripsApiUrl = "/api/trips",
  configApiUrl = "/api/agent-config",
  tenantId = 1,
  agentConfig: propConfig,
  theme: themeOverrides,
  displayName: propDisplayName,
  welcomeMessage: propWelcomeMessage,
  showFormToggle = true,
  onSwitchToForm,
  onTripSelect,
  poweredByText = "Powered by HayahAI",
  className,
  currency = "PHP",
  locale = "en-PH",
}: TripSearchWidgetProps) {
  const t = useMemo(() => mergeTheme(themeOverrides), [themeOverrides]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [context, setContext] = useState<BookingContext>({});
  const [routes, setRoutes] = useState<RouteData[]>([]);
  const [availableRoutePairs, setAvailableRoutePairs] = useState<Set<string> | null | undefined>(undefined);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [step, setStep] = useState<"route" | "passengers" | "vehicles" | "date" | "complete">("route");

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingRouteRef = useRef<RouteData | null>(null);
  const initAttempted = useRef(false);

  // ── Config ──────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<AgentConfig | null>(propConfig ?? null);

  useEffect(() => { injectKeyframes(); }, []);

  useEffect(() => {
    if (propConfig !== undefined) { setConfig(propConfig); return; }
    (async () => {
      try {
        const res = await fetch(`${configApiUrl}?tenantId=${tenantId}&type=trip-search`);
        if (res.ok) {
          const data = await res.json();
          setConfig(data?.config ?? data?.data?.config ?? null);
        }
      } catch { /* silent */ }
    })();
  }, [tenantId, configApiUrl, propConfig]);

  const displayName = propDisplayName || config?.displayName || "AyahAI";
  const rawWelcome = propWelcomeMessage || config?.welcomeMessage || "Hi! I'm AyahAI, your ferry booking assistant. 🛳️";
  const welcomeMsg = rawWelcome.split("\n").filter((l) => !l.trim().endsWith("?")).join("\n").trim() || rawWelcome.split("\n")[0];

  // ── Routes ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${routesApiUrl}?tenantId=${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          const arr = data.data || data;
          if (Array.isArray(arr)) setRoutes(arr);
        }
      } catch { /* silent */ }
    })();
  }, [routesApiUrl, tenantId]);

  // ── Route availability check ─────────────────────────────────────────
  useEffect(() => {
    if (routes.length === 0) return;
    const seen = new Set<string>();
    const toCheck: RouteData[] = [];
    for (const r of routes) {
      if (!isRealPort(r.src_port_name) || !isRealPort(r.dest_port_name)) continue;
      const key = `${r.src_port_code}:${r.dest_port_code}`;
      if (seen.has(key)) continue;
      seen.add(key);
      toCheck.push(r);
    }
    (async () => {
      const available = new Set<string>();
      await Promise.allSettled(toCheck.map(async (r) => {
        try {
          const res = await fetch(`${tripsApiUrl}/available-dates?origin_code=${r.src_port_code}&destination_code=${r.dest_port_code}&limit=1`);
          if (res.ok) {
            const d = await res.json();
            if (d.data?.length) available.add(`${r.src_port_code}:${r.dest_port_code}`);
          }
        } catch { /* skip */ }
      }));
      // If all checks failed (network error), fall back to showing all routes
      setAvailableRoutePairs(available.size > 0 ? available : null);
    })();
  }, [routes, tripsApiUrl]);

  const ROUTE_PREVIEW_COUNT = 6;

  const buildRouteOptions = (showAll = false): QuickReplyOption[] => {
    const seen = new Set<string>();
    const opts: QuickReplyOption[] = [];
    for (const r of routes) {
      if (!isRealPort(r.src_port_name) || !isRealPort(r.dest_port_name)) continue;
      const key = `${r.src_port_code}:${r.dest_port_code}`;
      if (seen.has(key)) continue;
      // Skip routes with no upcoming trips (if availability data is loaded)
      if (availableRoutePairs != null && !availableRoutePairs.has(key)) continue;
      seen.add(key);
      opts.push({
        label: `🛳️ ${r.src_port_name} → ${r.dest_port_name}`,
        value: `route:${r.src_port_code}:${r.dest_port_code}`,
      });
    }
    opts.sort((a, b) => a.label.localeCompare(b.label));
    if (!showAll && opts.length > ROUTE_PREVIEW_COUNT) {
      const remaining = opts.length - ROUTE_PREVIEW_COUNT;
      return [...opts.slice(0, ROUTE_PREVIEW_COUNT), { label: `➕ See ${remaining} more routes`, value: "show_more_routes" }];
    }
    return opts;
  };

  // ── Init message ────────────────────────────────────────────────────────
  useEffect(() => {
    if (routes.length === 0 || messages.length > 0 || initAttempted.current) return;
    // Wait for availability check before showing route chips
    if (availableRoutePairs === undefined) return;
    initAttempted.current = true;
    setMessages([{
      id: crypto.randomUUID(), role: "assistant",
      content: `${welcomeMsg}\n\nWhere would you like to travel?`,
      interactive: { type: "quick_reply", data: { options: buildRouteOptions() } },
    }]);
  }, [routes, messages.length, welcomeMsg, availableRoutePairs]);

  // ── Auto-scroll ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, showDatePicker]);

  // ── Date select ─────────────────────────────────────────────────────────
  const handleDateSelect = async (date: Date, label: string) => {
    setShowDatePicker(false);
    const dateStr = date.toLocaleDateString("en-CA");
    setContext((prev) => ({ ...prev, departureDate: dateStr, departureDateLabel: label }));
    addMsg("user", label);
    setStep("complete");
    const route = context.selectedRoute || pendingRouteRef.current;
    if (route) await searchTrips(dateStr, context.passengerCount, context.vehicleCount);
  };

  // ── Search trips ────────────────────────────────────────────────────────
  const searchTrips = async (depDate: string, passengers?: number, vehicles?: number) => {
    const route = context.selectedRoute || pendingRouteRef.current;
    if (!route) return;
    if (!pendingRouteRef.current) pendingRouteRef.current = route;

    setIsSearching(true);
    const searchId = crypto.randomUUID();
    setMessages((prev) => [...prev, { id: searchId, role: "assistant", content: "🔍 Searching for available trips..." }]);

    try {
      const params = new URLSearchParams({
        origin_code: route.src_port_code,
        destination_code: route.dest_port_code,
        departure_date: depDate,
        passenger_count: String(passengers || context.passengerCount || 1),
        vehicle_count: String(vehicles ?? context.vehicleCount ?? 0),
        sort: "departureDate", page: "1",
      });

      const res = await fetch(`${tripsApiUrl}?${params}`);
      setMessages((prev) => prev.filter((m) => m.id !== searchId));

      if (!res.ok) throw new Error("Failed");

      const data = await res.json();
      const tripsArr = data.data || [];
      const trips: TripData[] = tripsArr.map((t: any) => {
        const seg = t.segments?.[0];
        const ship = seg?.ship_name || t.ship_name || "Unknown";
        // Price: use base_fare (adult ECO rate) from first segment
        const price = seg?.base_fare
          ?? seg?.passenger_rates?.find((r: any) => r.passenger_type_code === "ADULT")?.amount
          ?? 0;
        // Seats: sum remaining from cabin_capacities across all segments (bottleneck)
        const availableSeats = (t.segments ?? [seg]).reduce((min: number, s: any) => {
          const cabinCaps: Record<string, { remaining: number }> = s?.cabin_capacities ?? {};
          const total = Object.values(cabinCaps).reduce((sum, c) => sum + (c.remaining ?? 0), 0);
          return total > 0 ? Math.min(min, total) : min;
        }, Infinity);
        // Departure date in local time — avoid UTC shift (e.g. 6AM PHT = prev day UTC)
        const rawDep = t.total_departure_time || t.scheduled_departure || "";
        const departureDateLocal = rawDep
          ? new Date(rawDep).toLocaleDateString("en-CA") // YYYY-MM-DD local
          : depDate;
        return {
          id: t.id?.toString() || crypto.randomUUID(),
          shippingLine: ship, vesselName: ship,
          srcPort: t.origin_name || route.src_port_name,
          destPort: t.destination_name || route.dest_port_name,
          departureTime: t.total_departure_time || t.scheduled_departure,
          arrivalTime: t.total_arrival_time || t.scheduled_arrival || "",
          duration: t.total_duration_minutes ? `${Math.floor(t.total_duration_minutes / 60)}h ${t.total_duration_minutes % 60}m` : "",
          price,
          availableSeats: isFinite(availableSeats) ? availableSeats : 0,
          departureDateLocal,
          passengerCount: context.passengerCount ?? 1,
          vehicleCount: context.vehicleCount ?? 0,
        };
      });

      if (trips.length > 0) {
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: "assistant",
          content: `I found ${trips.length} trip${trips.length > 1 ? "s" : ""} for you! 🎉`,
          tripResults: trips,
          interactive: { type: "quick_reply", data: { options: [
            { label: "🔄 Different date", value: "try a different date" },
            { label: "🏠 Start over", value: "start over" },
          ] } },
        }]);
      } else {
        // Fetch available dates
        let dateOpts: QuickReplyOption[] = [{ label: "🔄 Different route", value: "start over" }];
        try {
          const dRes = await fetch(`${tripsApiUrl}/available-dates?origin_code=${route.src_port_code}&destination_code=${route.dest_port_code}&limit=5&vehicle_count=${context.vehicleCount ?? 0}`);
          if (dRes.ok) {
            const dd = await dRes.json();
            if (dd.data?.length) {
              const opts = dd.data.map((d: any) => {
                const dt = new Date(d.date + "T00:00:00");
                const lbl = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return { label: `📅 ${lbl} (${d.trip_count} trip${d.trip_count > 1 ? "s" : ""})`, value: d.date.split("T")[0] };
              });
              dateOpts = [...opts, { label: "🔄 Different route", value: "start over" }];
            }
          }
        } catch { /* silent */ }

        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(), role: "assistant",
          content: dateOpts.length > 1 ? "No trips for that date. Here are dates with trips:" : "No trips found. Try a different route?",
          interactive: { type: "quick_reply", data: { options: dateOpts } },
        }]);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== searchId));
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(), role: "assistant",
        content: "Sorry, couldn't search right now. Please try again!",
        interactive: { type: "quick_reply", data: { options: [
          { label: "🔄 Try again", value: "try again" },
          { label: "🏠 Start over", value: "start over" },
        ] } },
      }]);
    } finally {
      setIsSearching(false);
    }
  };

  // ── Helpers ─────────────────────────────────────────────────────────────
  const addMsg = (role: "user" | "assistant", content: string, extra?: Partial<Message>) => {
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), role, content, ...extra }]);
  };
  const clearInteractive = () => {
    setMessages((prev) => prev.map((m) => m.interactive ? { ...m, interactive: undefined } : m));
  };

  // ── AI fallback ─────────────────────────────────────────────────────────
  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim()) return;
    clearInteractive();
    addMsg("user", text);
    setInput("");
    setIsLoading(true);
    try {
      const res = await fetch(chatApiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }].map((m) => ({ role: m.role, content: m.content })),
          context, contextSummary: buildContextSummary(context),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        addMsg("assistant", data.message, {
          interactive: { type: "quick_reply", data: { options: [{ label: "🏠 Start a new search", value: "start over" }] } },
        });
      } else throw new Error("API error");
    } catch {
      addMsg("assistant", "Having trouble right now. Please try again!", {
        interactive: { type: "quick_reply", data: { options: [{ label: "🏠 Start a new search", value: "start over" }] } },
      });
    } finally {
      setIsLoading(false);
    }
  }, [context, messages, chatApiUrl]);

  // ── Form submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const txt = input.trim();
    if (!txt) return;
    if (step === "passengers") { const n = parseInt(txt); if (!isNaN(n) && n >= 1 && n <= 20) { setInput(""); handleQuickReply(`passengers:${n}`, `${n} passenger${n > 1 ? "s" : ""}`); return; } }
    if (step === "vehicles") { const n = parseInt(txt); if (!isNaN(n) && n >= 0 && n <= 10) { setInput(""); handleQuickReply(`vehicles:${n}`, n === 0 ? "No vehicles" : `${n} vehicle${n > 1 ? "s" : ""}`); return; } }

    // ── Route intercept: "from X to Y [at/on DATE]" ───────────────────────
    if (routes.length > 0) {
      const rq = detectTypedRoute(txt);
      if (rq) {
        const srcPort = findPortInRoutes(rq.src, routes);
        const destPort = findPortInRoutes(rq.dest, routes);
        if (srcPort && destPort && srcPort.code !== destPort.code) {
          const route = findRouteByPorts(routes, srcPort.code, destPort.code);
          if (route) {
            setInput("");
            clearInteractive();
            addMsg("user", txt);
            pendingRouteRef.current = route;
            setContext((prev) => ({
              ...prev,
              originPort: { code: route.src_port_code, name: route.src_port_name, id: route.src_port_id },
              destinationPort: { code: route.dest_port_code, name: route.dest_port_name, id: route.dest_port_id },
              selectedRoute: route,
            }));
            if (rq.parsedDate) {
              // Date supplied — search immediately with defaults (1 pax, 0 vehicles)
              setContext((prev) => ({ ...prev, departureDate: rq.parsedDate!, passengerCount: prev.passengerCount ?? 1, vehicleCount: prev.vehicleCount ?? 0 }));
              setStep("complete");
              await searchTrips(rq.parsedDate, 1, 0);
            } else {
              // No date — ask passengers
              const opts = [1,2,3,4,5,6,7,8,9,10].map((n) => ({ label: `👤 ${n} passenger${n > 1 ? "s" : ""}`, value: `passengers:${n}` }));
              addMsg("assistant", `**${route.src_port_name} → ${route.dest_port_name}** 🛳️\n\nHow many passengers?`, { interactive: { type: "quick_reply", data: { options: opts } } });
              setStep("passengers");
            }
            return;
          }
        }
      }
    }
    // ─────────────────────────────────────────────────────────────────────

    sendToAI(txt);
  };

  // ── Quick reply handler ─────────────────────────────────────────────────
  const handleQuickReply = async (value: string, label: string) => {
    if (value === "show_more_routes") {
      setMessages((prev) => {
        const updated = [...prev];
        for (let i = updated.length - 1; i >= 0; i--) {
          if (updated[i].role === "assistant" && updated[i].interactive) {
            updated[i] = { ...updated[i], interactive: { type: "quick_reply", data: { options: buildRouteOptions(true) } } };
            break;
          }
        }
        return updated;
      });
      return;
    }

    if (value === "start over" || value.toLowerCase().includes("start over")) {
      setContext({}); setMessages([]); setStep("route"); pendingRouteRef.current = null; initAttempted.current = false; return;
    }
    clearInteractive();

    if (value === "choose_origin" || value === "choose_route") {
      addMsg("user", "Choose another route");
      addMsg("assistant", "Where would you like to travel?", { interactive: { type: "quick_reply", data: { options: buildRouteOptions() } } });
      return;
    }

    if (value.startsWith("route:")) {
      const [, srcCode, destCode] = value.split(":");
      const route = findRouteByPorts(routes, srcCode, destCode);
      if (!route) return;
      pendingRouteRef.current = route;
      setContext((prev) => ({
        ...prev,
        originPort: { code: route.src_port_code, name: route.src_port_name, id: route.src_port_id },
        destinationPort: { code: route.dest_port_code, name: route.dest_port_name, id: route.dest_port_id },
        selectedRoute: route,
      }));
      addMsg("user", `${route.src_port_name} → ${route.dest_port_name}`);
      const opts = [1,2,3,4,5,6,7,8,9,10].map((n) => ({ label: `👤 ${n} passenger${n > 1 ? "s" : ""}`, value: `passengers:${n}` }));
      addMsg("assistant", `**${route.src_port_name} → ${route.dest_port_name}** 🛳️\n\nHow many passengers?`, { interactive: { type: "quick_reply", data: { options: opts } } });
      setStep("passengers");
      return;
    }

    if (value.startsWith("passengers:")) {
      const count = parseInt(value.split(":")[1]);
      setContext((prev) => ({ ...prev, passengerCount: count }));
      const opts = [
        { label: "🚫 No vehicles", value: "vehicles:0" },
        { label: "🚗 1 vehicle", value: "vehicles:1" },
        { label: "🚗 2 vehicles", value: "vehicles:2" },
        { label: "🚗 3 vehicles", value: "vehicles:3" },
      ];
      addMsg("user", `${count} passenger${count > 1 ? "s" : ""}`);
      addMsg("assistant", "Bringing any vehicles?", { interactive: { type: "quick_reply", data: { options: opts } } });
      setStep("vehicles");
      return;
    }

    if (value.startsWith("vehicles:")) {
      const v = parseInt(value.split(":")[1]);
      setContext((prev) => ({ ...prev, vehicleCount: v }));
      addMsg("user", v === 0 ? "No vehicles" : `${v} vehicle${v > 1 ? "s" : ""}`);
      setStep("date");

      const route = context.selectedRoute || pendingRouteRef.current;
      if (route) {
        setIsSearching(true);
        try {
          const dRes = await fetch(`${tripsApiUrl}/available-dates?origin_code=${route.src_port_code}&destination_code=${route.dest_port_code}&limit=7&vehicle_count=${v}`);
          let dateOpts: QuickReplyOption[] = [];
          if (dRes.ok) {
            const dd = await dRes.json();
            if (dd.data?.length) {
              dateOpts = dd.data.map((d: any) => {
                const dt = new Date(d.date + "T00:00:00");
                const lbl = dt.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                return { label: `📅 ${lbl} (${d.trip_count} trip${d.trip_count > 1 ? "s" : ""})`, value: d.date.split("T")[0] };
              });
            }
          }
          if (dateOpts.length > 0) {
            dateOpts.push({ label: "🗓️ Pick another date", value: "pick_date" });
            addMsg("assistant", "Dates with available trips:", { interactive: { type: "quick_reply", data: { options: dateOpts } } });
          } else {
            addMsg("assistant", "No upcoming trips for this route yet.", {
              interactive: { type: "quick_reply", data: { options: [{ label: "🔄 Different route", value: "start over" }] } },
            });
          }
        } catch {
          addMsg("assistant", "When would you like to travel?", {
            interactive: { type: "quick_reply", data: { options: [{ label: "🗓️ Pick a date", value: "pick_date" }] } },
          });
        } finally {
          setIsSearching(false);
        }
      }
      return;
    }

    if (value === "pick_date") { setShowDatePicker(true); return; }
    if (value === "tomorrow") {
      const d = new Date(); d.setDate(d.getDate() + 1);
      const lbl = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      await handleDateSelect(d, `Tomorrow (${lbl})`);
      return;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const d = new Date(value + "T00:00:00");
      const lbl = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
      await handleDateSelect(d, lbl);
      return;
    }
    if (value.toLowerCase().includes("different date")) {
      setShowDatePicker(true);
      addMsg("user", label);
      addMsg("assistant", "Select a new date:");
      return;
    }

    sendToAI(label);
  };

  // ── Formatting ──────────────────────────────────────────────────────────
  const formatTime = (time: string) => { try { return new Date(time).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: true }); } catch { return time; } };
  const formatPrice = (price: number) => new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0 }).format(price);

  // ── Styles ──────────────────────────────────────────────────────────────
  const s = buildStyles(t);

  // Determine if quick replies are port-selection (many items → use grid)
  const isPortGrid = (opts: QuickReplyOption[]) => opts.length > 4 && opts.some((o) => o.value.startsWith("route:") || o.value.startsWith("origin:") || o.value.startsWith("dest:"));

  const renderContent = (text: string) =>
    text.split(/(\*\*.*?\*\*)/).map((part, i) =>
      part.startsWith("**") && part.endsWith("**")
        ? <strong key={i}>{part.slice(2, -2)}</strong>
        : part
    );

  return (
    <div className={className} style={{ ...s.container, fontFamily: t.fontFamily }}>
      {/* Header */}
      <div style={s.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={s.headerIcon}><IconSparkles size={18} color="#fff" /></div>
          <div>
            <div style={{ fontSize: t.fontSize?.base, fontWeight: 700, color: t.colors.headerText, letterSpacing: "-0.01em" }}>Where Do You Want to Go?</div>
            <div style={{ fontSize: "11px", color: t.colors.headerSubtext, opacity: 0.85 }}>Chat with {displayName} to find your trip</div>
          </div>
        </div>
        {showFormToggle && onSwitchToForm && (
          <button onClick={onSwitchToForm} style={s.formToggle}>
            <IconFormInput size={14} color="#fff" /> <span>Form</span>
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} style={s.messagesArea}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ animation: "hayahai-fadeIn .25s ease" }}>
              {msg.role === "user" ? (
                /* ── User bubble ── */
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <div style={s.userBubble}>
                    <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{renderContent(msg.content)}</div>
                  </div>
                </div>
              ) : (
                /* ── Bot bubble with avatar ── */
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <div style={s.botAvatar}><IconBot size={14} color={t.colors.primary} /></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "10px", color: t.colors.primary, fontWeight: 600, marginBottom: 4, letterSpacing: "0.02em" }}>{displayName}</div>
                    <div style={s.botBubble}>
                      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{renderContent(msg.content)}</div>
                    </div>

                    {/* Trip cards */}
                    {msg.tripResults && msg.tripResults.length > 0 && (
                      <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 10, maxHeight: 340, overflowY: "auto" }}>
                        {msg.tripResults.map((trip, i) => (
                          <div key={trip.id || i} style={s.tripCard}>
                            <div style={s.tripCardHeader}>
                              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#fff" }}>
                                <IconShip size={16} color="#fff" />
                                <span style={{ fontWeight: 600, fontSize: t.fontSize?.xs }}>{trip.shippingLine}</span>
                              </div>
                              <span style={{ color: "rgba(255,255,255,0.8)", fontSize: "10px" }}>{trip.vesselName}</span>
                            </div>
                            <div style={{ padding: "14px 16px" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: t.fontSize?.lg, fontWeight: 700, color: t.colors.botBubbleText }}>{formatTime(trip.departureTime)}</div>
                                  <div style={{ fontSize: "10px", color: t.colors.mutedText, marginTop: 2 }}>{trip.srcPort}</div>
                                </div>
                                <div style={{ flex: 1, margin: "0 14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "10px", color: t.colors.mutedText }}>
                                    <IconClock size={12} /> {trip.duration}
                                  </div>
                                  <div style={{ width: "100%", display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                                    <div style={{ flex: 1, height: 2, background: t.colors.border, borderRadius: 1 }} />
                                    <IconArrowRight size={12} color={t.colors.primary} />
                                    <div style={{ flex: 1, height: 2, background: t.colors.border, borderRadius: 1 }} />
                                  </div>
                                </div>
                                <div style={{ textAlign: "center" }}>
                                  <div style={{ fontSize: t.fontSize?.lg, fontWeight: 700, color: t.colors.botBubbleText }}>{formatTime(trip.arrivalTime)}</div>
                                  <div style={{ fontSize: "10px", color: t.colors.mutedText, marginTop: 2 }}>{trip.destPort}</div>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 10, borderTop: `1px solid ${t.colors.border}` }}>
                                <div>
                                  <div style={{ fontSize: "20px", fontWeight: 700, color: t.colors.primary }}>{formatPrice(trip.price)}</div>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "10px", color: t.colors.mutedText, marginTop: 2 }}>
                                    <IconUsers size={12} /> {trip.availableSeats} seats left
                                  </div>
                                </div>
                                <button onClick={() => onTripSelect?.(trip)} style={s.chooseTripBtn}>Choose Trip</button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick replies */}
                    {msg.interactive?.type === "quick_reply" && (() => {
                      const opts = (msg.interactive!.data as any).options as QuickReplyOption[];
                      const useGrid = isPortGrid(opts);
                      return (
                        <div style={{
                          marginTop: 10,
                          display: "flex",
                          flexWrap: "wrap" as const,
                          gap: useGrid ? 6 : 8,
                          maxHeight: useGrid ? 240 : undefined,
                          overflowY: useGrid ? "auto" as const : undefined,
                          paddingRight: useGrid ? 4 : undefined,
                        }}>
                          {opts.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleQuickReply(opt.value, opt.label)}
                              style={useGrid ? s.portChip : s.quickReply}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ))}

          {(isLoading || isSearching) && (
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start", animation: "hayahai-fadeIn .2s ease" }}>
              <div style={s.botAvatar}><IconLoader size={14} color={t.colors.primary} /></div>
              <div style={{ ...s.botBubble, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: t.fontSize?.xs, color: t.colors.mutedText }}>{isSearching ? "Searching trips..." : `${displayName} is thinking...`}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Date Picker */}
      {showDatePicker && (
        <DatePickerInline
          theme={t}
          onSelect={handleDateSelect}
          onClose={() => setShowDatePicker(false)}
        />
      )}

      {/* Input */}
      <div style={s.inputArea}>
        <form onSubmit={handleSubmit} style={s.inputForm}>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Where do you want to go?"
            style={s.input}
            disabled={isLoading || isSearching}
          />
          <button type="submit" disabled={isLoading || isSearching || !input.trim()} style={{ ...s.sendBtn, opacity: isLoading || isSearching || !input.trim() ? 0.4 : 1 }}>
            <IconSend size={14} color="#fff" />
          </button>
        </form>
        {poweredByText && (
          <div style={s.poweredBy}><IconSparkles size={10} /> <span>{poweredByText}</span></div>
        )}
      </div>
    </div>
  );
}

// ─── Inline Date Picker ──────────────────────────────────────────────────────
function DatePickerInline({ theme: t, onSelect, onClose }: { theme: HayahAITheme; onSelect: (d: Date, l: string) => void; onClose: () => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dates = Array.from({ length: 21 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() + i); return d; });
  const fmtDay = (d: Date) => { const isT = d.toDateString() === today.toDateString(); const isTm = d.toDateString() === new Date(today.getTime() + 86400000).toDateString(); if (isT) return "Today"; if (isTm) return "Tmrw"; return d.toLocaleDateString("en-US", { weekday: "short" }); };

  return (
    <div style={{ position: "absolute", bottom: 56, left: 8, right: 8, background: "#fff", borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,.15)", border: `1px solid ${t.colors.border}`, zIndex: 50, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 12px", borderBottom: `1px solid ${t.colors.border}` }}>
        <span style={{ fontWeight: 600, fontSize: t.fontSize?.sm, color: t.colors.inputText }}>Select a date</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: "50%", display: "flex" }}><IconX size={16} color={t.colors.mutedText} /></button>
      </div>
      <div style={{ position: "relative", padding: "12px 8px" }}>
        <button onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: "smooth" })} style={{ position: "absolute", left: 0, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", cursor: "pointer", padding: 2, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}><IconChevronLeft size={16} /></button>
        <div ref={scrollRef} style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 24px", scrollbarWidth: "none" as any }}>
          {dates.map((date, idx) => {
            const isToday = date.toDateString() === today.toDateString();
            return (
              <button key={idx} onClick={() => {
                const lbl = date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
                onSelect(date, isToday ? `Today (${lbl})` : lbl);
              }} style={{
                flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                width: 56, height: 64, borderRadius: 8, cursor: "pointer", border: isToday ? "none" : `1px solid ${t.colors.border}`,
                background: isToday ? t.colors.primary : t.colors.inputBg, color: isToday ? "#fff" : t.colors.inputText,
                transition: "all .15s",
              }}>
                <span style={{ fontSize: "10px", fontWeight: 500, color: isToday ? "rgba(255,255,255,0.7)" : t.colors.mutedText }}>{fmtDay(date)}</span>
                <span style={{ fontSize: "18px", fontWeight: 600 }}>{date.getDate()}</span>
                <span style={{ fontSize: "10px", color: isToday ? "rgba(255,255,255,0.7)" : t.colors.mutedText }}>{date.toLocaleDateString("en-US", { month: "short" })}</span>
              </button>
            );
          })}
        </div>
        <button onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: "smooth" })} style={{ position: "absolute", right: 0, top: "50%", transform: "translateY(-50%)", zIndex: 10, background: "rgba(255,255,255,0.9)", border: "none", borderRadius: "50%", cursor: "pointer", padding: 2, boxShadow: "0 1px 3px rgba(0,0,0,.1)" }}><IconChevronRight size={16} /></button>
      </div>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
function buildStyles(t: HayahAITheme) {
  const base: Record<string, CSSProperties> = {
    container: {
      background: "#fff", backdropFilter: "blur(16px)",
      borderRadius: 16, boxShadow: "0 12px 48px rgba(0,0,0,.10), 0 2px 8px rgba(0,0,0,.06)",
      overflow: "hidden", position: "relative", width: "100%",
    },
    header: {
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: `linear-gradient(135deg, ${t.colors.headerBg} 0%, ${t.colors.headerBg}dd 100%)`,
      padding: "14px 18px",
    },
    headerIcon: {
      width: 36, height: 36, borderRadius: "50%",
      background: "rgba(255,255,255,0.15)", backdropFilter: "blur(4px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    },
    formToggle: {
      display: "flex", alignItems: "center", gap: 6,
      borderRadius: 9999, background: "rgba(255,255,255,0.15)",
      padding: "6px 14px", fontSize: t.fontSize?.xs, color: "#fff",
      border: "1px solid rgba(255,255,255,0.2)", cursor: "pointer",
      transition: "all .15s", fontFamily: "inherit",
    },
    messagesArea: {
      height: 340, overflowY: "auto" as const,
      background: `linear-gradient(180deg, ${t.colors.background} 0%, #fafbfc 100%)`,
      padding: "16px 14px",
      scrollBehavior: "smooth" as const,
    },
    botAvatar: {
      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
      background: `${t.colors.primary}12`,
      border: `1.5px solid ${t.colors.primary}30`,
      display: "flex", alignItems: "center", justifyContent: "center",
      marginTop: 18,
    },
    userBubble: {
      maxWidth: "80%",
      borderRadius: "18px 18px 4px 18px",
      padding: "10px 14px", fontSize: t.fontSize?.xs,
      background: `linear-gradient(135deg, ${t.colors.userBubble}, ${t.colors.userBubble}e8)`,
      color: t.colors.userBubbleText,
      boxShadow: "0 2px 8px rgba(0,0,0,.08)",
    },
    botBubble: {
      maxWidth: "100%",
      borderRadius: "4px 18px 18px 18px",
      padding: "10px 14px", fontSize: t.fontSize?.xs,
      background: t.colors.botBubble, color: t.colors.botBubbleText,
      border: `1px solid ${t.colors.botBubbleBorder}`,
      boxShadow: "0 1px 4px rgba(0,0,0,.04)",
    },
    quickReply: {
      padding: "8px 16px", borderRadius: 9999,
      border: `1.5px solid ${t.colors.quickReplyBorder}`,
      background: t.colors.quickReplyBg, color: t.colors.quickReplyText,
      fontSize: t.fontSize?.xs, fontWeight: 600, cursor: "pointer",
      transition: "all .2s ease", fontFamily: "inherit",
      boxShadow: "0 1px 3px rgba(0,0,0,.04)",
    },
    portChip: {
      padding: "9px 14px", borderRadius: 10,
      border: `1.5px solid ${t.colors.quickReplyBorder}`,
      background: t.colors.quickReplyBg, color: t.colors.quickReplyText,
      fontSize: "12px", fontWeight: 500, cursor: "pointer",
      transition: "all .2s ease", fontFamily: "inherit",
      textAlign: "left" as const, whiteSpace: "normal" as const,
      flex: "1 1 calc(33.333% - 4px)", minWidth: "130px",
      lineHeight: 1.3,
    },
    tripCard: {
      background: "#fff", borderRadius: 14,
      border: `1px solid ${t.colors.border}`,
      boxShadow: "0 2px 8px rgba(0,0,0,.06)", overflow: "hidden",
    },
    tripCardHeader: {
      background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.primaryHover})`,
      padding: "10px 14px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    },
    chooseTripBtn: {
      padding: "9px 18px",
      background: "linear-gradient(135deg, #22c55e, #059669)",
      color: "#fff", fontSize: t.fontSize?.xs, fontWeight: 600,
      borderRadius: 10, border: "none", cursor: "pointer",
      boxShadow: "0 2px 6px rgba(34,197,94,.25)",
      transition: "all .15s ease", fontFamily: "inherit",
    },
    inputArea: {
      borderTop: `1px solid ${t.colors.border}`,
      background: "#fff", padding: "12px 14px",
    },
    inputForm: {
      display: "flex", alignItems: "center", gap: 8,
      borderRadius: t.borderRadius.input,
      border: `1.5px solid ${t.colors.inputBorder}`,
      background: t.colors.inputBg, padding: "5px 12px",
      transition: "border-color .2s ease",
    },
    input: {
      flex: 1, background: "transparent", border: "none", outline: "none",
      padding: "5px 8px", fontSize: t.fontSize?.xs,
      color: t.colors.inputText, fontFamily: "inherit",
    },
    sendBtn: {
      width: 30, height: 30, borderRadius: "50%",
      background: `linear-gradient(135deg, ${t.colors.primary}, ${t.colors.primaryHover})`,
      border: "none", cursor: "pointer",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all .15s ease", flexShrink: 0,
      boxShadow: `0 2px 6px ${t.colors.primary}40`,
    },
    poweredBy: {
      marginTop: 8, display: "flex", justifyContent: "center",
      alignItems: "center", gap: 4, opacity: 0.4,
      fontSize: "9px", fontWeight: 500, color: t.colors.mutedText,
    },
  };
  return base;
}
