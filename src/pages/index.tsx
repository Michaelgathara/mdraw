import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-8">PageDraw</h1>
      <p className="text-xl mb-12 text-center max-w-2xl">
        A page-based drawing tool with PDF export functionality.
        Create beautiful diagrams, illustrations, and sketches with ease.
      </p>
      <div className="flex gap-4">
        <Link 
          href="/editor" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Project
        </Link>
        <Link 
          href="/projects" 
          className="px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Open Project
        </Link>
      </div>
    </main>
  );
}