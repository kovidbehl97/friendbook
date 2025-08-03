// client/src/routes/profile/ContactAndBasicInfoSection.tsx

import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../api/axiosInstance";
import ProfileFieldsAddEditBox from "../ProfileFieldsAddEditBox";
import { useOutletContext } from "react-router-dom";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  contactPhoneNumber?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  socialLinks?: string[] | null;
  gender?: Gender | null;
  pronouns?: string | null;
  dateOfBirth?: string | null;
  languages?: string[] | null;
}

interface ProfileOutletContext {
  user: ProfileUser;
  isMyProfile: boolean;
}

export type Gender =
  | "MALE"
  | "FEMALE"
  | "NON_BINARY"
  | "PREFER_NOT_TO_SAY"
  | "CUSTOM";

interface UpdateUserProfileData {
  contactPhoneNumber?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  socialLinks?: string[] | null;
  gender?: Gender | null;
  pronouns?: string | null;
  dateOfBirth?: string | null;
  languages?: string[] | null;
}

function AboutContactBasicInfo() {
  const { user, isMyProfile } = useOutletContext<ProfileOutletContext>();
  const queryClient = useQueryClient();

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
    let dataToUpdate: UpdateUserProfileData;

    if (field === "dateOfBirth") {
      dataToUpdate = { [field]: value as string | null };
    } else if (field === "gender") {
      dataToUpdate = { [field]: value as Gender | null };
    } else {
      dataToUpdate = { [field]: value };
    }

    updateUserProfileMutation.mutate(dataToUpdate);
  };

  const GENDER_OPTIONS = [
    { value: "MALE", label: "Male" },
    { value: "FEMALE", label: "Female" },
    { value: "NON_BINARY", label: "Non-Binary" },
    { value: "PREFER_NOT_TO-SAY", label: "Prefer not to say" },
    { value: "CUSTOM", label: "Custom" },
  ];

  const hasValue = (value: string | string[] | null | undefined): boolean => {
    if (value === null || value === undefined) return false;
    if (typeof value === "string") return value.trim() !== "";
    if (Array.isArray(value)) return value.length > 0;
    return false;
  };

  // Refactored helper function for rendering a generic field
  const renderField = (
    field: keyof UpdateUserProfileData,
    label: string,
    value: string | string[] | null | undefined,
    inputType: "text" | "textarea" | "date" | "array-text" | "url" = "text"
  ) => {
    const isCurrentlyEditing = editingField === field;
    const placeholder = `Add ${label.toLowerCase()}`;
    const displayValue = Array.isArray(value) ? (
      hasValue(value) ? (
        <ul className="list-disc list-inside">
          {value.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
      ) : (
        <span className="text-gray-500">Not provided</span>
      )
    ) : (
      value || <span className="text-gray-500">Not provided</span>
    );

    return (
      <div className="flex items-center mb-4">
        <span className="font-medium w-32">{label}:</span>
        <div className="flex-grow relative">
          {isCurrentlyEditing && isMyProfile ? (
            <ProfileFieldsAddEditBox
              initialValue={value}
              onSave={(val) =>
                handleSave(field, val as string | string[] | null)
              }
              onCancel={() => setEditingField(null)}
              placeholder={placeholder}
              type={inputType}
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

  const renderGenderField = () => {
    const isCurrentlyEditing = editingField === "gender";
    const displayValue = user.gender ? (
      GENDER_OPTIONS.find((opt) => opt.value === user.gender)?.label ||
      user.gender
    ) : (
      <span className="text-gray-500">Not provided</span>
    );

    return (
      <div className="flex items-center mb-4">
        <span className="font-medium w-32">Gender:</span>
        <div className="flex-grow relative">
          {isCurrentlyEditing && isMyProfile ? (
            <ProfileFieldsAddEditBox
              initialValue={user.gender}
              onSave={(val) => handleSave("gender", val as Gender | null)}
              onCancel={() => setEditingField(null)}
              placeholder="Select gender"
              type="select"
              options={GENDER_OPTIONS}
              label="Gender"
            />
          ) : (
            <div className="flex w-full items-start">
              <span className="flex-grow text-gray-700">{displayValue}</span>
              {isMyProfile && (
                <button
                  onClick={() => setEditingField("gender")}
                  className="ml-auto text-blue-500 hover:text-blue-700 font-medium"
                >
                  {hasValue(user.gender) ? "Edit" : "Add"}
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
      <h3 className="text-lg font-semibold mb-4">Contact and Basic Info</h3>

      <div className="mb-6">
        <h4 className="text-md font-semibold mb-2">Contact Info</h4>
        <div className="space-y-2">
          {renderField("contactPhoneNumber", "Phone", user.contactPhoneNumber)}
          {renderField(
            "contactEmail",
            "Email",
            user.contactEmail || user.email
          )}
          {renderField("website", "Website", user.website, "url")}
          {renderField(
            "socialLinks",
            "Social Links",
            user.socialLinks,
            "array-text"
          )}
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2">Basic Info</h4>
        <div className="space-y-2">
          {renderGenderField()}
          {renderField("pronouns", "Pronouns", user.pronouns)}
          {renderField(
            "dateOfBirth",
            "Date of Birth",
            user.dateOfBirth,
            "date"
          )}
          {renderField("languages", "Languages", user.languages, "array-text")}
        </div>
      </div>
    </div>
  );
}

export default AboutContactBasicInfo;
