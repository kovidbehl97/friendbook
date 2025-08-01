import React, { useState, useEffect } from 'react';

// Define the type for select options
export interface SelectOption {
  value: string;
  label: string;
}

// Define the props interface for ProfileFieldsAddEditBox
export interface ProfileFieldsAddEditBoxProps {
  initialValue: string | string[] | null | undefined;
  onSave: (value: string | string[] | null) => void;
  onCancel: () => void;
  placeholder?: string;
  type?: 'text' | 'textarea' | 'date' | 'number' | 'email' | 'url' | 'array-text' | 'select';
  label: string;
  isStandalone?: boolean;
  options?: SelectOption[];
}

const ProfileFieldsAddEditBox: React.FC<ProfileFieldsAddEditBoxProps> = ({
  initialValue,
  onSave,
  onCancel,
  placeholder,
  type = 'text',
  label,
  isStandalone = false,
  options,
}) => {
  // Local state for the input value.
  const [value, setValue] = useState<string>(
    Array.isArray(initialValue) ? initialValue.join(', ') : (initialValue || '')
  );

  // Effect to update local state if initialValue changes (e.g., after a save)
  useEffect(() => {
    setValue(Array.isArray(initialValue) ? initialValue.join(', ') : (initialValue || ''));
  }, [initialValue, type]);

  const handleSave = () => {
    let finalValue: string | string[] | null = null;

    if (type === 'array-text') {
      finalValue = value.split(',').map(item => item.trim()).filter(item => item !== '');
      if (finalValue.length === 0) finalValue = null;
    } else if (value.trim() === '') {
      finalValue = null;
    } else {
      finalValue = value;
    }

    onSave(finalValue);
  };

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={4}
          />
        );
      case 'date':
        return (
          <input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'array-text':
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="" disabled selected={!value}>
              {placeholder || `Select ${label}`}
            </option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      default: // 'text', 'number', 'email', 'url'
        return (
          <input
            type={type}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={`input-${label}`} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      {renderInput()}
      {/* Hide the buttons if the component is in a standalone state */}
      {!isStandalone && (
        <div className="flex gap-2 mt-2 justify-end">
          <button
            onClick={handleSave}
            className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 text-sm"
          >
            Save
          </button>
          <button
            onClick={onCancel}
            className="px-3 py-1 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};

export default ProfileFieldsAddEditBox;