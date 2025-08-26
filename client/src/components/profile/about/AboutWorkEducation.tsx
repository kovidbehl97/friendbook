import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../../../api/axiosInstance";
import ProfileFieldsAddEditBox from "../ProfileFieldsAddEditBox";
import { useOutletContext } from "react-router-dom";

interface WorkExperiencePayload {
  id?: string;
  company: string;
  position?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  isCurrent?: boolean;
}

interface EducationExperiencePayload {
  id?: string;
  institution: string;
  degree?: string | null;
  fieldOfStudy?: string | null;
  description?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

interface ProfileUser {
  id: string;
  name: string;
  workExperiences?: WorkExperiencePayload[];
  educationExperiences?: EducationExperiencePayload[];
}

interface ProfileOutletContext {
  user: ProfileUser;
  isMyProfile: boolean;
}

function AboutWorkEducation() {
  const { user, isMyProfile } = useOutletContext<ProfileOutletContext>();
  const queryClient = useQueryClient();

  const [addingNewWork, setAddingNewWork] = useState(false);
  const [addingNewEducation, setAddingNewEducation] = useState(false);

  // This state is the single source of truth for which field is being edited.
  const [editingWorkField, setEditingWorkField] = useState<{
    id: string;
    field: keyof WorkExperiencePayload;
  } | null>(null);
  const [editingEducationField, setEditingEducationField] = useState<{
    id: string;
    field: keyof EducationExperiencePayload;
  } | null>(null);

  const [newWorkData, setNewWorkData] = useState<WorkExperiencePayload>({
    company: "",
  });
  const [newEducationData, setNewEducationData] =
    useState<EducationExperiencePayload>({ institution: "" });

  const handleMutationSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ["userProfile", user.id] });
    setAddingNewWork(false);
    setAddingNewEducation(false);
    setNewWorkData({ company: "" });
    setNewEducationData({ institution: "" });
  };

  const handleMutationError = (error: unknown, action: string) => {
    console.error(`Error ${action}:`, error);
    alert(`Failed to ${action}. Please try again.`);
  };

  const addWorkMutation = useMutation({
    mutationFn: (newWork: WorkExperiencePayload) =>
      axiosInstance.post(`/users/${user.id}/work`, newWork),
    onSuccess: () => handleMutationSuccess(),
    onError: (error) => handleMutationError(error, "adding work experience"),
  });

  const updateWorkMutation = useMutation({
    mutationFn: ({ id, ...updatedWork }: WorkExperiencePayload) =>
      axiosInstance.put(`/users/${user.id}/work/${id}`, updatedWork),
    onSuccess: () => handleMutationSuccess(),
    onError: (error) => handleMutationError(error, "updating work experience"),
  });

  const deleteWorkMutation = useMutation({
    mutationFn: (workId: string) =>
      axiosInstance.delete(`/users/${user.id}/work/${workId}`),
    onSuccess: () => handleMutationSuccess(),
    onError: (error) => handleMutationError(error, "deleting work experience"),
  });

  const addEducationMutation = useMutation({
    mutationFn: (newEducation: EducationExperiencePayload) =>
      axiosInstance.post(`/users/${user.id}/education`, newEducation),
    onSuccess: () => handleMutationSuccess(),
    onError: (error) =>
      handleMutationError(error, "adding education experience"),
  });

  const updateEducationMutation = useMutation({
    mutationFn: ({ id, ...updatedEducation }: EducationExperiencePayload) =>
      axiosInstance.put(`/users/${user.id}/education/${id}`, updatedEducation),
    onSuccess: () => handleMutationSuccess(),
    onError: (error) =>
      handleMutationError(error, "updating education experience"),
  });

  const deleteEducationMutation = useMutation({
    mutationFn: (educationId: string) =>
      axiosInstance.delete(`/users/${user.id}/education/${educationId}`),
    onSuccess: () => handleMutationSuccess(),
    onError: (error) =>
      handleMutationError(error, "deleting education experience"),
  });

  const handleUpdateExperienceField = (
    experienceId: string,
    field: keyof WorkExperiencePayload | keyof EducationExperiencePayload,
    value: string | string[] | boolean | null,
    type: "work" | "education"
  ) => {
    const payload: { id: string; [key: string]: any } = {
      id: experienceId,
      [field]: value,
    };
    if (type === "work") {
      updateWorkMutation.mutate(payload as WorkExperiencePayload, {
        onSuccess: () => {
          // Clear the editing state after a successful save
          setEditingWorkField(null);
          handleMutationSuccess();
        },
      });
    } else {
      updateEducationMutation.mutate(payload as EducationExperiencePayload, {
        onSuccess: () => {
          // Clear the editing state after a successful save
          setEditingEducationField(null);
          handleMutationSuccess();
        },
      });
    }
  };

  const renderEditableField = (
    experienceId: string,
    field: keyof WorkExperiencePayload | keyof EducationExperiencePayload,
    label: string,
    value: string | null | undefined,
    type: "work" | "education",
    inputType: "text" | "textarea" | "date"
  ) => {
    const isCurrentlyEditing =
      (type === "work" &&
        editingWorkField?.id === experienceId &&
        editingWorkField?.field === field) ||
      (type === "education" &&
        editingEducationField?.id === experienceId &&
        editingEducationField?.field === field);

    const handleSetEditing = () => {
      if (type === "work") {
        setEditingWorkField({
          id: experienceId,
          field: field as keyof WorkExperiencePayload,
        });
      } else {
        setEditingEducationField({
          id: experienceId,
          field: field as keyof EducationExperiencePayload,
        });
      }
    };

    const handleCancelEditing = () => {
      if (type === "work") {
        setEditingWorkField(null);
      } else {
        setEditingEducationField(null);
      }
    };

    const hasStringValue = (val: string | null | undefined): boolean => {
      return val !== null && val !== undefined && val.trim() !== "";
    };

    const displayValue =
      inputType === "date" && value
        ? new Date(value).toLocaleDateString()
        : value;

    return (
      <div className="flex items-center mb-4">
        <span className="font-medium w-28">{label}:</span>
        <div className="flex-grow relative">
          {isCurrentlyEditing ? (
            <ProfileFieldsAddEditBox
              initialValue={value} 
              onSave={(val) =>
                handleUpdateExperienceField(experienceId, field, val, type)
              }
              onCancel={handleCancelEditing}
              placeholder={`Add ${label.toLowerCase()}`}
              type={inputType}
              label={label}
              isStandalone={false}
            />
          ) : (
            <div className="flex w-full items-start">
              <span className="flex-grow text-gray-700">
                {displayValue || (
                  <span className="text-gray-500">Not provided</span>
                )}
              </span>
              {isMyProfile && (
                <button
                  onClick={handleSetEditing}
                  className="ml-auto text-blue-500 hover:text-blue-700 font-medium"
                >
                  {hasStringValue(value as string) ? "Edit" : "Add"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderWorkExperienceItem = (exp: WorkExperiencePayload) => {
    return (
      <li key={exp.id} className="border-b pb-4 last:border-b-0 space-y-2">
        {renderEditableField(
          exp.id!,
          "company",
          "Company",
          exp.company,
          "work",
          "text"
        )}
        {renderEditableField(
          exp.id!,
          "position",
          "Position",
          exp.position,
          "work",
          "text"
        )}
        {renderEditableField(
          exp.id!,
          "startDate",
          "Start Date",
          exp.startDate,
          "work",
          "date"
        )}
        {renderEditableField(
          exp.id!,
          "endDate",
          "End Date",
          exp.endDate,
          "work",
          "date"
        )}
        {renderEditableField(
          exp.id!,
          "description",
          "Description",
          exp.description,
          "work",
          "textarea"
        )}

        {isMyProfile && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => deleteWorkMutation.mutate(exp.id!)}
              disabled={deleteWorkMutation.isPending}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
            >
              {deleteWorkMutation.isPending
                ? "Deleting..."
                : "Delete Experience"}
            </button>
          </div>
        )}
      </li>
    );
  };

  const renderEducationExperienceItem = (edu: EducationExperiencePayload) => {
    return (
      <li key={edu.id} className="border-b pb-4 last:border-b-0 space-y-2">
        {renderEditableField(
          edu.id!,
          "institution",
          "Institution",
          edu.institution,
          "education",
          "text"
        )}
        {renderEditableField(
          edu.id!,
          "degree",
          "Degree",
          edu.degree,
          "education",
          "text"
        )}
        {renderEditableField(
          edu.id!,
          "fieldOfStudy",
          "Field of Study",
          edu.fieldOfStudy,
          "education",
          "text"
        )}
        {renderEditableField(
          edu.id!,
          "startDate",
          "Start Date",
          edu.startDate,
          "education",
          "date"
        )}
        {renderEditableField(
          edu.id!,
          "endDate",
          "End Date",
          edu.endDate,
          "education",
          "date"
        )}
        {renderEditableField(
          edu.id!,
          "description",
          "Description",
          edu.description,
          "education",
          "textarea"
        )}

        {isMyProfile && (
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => deleteEducationMutation.mutate(edu.id!)}
              disabled={deleteEducationMutation.isPending}
              className="px-3 py-1 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm disabled:opacity-50"
            >
              {deleteEducationMutation.isPending
                ? "Deleting..."
                : "Delete Experience"}
            </button>
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Work & Education</h3>

      <div className="mb-6">
        <h4 className="text-md font-semibold mb-2">Work Experiences</h4>
        <ul className="space-y-4">
          {user.workExperiences && user.workExperiences.length > 0 ? (
            user.workExperiences.map(renderWorkExperienceItem)
          ) : (
            <li className="text-gray-500">No work experience added.</li>
          )}
        </ul>
        {isMyProfile && (
          <div className="mt-4">
            {addingNewWork ? (
              <div className="p-4 border rounded-md bg-gray-50">
                <h5 className="font-medium mb-2">Add New Work Experience</h5>
                <div className="space-y-3">
                  <ProfileFieldsAddEditBox
                    initialValue={newWorkData.company}
                    onSave={(val) =>
                      setNewWorkData((prev) => ({
                        ...prev,
                        company: val as string,
                      }))
                    }
                    placeholder="Company Name"
                    type="text"
                    label="Company"
                    isStandalone={true}
                    onCancel={() => {}} // Added a no-op onCancel
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newWorkData.position}
                    onSave={(val) =>
                      setNewWorkData((prev) => ({
                        ...prev,
                        position: val as string | null,
                      }))
                    }
                    placeholder="Position"
                    type="text"
                    label="Position"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newWorkData.startDate}
                    onSave={(val) =>
                      setNewWorkData((prev) => ({
                        ...prev,
                        startDate: val as string | null,
                      }))
                    }
                    type="date"
                    label="Start Date"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newWorkData.endDate}
                    onSave={(val) =>
                      setNewWorkData((prev) => ({
                        ...prev,
                        endDate: val as string | null,
                      }))
                    }
                    type="date"
                    label="End Date"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="newWorkIsCurrent"
                      checked={newWorkData.isCurrent || false}
                      onChange={(e) =>
                        setNewWorkData((prev) => ({
                          ...prev,
                          isCurrent: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label
                      htmlFor="newWorkIsCurrent"
                      className="ml-2 block text-sm text-gray-900"
                    >
                      Currently work here
                    </label>
                  </div>
                  <ProfileFieldsAddEditBox
                    initialValue={newWorkData.description}
                    onSave={(val) =>
                      setNewWorkData((prev) => ({
                        ...prev,
                        description: val as string | null,
                      }))
                    }
                    type="textarea"
                    placeholder="Description"
                    label="Description"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        if (newWorkData.company) {
                          addWorkMutation.mutate(newWorkData);
                        } else {
                          alert("Company name is required!");
                        }
                      }}
                      disabled={
                        addWorkMutation.isPending || !newWorkData.company
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {addWorkMutation.isPending
                        ? "Adding..."
                        : "Save Work Experience"}
                    </button>
                    <button
                      onClick={() => {
                        setAddingNewWork(false);
                        setNewWorkData({ company: "" });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingNewWork(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium mt-4"
              >
                Add New Work Experience
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <h4 className="text-md font-semibold mb-2">Education Experiences</h4>
        <ul className="space-y-4">
          {user.educationExperiences && user.educationExperiences.length > 0 ? (
            user.educationExperiences.map(renderEducationExperienceItem)
          ) : (
            <li className="text-gray-500">No education experience added.</li>
          )}
        </ul>
        {isMyProfile && (
          <div className="mt-4">
            {addingNewEducation ? (
              <div className="p-4 border rounded-md bg-gray-50">
                <h5 className="font-medium mb-2">
                  Add New Education Experience
                </h5>
                <div className="space-y-3">
                  <ProfileFieldsAddEditBox
                    initialValue={newEducationData.institution}
                    onSave={(val) =>
                      setNewEducationData((prev) => ({
                        ...prev,
                        institution: val as string,
                      }))
                    }
                    placeholder="Institution Name"
                    type="text"
                    label="Institution"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newEducationData.degree}
                    onSave={(val) =>
                      setNewEducationData((prev) => ({
                        ...prev,
                        degree: val as string | null,
                      }))
                    }
                    placeholder="Degree"
                    type="text"
                    label="Degree"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newEducationData.fieldOfStudy}
                    onSave={(val) =>
                      setNewEducationData((prev) => ({
                        ...prev,
                        fieldOfStudy: val as string | null,
                      }))
                    }
                    placeholder="Field of Study"
                    type="text"
                    label="Field of Study"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newEducationData.startDate}
                    onSave={(val) =>
                      setNewEducationData((prev) => ({
                        ...prev,
                        startDate: val as string | null,
                      }))
                    }
                    type="date"
                    label="Start Date"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newEducationData.endDate}
                    onSave={(val) =>
                      setNewEducationData((prev) => ({
                        ...prev,
                        endDate: val as string | null,
                      }))
                    }
                    type="date"
                    label="End Date"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <ProfileFieldsAddEditBox
                    initialValue={newEducationData.description}
                    onSave={(val) =>
                      setNewEducationData((prev) => ({
                        ...prev,
                        description: val as string | null,
                      }))
                    }
                    type="textarea"
                    placeholder="Description"
                    label="Description"
                    isStandalone={true}
                    onCancel={() => {}}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        if (newEducationData.institution) {
                          addEducationMutation.mutate(newEducationData);
                        } else {
                          alert("Institution name is required!");
                        }
                      }}
                      disabled={
                        addEducationMutation.isPending ||
                        !newEducationData.institution
                      }
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {addEducationMutation.isPending
                        ? "Adding..."
                        : "Save Education Experience"}
                    </button>
                    <button
                      onClick={() => {
                        setAddingNewEducation(false);
                        setNewEducationData({ institution: "" });
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setAddingNewEducation(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors font-medium mt-4"
              >
                Add New Education Experience
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AboutWorkEducation;
