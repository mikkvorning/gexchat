'use client';

/**
 * This component handles Material-UI's styling solution (Emotion) in Next.js App Router.
 * It's needed because:
 * 1. MUI uses Emotion for dynamic style generation
 * 2. These styles must be identical between server and client to prevent hydration errors
 * 3. Next.js App Router needs special handling for server-side rendered styles
 *
 * How it works:
 * - Creates an Emotion cache to store and manage CSS styles
 * - Uses Next.js's useServerInsertedHTML to inject styles during SSR
 * - Ensures styles are properly shared between server and client
 * - Prevents the "hydration mismatch" error in MUI components
 *
 * Note: This is only needed when using MUI v7+ with Next.js App Router.
 * If you see hydration errors, this component is likely related to the solution.
 */

import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import { useServerInsertedHTML } from 'next/navigation';
import { useState } from 'react';

export default function EmotionRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Create a new Emotion cache instance, only once per component lifecycle
  const [cache] = useState(() => {
    const cache = createCache({ key: 'css' }); // 'css' is the key for style data attributes
    cache.compat = true; // Enable compatibility mode for SSR
    return cache;
  });
  // During SSR, this hook injects the accumulated styles into the HTML
  // This ensures the server-rendered HTML includes all necessary styles
  useServerInsertedHTML(() => {
    return (
      <style
        // Marks this style tag with Emotion's key and the IDs of all styles used
        data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(' ')}`}
        // Injects the actual CSS rules that were collected in the cache
        dangerouslySetInnerHTML={{
          __html: Object.values(cache.inserted).join(' '),
        }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
