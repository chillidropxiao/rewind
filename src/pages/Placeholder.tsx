export default function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-display font-bold text-slate-900 mb-4">{title}</h1>
      <p className="text-slate-600">该功能正在开发中，敬请期待...</p>
    </div>
  );
}
