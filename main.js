const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".site-nav");

if (toggle && nav) {
  const closeNavigation = () => {
    nav.classList.remove("open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.textContent = "Menu";
  };

  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(isOpen));
    toggle.textContent = isOpen ? "Close" : "Menu";
  });

  nav.addEventListener("click", (event) => {
    if (event.target instanceof HTMLAnchorElement) closeNavigation();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeNavigation();
  });
}

document.querySelectorAll("[data-current-year]").forEach((element) => {
  element.textContent = String(new Date().getFullYear());
});

const supportForm = document.querySelector("#support-request-form");

if (supportForm instanceof HTMLFormElement) {
  supportForm.addEventListener("submit", (event) => {
    event.preventDefault();

    if (!supportForm.reportValidity()) return;

    const formData = new FormData(supportForm);
    const subject = `[${formData.get("requestType")}] Browslium support — ${formData.get("organization")}`;
    const body = [
      "Browslium support request",
      "",
      `Customer / family / organization: ${formData.get("organization")}`,
      `Contact name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      `Request type: ${formData.get("requestType")}`,
      `Platform: ${formData.get("platform")}`,
      `Priority: ${formData.get("priority")}`,
      `Account / organization / device ID: ${formData.get("reference") || "Not provided"}`,
      `Affected browser / application: ${formData.get("affectedSoftware") || "Not provided"}`,
      "",
      "Description:",
      String(formData.get("description") || ""),
    ].join("\n");

    const mailto = `mailto:admin@browslium.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    const status = document.querySelector("#form-status");
    if (status) status.classList.add("visible");
    window.location.href = mailto;
  });
}
