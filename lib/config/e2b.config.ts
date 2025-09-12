// E2B Sandbox Configuration
export const e2bConfig = {
  // Sandbox timeout in minutes
  timeoutMinutes: 30,

  // Convert to milliseconds for E2B API
  get timeoutMs() {
    return this.timeoutMinutes * 60 * 1000;
  },

  // Vite development server port
  vitePort: 5173,

  // Time to wait for Vite to be ready (in milliseconds)
  viteStartupDelay: 7000,

  // Time to wait for CSS rebuild (in milliseconds)
  cssRebuildDelay: 2000,
};

export default e2bConfig;
