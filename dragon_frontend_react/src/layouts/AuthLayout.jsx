export default function AuthLayout({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <div
        style={{
          width: 360,
          padding: 24,
          border: "1px solid #ddd",
          borderRadius: 8,
        }}
      >
        {children}
      </div>
    </div>
  );
}
