export const fireAndForget = (fn: () => Promise<void>) => fn().catch(() => {});
