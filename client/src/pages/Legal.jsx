import { Link } from "../router.jsx";
import { HELP_EMAIL, HELP_PHONE } from "../config.js";

// Terms & Conditions, Privacy, Cookie and Refund policy pages (linked from the footer).
// The texts are sample content for a university project, written to match how
// Doorlist actually works; they are not legal documents.

const UPDATED = "24 November 2026";

const contact = (
  <>
    email <a href={`mailto:${HELP_EMAIL}`}>{HELP_EMAIL}</a> or call {HELP_PHONE}
  </>
);

const TERMS = [
  {
    heading: "1. About Doorlist",
    text: [
      "Doorlist is an online platform where people in Tbilisi find events, get tickets and organize their own events. By creating an account or using the site you agree to these terms.",
    ],
  },
  {
    heading: "2. Accounts",
    list: [
      "You need an account to get tickets or organize events. Give your real name and an email address you use.",
      "Keep your password to yourself. You are responsible for what happens in your account.",
      "Your email address is your login and can't be changed later.",
      "One person, one account. We may suspend accounts that break these terms.",
    ],
  },
  {
    heading: "3. Attendees",
    list: [
      "A ticket lets the named account holder into the event. You can get 1 to 10 tickets per event.",
      "Organizers may set entry rules: an age limit, face control or a dress code. If you don't meet them, the organizer can refuse entry.",
      "Prices are set in Georgian lari (GEL). Prices shown in USD or EUR are approximate.",
    ],
  },
  {
    heading: "4. Organizers",
    list: [
      "Organizer accounts start after an administrator approves them.",
      "Organizers are responsible for their events: the description, date, venue, price and entry rules must be correct.",
      "If you change or cancel an event, everyone with a ticket is notified. Past events can't be changed.",
      "You may only use the attendee list of your event to run that event.",
    ],
  },
  {
    heading: "5. Ilia State University section",
    text: [
      "Accounts with an @iliauni.edu.ge email address can see internal Ilia State University meetings. Using a university address that isn't yours is not allowed and leads to suspension.",
    ],
  },
  {
    heading: "6. Things you must not do",
    list: [
      "Publish false, offensive or illegal events.",
      "Resell tickets above their price, or collect tickets for someone else without their consent.",
      "Try to access other people's accounts or parts of the site you are not allowed to use.",
    ],
  },
  {
    heading: "7. Liability",
    text: [
      "Doorlist connects attendees and organizers; the organizer runs the event. We are not responsible for what happens at an event, but we help sort out problems when you contact us.",
    ],
  },
  {
    heading: "8. Changes and contact",
    text: [
      "We may update these terms. Important changes are announced on the site before they apply. These terms are governed by the law of Georgia.",
      <>Questions: {contact}.</>,
    ],
  },
];

const PRIVACY = [
  {
    heading: "What we collect",
    list: [
      "Account details: your first and last name, email address and, for organizers, the organization name.",
      "Your password, stored only as a secure hash (bcrypt). We can't see it.",
      "Your tickets, the events you organize, your requests to the administrators and your notifications.",
      "Your settings: preferred currency and light or dark theme.",
    ],
  },
  {
    heading: "Why we use it",
    list: [
      "To run your account and show your tickets.",
      "To let organizers see who is coming to their own events (name, email and number of tickets).",
      "To send you notifications in the app, for example when an event you have a ticket for changes.",
      "To keep the platform safe, for example by blocking actions your account is not allowed to do.",
    ],
  },
  {
    heading: "Who can see it",
    text: [
      "Organizers see the attendee list of their own events only. Administrators can see accounts in order to approve organizers and help with problems. We don't sell your data and don't share it with advertisers.",
    ],
  },
  {
    heading: "How long we keep it",
    text: [
      "We keep your data while your account exists. Past tickets stay in your history so you can see the events you went to. If you want your account deleted, contact us.",
    ],
  },
  {
    heading: "Your rights",
    text: [
      "You can see and change your name, organization and currency under My Profile → Edit Profile. You can ask us for a copy of your data, for corrections, or for deletion.",
      <>Contact: {contact}.</>,
    ],
  },
];

const COOKIES = [
  {
    heading: "Do we use cookies?",
    text: [
      "Doorlist does not use advertising or tracking cookies, and there is no analytics or third-party tracking on the site.",
    ],
  },
  {
    heading: "What we store in your browser",
    text: ["Instead of cookies, the site keeps two small items in your browser's local storage:"],
    list: [
      "Your login token, so you stay logged in. It is removed when you log out.",
      "Your light or dark theme choice, so the site looks the way you picked it.",
    ],
  },
  {
    heading: "Fonts",
    text: [
      "Text on the site uses the Archivo and IBM Plex Mono fonts, loaded from Google Fonts. Your browser contacts Google's servers to download them.",
    ],
  },
  {
    heading: "How to clear it",
    text: [
      "Logging out removes your login token. You can remove everything at any time by clearing the site data for Doorlist in your browser settings.",
    ],
  },
];

const REFUNDS = [
  {
    heading: "Cancelling a ticket",
    text: [
      "You can cancel your tickets on the event page (Cancel Ticket) until the event starts. All tickets you got for that event are cancelled together.",
    ],
  },
  {
    heading: "When you get your money back",
    list: [
      "Cancelled at least 48 hours before the event starts: full refund.",
      "Cancelled less than 48 hours before: 50% refund.",
      "After the event has started, or if you didn't come: no refund.",
      "Free tickets have nothing to refund, but please cancel them so someone else can come.",
    ],
  },
  {
    heading: "If the organizer changes or cancels the event",
    list: [
      "Event cancelled by the organizer: full refund, always. You are notified in the app.",
      "Date, venue or price changed: you are notified and can cancel for a full refund until the event starts.",
    ],
  },
  {
    heading: "How refunds are paid",
    text: [
      "Refunds go back to the original payment method, in the currency you paid in, within 14 days. Your bank may take a few extra days to show it.",
    ],
  },
  {
    heading: "Problems",
    text: [<>If something went wrong with a ticket or a refund, {contact}.</>],
  },
];

export const LEGAL_PAGES = [
  { path: "/terms", title: "Terms & Conditions", sections: TERMS },
  { path: "/privacy", title: "Privacy Policy", sections: PRIVACY },
  { path: "/cookies", title: "Cookie Policy", sections: COOKIES },
  { path: "/refunds", title: "Refund Policy", sections: REFUNDS },
];

export default function Legal({ path }) {
  const page = LEGAL_PAGES.find((p) => p.path === path);
  return (
    <article className="legal">
      <Link to="/" className="back">
        ← All Events
      </Link>
      <p className="eyebrow">Legal</p>
      <h1>{page.title}</h1>
      <p className="legal__updated">Last updated {UPDATED}</p>
      <p className="legal__note">Sample text for a university project, not a legal document.</p>
      {page.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          {section.text?.map((t, i) => (
            <p key={i}>{t}</p>
          ))}
          {section.list && (
            <ul>
              {section.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      <nav className="legal__other" aria-label="Other policies">
        {LEGAL_PAGES.filter((p) => p.path !== path).map((p) => (
          <Link key={p.path} to={p.path}>
            {p.title}
          </Link>
        ))}
      </nav>
    </article>
  );
}
