"use client";

// Replaces the root layout when layout-level rendering fails. Keep this
// self-contained so the error route does not depend on app providers.
export default function GlobalError({
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          alignItems: "center",
          display: "flex",
          fontFamily: "system-ui, -apple-system, sans-serif",
          justifyContent: "center",
          margin: 0,
          minHeight: "100vh",
        }}
      >
        <main style={{ maxWidth: 440, padding: 24, textAlign: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
            Haven Desk hit an unexpected error
          </h2>
          <p style={{ color: "#6b7280", fontSize: 14, marginBottom: 16 }}>
            The cockpit could not render this view. Try reloading it.
          </p>
          <button
            onClick={() => unstable_retry()}
            style={{
              border: "1px solid #d1d5db",
              borderRadius: 6,
              cursor: "pointer",
              padding: "8px 16px",
            }}
          >
            Reload
          </button>
        </main>
      </body>
    </html>
  );
}
