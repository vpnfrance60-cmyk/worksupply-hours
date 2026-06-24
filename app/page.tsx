export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-sm text-center">
        <h1 className="text-xl font-semibold mb-2">WorkSupply Hours</h1>
        <p className="text-gray-600 mb-6 text-sm">
          Workers log hours at <code className="bg-gray-100 px-1 rounded">/worker</code>.
          Clients review at <code className="bg-gray-100 px-1 rounded">/client/[slug]</code>.
        </p>
      </div>
    </main>
  );
}
