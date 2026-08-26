"use client";

import { useEffect, useRef, useState } from "react";

import {
  LearningProgressProvider,
  useLearningProgress,
} from "../../core/progress";
import { LearningCompass } from "./LearningCompass";
import { useLearningCompass } from "./learning-compass-store";
import "./site-header.css";

const nav = [
  ["开始", "/start"],
  ["课程", "/learn"],
  ["术语", "/glossary"],
  ["源码", "/source"],
] as const;
const mechanismChapterSlugById: Readonly<Record<string, string>> = {
  "stg.chapter-1": "row-to-sample",
  "stg.chapter-2": "field-ownership",
  "stg.chapter-3": "group-without-aliasing",
  "stg.chapter-4": "sample-to-request",
  "stg.chapter-5": "response-projection",
  "stg.chapter-6": "writeback-contract",
  assessment: "assessment",
};

function HeaderContent() {
  const compass = useLearningCompass();
  const { progress, hydrated } = useLearningProgress();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDialogElement>(null);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const resumeHref = (() => {
    if (!hydrated || compass) return null;
    const latest = Object.entries(progress.lessons)
      .filter(([, lesson]) => lesson.resume !== null)
      .sort(([, left], [, right]) => right.updated_at.localeCompare(left.updated_at))[0];
    if (!latest) return null;
    const [lessonId, lesson] = latest;
    const resume = lesson.resume;
    if (lessonId === "core.sample-to-generation" && resume?.kind === "chaptered") {
      const chapterSlug = mechanismChapterSlugById[resume.chapter_id];
      if (!chapterSlug) return "/learn/sample-to-generation";
      const phase = resume.section_id && ["orient", "model", "verify", "practice"].includes(resume.section_id)
        ? `#${resume.section_id}`
        : "";
      return `/learn/sample-to-generation?chapter=${encodeURIComponent(chapterSlug)}${phase}`;
    }
    if (lessonId === "core.sample-journey" && resume?.kind === "sample-journey") {
      const params = new URLSearchParams({
        event: resume.event_id,
        sample: resume.selected_sample_id,
        timeline: resume.timeline_mode,
      });
      return `/learn/sample-journey?${params.toString()}`;
    }
    return null;
  })();

  useEffect(() => {
    const dialog = menuRef.current;
    if (!dialog) return;
    if (menuOpen && !dialog.open) dialog.showModal();
    if (!menuOpen && dialog.open) dialog.close();
  }, [menuOpen]);

  return (
    <header className={`site-header${compass ? " has-learning-compass" : ""}`}>
      <div className="site-header-primary page-shell">
        <a className="brand" href="/" aria-label="slime Lab 首页">
          <span className="brand-wordmark">slime Lab</span>
          <small>Mechanism curriculum / M1</small>
        </a>
        <nav className="site-primary-nav" aria-label="主导航">
          {nav.map(([label, href]) => <a href={href} key={href}>{label}</a>)}
        </nav>
        <div className="site-header-actions">
          {resumeHref ? <a className="site-continue-learning" href={resumeHref}>继续学习</a> : null}
          <a
            aria-label="在新窗口打开 THUDM/slime GitHub 源码仓库"
            className="source-link"
            href="https://github.com/THUDM/slime"
            rel="noreferrer"
            target="_blank"
          >
            <span>THUDM/slime</span>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 17 17 7M8 7h9v9" /></svg>
          </a>
        </div>
        {compass ? (
          <button
            className="site-mobile-route"
            onClick={(event) => window.dispatchEvent(new CustomEvent(
              "slime:open-learning-compass",
              { detail: event.currentTarget },
            ))}
            type="button"
          >
            课程路线
          </button>
        ) : null}
        <button
          aria-controls="site-mobile-menu"
          aria-expanded={menuOpen}
          className="site-menu-trigger"
          onClick={() => setMenuOpen(true)}
          ref={menuTriggerRef}
          type="button"
        >
          菜单
        </button>
      </div>

      {compass ? <LearningCompass compass={compass} /> : null}

      <dialog
        aria-labelledby="site-mobile-menu-title"
        className="site-mobile-menu"
        id="site-mobile-menu"
        onCancel={(event) => {
          event.preventDefault();
          setMenuOpen(false);
        }}
        onClose={() => {
          setMenuOpen(false);
          menuTriggerRef.current?.focus();
        }}
        onKeyDown={(event) => {
          if (event.key !== "Escape") return;
          event.preventDefault();
          setMenuOpen(false);
        }}
        ref={menuRef}
      >
        <div>
          <header>
            <h2 id="site-mobile-menu-title">站点导航</h2>
            <button onClick={() => setMenuOpen(false)} type="button">关闭</button>
          </header>
          <nav aria-label="移动端主导航">
            {nav.map(([label, href]) => (
              <a href={href} key={href} onClick={() => setMenuOpen(false)}>{label}</a>
            ))}
          </nav>
          <a href="https://github.com/THUDM/slime" rel="noreferrer" target="_blank">
            THUDM/slime 源码仓库 ↗
          </a>
        </div>
      </dialog>
    </header>
  );
}

export function SiteHeader() {
  return (
    <>
      <LearningProgressProvider />
      <HeaderContent />
    </>
  );
}
