// A row of radio buttons that can also be unselected: clicking the selected
// option again clears it (value becomes null). With `required`, one option
// always stays selected.
export default function ChoiceGroup({ label, name, options, value, onChange, error, hint, required = false }) {
  const pick = (optionValue) => onChange(value === optionValue && !required ? null : optionValue);
  return (
    <fieldset className={`field choice-row${error ? " field--invalid" : ""}`}>
      <legend>{label}</legend>
      <div className="choice-row__options">
        {options.map((option) => (
          <label key={String(option.value)} className={value === option.value ? "is-checked" : undefined}>
            <input
              type="radio"
              name={name}
              checked={value === option.value}
              // onClick (not onChange) also fires on the already-selected option
              onClick={() => pick(option.value)}
              onChange={() => {}}
            />
            {option.label}
          </label>
        ))}
      </div>
      {error ? <p className="field__error">{error}</p> : hint ? <p className="field__hint">{hint}</p> : null}
    </fieldset>
  );
}
