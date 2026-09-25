export interface CpuCore {
  index: number;
  pCores: number;
  schedulerHint: number | null;
  batchMs: number;
  opsPerSec: number;
  loadFactor: number;
}

export interface GpuInfo {
  vendor: string;
  renderer: string;
  tier: "flagship" | "high" | "mid" | "entry" | "unknown";
  maxTextureSize: number;
  extensions: string[];
  fillRateMpix: number;
  shaderScore: number;
}

export interface DeviceProfile {
  platform: string;
  mobile: boolean;
  cores: number;
  deviceMemoryGb: number | null;
  screenW: number;
  screenH: number;
  dpr: number;
  gpu: GpuInfo;
  touchPoints: number;
  osHint: string;
  browser: string;
}

export interface CpuBench {
  singleOpsPerSec: number;
  multiOpsPerSec: number;
  scalingEfficiency: number;
  schedulerJitterMs: number;
  cores: CpuCore[];
}

export interface GpuBench {
  fillRateMpix: number;
  shaderScore: number;
  jankPct: number;
  fpsSteady: number;
  trianglesPerSec: number;
}

export interface ThermalBench {
  driftPct: number;
  droppedFpsPct: number;
  verdict: "cool" | "warm" | "hot" | "critical";
  sustainedFps: number;
}

export interface MemoryBench {
  pressureScore: number;
  transferOpsPerSec: number;
  ok: boolean;
}

export interface BenchResults {
  cpu: CpuBench;
  gpu: GpuBench;
  thermal: ThermalBench;
  memory: MemoryBench;
  timestamp: number;
}

export interface Scores {
  overall: number;
  cpu: number;
  gpu: number;
  stability: number;
  memory: number;
  rank: string;
}

export interface BoostAction {
  id: string;
  title: string;
  detail: string;
  impact: number;
  risk: "none" | "low" | "medium";
  steps: string[];
}

export interface BoostPlan {
  headline: string;
  estimatedFpsGainPct: number;
  bottleneck: "gpu" | "cpu" | "thermal" | "memory" | "balanced";
  actions: BoostAction[];
}

export interface GameProfile {
  id: string;
  name: string;
  category: string;
  hdTier: number;
  gpuBound: number;
  cpuBound: number;
  ramNeedGb: number;
  thermalLoad: number;
  tips: string[];
}

export interface DiagnosticReport {
  device: DeviceProfile;
  bench: BenchResults;
  scores: Scores;
  plan: BoostPlan;
  games: { game: GameProfile; verdict: string; fpsEstimate: [number, number] }[];
}
