import React, { KeyboardEvent } from 'react';

interface GameInputProps {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  answerGood: boolean;
  hasValidation: boolean;
  isDisabled: boolean;
  type?: 'text' | 'select';
  selectValues?: string[];
}

const styles = {
  input: {
    default: 'border-slate-200 hover:border-slate-300 focus:border-slate-400',
    success:
      'border-green-500 text-green-500 hover:border-green-600 focus:border-green-700',
    error:
      'border-red-500 text-red-500 hover:border-red-600 focus:border-red-700',
  },
  label: {
    default: 'text-inherit',
    success: 'text-green-500',
    error: 'text-red-500',
  },
};

const getValidationStyles = (
  isValid: boolean,
  type: 'label' | 'input',
  hasValidation: boolean
): string => {
  if (!hasValidation) {
    return styles[type].default;
  }
  return isValid ? styles[type].success : styles[type].error;
};

const GameInput: React.FC<GameInputProps> = ({
  name,
  label,
  value,
  onChange,
  onSubmit,
  answerGood,
  hasValidation,
  isDisabled,
  type = 'text',
  selectValues,
}) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  const inputClassName = `${getValidationStyles(answerGood, 'input', hasValidation)} w-2/3 rounded-md border p-1 shadow-sm focus:shadow focus:outline-none`;
  const labelClassName = `${getValidationStyles(answerGood, 'label', hasValidation)} w-28 p-1 text-right`;

  const renderInput = () => {
    if (type === 'select') {
      return (
        <select
          value={value}
          disabled={isDisabled}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
        >
          {selectValues?.map((value) => (
            <option key={value} value={value}>
              {value.charAt(0).toUpperCase() + value.slice(1)}
            </option>
          ))}
        </select>
      );
    }
    if (type === 'text') {
      return (
        <input
          type="text"
          id={name}
          disabled={isDisabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={inputClassName}
        />
      );
    }
  };

  return (
    <div className="flex flex-row gap-4 pb-3">
      <label htmlFor={name} className={labelClassName}>
        {label}
      </label>
      {renderInput()}
    </div>
  );
};

export default GameInput;
