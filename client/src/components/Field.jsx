import { useId } from "react";

// Label + input + error message under it. Pass `as="textarea"` or
// `as="select"` (with option children) for other controls.
export default function Field({ label, error, hint, as: Control = "input", children, ...props }) {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className={`field${error ? " field--invalid" : ""}`}>
      <label htmlFor={id}>{label}</label>
      <Control
        id={id}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? errorId : undefined}
        {...props}
      >
        {children}
      </Control>
      {error ? (
        <p className="field__error" id={errorId}>
          {error}
        </p>
      ) : hint ? (
        <p className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
