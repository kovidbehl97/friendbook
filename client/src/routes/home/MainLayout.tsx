// src/routes/home/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import LeftSideBar from '../../components/home/LeftSideBar';
import RightSideBar from '../../components/home/RightSideBar';
// Assuming you have a RightSideBar component
// import RightSideBar from '../../components/home/RightSideBar';

function MainLayout() {
  return (
    <div className="flex w-full h-full max-h-[calc(100vh-56px)] bg-gray-300 pt-5">
      <LeftSideBar />
      <main className="w-full flex flex-col items-center gap-5 h-full overflow-y-scroll pb-5">
        <Outlet /> {/* This is where the child route components will render */}
      </main>
      <div className="min-w-80 p-4">
        {/* Placeholder for RightSideBar, you can add your component here */}
        <RightSideBar />
      </div>
    </div>
  );
}

export default MainLayout;