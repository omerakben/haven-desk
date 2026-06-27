const CONTACT_EMAIL = "";

const navToggle = document.querySelector(".nav-toggle");
const siteNav = document.querySelector(".site-nav");

navToggle?.addEventListener("click", () => {
  const isOpen = siteNav?.dataset.open === "true";
  if (siteNav) {
    siteNav.dataset.open = String(!isOpen);
  }
  navToggle.setAttribute("aria-expanded", String(!isOpen));
});

siteNav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement && siteNav.dataset.open === "true") {
    siteNav.dataset.open = "false";
    navToggle?.setAttribute("aria-expanded", "false");
  }
});

const installTabs = document.querySelectorAll("[data-install-tab]");
const installPanels = document.querySelectorAll("[data-install-panel]");

installTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const target = tab.getAttribute("data-install-tab");
    installTabs.forEach((item) => {
      const isActive = item === tab;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-selected", String(isActive));
    });
    installPanels.forEach((panel) => {
      panel.classList.toggle("active", panel.getAttribute("data-install-panel") === target);
    });
  });
});

async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for local previews and browsers that block clipboard writes.
    }
  }

  const scratch = document.createElement("textarea");
  scratch.value = text;
  scratch.setAttribute("readonly", "");
  scratch.style.position = "fixed";
  scratch.style.opacity = "0";
  document.body.appendChild(scratch);
  scratch.select();
  document.execCommand("copy");
  scratch.remove();
}

document.querySelectorAll("[data-copy-command]").forEach((button) => {
  button.addEventListener("click", async () => {
    const commandId = button.getAttribute("data-copy-command");
    const command = commandId ? document.getElementById(commandId)?.textContent?.trim() : "";
    if (!command) {
      return;
    }
    await copyText(command);
    button.textContent = "Copied";
    button.classList.add("copied");
    window.setTimeout(() => {
      button.textContent = "Copy";
      button.classList.remove("copied");
    }, 1600);
  });
});

const form = document.querySelector("#pilot-form");
const output = document.querySelector("#application-output");
const summaryField = document.querySelector("#application-summary");
const copyButton = document.querySelector("#copy-application");
const emailLink = document.querySelector("#email-application");
const emailWarning = document.querySelector("#email-warning");

function getValue(formData, key) {
  return String(formData.get(key) || "").trim();
}

function buildSummary(formData) {
  return [
    "Haven Desk small business early-access application",
    "",
    `Name: ${getValue(formData, "name")}`,
    `Email: ${getValue(formData, "email")}`,
    `Business type: ${getValue(formData, "business")}`,
    `Machine: ${getValue(formData, "machine")}`,
    "",
    "Weekly admin pain:",
    getValue(formData, "pain"),
    "",
    "Data they avoid pasting into cloud AI:",
    getValue(formData, "privacy"),
    "",
    "Consent:",
    "The applicant understands Haven Desk is early access and does not send messages or take external actions for them.",
  ].join("\n");
}

function buildMailto(summary) {
  const subject = encodeURIComponent("Haven Desk small business early-access application");
  const body = encodeURIComponent(summary);
  const recipient = CONTACT_EMAIL.trim();
  return recipient ? `mailto:${recipient}?subject=${subject}&body=${body}` : `mailto:?subject=${subject}&body=${body}`;
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(form);
  const summary = buildSummary(formData);

  if (summaryField instanceof HTMLTextAreaElement) {
    summaryField.value = summary;
  }
  if (emailLink instanceof HTMLAnchorElement) {
    emailLink.href = buildMailto(summary);
  }
  if (emailWarning) {
    emailWarning.textContent = CONTACT_EMAIL
      ? "Review the email before sending. Do not include sensitive client data in the pilot application."
      : "Contact email is not configured yet. Copy the application summary and send it through the approved pilot channel.";
  }
  output?.removeAttribute("hidden");
  output?.scrollIntoView({ behavior: "smooth", block: "start" });
});

copyButton?.addEventListener("click", async () => {
  if (!(summaryField instanceof HTMLTextAreaElement)) {
    return;
  }
  await navigator.clipboard.writeText(summaryField.value);
  copyButton.textContent = "Copied";
  window.setTimeout(() => {
    copyButton.textContent = "Copy application";
  }, 1800);
});
