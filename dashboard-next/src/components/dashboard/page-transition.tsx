'use client';
import { AnimatePresence, motion } from 'motion/react';
import { LayoutRouterContext } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { usePathname } from 'next/navigation';
import { useContext, useEffect, useState, type ContextType } from 'react';

// This sucks, but prevents the page appearing before the animation kicks in
function FrozenRouter({ children }: { children: React.ReactNode }) {
  const context = useContext(LayoutRouterContext);
  const [frozen, setFrozen] = useState<ContextType<
    typeof LayoutRouterContext
  > | null>(null);

  // Freeze only once on first mount (that's why no deps)
  useEffect(() => {
    setFrozen(context);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <LayoutRouterContext.Provider value={frozen ?? context}>
      {children}
    </LayoutRouterContext.Provider>
  );
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.main
        key={pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{
          duration: 0.35,
          ease: 'easeInOut',
        }}
        className="inset-0 h-full w-full overflow-hidden"
      >
        <FrozenRouter>{children}</FrozenRouter>
      </motion.main>
    </AnimatePresence>
  );
}
