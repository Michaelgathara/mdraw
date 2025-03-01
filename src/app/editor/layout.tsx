// src/app/editor/layout.tsx
export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen flex flex-col">
      {children}
    </div>
  );
}