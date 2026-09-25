import type { DeviceProfile, GpuInfo } from "./types";

export function isMobileUA(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|Silk|Kindle/i.test(navigator.userAgent);
}

export function osHint(): string {
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android\s([\d.]+)/);
    return m ? `Android ${m[1]}` : "Android";
  }
  if (/iPhone|iPad|iPod/i.test(ua)) return `iOS ${/OS\s([\d_]+)/.exec(ua)?.[1]?.replace(/_/g, ".") ?? ""}`.trim();
  if (/CrOS/.test(ua)) return "ChromeOS";
  if (/Mac/.test(ua)) return "macOS";
  if (/Win/.test(ua)) return "Windows";
  return "Unknown OS";
}

export function browserHint(): string {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/OPR\//.test(ua)) return "Opera";
  if (/SamsungBrowser/.test(ua)) return "Samsung Internet";
  if (/Firefox/.test(ua)) return "Firefox";
  if (/Chrome/.test(ua)) return "Chrome";
  if (/Safari/.test(ua)) return "Safari";
  return "Browser";
}

function gpuTier(vendor: string, renderer: string): GpuInfo["tier"] {
  const s = `${vendor} ${renderer}`.toLowerCase();
  if (/apple\s*a1[4-9]|m[1-9]\s|a17|a18/.test(s)) return "flagship";
  if (/adreno\s*(7[5-9]|8[0-9])|immortalis|mali-g7[1-9]|xclipse/.test(s)) return "flagship";
  if (/adreno\s*(6[4-9]|7[0-4])|mali-g6[1-9]|mali-g5[7-9]/.test(s)) return "high";
  if (/adreno\s*(6[1-3]|5[4-9])|mali-g[5-6][0-8]|powervr/.test(s)) return "mid";
  if (/adreno\s*[1-5][0-3]|mali-g[1-4][0-8]|mali-[t4]/.test(s)) return "entry";
  return "unknown";
}

export async function scanDevice(): Promise<DeviceProfile> {
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    hardwareConcurrency?: number;
    maxTouchPoints?: number;
  };
  const gpu = await probeGpu();
  const dm = nav.deviceMemory ?? null;
  return {
    platform: nav.platform ?? "unknown",
    mobile: isMobileUA(),
    cores: nav.hardwareConcurrency ?? 4,
    deviceMemoryGb: dm,
    screenW: screen.width,
    screenH: screen.height,
    dpr: Math.round((window.devicePixelRatio || 1) * 100) / 100,
    gpu,
    touchPoints: nav.maxTouchPoints ?? 0,
    osHint: osHint(),
    browser: browserHint(),
  };
}

async function probeGpu(): Promise<GpuInfo> {
  const canvas = document.createElement("canvas");
  const gl = (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) as WebGL2RenderingContext | WebGLRenderingContext | null;
  if (!gl) {
    return {
      vendor: "unavailable", renderer: "unavailable", tier: "unknown",
      maxTextureSize: 0, extensions: [], fillRateMpix: 0, shaderScore: 0,
    };
  }
  const ext = gl.getExtension("WEBGL_debug_renderer_info");
  const vendor = (ext ? (gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) as string) : gl.getParameter(gl.VENDOR)) || "unknown";
  const renderer = (ext ? (gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) as string) : gl.getParameter(gl.RENDERER)) || "unknown";
  const maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
  const extensions = Array.from(gl.getSupportedExtensions() ?? []);
  void ext;
  return {
    vendor: String(vendor),
    renderer: String(renderer),
    tier: gpuTier(String(vendor), String(renderer)),
    maxTextureSize,
    extensions,
    fillRateMpix: 0,
    shaderScore: 0,
  };
}
