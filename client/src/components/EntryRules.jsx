// Face control, age limit and dress code as small facts. Only the rules the
// organizer set are shown.
export function entryRules(event) {
  const rules = [];
  if (event.age_limit) rules.push(["Age", `${event.age_limit}+`]);
  if (event.face_control === 1) rules.push(["Face control", "Yes"]);
  if (event.face_control === 0) rules.push(["Face control", "No"]);
  if (event.dress_code) rules.push(["Dress code", event.dress_code]);
  return rules;
}
