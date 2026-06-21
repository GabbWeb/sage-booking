import type { BuiltEmail, EmailData, EmailType } from "./types";

// Plantillas de email con la estetica Apothecary. Pensadas para clientes de
// correo reales: layout con tablas, estilos inline, fuentes web safe que
// aproximan Cormorant (serif) y Jost (sans). Sin emojis, sin guiones largos.
// Todo en ingles (publico de Austin). No envian nada: solo construyen HTML.

const COLORS = {
  ink: "#1f1810",
  sage: "#77816b",
  sageDeep: "#5e674f",
  amber: "#a67c52",
  cream: "#f2eee5",
  paper: "#f7f4ec",
};

const SERIF = "Georgia, 'Times New Roman', serif";
const SANS = "Helvetica, Arial, sans-serif";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type Section = { heading?: string; paragraphs?: string[]; list?: string[] };

function renderSections(sections: Section[]): string {
  return sections
    .map((s) => {
      const parts: string[] = [];
      if (s.heading) {
        parts.push(
          `<h2 style="margin:28px 0 10px;font-family:${SERIF};font-size:20px;font-weight:500;color:${COLORS.ink};">${escapeHtml(
            s.heading,
          )}</h2>`,
        );
      }
      for (const p of s.paragraphs ?? []) {
        parts.push(
          `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.65;color:${COLORS.sageDeep};">${p}</p>`,
        );
      }
      if (s.list?.length) {
        const items = s.list
          .map(
            (li) =>
              `<li style="margin:0 0 8px;font-family:${SANS};font-size:15px;line-height:1.6;color:${COLORS.sageDeep};">${li}</li>`,
          )
          .join("");
        parts.push(
          `<ul style="margin:0 0 14px;padding-left:20px;">${items}</ul>`,
        );
      }
      return parts.join("");
    })
    .join("");
}

function layout({
  preheader,
  title,
  bodyHtml,
}: {
  preheader: string;
  title: string;
  bodyHtml: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${COLORS.paper};">
<span style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(
    preheader,
  )}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.paper};">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:${COLORS.paper};">
        <tr>
          <td style="padding:8px 8px 24px;text-align:center;">
            <div style="font-family:${SANS};font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${COLORS.amber};">Sage Essence</div>
          </td>
        </tr>
        <tr>
          <td style="background-color:${COLORS.cream};border:1px solid #e3ddcf;border-radius:16px;padding:36px 32px;">
            <h1 style="margin:0 0 4px;font-family:${SERIF};font-size:30px;font-weight:500;line-height:1.2;color:${COLORS.ink};">${escapeHtml(
              title,
            )}</h1>
            ${bodyHtml}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 8px;text-align:center;font-family:${SANS};font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.sage};">
            Sage Essence LLC, Austin TX
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
  <tr><td style="border-radius:999px;background-color:${COLORS.sageDeep};">
    <a href="${escapeHtml(
      href,
    )}" style="display:inline-block;padding:12px 28px;font-family:${SANS};font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${COLORS.paper};text-decoration:none;">${escapeHtml(
      label,
    )}</a>
  </td></tr>
</table>`;
}

// --------------------------------------------------------------------------
// Email 1: preparacion (inmediato al reservar)
// --------------------------------------------------------------------------
function prep(data: EmailData): BuiltEmail {
  const when = data.scheduledDateText
    ? `We have you down for ${escapeHtml(data.scheduledDateText)}.`
    : "We will confirm your date shortly.";

  const body =
    `<p style="margin:14px 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${COLORS.sageDeep};">Hi ${escapeHtml(
      data.firstName,
    )}, thank you for booking your ${escapeHtml(
      data.serviceLabel.toLowerCase(),
    )} with us. ${when} Here is how to get the most out of your visit.</p>` +
    renderSections([
      {
        heading: "A quick checklist",
        list: [
          "Clear countertops and floors of small items so we can reach every surface.",
          "Set aside any products you prefer we use, or let us know if you have none.",
          "Secure valuables and important documents.",
          "Make a note of anything that needs special care.",
        ],
      },
      {
        heading: "Getting in",
        paragraphs: [
          "Let us know how you would like us to enter: a key, a code, or you will be home. If you have pets, tell us their names and whether they stay in during the clean.",
        ],
      },
      {
        heading: "Our promise",
        paragraphs: [
          "We use non toxic, low scent products that are gentle on your home and the people in it. If you have any sensitivities, reply to this email and we will adjust.",
        ],
      },
    ]);

  return {
    subject: "How to prepare for your clean",
    html: layout({
      preheader: "A short checklist so your clean goes smoothly.",
      title: "Getting ready for your clean",
      bodyHtml: body,
    }),
    text: toText([
      `Hi ${data.firstName}, thank you for booking your ${data.serviceLabel.toLowerCase()}.`,
      data.scheduledDateText ? `Date: ${data.scheduledDateText}` : "",
      "",
      "A quick checklist:",
      "- Clear countertops and floors of small items.",
      "- Set aside any products you prefer we use.",
      "- Secure valuables and important documents.",
      "- Note anything that needs special care.",
      "",
      "Getting in: tell us if we should use a key, a code, or if you will be home. Let us know about pets.",
      "",
      "We use non toxic, low scent products. Reply with any sensitivities and we will adjust.",
      "",
      "Sage Essence LLC, Austin TX",
    ]),
  };
}

// --------------------------------------------------------------------------
// Email 2: recordatorio (2 dias antes)
// --------------------------------------------------------------------------
function reminder(data: EmailData): BuiltEmail {
  const when = data.scheduledDateText
    ? escapeHtml(data.scheduledDateText)
    : "in two days";

  const body =
    `<p style="margin:14px 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${COLORS.sageDeep};">Hi ${escapeHtml(
      data.firstName,
    )}, a friendly reminder that your ${escapeHtml(
      data.serviceLabel.toLowerCase(),
    )} is coming up on ${when}.</p>` +
    renderSections([
      {
        heading: "Before we arrive",
        list: [
          "Clear surfaces and floors where you can.",
          "Confirm how we will get in, and where pets will be.",
          "Reply here if anything has changed.",
        ],
      },
    ]);

  return {
    subject: "Your clean is in two days",
    html: layout({
      preheader: "A friendly reminder about your upcoming clean.",
      title: "See you soon",
      bodyHtml: body,
    }),
    text: toText([
      `Hi ${data.firstName}, a reminder that your ${data.serviceLabel.toLowerCase()} is coming up on ${data.scheduledDateText ?? "in two days"}.`,
      "",
      "Before we arrive:",
      "- Clear surfaces and floors where you can.",
      "- Confirm how we will get in, and where pets will be.",
      "- Reply here if anything has changed.",
      "",
      "Sage Essence LLC, Austin TX",
    ]),
  };
}

// --------------------------------------------------------------------------
// Email 3: agradecimiento + resena (despues de la limpieza)
// --------------------------------------------------------------------------
function thankyou(data: EmailData): BuiltEmail {
  const review = data.reviewUrl
    ? button("Leave a review", data.reviewUrl)
    : `<p style="margin:0 0 14px;font-family:${SANS};font-size:15px;line-height:1.65;color:${COLORS.sageDeep};">We will send you a link to leave a review shortly.</p>`;

  const body =
    `<p style="margin:14px 0 0;font-family:${SANS};font-size:15px;line-height:1.65;color:${COLORS.sageDeep};">Hi ${escapeHtml(
      data.firstName,
    )}, thank you for welcoming us into your home. We hope it feels calm and cared for.</p>` +
    renderSections([
      {
        heading: "Keeping it fresh",
        list: [
          "Air out rooms for a few minutes after we leave.",
          "A quick wipe of high touch spots between visits goes a long way.",
          "Tell us what you loved or what we can do better.",
        ],
      },
      {
        heading: "Would you share a few words",
        paragraphs: [
          "If the clean met the mark, a short review helps a small local business more than you know.",
        ],
      },
    ]) +
    review;

  return {
    subject: "Thank you from Sage Essence",
    html: layout({
      preheader: "Thank you, plus a small favor if you have a minute.",
      title: "Thank you",
      bodyHtml: body,
    }),
    text: toText([
      `Hi ${data.firstName}, thank you for welcoming us into your home.`,
      "",
      "Keeping it fresh:",
      "- Air out rooms for a few minutes after we leave.",
      "- A quick wipe of high touch spots between visits goes a long way.",
      "- Tell us what you loved or what we can do better.",
      "",
      data.reviewUrl
        ? `Leave a review: ${data.reviewUrl}`
        : "We will send you a link to leave a review shortly.",
      "",
      "Sage Essence LLC, Austin TX",
    ]),
  };
}

function toText(lines: string[]): string {
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

const BUILDERS: Record<EmailType, (data: EmailData) => BuiltEmail> = {
  prep,
  reminder_2days: reminder,
  thankyou,
};

export function buildEmail(type: EmailType, data: EmailData): BuiltEmail {
  return BUILDERS[type](data);
}

export const EMAIL_TYPES: EmailType[] = ["prep", "reminder_2days", "thankyou"];
