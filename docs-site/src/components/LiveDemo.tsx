import React, { useState } from 'react';
import { useColorMode } from '@docusaurus/theme-common';

interface LiveDemoProps {
  src: string;
  height?: number;
  title?: string;
  sourceLink?: string;
}

/**
 * LiveDemo component for embedding interactive game demos
 * in documentation pages.
 *
 * @example
 * <LiveDemo
 *   src="/demos/ui-button.html"
 *   height={300}
 *   title="UIButton Example"
 *   sourceLink="https://github.com/gamebyte-ai/gamebyte-framework/blob/main/examples/ui-button"
 * />
 */
export default function LiveDemo({
  src,
  height = 400,
  title = 'Live Demo',
  sourceLink,
}: LiveDemoProps): JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { colorMode } = useColorMode();

  // Build iframe URL with theme parameter (SSR-safe)
  const iframeSrc = (() => {
    if (typeof window === 'undefined') return src;
    try {
      const url = new URL(src, window.location.origin);
      url.searchParams.set('theme', colorMode);
      return url.toString();
    } catch {
      // Fallback for invalid URLs
      const separator = src.includes('?') ? '&' : '?';
      return `${src}${separator}theme=${colorMode}`;
    }
  })();

  const handleLoad = () => {
    setIsLoading(false);
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <div className="live-demo-container">
      <div className="live-demo-header">
        <span className="live-demo-title">
          <span role="img" aria-label="gamepad">🎮</span>
          {title}
        </span>
        <div className="live-demo-actions">
          {sourceLink && (
            <a
              href={sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="live-demo-source-link"
              title="View source code"
            >
              {'</>'}
            </a>
          )}
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="live-demo-fullscreen-link"
            title="Open in new tab"
          >
            ⛶
          </a>
        </div>
      </div>
      <div className="live-demo-content" style={{ position: 'relative', minHeight: height }}>
        {isLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#1a1a2e',
              color: '#818cf8',
            }}
          >
            Loading demo...
          </div>
        )}
        {hasError ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height,
              backgroundColor: '#1a1a2e',
              color: '#f87171',
            }}
          >
            Failed to load demo. <a href={src} target="_blank" rel="noopener noreferrer" style={{ marginLeft: '0.5rem', color: '#818cf8' }}>Open directly</a>
          </div>
        ) : (
          <iframe
            key={colorMode} // Force reload on theme change
            src={iframeSrc}
            className="live-demo-iframe"
            style={{ height, display: isLoading ? 'none' : 'block' }}
            onLoad={handleLoad}
            onError={handleError}
            title={title}
            sandbox="allow-scripts allow-same-origin"
          />
        )}
      </div>
    </div>
  );
}
