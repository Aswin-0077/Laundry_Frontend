import React from 'react';
// import '../styles/style.css';

interface FormDateInputProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  name?: string;
  className?: string;
  label?: string;
  error?: string;
}

const FormDateInput: React.FC<FormDateInputProps> = ({
  value,
  onChange,
  onBlur,
  name,
  className = '',
  label = 'Date',
  error
}) => {
  return (
    <div className="form-group">
      <label htmlFor={name} className='mb-0' style={{fontSize:'14px'}}>{label}</label>
      <input
        type="date"
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        className={`form-control ${className}`.trim()}
      />
      {error && <div className="error-message">{error}</div>}
    </div>
  );
};

export default FormDateInput;