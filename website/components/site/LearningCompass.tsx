"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { RefObject } from "react";

import {
  LEARNING_COMPASS_PHASES,
  type LearningCompassRegistration,
  type LearningCompassTarget,
} from "./learning-compass-store";

const focusableSelector = [
  "button:not([disabled])",
  "a[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function useModalFocus(
  open: boolean,
  panelRef: RefObject<HTMLElement | null>,
  triggerRef: RefObject<HTMLButtonElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const background = Array.from(document.querySelectorAll<HTMLElement>(
      ".site-header-primary, #main-content, .site-footer, .skip-link",
    ));
    const previousBackground = background.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));
    previousBackground.forEach(({ element }) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    const previousOverflow = document.body.style.overflow;
    const returnFocus = triggerRef.current;
    document.body.style.overflow = "hidden";
    const items = () =>
      Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hidden && element.getAttribute("aria-hidden") !== "true",
      );
    const frame = window.requestAnimationFrame(() =>
      (items()[0] ?? panel).focus(),
    );
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        close();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = items();
      if (!focusable.length) {
        event.preventDefault();
        panel.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1) ?? first;
      if (
        event.shiftKey &&
        (document.activeElement === first || !panel.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousBackground.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      returnFocus?.focus();
    };
  }, [close, open, panelRef, triggerRef]);
}

function CompassMap({
  compass,
  onNavigate,
}: {
  compass: LearningCompassRegistration;
  onNavigate: (target: LearningCompassTarget) => void;
}) {
  return (
    <ol className="learning-compass-map-list">
      {compass.chapters.map((chapter) => (
        <li
          className={chapter.id === compass.activeChapterId ? "is-current" : ""}
          key={chapter.id}
        >
          <div>
            <span>{chapter.position === "final" ? "FINAL" : String(chapter.position).padStart(2, "0")}</span>
            <strong>{chapter.label}</strong>
            <small>{chapter.durationMinutes} 分钟</small>
          </div>
          <nav aria-label={`${chapter.label}学习阶段`}>
            {chapter.phases.map((phase) => {
              const target = {
                chapterId: chapter.id,
                phaseId: phase.id,
                href: `${chapter.href}#${phase.id}`,
              };
              const current =
                chapter.id === compass.activeChapterId &&
                phase.id === compass.activePhaseId;
              return (
                <a
                  aria-current={current ? "location" : undefined}
                  href={target.href}
                  key={phase.id}
                  onClick={(event) => {
                    event.preventDefault();
                    onNavigate(target);
                  }}
                >
                  {phase.label}
                </a>
              );
            })}
          </nav>
        </li>
      ))}
    </ol>
  );
}

export function LearningCompass({
  compass,
}: {
  compass: LearningCompassRegistration;
}) {
  const [mapOpen, setMapOpen] = useState(false);
  const mapPanelRef = useRef<HTMLElement>(null);
  const mapTriggerRef = useRef<HTMLButtonElement>(null);
  const closeMap = useMemo(() => () => setMapOpen(false), []);
  useModalFocus(mapOpen, mapPanelRef, mapTriggerRef, closeMap);
  useEffect(() => {
    const openFromHeader = (event: Event) => {
      const trigger = (event as CustomEvent<HTMLElement>).detail;
      if (trigger instanceof HTMLButtonElement) mapTriggerRef.current = trigger;
      setMapOpen(true);
    };
    window.addEventListener("slime:open-learning-compass", openFromHeader);
    return () => window.removeEventListener("slime:open-learning-compass", openFromHeader);
  }, []);

  const activeChapter =
    compass.chapters.find((chapter) => chapter.id === compass.activeChapterId) ??
    compass.chapters[0];
  const activePhase =
    activeChapter?.phases.find((phase) => phase.id === compass.activePhaseId) ??
    activeChapter?.phases[0] ?? LEARNING_COMPASS_PHASES[0];
  const activePhaseIndex = Math.max(0, activeChapter?.phases.findIndex(
    (phase) => phase.id === activePhase.id,
  ) ?? 0);
  const chapterPosition = activeChapter?.position === "final"
    ? "FINAL"
    : `${activeChapter?.position ?? 1}/${compass.chapterCount}`;
  const navigate = (target: LearningCompassTarget) => {
    setMapOpen(false);
    compass.navigate(target);
  };

  return (
    <>
      <div className="learning-compass" aria-label="当前学习位置">
        <button
          aria-controls="learning-compass-map"
          aria-expanded={mapOpen}
          className="learning-compass-route"
          onClick={(event) => {
            mapTriggerRef.current = event.currentTarget;
            setMapOpen(true);
          }}
          ref={mapTriggerRef}
          type="button"
        >
          <span>STAGE {String(compass.stage.position).padStart(2, "0")}</span>
          <strong className="learning-compass-stage-label">{compass.stage.label}</strong>
          <strong className="learning-compass-position">
            S{String(compass.stage.position).padStart(2, "0")} · C{String(compass.course.position).padStart(2, "0")} · {chapterPosition} · {activePhaseIndex + 1}/4
          </strong>
        </button>
        <a className="learning-compass-course" href={compass.course.href}>
          <span>COURSE {String(compass.course.position).padStart(2, "0")}</span>
          <strong>{compass.course.label}</strong>
          <small>{compass.course.durationMinutes} 分钟</small>
        </a>
        <button
          className="learning-compass-chapter"
          onClick={(event) => {
            mapTriggerRef.current = event.currentTarget;
            setMapOpen(true);
          }}
          type="button"
        >
          <span>{activeChapter?.position === "final" ? "ASSESSMENT" : `${compass.chapterNoun ?? "章"} ${String(activeChapter?.position ?? 1).padStart(2, "0")}/${String(compass.chapterCount).padStart(2, "0")}`}</span>
          <strong>{activeChapter?.shortLabel}</strong>
        </button>
        <a
          aria-current="location"
          className="learning-compass-current"
          href={`${activeChapter?.href ?? compass.course.href}#${activePhase.id}`}
          onClick={(event) => {
            event.preventDefault();
            if (!activeChapter) return;
            navigate({
              chapterId: activeChapter.id,
              phaseId: activePhase.id,
              href: `${activeChapter.href}#${activePhase.id}`,
            });
          }}
        >
          <span>PHASE {String(activePhaseIndex + 1).padStart(2, "0")}/04</span>
          <strong>{activePhase.label}</strong>
          <i className="learning-compass-phase-line" aria-hidden="true">
            {activeChapter?.phases.map((phase, index) => (
              <b className={index <= activePhaseIndex ? "is-reached" : ""} key={phase.id} />
            ))}
          </i>
        </a>
        {compass.next ? (
          <a
            className="learning-compass-next"
            href={compass.next.href}
            onClick={(event) => {
              const nextUrl = new URL(compass.next?.href ?? "", window.location.origin);
              const nextChapter = compass.chapters.find(
                (chapter) => new URL(chapter.href, window.location.origin).search === nextUrl.search,
              );
              const phaseId = nextUrl.hash.slice(1) as LearningCompassTarget["phaseId"];
              if (!nextChapter || !nextChapter.phases.some((phase) => phase.id === phaseId)) {
                return;
              }
              event.preventDefault();
              navigate({ chapterId: nextChapter.id, phaseId, href: compass.next?.href ?? "" });
            }}
          >
            <span>下一步</span>
            <strong>{compass.next.label}</strong>
          </a>
        ) : (
          <a className="learning-compass-next" href="/learn">
            <span>下一步</span><strong>返回课程路线</strong>
          </a>
        )}
      </div>

      {mapOpen ? (
        <div className="learning-compass-backdrop">
          <button
            aria-hidden="true"
            className="learning-compass-dismiss"
            onClick={closeMap}
            tabIndex={-1}
            type="button"
          />
          <section
            aria-labelledby="learning-compass-map-title"
            aria-modal="true"
            className="learning-compass-map"
            id="learning-compass-map"
            ref={mapPanelRef}
            role="dialog"
            tabIndex={-1}
          >
            <header>
              <div>
                <h2 id="learning-compass-map-title">{compass.course.label}</h2>
                <p>{compass.chapters.length} 个学习单元 · {compass.course.durationMinutes} 分钟</p>
                <a className="learning-compass-cover-link" href={compass.course.href}>
                  查看课程封面与学习目标
                </a>
              </div>
              <button aria-label="关闭课程路线" onClick={closeMap} type="button">关闭</button>
            </header>
            <CompassMap compass={compass} onNavigate={navigate} />
          </section>
        </div>
      ) : null}
    </>
  );
}
