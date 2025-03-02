import { Outlet } from 'react-router-dom';
import Header from './components/Header.tsx';

function App() {
  return (
    <div className="flex h-screen flex-col font-rocknroll">
      <header className="border-b-8 border-red-600 bg-zinc-700">
        <Header />
      </header>

      <main className="mb-auto">
        <Outlet />
      </main>

      <footer className="bg-zinc-800">
        <div className="flex flex-col gap-2 p-2 text-zinc-300 lg:mx-auto lg:max-w-7xl lg:px-5">
          <span className="text-4xl">Footer</span>
          <div className="flex gap-4 text-4xl">
            <div className="max-xl:hidden">XL</div>
            <div className="max-lg:hidden">LG</div>
            <div className="max-md:hidden">MD</div>
            <div className="max-sm:hidden">SM</div>
            <div className="max-xs:hidden">XS</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
