import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

const MainLayout = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-900 text-gray-200">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-6 bg-gray-900">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
