import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../api/axiosInstance";
import ProfileFieldsAddEditBox from "../ProfileFieldsAddEditBox";
import { useOutletContext } from "react-router-dom";

interface ProfileUser {
  id: string;
  name: string;
  currentCity?: string | null;
  hometown?: string | null;
  pastCities?: string[] | null;
}

interface ProfileOutletContext {
  user: ProfileUser;
  isMyProfile: boolean;
}

interface UpdateUserProfileData {
  currentCity?: string | null;
  hometown?: string | null;
  pastCities?: string[] | null;
}

function AboutPlacesLived() {
  const { user, isMyProfile } = useOutletContext<ProfileOutletContext>();
  const queryClient = useQueryClient();
  // This state is the single source of truth for which field is being edited.
  const [editingField, setEditingField] = useState<
    keyof UpdateUserProfileData | null
  >(null);

  const updateUserProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfileData) => {
      const response = await axiosInstance.put("/users/profile", data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
      setEditingField(null);
    },
    onError: (error) => {
      console.error("Error updating profile field:", error);
      alert("Failed to update field. Please try again.");
    },
  });

  const handleSave = (
    field: keyof UpdateUserProfileData,
    value: string | string[] | null
  ) => {
    const dataToUpdate: UpdateUserProfileData = { [field]: value as any };
    updateUserProfileMutation.mutate(dataToUpdate);
  };

  const hasValue = (value: string | string[] | null | undefined): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    return false;
  };

  // Helper function to render a text input field
  const renderTextField = (
    field: keyof UpdateUserProfileData,
    label: string,
    value: string | null | undefined
  ) => {
    const isCurrentlyEditing = editingField === field;
    const placeholder = `Add ${label.toLowerCase()}`;
    const displayValue = value || (
      <span className="text-gray-500">Not provided</span>
    );

    return (
      <div className="flex items-center mb-4">
        <span className="font-medium w-32">{label}:</span>
        <div className="flex-grow relative">
          {isCurrentlyEditing && isMyProfile ? (
            <ProfileFieldsAddEditBox
              initialValue={value}
              onSave={(val) => handleSave(field, val as string | null)}
              onCancel={() => setEditingField(null)}
              placeholder={placeholder}
              type="text"
              label={label}
            />
          ) : (
            <div className="flex w-full items-start">
              <span className="flex-grow text-gray-700">{displayValue}</span>
              {isMyProfile && (
                <button
                  onClick={() => setEditingField(field)}
                  className="ml-auto text-blue-500 hover:text-blue-700 font-medium"
                >
                  {hasValue(value) ? "Edit" : "Add"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // Helper function to render an array-text field
  const renderArrayTextField = (
    field: keyof UpdateUserProfileData,
    label: string,
    value: string[] | null | undefined
  ) => {
    const isCurrentlyEditing = editingField === field;
    const placeholder = `Enter ${label.toLowerCase()}, comma-separated`;

    return (
      <div className="flex items-center mb-4">
        <span className="font-medium w-32">{label}:</span>
        <div className="flex-grow relative">
          {isCurrentlyEditing && isMyProfile ? (
            <ProfileFieldsAddEditBox
              initialValue={value}
              onSave={(val) => handleSave(field, val as string[] | null)}
              onCancel={() => setEditingField(null)}
              placeholder={placeholder}
              type="array-text"
              label={label}
            />
          ) : (
            <div className="flex w-full items-start">
              <span className="flex-grow text-gray-700">
                {hasValue(value) ? (
                  <ul className="list-disc list-inside">
                    {value!.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-gray-500">Not provided</span>
                )}
              </span>
              {isMyProfile && (
                <button
                  onClick={() => setEditingField(field)}
                  className="ml-auto text-blue-500 hover:text-blue-700 font-medium"
                >
                  {hasValue(value) ? "Edit" : "Add"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Places Lived</h3>
      <div className="space-y-2">
        {renderTextField("currentCity", "Current City", user.currentCity)}
        {renderTextField("hometown", "Hometown", user.hometown)}
        {renderArrayTextField("pastCities", "Past Cities", user.pastCities)}
      </div>
    </div>
  );
}

export default AboutPlacesLived;
