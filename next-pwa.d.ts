declare module "next-pwa" {
  import type { NextConfig } from "next";

  interface PWAConfig {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    disable?: boolean;
    fallbacks?: {
      document?: string;
      image?: string;
      audio?: string;
      video?: string;
      font?: string;
    };
    cacheOnFrontEndNav?: boolean;
    reloadOnOnline?: boolean;
    sw?: string;
    scope?: string;
    publicExcludes?: string[];
    buildExcludes?: (string | RegExp)[];
    cacheStartUrl?: boolean;
    dynamicStartUrl?: boolean;
    dynamicStartUrlRedirect?: string;
    runtimeCaching?: object[];
  }

  function withPWA(config: PWAConfig): (nextConfig: NextConfig) => NextConfig;

  export default withPWA;
}
