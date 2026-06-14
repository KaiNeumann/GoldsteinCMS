import { createElement } from "react";
import SocialLinks from "../SocialLinks";
import ContactForm from "../forms/ContactForm";
import NewsletterSignup from "../forms/NewsletterSignup";
import ConsentServiceSummary from "../consent/ConsentServiceSummary";
import { addCleanupCallback, mountReactComponent } from "../cms-enhance";

export function enhanceServiceSummary(root: HTMLElement) {
  const summaries = root.querySelectorAll(".gf-consent-service-summary");
  summaries.forEach((el) => {
    const container = el as HTMLElement;
    const cleanup = mountReactComponent(
      container,
      createElement(ConsentServiceSummary)
    );
    addCleanupCallback(root, cleanup);
  });
}

export function enhanceSocialLinks(root: HTMLElement) {
  const containers = root.querySelectorAll("div.gf-social-links[data-variant]");
  containers.forEach((container) => {
    const variant = container.getAttribute("data-variant") || "icons";
    const cleanup = mountReactComponent(
      container as HTMLElement,
      createElement(SocialLinks, { variant: variant as any })
    );
    addCleanupCallback(root, cleanup);
  });
}

export function enhanceContactForm(root: HTMLElement) {
  const containers = root.querySelectorAll("div.gf-contact-form[data-form-id]");
  containers.forEach((container) => {
    const formId = container.getAttribute("data-form-id") || "default";
    const cleanup = mountReactComponent(
      container as HTMLElement,
      createElement(ContactForm, { formId })
    );
    addCleanupCallback(root, cleanup);
  });
}

export function enhanceNewsletterSignup(root: HTMLElement) {
  const containers = root.querySelectorAll("div.gf-newsletter-signup[data-form-id]");
  containers.forEach((container) => {
    const formId = container.getAttribute("data-form-id") || "default";
    const cleanup = mountReactComponent(
      container as HTMLElement,
      createElement(NewsletterSignup, { formId })
    );
    addCleanupCallback(root, cleanup);
  });
}
