import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../api/axiosInstance";
import ProfileFieldsAddEditBox from "../ProfileFieldsAddEditBox";
import { useOutletContext } from "react-router-dom";

interface ProfileUser {
  id: string;
  name: string;
  bio?: string | null;
  currentWorkplace?: string | null;
  hometown?: string | null;
  studiedAt?: string | null;
  maritalStatus?: MaritalStatus | null;
  contactPhoneNumber?: string | null;
  currentCity?: string | null;
}

interface ProfileOutletContext {
  user: ProfileUser;
  isMyProfile: boolean;
}

export type MaritalStatus =
  | "SINGLE"
  | "IN_RELATIONSHIP"
  | "MARRIED"
  | "DIVORCED"
  | "WIDOWED"
  | "COMPLICATED"
  | "OPEN_RELATIONSHIP"
  | "ENGAGED";

interface UpdateUserProfileData {
  currentWorkplace?: string | null;
  hometown?: string | null;
  studiedAt?: string | null;
  maritalStatus?: MaritalStatus | null;
  contactPhoneNumber?: string | null;
  currentCity?: string | null;
}

function AboutOverview() {
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
    value: string | MaritalStatus | null
  ) => {
    const dataToUpdate: UpdateUserProfileData = { [field]: value as any };
    updateUserProfileMutation.mutate(dataToUpdate);
  };

  const MARITAL_STATUS_OPTIONS = [
    { value: "SINGLE", label: "Single" },
    { value: "IN_RELATIONSHIP", label: "In a Relationship" },
    { value: "MARRIED", label: "Married" },
    { value: "DIVORCED", label: "Divorced" },
    { value: "WIDOWED", label: "Widowed" },
    { value: "COMPLICATED", label: "It's Complicated" },
    { value: "OPEN_RELATIONSHIP", label: "In an Open Relationship" },
    { value: "ENGAGED", label: "Engaged" },
  ];

  const hasValue = (
    value: string | MaritalStatus | null | undefined
  ): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    return false;
  };

  // Refactored helper function to render a generic field
  const renderField = (
    field: keyof UpdateUserProfileData,
    label: string,
    value: string | null | undefined,
    type: "text" | "select" = "text"
  ) => {
    const isCurrentlyEditing = editingField === field;
    const placeholder = `Add ${label.toLowerCase()}`;
    const displayValue = value || (
      <span className="text-gray-500">Not provided</span>
    );
    const isSelect = type === "select";

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
              type={isSelect ? "select" : "text"}
              options={isSelect ? MARITAL_STATUS_OPTIONS : undefined}
              label={label}
            />
          ) : (
            <div className="flex w-full items-start">
              <span className="flex-grow text-gray-700">
                {isSelect && value
                  ? MARITAL_STATUS_OPTIONS.find((opt) => opt.value === value)
                      ?.label
                  : displayValue}
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
      <h3 className="text-lg font-semibold mb-2">Overview</h3>
      <div className="space-y-2">
        {renderField("currentWorkplace", "Workplace", user.currentWorkplace)}
        {renderField("studiedAt", "School", user.studiedAt)}
        {renderField("currentCity", "Current City", user.currentCity)}
        {renderField("hometown", "Hometown", user.hometown)}
        {renderField(
          "maritalStatus",
          "Relationship",
          user.maritalStatus,
          "select"
        )}
        {renderField("contactPhoneNumber", "Contact", user.contactPhoneNumber)}
      </div>
    </div>
  );
}

export default AboutOverview;
