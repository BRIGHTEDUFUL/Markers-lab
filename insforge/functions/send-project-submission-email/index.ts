type SubmissionPayload = {
  notificationId?: string;
  to?: string;
  projectId?: string;
  projectTitle?: string;
  projectStatus?: string;
  submitter?: {
    id?: string;
    name?: string;
    email?: string;
  };
  submittedAt?: string;
  details?: {
    category?: string;
    budget?: string;
    timeline?: string;
    tags?: string[];
    repoUrl?: string | null;
    description?: string;
    filesCount?: number;
  };
};

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json",
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST,OPTIONS",
      "access-control-allow-headers": "content-type,authorization",
    },
  });

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTags(tags: string[] | undefined): string {
  if (!tags || tags.length === 0) return "None";
  return tags.slice(0, 12).map((tag) => escapeHtml(tag)).join(", ");
}

export default async function handler(req: Request) {
  if (req.method === "OPTIONS") return json(200, { ok: true });
  if (req.method !== "POST") return json(405, { ok: false, error: "Method not allowed" });

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const configuredFrom = Deno.env.get("OFFICIAL_FROM_EMAIL")?.trim() || "";
  const officialInboxEmail =
    Deno.env.get("OFFICIAL_INBOX_EMAIL")?.trim() || "creators.makerslab@gmail.com";
  const brandName = Deno.env.get("BRAND_NAME")?.trim() || "Makers Lab";
  const adminDashboardUrl =
    Deno.env.get("ADMIN_DASHBOARD_URL")?.trim() || "https://5ab7xs59.insforge.site/admin";
  const fromEmail = configuredFrom.includes("@")
    ? configuredFrom
    : `${brandName} <onboarding@resend.dev>`;

  if (!resendApiKey) {
    return json(500, {
      ok: false,
      error: "Missing RESEND_API_KEY secret",
    });
  }

  let payload: SubmissionPayload;
  const rawText = await req.text();
  try {
    if (rawText.trim().startsWith("{")) {
      payload = JSON.parse(rawText) as SubmissionPayload;
    } else {
      const params = new URLSearchParams(rawText);
      payload = {
        to: params.get("to") || undefined,
        notificationId: params.get("notificationId") || undefined,
        projectId: params.get("projectId") || undefined,
        projectTitle: params.get("projectTitle") || undefined,
        projectStatus: params.get("projectStatus") || undefined,
        submitter: {
          id: params.get("submitterId") || undefined,
          name: params.get("submitterName") || undefined,
          email: params.get("submitterEmail") || undefined,
        },
        submittedAt: params.get("submittedAt") || undefined,
        details: {
          category: params.get("category") || undefined,
          budget: params.get("budget") || undefined,
          timeline: params.get("timeline") || undefined,
          description: params.get("description") || undefined,
          filesCount: Number(params.get("filesCount") || 0),
        },
      };
    }
  } catch {
    return json(400, { ok: false, error: "Invalid request body" });
  }

  const to = officialInboxEmail;
  if (!to) return json(400, { ok: false, error: "Missing destination email" });

  const title = payload.projectTitle || "New Project Submission";
  const details = payload.details || {};
  const submitterName = payload.submitter?.name || "Unknown";
  const submitterEmail = payload.submitter?.email || "No email provided";
  const projectStatus = payload.projectStatus || "PENDING";
  const submittedAt = payload.submittedAt || new Date().toISOString();

  const html = `
    <div style="background:#f1f5f9;margin:0;padding:28px 12px;font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <div style="max-width:700px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ee;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(15,23,42,0.08);">
        <div style="background:#0f172a;padding:22px 26px;color:#f8fafc;">
          <table style="width:100%;border-collapse:collapse;">
            <tr>
              <td style="vertical-align:top;">
                <p style="margin:0;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.8;">${escapeHtml(brandName)}</p>
                <h2 style="margin:8px 0 0;font-size:22px;line-height:1.25;">Project Submission Alert</h2>
              </td>
              <td style="text-align:right;vertical-align:top;">
                <span style="display:inline-block;padding:6px 10px;border:1px solid rgba(255,255,255,0.3);border-radius:999px;font-size:10px;letter-spacing:0.1em;text-transform:uppercase;">Admin Notice</span>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:22px 26px 10px;">
          <p style="margin:0 0 14px;font-size:14px;color:#334155;">
            A new project submission has arrived and is ready for evaluation in your admin dashboard.
          </p>

          <div style="margin:0 0 16px;padding:14px 16px;border:1px solid #dbe3ee;border-left:4px solid #0f172a;border-radius:10px;background:#f8fafc;">
            <p style="margin:0;font-size:14px;"><strong>Project:</strong> ${escapeHtml(title)}</p>
            <p style="margin:6px 0 0;font-size:13px;color:#475569;"><strong>Submitter:</strong> ${escapeHtml(submitterName)} (${escapeHtml(submitterEmail)})</p>
          </div>

          <table style="width:100%;border-collapse:separate;border-spacing:0;margin:0 0 18px;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
            <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:bold;width:170px;font-size:13px;">Submission Status</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${escapeHtml(projectStatus)}</td></tr>
            <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:bold;font-size:13px;">Category</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${escapeHtml(details.category || "-")}</td></tr>
            <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:bold;font-size:13px;">Budget</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${escapeHtml(details.budget || "-")}</td></tr>
            <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:bold;font-size:13px;">Timeline</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${escapeHtml(details.timeline || "-")}</td></tr>
            <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:bold;font-size:13px;">Attached Files</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${escapeHtml(details.filesCount || 0)}</td></tr>
            <tr><td style="padding:10px 12px;background:#f8fafc;border-bottom:1px solid #e2e8f0;font-weight:bold;font-size:13px;">Tags</td><td style="padding:10px 12px;border-bottom:1px solid #e2e8f0;font-size:13px;">${formatTags(details.tags)}</td></tr>
            <tr><td style="padding:10px 12px;background:#f8fafc;font-weight:bold;font-size:13px;">Submitted At</td><td style="padding:10px 12px;font-size:13px;">${escapeHtml(submittedAt)}</td></tr>
          </table>

          <p style="margin:0 0 8px;font-size:13px;font-weight:bold;color:#0f172a;letter-spacing:0.02em;">Submission Brief</p>
          <p style="margin:0 0 16px;padding:12px 14px;border:1px solid #e2e8f0;background:#f8fafc;border-radius:10px;color:#334155;font-size:13px;">${escapeHtml(details.description || "-")}</p>

          <table style="border-collapse:collapse;margin:0 0 10px;">
            <tr>
              <td style="border-radius:10px;background:#0f172a;text-align:center;">
                <a href="${escapeHtml(adminDashboardUrl)}" style="display:inline-block;padding:11px 18px;font-size:12px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#ffffff;text-decoration:none;">
                  Open Admin Dashboard
                </a>
              </td>
            </tr>
          </table>
        </div>

        <div style="padding:0 26px 20px;">
          <div style="padding:10px 12px;background:#f8fafc;border:1px dashed #cbd5e1;border-radius:10px;">
            <p style="margin:0;font-size:11px;color:#64748b;line-height:1.5;">
              Notification ID: ${escapeHtml(payload.notificationId || "-")}<br />
              Project ID: ${escapeHtml(payload.projectId || "-")}<br />
              Source: ${escapeHtml(brandName)} Submission Pipeline
            </p>
          </div>
        </div>
      </div>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [to],
      subject: `${brandName} Admin | Review Required: ${title}`,
      html,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    const lowered = text.toLowerCase();
    const isRecipientRestriction =
      response.status === 403 &&
      lowered.includes("you can only send testing emails to your own email address");

    if (isRecipientRestriction) {
      return json(200, {
        ok: false,
        blocked: true,
        code: "RESEND_RECIPIENT_RESTRICTED",
        error:
          "Resend account is in testing mode. Verify a domain and use a sender on that domain to deliver to official inbox.",
        details: text.slice(0, 400),
      });
    }

    return json(502, {
      ok: false,
      error: "Email provider request failed",
      details: text.slice(0, 400),
    });
  }

  return json(200, { ok: true });
}
