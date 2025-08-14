// client/src/routes/friends/FriendsPage.tsx
import { Outlet } from "react-router-dom";
import LeftSideBar from "../../components/friends/LeftSideBar";

function FriendsPage() {
  return (
    <div className="flex w-full h-full max-h-[calc(100vh-56px)] bg-gray-300">
      <LeftSideBar/>
      <Outlet />
      
    </div>
  );
}

export default FriendsPage;
