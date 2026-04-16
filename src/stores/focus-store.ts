import { create } from "zustand";
import {
  FocusEngine,
  type FocusEngineConfig,
  type EngineState,
  type EngineEvent,
} from "@/lib/focus-engine";

interface FocusStore {
  // State
  engine: FocusEngine | null;
  engineState: EngineState | null;
  sessionId: string | null; // server-side session ID
  objectiveId: string | null;
  configId: string | null;
  isActive: boolean;

  // Actions
  startFocus: (params: {
    config: FocusEngineConfig;
    sessionId: string;
    configId: string;
    objectiveId?: string;
  }) => void;
  pause: () => void;
  resume: () => void;
  skipInterval: () => void;
  finish: () => EngineState | null;
  reset: () => void;
}

export const useFocusStore = create<FocusStore>((set, get) => ({
  engine: null,
  engineState: null,
  sessionId: null,
  objectiveId: null,
  configId: null,
  isActive: false,

  startFocus: ({ config, sessionId, configId, objectiveId }) => {
    const prev = get().engine;
    if (prev) prev.destroy();

    const engine = new FocusEngine(config);

    const handleEvent = (event: EngineEvent) => {
      set({ engineState: event.state });
    };

    engine.onEvent(handleEvent);
    engine.start();

    set({
      engine,
      engineState: engine.getState(),
      sessionId,
      configId,
      objectiveId: objectiveId ?? null,
      isActive: true,
    });
  },

  pause: () => {
    get().engine?.pause();
    const state = get().engine?.getState() ?? null;
    set({ engineState: state });
  },

  resume: () => {
    get().engine?.resume();
    const state = get().engine?.getState() ?? null;
    set({ engineState: state });
  },

  skipInterval: () => {
    get().engine?.skipInterval();
  },

  finish: () => {
    const engine = get().engine;
    if (!engine) return null;
    const finalState = engine.finish();
    engine.destroy();
    set({ isActive: false });
    return finalState;
  },

  reset: () => {
    get().engine?.destroy();
    set({
      engine: null,
      engineState: null,
      sessionId: null,
      objectiveId: null,
      configId: null,
      isActive: false,
    });
  },
}));
