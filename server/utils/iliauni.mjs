// Ilia State University members are recognised by their email domain.
// Internal ("iliauni") events are visible only to them.
export const ILIAUNI_DOMAIN = "iliauni.edu.ge";

export const isIliauni = (email = "") => email.trim().toLowerCase().endsWith(`@${ILIAUNI_DOMAIN}`);

export const AUDIENCES = ["public", "iliauni"];

export const ILIAUNI_ONLY_MESSAGE = "Iliauni meetings are only for Ilia State University members (@iliauni.edu.ge accounts)";
export const ILIAUNI_VENUE_MESSAGE = "A, B, C and D Block are Ilia State University venues: only organizers with an @iliauni.edu.ge email can use them";
export const ILIAUNI_CREATE_MESSAGE = "Only organizers with an @iliauni.edu.ge email can create Iliauni meetings";
