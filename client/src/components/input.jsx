import React from "react";
import "./input.css";

function Input({
  label,
  type = "text",
  name,
  value,
  onChange,
  required = false,
  placeholder = " ",
  accept,
  options,
  rightIcon,
  onIconClick,
  iconDisabled = false,
  iconLabel = "Aksi",
  ...props
}) {

  // Input File
  if (type === "file") {
    return (
      <div className="input-field">
        <label htmlFor={name} className="file-label">
          {label}
        </label>
        <input
          id={name}
          name={name}
          type="file"
          accept={accept}
          onChange={onChange}
          required={required}
          className="file-input"
          {...props}
        />
      </div>
    );
  }

  // Input Dropdown (Select)
  if (type === "select") {
    return (
      <div className="input-field input-field--select">
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          required={required}
          className="input-field__input input-field__select"
          {...props}
        >
          <option value="" disabled hidden></option>
          {options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <label htmlFor={name} className="input-field__label">
          {label}
        </label>
      </div>
    );
  }

  // Input selain file & select (default: text, date, dll)
  return (
    <div className="input-field">
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`input-field__input${rightIcon ? " input-field__input--with-icon" : ""}`}
        {...props}
      />

      <label htmlFor={name} className="input-field__label">
        {label}
      </label>

      {rightIcon && (
        <button
          type="button"
          className="input-field__icon-btn"
          onClick={onIconClick}
          disabled={iconDisabled}
          aria-label={iconLabel}
        >
          {rightIcon}
        </button>
      )}
    </div>
  );
}

export default Input;