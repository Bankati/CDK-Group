"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * Animations GSAP de la page d'accueil.
 * Les éléments sont repérés par l'attribut `data-gsap` (aucun style modifié).
 * Si l'appareil demande de réduire les animations, rien n'est animé.
 */
export function HomeAnimations() {
  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      document.documentElement.classList.add("gsap-on");
      const q = <T extends Element = HTMLElement>(sel: string) => gsap.utils.toArray<T>(sel);
      const reveal = { toggleActions: "play none none none", start: "top 85%" } as const;

      /* ── Hero : entrée en scène ─────────────────────────────── */
      const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
      intro
        .from("[data-gsap='hero-nav']", {
          y: -30,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 0.8,
        })
        .from(
          "[data-gsap='hero-up']",
          { y: 36, opacity: 0, clearProps: "transform,opacity", duration: 0.9, stagger: 0.12 },
          "-=0.4",
        );

      // Profondeur : la photo défile plus lentement que la page.
      gsap.to("[data-gsap='hero-bg']", {
        yPercent: 18,
        ease: "none",
        scrollTrigger: {
          trigger: "[data-gsap='hero-bg']",
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });

      /* ── Titres de section ─────────────────────────────────── */
      q("[data-gsap='title']").forEach((el) => {
        gsap.from(el.children, {
          y: 40,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: el, ...reveal },
        });
      });

      /* ── Lancement : l'affiche se redresse, le texte suit ───── */
      const poster = document.querySelector("[data-gsap='poster']");
      if (poster) {
        gsap.from(poster, {
          y: 80,
          rotate: -8,
          scale: 0.9,
          opacity: 0,
          clearProps: "opacity",
          duration: 1.2,
          ease: "power4.out",
          scrollTrigger: { trigger: poster, ...reveal },
        });
        gsap.to(poster, {
          yPercent: -8,
          ease: "none",
          scrollTrigger: { trigger: poster, start: "top bottom", end: "bottom top", scrub: true },
        });
      }
      const launchText = document.querySelector("[data-gsap='launch-text']");
      if (launchText) {
        gsap.from([...launchText.children, ...launchText.querySelectorAll("li")], {
          x: 40,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.09,
          scrollTrigger: { trigger: launchText, ...reveal },
        });
      }

      /* ── Comment ça marche : étapes en cascade, chiffres qui grandissent ── */
      const steps = q("[data-gsap='step']");
      if (steps.length) {
        const tl = gsap.timeline({ scrollTrigger: { trigger: steps[0]!, ...reveal } });
        tl.from(steps, {
          y: 60,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 0.8,
          ease: "power3.out",
          stagger: 0.15,
        }).from(
          "[data-gsap='step-num']",
          { scale: 0, rotate: -25, duration: 0.7, ease: "back.out(2.2)", stagger: 0.15 },
          "-=0.75",
        );
      }

      /* ── Packages : cartes en cascade ───────────────────────── */
      q("[data-gsap='cards']").forEach((grid) => {
        gsap.from(grid.children, {
          y: 70,
          scale: 0.94,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 0.9,
          ease: "power3.out",
          stagger: 0.12,
          scrollTrigger: { trigger: grid, ...reveal },
        });
      });
      const banner = document.querySelector("[data-gsap='banner']");
      if (banner) {
        gsap.from(banner, {
          scale: 0.85,
          y: 40,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 1,
          ease: "elastic.out(1, 0.7)",
          scrollTrigger: { trigger: banner, ...reveal },
        });
      }

      /* ── FAQ et contact ────────────────────────────────────── */
      const faq = q("[data-gsap='faq']");
      if (faq.length) {
        gsap.from(faq, {
          x: -40,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.08,
          scrollTrigger: { trigger: faq[0]!, ...reveal },
        });
      }
      q("[data-gsap='list']").forEach((list) => {
        gsap.from(list.children, {
          x: 40,
          opacity: 0,
          clearProps: "transform,opacity",
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.1,
          scrollTrigger: { trigger: list, ...reveal },
        });
      });

      // Les images chargées après coup décalent la page : on recalcule les positions.
      const refresh = () => ScrollTrigger.refresh();
      window.addEventListener("load", refresh);
      return () => {
        window.removeEventListener("load", refresh);
        document.documentElement.classList.remove("gsap-on");
      };
    });

    return () => mm.revert();
  });

  return null;
}
