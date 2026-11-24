// Small "Iliauni only" label with the university seal, for internal meetings.
export default function IliauniTag({ label = "Iliauni only" }) {
  return (
    <span className="iliauni-tag" title="Only for @iliauni.edu.ge accounts">
      <img src="/iliauni-logo.png" alt="" width="16" height="16" />
      {label}
    </span>
  );
}
