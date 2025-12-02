import React, { useEffect, useRef } from 'react';

interface PDFViewerProps {
  url: string | null;
  page?: number;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, page = 1 }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (iframeRef.current && url) {
      // Update the iframe src to jump to the page
      // Note: This works for browser's default PDF viewer usually
      iframeRef.current.src = `${url}#page=${page}`;
    }
  }, [url, page]);

  if (!url) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
        <p>No PDF selected</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-200">
      <iframe
        ref={iframeRef}
        src={`${url}#page=${page}`}
        className="h-full w-full border-none"
        title="PDF Viewer"
      />
    </div>
  );
};
