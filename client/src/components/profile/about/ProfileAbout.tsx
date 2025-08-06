import React from "react";
import { NavLink, Outlet, useOutletContext } from "react-router-dom";
import { UserProfileData } from "../../../routes/profile/Profile";

interface OutletContextType {
  user: UserProfileData;
  isMyProfile: boolean;
}

function ProfileAbout() {
  const { user, isMyProfile } = useOutletContext<OutletContextType>();

  return (
    <div className="flex gap-4">
      {/* This is the About navigation sidebar */}
      <div className="w-1/4 bg-white rounded-lg shadow-md p-4 sticky top-4">
        <h2 className="text-xl font-semibold mb-4">About</h2>
        <ul>
          <li className="mb-2">
            <NavLink
              to="." // <-- Point to the current path
              end // <-- Add the 'end' prop for exact matching
              className={({ isActive }) =>
                "block p-2 rounded-md transition-colors duration-200 " +
                (isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100")
              }
            >
              Overview
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="work-education"
              className={({ isActive }) =>
                "block p-2 rounded-md transition-colors duration-200 " +
                (isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100")
              }
            >
              Work and Education
            </NavLink>
          </li>
          <li className="mb-2">
            <NavLink
              to="places-lived"
              className={({ isActive }) =>
                "block p-2 rounded-md transition-colors duration-200 " +
                (isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100")
              }
            >
              Places Lived
            </NavLink>
          </li>
          <li>
            <NavLink
              to="contact-basic-info"
              className={({ isActive }) =>
                "block p-2 rounded-md transition-colors duration-200 " +
                (isActive
                  ? "bg-blue-100 text-blue-700 font-medium"
                  : "text-gray-700 hover:bg-gray-100")
              }
            >
              Contact and Basic Info
            </NavLink>
          </li>
        </ul>
      </div>

      {/* This is the content area for the nested 'About' pages */}
      <div className="w-3/4">
        <Outlet context={{ user, isMyProfile }} />
      </div>
    </div>
  );
}

export default ProfileAbout;