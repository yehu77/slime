"use client";

import { useEffect, useRef, useState, type FormEvent, type RefObject } from "react";

import { sampleToGenerationCourse } from "../../content/zh/lessons/sample-to-generation";
import anchorsPayload from "../../data/source-refs/slime-06ffdbe2.anchors.generated.json";
import {
  gradeGroupingInvestigation,
  type GroupingInitialJudgementSubmission,
  type GroupingInvestigationGrade,
  type GroupingInvestigationSubmission,
  type GroupingTraceStep,
} from "../../core/sample-to-generation";
import type { LearningArtifactV2 } from "../../core/progress";
import { GuidedSourceExcerpt } from "./GuidedSourceExcerpt";
import type { ChapterThreeGroupingChapter } from "./chapter-reader-contracts";
import "./chapter-three-grouping-investigation.css";

type SourceAnchor = {
  id: string;
  symbol: string;
  url: string;
  guided_excerpt?: {
    code: string;
    start_line: number;
  };
};

type FaultAnswer = {
  dimension: string;
  boundary: string;
  consequence: string;
};

type TraceAnswer = {
  groupIndex: string;
  sampleIndex: string;
};

type AliasProbeAnswer = {
  target: string;
  sibling: string;
  seed: string;
};

type ChapterThreeGroupingInvestigationProps = {
  chapter: ChapterThreeGroupingChapter;
  headingRef: RefObject<HTMLHeadingElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  initialArtifact?: LearningArtifactV2;
  storedSubmission?: GroupingInvestigationSubmission;
  passed: boolean;
  onOpenDrawer: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onRecordInitialJudgement: (
    response: GroupingInitialJudgementSubmission | null,
    skipped: boolean,
  ) => void;
  onSubmitInvestigation: (
    submission: GroupingInvestigationSubmission,
    grade: GroupingInvestigationGrade,
  ) => void;
};

const sourceAnchors = anchorsPayload.anchors as readonly SourceAnchor[];

function GroupingEvidence({ evidenceId }: { evidenceId: string }) {
  const evidence = sampleToGenerationCourse.sourceEvidence.find((item) => item.id === evidenceId);
  if (!evidence) return null;
  const anchor = sourceAnchors.find((item) => item.id === evidence.sourceRefId);
  return (
    <GuidedSourceExcerpt
      evidence={evidence}
      sourceUrl={anchor?.url}
      symbol={anchor?.symbol}
      code={anchor?.guided_excerpt?.code}
      lineStart={anchor?.guided_excerpt?.start_line}
    />
  );
}

function numberOrUndefined(value: string | undefined) {
  if (value === undefined || value.trim() === "") return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : undefined;
}

function traceAnswerMatches(step: GroupingTraceStep, answer: TraceAnswer | undefined) {
  if (!answer) return false;
  const expectedGroupIndex = step.assignment
    ? step.assignment.group_index
    : step.countersAfter.groupIndex;
  const expectedSampleIndex = step.assignment
    ? step.assignment.index
    : step.countersAfter.sampleIndex;
  return Number(answer.groupIndex) === expectedGroupIndex && Number(answer.sampleIndex) === expectedSampleIndex;
}

export function ChapterThreeGroupingInvestigation({
  chapter,
  headingRef,
  triggerRef,
  initialArtifact,
  storedSubmission,
  passed,
  onOpenDrawer,
  onPrevious,
  onNext,
  onRecordInitialJudgement,
  onSubmitInvestigation,
}: ChapterThreeGroupingInvestigationProps) {
  const manifest = chapter.groupingInvestigation;
  const orient = manifest.phases[0];
  const model = manifest.phases[1];
  const verify = manifest.phases[2];
  const practice = manifest.phases[3];
  const expected = manifest.expectedValues;
  const savedInitialJudgement = storedSubmission?.initialJudgement;
  const restoredInitialGrade = storedSubmission
    ? gradeGroupingInvestigation(expected, storedSubmission)
    : null;
  const [orientationChoices, setOrientationChoices] = useState<Record<string, string>>(
    () => ({ ...savedInitialJudgement?.symptomClassifications }),
  );
  const [blastRadius, setBlastRadius] = useState<string[]>(
    () => [...(savedInitialJudgement?.correctBlastRadius ?? [])],
  );
  const [orientationSubmitted, setOrientationSubmitted] = useState(
    () => Boolean(initialArtifact) || Boolean(savedInitialJudgement),
  );
  const [orientationSkipped, setOrientationSkipped] = useState(
    () => initialArtifact?.status === "skipped",
  );
  const [orientationError, setOrientationError] = useState("");
  const [candidateCount, setCandidateCount] = useState<1 | 2 | 3 | null>(null);
  const [modelTraceAnswers, setModelTraceAnswers] = useState<Record<string, TraceAnswer>>({});
  const [modelTraceSubmitted, setModelTraceSubmitted] = useState(false);
  const [modelTraceAccepted, setModelTraceAccepted] = useState(false);
  const [sourceMap, setSourceMap] = useState<Record<string, string>>(
    () => ({ ...storedSubmission?.sourceMapping }),
  );
  const [sourceMapSubmitted, setSourceMapSubmitted] = useState(
    () => Boolean(storedSubmission?.sourceMapping),
  );
  const [sourceMapAccepted, setSourceMapAccepted] = useState(
    () => Boolean(restoredInitialGrade?.sourceVerificationCorrect),
  );
  const [coldTraceAnswers, setColdTraceAnswers] = useState<Record<string, TraceAnswer>>(() =>
    Object.fromEntries(expected.matrix.map((entry) => {
      const answer = storedSubmission?.matrix?.[entry.candidateId];
      return [entry.candidateId, {
        groupIndex: answer?.groupIndex === undefined ? "" : String(answer.groupIndex),
        sampleIndex: answer?.sampleIndex === undefined ? "" : String(answer.sampleIndex),
      }];
    })),
  );
  const [counterAnswers, setCounterAnswers] = useState<TraceAnswer>(() => ({
    groupIndex: storedSubmission?.countersAfter?.groupIndex === undefined
      ? ""
      : String(storedSubmission.countersAfter.groupIndex),
    sampleIndex: storedSubmission?.countersAfter?.sampleIndex === undefined
      ? ""
      : String(storedSubmission.countersAfter.sampleIndex),
  }));
  const [coldTraceSubmitted, setColdTraceSubmitted] = useState(
    () => Boolean(storedSubmission?.matrix || storedSubmission?.countersAfter),
  );
  const [coldTraceAccepted, setColdTraceAccepted] = useState(() => Boolean(
    restoredInitialGrade?.dimensionGrades.relationship.checks.groupAssignments &&
    restoredInitialGrade.dimensionGrades.identity.checks.sampleAssignments &&
    restoredInitialGrade.dimensionGrades.identity.checks.uniqueIndexes &&
    restoredInitialGrade.dimensionGrades.counterTiming.checks.finalCounters,
  ));
  const [aliasProbeAnswers, setAliasProbeAnswers] = useState<AliasProbeAnswer>(() => ({
    target: storedSubmission?.aliasProbe?.target ?? "",
    sibling: storedSubmission?.aliasProbe?.sibling ?? "",
    seed: storedSubmission?.aliasProbe?.seed ?? "",
  }));
  const [aliasProbeSubmitted, setAliasProbeSubmitted] = useState(
    () => Boolean(storedSubmission?.aliasProbe),
  );
  const [faultAnswers, setFaultAnswers] = useState<Record<string, FaultAnswer>>(() =>
    Object.fromEntries(verify.faultCards.map((fault) => {
      const report = storedSubmission?.caseReport?.[fault.symptom.id];
      return [fault.id, {
        dimension: storedSubmission?.faultClassifications?.[fault.id] ?? "",
        boundary: report?.firstErrorBoundary ?? "",
        consequence: report?.downstreamConsequenceId ?? "",
      }];
    })),
  );
  const [investigationGrade, setInvestigationGrade] = useState<GroupingInvestigationGrade | null>(
    restoredInitialGrade,
  );
  const restoredFingerprint = JSON.stringify({
    artifact: initialArtifact
      ? {
          status: initialArtifact.status,
          submittedAt: initialArtifact.submitted_at,
          response: initialArtifact.response,
        }
      : null,
    submission: storedSubmission ?? null,
    passed,
  });
  const lastRestoredFingerprint = useRef<string | null>(null);

  useEffect(() => {
    if (lastRestoredFingerprint.current === restoredFingerprint) return;
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      if (lastRestoredFingerprint.current === restoredFingerprint) return;
      lastRestoredFingerprint.current = restoredFingerprint;
      const saved = storedSubmission?.initialJudgement;
      setOrientationChoices({ ...saved?.symptomClassifications });
      setBlastRadius([...(saved?.correctBlastRadius ?? [])]);
      setOrientationSkipped(initialArtifact?.status === "skipped");
      setOrientationSubmitted(Boolean(initialArtifact) || Boolean(saved));
      setSourceMap({ ...storedSubmission?.sourceMapping });
      setSourceMapSubmitted(Boolean(storedSubmission?.sourceMapping));
      setColdTraceAnswers(Object.fromEntries(expected.matrix.map((entry) => {
        const answer = storedSubmission?.matrix?.[entry.candidateId];
        return [entry.candidateId, {
          groupIndex: answer?.groupIndex === undefined ? "" : String(answer.groupIndex),
          sampleIndex: answer?.sampleIndex === undefined ? "" : String(answer.sampleIndex),
        }];
      })));
      setCounterAnswers({
        groupIndex: storedSubmission?.countersAfter?.groupIndex === undefined
          ? ""
          : String(storedSubmission.countersAfter.groupIndex),
        sampleIndex: storedSubmission?.countersAfter?.sampleIndex === undefined
          ? ""
          : String(storedSubmission.countersAfter.sampleIndex),
      });
      setColdTraceSubmitted(Boolean(storedSubmission?.matrix || storedSubmission?.countersAfter));
      setAliasProbeAnswers({
        target: storedSubmission?.aliasProbe?.target ?? "",
        sibling: storedSubmission?.aliasProbe?.sibling ?? "",
        seed: storedSubmission?.aliasProbe?.seed ?? "",
      });
      setAliasProbeSubmitted(Boolean(storedSubmission?.aliasProbe));
      setFaultAnswers(Object.fromEntries(verify.faultCards.map((fault) => {
        const report = storedSubmission?.caseReport?.[fault.symptom.id];
        return [fault.id, {
          dimension: storedSubmission?.faultClassifications?.[fault.id] ?? "",
          boundary: report?.firstErrorBoundary ?? "",
          consequence: report?.downstreamConsequenceId ?? "",
        }];
      })));
      const restoredGrade = storedSubmission
        ? gradeGroupingInvestigation(expected, storedSubmission)
        : null;
      setInvestigationGrade(restoredGrade);
      setSourceMapAccepted(Boolean(restoredGrade?.sourceVerificationCorrect));
      setColdTraceAccepted(Boolean(
        restoredGrade?.dimensionGrades.relationship.checks.groupAssignments &&
        restoredGrade.dimensionGrades.identity.checks.sampleAssignments &&
        restoredGrade.dimensionGrades.identity.checks.uniqueIndexes &&
        restoredGrade.dimensionGrades.counterTiming.checks.finalCounters,
      ));
    });
    return () => {
      cancelled = true;
    };
  }, [expected, initialArtifact, passed, restoredFingerprint, storedSubmission, verify.faultCards]);

  const activeInitialJudgement = orientationSkipped
    ? null
    : orientationSubmitted
      ? {
          symptomClassifications: orientationChoices,
          correctBlastRadius: blastRadius,
        }
      : storedSubmission?.initialJudgement ?? null;
  const orientationResolved = orientationSubmitted || orientationSkipped;
  const orientationCanBeSupplemented = initialArtifact?.status === "skipped" || orientationSkipped;
  const orientationLocked = initialArtifact?.status === "submitted" ||
    (orientationSubmitted && !orientationCanBeSupplemented);
  const orientationCorrect = Boolean(
    activeInitialJudgement &&
      orient.judgement.symptoms.every(
        (symptom) => activeInitialJudgement.symptomClassifications?.[symptom.id] === expected.initialJudgement.symptomClassifications[symptom.id],
      ) &&
      activeInitialJudgement.correctBlastRadius?.length === expected.initialJudgement.correctBlastRadius.length &&
      activeInitialJudgement.correctBlastRadius.every((candidate) => expected.initialJudgement.correctBlastRadius.includes(candidate)),
  );
  const modelTraceCorrect = model.workedTrace.every((step) => traceAnswerMatches(step, modelTraceAnswers[step.id]));
  const sourceMapCorrect = verify.claims.every(
    (claim) => sourceMap[claim.id] === expected.sourceMapping[claim.id],
  );
  const coldTraceCorrect = expected.matrix.every((entry) => {
    const answer = coldTraceAnswers[entry.candidateId];
    return Number(answer?.groupIndex) === entry.groupIndex && Number(answer?.sampleIndex) === entry.sampleIndex;
  }) &&
    numberOrUndefined(counterAnswers.groupIndex) === expected.countersAfter.groupIndex &&
    numberOrUndefined(counterAnswers.sampleIndex) === expected.countersAfter.sampleIndex;
  const aliasProbeCorrect = (Object.keys(aliasProbeAnswers) as Array<keyof AliasProbeAnswer>).every(
    (field) => aliasProbeAnswers[field] === expected.aliasProbe[field],
  );
  const modelTraceLocked = passed || modelTraceAccepted;
  const sourceMapLocked = passed || sourceMapAccepted;
  const coldTraceLocked = passed || coldTraceAccepted;
  const finalReportLocked = passed || Boolean(investigationGrade?.correct);

  function submitOrientation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (blastRadius.length === 0) {
      setOrientationError("至少圈出一个会被 mutation 影响的对象，或选择跳过初判。");
      return;
    }
    const response: GroupingInitialJudgementSubmission = {
      symptomClassifications: orientationChoices,
      correctBlastRadius: blastRadius,
    };
    setOrientationError("");
    setOrientationSkipped(false);
    setOrientationSubmitted(true);
    onRecordInitialJudgement(response, false);
  }

  function skipOrientation() {
    setOrientationError("");
    setOrientationSkipped(true);
    setOrientationSubmitted(true);
    onRecordInitialJudgement(null, true);
  }

  function submitModelTrace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModelTraceSubmitted(true);
    setModelTraceAccepted(modelTraceCorrect);
  }

  function submitSourceMap(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSourceMapSubmitted(true);
    setSourceMapAccepted(sourceMapCorrect);
  }

  function submitColdTrace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setColdTraceSubmitted(true);
    setColdTraceAccepted(coldTraceCorrect);
  }

  function submitInvestigation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAliasProbeSubmitted(true);
    const submission: GroupingInvestigationSubmission = {
      initialJudgement: activeInitialJudgement ?? undefined,
      matrix: Object.fromEntries(expected.matrix.map((entry) => {
        const answer = coldTraceAnswers[entry.candidateId];
        return [entry.candidateId, {
          groupIndex: numberOrUndefined(answer?.groupIndex),
          sampleIndex: numberOrUndefined(answer?.sampleIndex),
        }];
      })),
      countersAfter: {
        groupIndex: numberOrUndefined(counterAnswers.groupIndex),
        sampleIndex: numberOrUndefined(counterAnswers.sampleIndex),
      },
      aliasProbe: {
        target: aliasProbeAnswers.target || undefined,
        sibling: aliasProbeAnswers.sibling || undefined,
        seed: aliasProbeAnswers.seed || undefined,
      },
      sourceMapping: sourceMap,
      faultClassifications: Object.fromEntries(
        verify.faultCards.map((fault) => [fault.id, faultAnswers[fault.id]?.dimension]),
      ),
      caseReport: Object.fromEntries(
        verify.faultCards.map((fault) => [fault.symptom.id, {
          firstErrorBoundary: faultAnswers[fault.id]?.boundary,
          downstreamConsequenceId: faultAnswers[fault.id]?.consequence,
        }]),
      ),
    };
    const grade = gradeGroupingInvestigation(expected, submission);
    setInvestigationGrade(grade);
    onSubmitInvestigation(submission, grade);
  }

  return (
    <article className="grouping-investigation-reader" aria-labelledby="mechanism-chapter-title">
      <header className="grouping-investigation-opening" id="orient">
        <picture className="grouping-investigation-rain-frame">
          <source media="(max-width: 700px)" srcSet="/art/grouping-investigation-rain-portrait.webp" />
          <img
            alt="雨中的持伞人物站在城市灯火倒映的路面上。"
            decoding="async"
            fetchPriority="high"
            height={900}
            loading="eager"
            src="/art/grouping-investigation-rain-wide.webp"
            width={1600}
          />
        </picture>
        <div className="grouping-investigation-opening-sheet">
          <p className="grouping-investigation-running-head">CHAPTER 03 / GROUPING INVESTIGATION</p>
          <h1 id="mechanism-chapter-title" ref={headingRef} tabIndex={-1}>{chapter.title}</h1>
          <blockquote>{chapter.drivingQuestion}</blockquote>
          <p className="grouping-investigation-opening-summary">
            这一章从一份尚未定性的异常报告开始。先留下判断，再让模型与固定源码决定哪些怀疑成立。
          </p>
          <dl className="grouping-investigation-dossier-facts">
            <div><dt>观察点</dt><dd><code>groups-built</code></dd></div>
            <div><dt>待查边界</dt><dd>关系、身份、可变状态</dd></div>
            <div><dt>固定范围</dt><dd>DataSource fan-out，不进入 generation</dd></div>
          </dl>
          <button className="mechanism-state-trigger" ref={triggerRef} type="button" onClick={onOpenDrawer}>
            打开 a0 分组后账本
          </button>
        </div>
      </header>

      <section className="grouping-scene-dossier" aria-labelledby="grouping-scene-dossier-title">
        <div className="grouping-scene-dossier-copy">
          <p className="grouping-incident-boundary">教学假想故障 · 不是固定 commit 的实际输出</p>
          <h2 id="grouping-scene-dossier-title">{orient.title}</h2>
          <h3>{orient.incident.title}</h3>
          <ol>
            {orient.incident.report.map((line, index) => (
              <li key={line}><b>{String(index + 1).padStart(2, "0")}</b><code>{line}</code></li>
            ))}
          </ol>
        </div>
        {orientationLocked ? (
          <section className="grouping-orient-receipt" aria-label="不可覆盖的故障初判">
            <header><strong>初判 artifact 已封存</strong><span>{orientationCorrect ? "命中四个维度" : "保留原判断，等待后续校正"}</span></header>
            <ol>
              {orient.judgement.symptoms.map((symptom) => (
                <li key={symptom.id}>
                  <span>{symptom.report}</span>
                  <b>{orient.judgement.categoryOptions.find((option) => option.id === orientationChoices[symptom.id])?.label ?? "未分类"}</b>
                </li>
              ))}
            </ol>
            <p>预测 mutation 影响：<strong>{blastRadius.join("、") || "未作答"}</strong></p>
          </section>
        ) : <form className="grouping-orient-judgement" onSubmit={submitOrientation}>
          <fieldset disabled={orientationLocked}>
            <legend>{orient.judgement.prompt}</legend>
            <div className="grouping-symptom-classification">
              {orient.judgement.symptoms.map((symptom) => (
                <label key={symptom.id}>
                  <span>{symptom.report}</span>
                  <select
                    required
                    value={orientationChoices[symptom.id] ?? ""}
                    onChange={(event) => setOrientationChoices((current) => ({ ...current, [symptom.id]: event.target.value }))}
                  >
                    <option value="">分类到哪一维？</option>
                    {orient.judgement.categoryOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                  </select>
                </label>
              ))}
            </div>
            <div className="grouping-blast-radius-choice">
              <strong>{orient.judgement.blastRadius.prompt}</strong>
              {orient.judgement.blastRadius.candidateOptions.map((candidate) => (
                <label key={candidate}>
                  <input
                    checked={blastRadius.includes(candidate)}
                    type="checkbox"
                    value={candidate}
                    onChange={(event) => setBlastRadius((current) => event.target.checked
                      ? [...current, candidate]
                      : current.filter((item) => item !== candidate))}
                  />
                  <span>{candidate}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grouping-orient-actions">
            <button className="grouping-investigation-submit" disabled={orientationLocked} type="submit">
              {orientationSkipped ? "补交一次真实初判" : "提交初判"}
            </button>
            <button className="grouping-investigation-skip" disabled={orientationResolved} type="button" onClick={skipOrientation}>跳过初判，继续阅读</button>
          </div>
          {orientationError ? <p className="is-correction" role="alert">{orientationError}</p> : null}
          {orientationSubmitted ? (
            <p className={orientationCorrect ? "is-correct" : "is-correction"} role="status" aria-live="polite">
              {orientationSkipped
                ? "初判已记录为跳过；下面会在提交后给出对象边界与固定源码。"
                : orientationCorrect
                  ? "初判已封存：四条症状与 mutation 传播半径都已定位。"
                  : "初判已封存：继续通过模型、证据与冷案逐项校正。"}
            </p>
          ) : null}
        </form>}
      </section>

      <section className="grouping-inference-desk" id="model" aria-labelledby="grouping-inference-desk-title">
        <div className="grouping-inference-figure">
          <picture>
            <source media="(max-width: 700px)" srcSet="/art/grouping-investigation-mirror-portrait.webp" />
            <img alt="镜面前的女孩与多层倒影，呼应同值不等于同一对象。" decoding="async" height={900} loading="lazy" src="/art/grouping-investigation-mirror-wide.webp" width={1600} />
          </picture>
          <p>同值 ≠ 同一对象图</p>
        </div>
        <div className="grouping-inference-controls">
          <h2 id="grouping-inference-desk-title">{model.title}</h2>
          <p>{chapter.objective}</p>
          <dl className="grouping-notation-strip">
            {model.notation.map((item) => <div key={item.symbol}><dt>{item.symbol}</dt><dd>{item.meaning}</dd></div>)}
          </dl>
          <fieldset className="grouping-n-experiment">
            <legend>改变 <code>N</code>，只观察“每组的候选宽度”</legend>
            <div>
              {([1, 2, 3] as const).map((count) => (
                <label key={count}><input checked={candidateCount === count} name="grouping-candidate-count" type="radio" value={count} onChange={() => setCandidateCount(count)} /><span>N = {count}</span></label>
              ))}
            </div>
          </fieldset>
          <output className="grouping-n-output" aria-live="polite">
            {candidateCount === null ? "先选择 N；推导不会预先展开。" : <><strong>P = 2</strong> 个 occurrence，各自留下 {candidateCount} 个独立候选槽；本次共有 {2 * candidateCount} 条物理候选。<span aria-label={`每组 ${candidateCount} 个候选槽`}>{Array.from({ length: candidateCount }, (_, index) => <i key={index}>candidate slot</i>)}</span></>}
          </output>
          <ol className="grouping-inference-rules">{model.rules.map((rule) => <li key={rule}>{rule}</li>)}</ol>

          {!modelTraceAccepted && !passed ? <form className="grouping-model-trace" onSubmit={submitModelTrace}>
            <fieldset disabled={!orientationResolved || modelTraceLocked}>
              <legend>六行追踪：每行分别写当前 <code>G</code> 与 <code>I</code></legend>
              <ol>
                {model.workedTrace.map((step) => {
                  const label = step.assignment ? `copy ${step.assignment.candidateId}` : `close ${step.seedOccurrenceId}`;
                  const answer = modelTraceAnswers[step.id] ?? { groupIndex: "", sampleIndex: "" };
                  const groupFieldLabel = step.assignment ? "写入 G" : "封口后 G";
                  const sampleFieldLabel = step.assignment ? "写入 I" : "封口后 I";
                  return (
                    <li key={step.id}>
                      <span>{String(step.order).padStart(2, "0")}</span>
                      <strong>{label}</strong>
                      <label><span>{groupFieldLabel}</span><input aria-invalid={modelTraceSubmitted && !traceAnswerMatches(step, answer)} inputMode="numeric" required type="number" value={answer.groupIndex} onChange={(event) => setModelTraceAnswers((current) => ({ ...current, [step.id]: { ...answer, groupIndex: event.target.value } }))} /></label>
                      <label><span>{sampleFieldLabel}</span><input aria-invalid={modelTraceSubmitted && !traceAnswerMatches(step, answer)} inputMode="numeric" required type="number" value={answer.sampleIndex} onChange={(event) => setModelTraceAnswers((current) => ({ ...current, [step.id]: { ...answer, sampleIndex: event.target.value } }))} /></label>
                    </li>
                  );
                })}
              </ol>
            </fieldset>
            <button className="grouping-investigation-submit" disabled={!orientationResolved || modelTraceLocked} type="submit">{modelTraceSubmitted && !modelTraceCorrect ? "修正后重新提交" : "提交六行 trace"}</button>
            {modelTraceSubmitted ? <p className={modelTraceCorrect ? "is-correct" : "is-correction"} role="status" aria-live="polite">{modelTraceCorrect ? "六个因果步骤全部成立。" : "本轮推演仍有错位；对照实际 trace 后可以修正并重新提交。"}</p> : null}
          </form> : null}
          {passed && !modelTraceSubmitted ? (
            <section className="grouping-model-pass-recap" aria-label="已通过的六行计数器推演">
              <header><strong>六行推演已通过</strong><span>候选写入读取当前 G/I；封口行只推进组计数器。</span></header>
              <ol>
                {model.workedTrace.map((step) => (
                  <li key={step.id}>
                    <b>{step.assignment ? step.assignment.candidateId : `close ${step.seedOccurrenceId}`}</b>
                    <code>G={step.assignment?.group_index ?? step.countersAfter.groupIndex}</code>
                    <code>I={step.assignment?.index ?? step.countersAfter.sampleIndex}</code>
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
          {modelTraceSubmitted ? (
            <section className="grouping-model-verdict" aria-labelledby="grouping-model-verdict-title">
              <h3 id="grouping-model-verdict-title">实际 trace：逐行核对计数器读取与推进</h3>
              <ol>
                {model.workedTrace.map((step) => {
                  const answer = modelTraceAnswers[step.id];
                  const matches = traceAnswerMatches(step, answer);
                  return (
                    <li className={matches ? "is-match" : "is-mismatch"} key={step.id}>
                      <span>{String(step.order).padStart(2, "0")}</span>
                      <div>
                        <strong>{step.assignment ? `clone/write ${step.assignment.candidateId}` : `封口 ${step.seedOccurrenceId} group`}</strong>
                        <small>你的推导 G={answer?.groupIndex || "—"}, I={answer?.sampleIndex || "—"}</small>
                      </div>
                      <code>
                        {step.assignment
                          ? `write g=${step.assignment.group_index}, i=${step.assignment.index}; next I=${step.countersAfter.sampleIndex}`
                          : `G ${step.countersBefore.groupIndex} → ${step.countersAfter.groupIndex}; I stays ${step.countersAfter.sampleIndex}`}
                      </code>
                    </li>
                  );
                })}
              </ol>
              <dl>
                <div><dt>relationship</dt><dd>同一 seed occurrence 的两次 write 读取同一个 G。</dd></div>
                <div><dt>identity</dt><dd>I 在每个候选写入后推进，物理 Sample 不复用身份。</dd></div>
                <div><dt>aliasing</dt><dd>计数 trace 不足以裁定对象图；下一台实验用 nested metadata 直接验证。</dd></div>
                <div><dt>counter timing</dt><dd>G 只在整组封口后推进；close 行不会额外产生 Sample。</dd></div>
              </dl>
            </section>
          ) : null}
        </div>
      </section>

      <section className="grouping-source-court" id="verify" aria-labelledby="grouping-source-court-title">
        <div className="grouping-source-court-visual">
          <picture>
            <source media="(max-width: 700px)" srcSet="/art/grouping-investigation-mask-portrait.webp" />
            <img alt="安静教室里戴面具的学生和独立游动的金鱼。" decoding="async" height={900} loading="lazy" src="/art/grouping-investigation-mask-wide.webp" width={1600} />
          </picture>
          <p>对象别名污染的视觉隐喻 · 不是控制流或内存结构图解</p>
        </div>
        <div className="grouping-source-court-copy">
          <h2 id="grouping-source-court-title">{verify.title}</h2>
          <p>初判封存后才揭示 <code>deepcopy</code> 与 shallow copy 的传播差异；再把推导映射回固定 commit。</p>
          {orientationResolved ? (
            <div className="grouping-blast-reveal" aria-live="polite">
              <p className={orientationCorrect ? "is-correct" : "is-correction"}>{orientationSkipped ? "初判跳过。" : orientationCorrect ? "初判与正确 deepcopy 边界相符。" : "初判与对象边界不同；核对两种复制语义。"}</p>
              <div>
                <section><h3>deepcopy</h3><ol>{practice.prompt.aliasProbe.fields.map((field) => <li key={field.id}><span>{field.label}</span><b>{expected.aliasProbe[field.id]}</b></li>)}</ol></section>
                <section><h3>shallow copy（反事实）</h3><ol>{practice.prompt.aliasProbe.fields.map((field) => <li key={field.id}><span>{field.label}</span><b>local</b></li>)}</ol></section>
              </div>
            </div>
          ) : <p className="grouping-gated-note">先完成或跳过初判，才能揭示复制半径与来源映射。</p>}
        </div>

        {orientationResolved ? (
          <div className="grouping-source-map">
            {sourceMapAccepted ? (
              <dl className="grouping-source-map-receipt" aria-label="已核证的源码来源映射">
                {verify.claims.map((claim) => (
                  <div key={claim.id}>
                    <dt>{claim.label}</dt>
                    <dd>{verify.sourceCards.find((source) => source.sourceRefId === sourceMap[claim.id])?.label}</dd>
                  </div>
                ))}
              </dl>
            ) : <form onSubmit={submitSourceMap}>
              <fieldset disabled={sourceMapLocked}>
                <legend>把三条待证主张映射到固定提交位置</legend>
                {verify.claims.map((claim) => (
                  <label key={claim.id}>
                    <span>{claim.label}</span>
                    <select required value={sourceMap[claim.id] ?? ""} onChange={(event) => {
                      setSourceMapAccepted(false);
                      setInvestigationGrade(null);
                      setSourceMap((current) => ({ ...current, [claim.id]: event.target.value }));
                    }}>
                      <option value="">选择来源</option>
                      {verify.sourceCards.map((source) => <option key={source.sourceRefId} value={source.sourceRefId}>{source.label}</option>)}
                    </select>
                  </label>
                ))}
              </fieldset>
              <button className="grouping-investigation-submit" disabled={sourceMapLocked} type="submit">{sourceMapSubmitted && !sourceMapAccepted ? "修正并重新核证" : "提交来源映射"}</button>
            </form>}
            {sourceMapSubmitted ? (
              <div className="grouping-source-verdict" aria-live="polite">
                <p className={sourceMapAccepted ? "is-correct" : "is-correction"}>{sourceMapAccepted ? "来源映射成立。现在可以核对固定提交。" : "映射有一处或多处错位；下面的摘录给出可复核的锚点。"}</p>
                {passed ? (
                  <details className="grouping-completed-source-evidence">
                    <summary>展开固定 commit 的 <code>get_samples</code> 最小摘录</summary>
                    <GroupingEvidence evidenceId={chapter.evidenceId} />
                  </details>
                ) : <GroupingEvidence evidenceId={chapter.evidenceId} />}
                <div className="grouping-source-supplements">
                  {chapter.additionalEvidenceIds?.map((evidenceId) => {
                    const evidence = sampleToGenerationCourse.sourceEvidence.find((item) => item.id === evidenceId);
                    return <details key={evidenceId}><summary>{evidence?.title ?? evidenceId}</summary><GroupingEvidence evidenceId={evidenceId} /></details>;
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </section>

      <section className="grouping-case-report" id="practice" aria-labelledby="grouping-case-report-title">
          {sourceMapSubmitted ? <>
          <div className="grouping-case-report-header">
            <div>
              <h2 id="grouping-case-report-title">{practice.title}</h2>
              <p>重复 prompt 不是重复 occurrence。用非零计数器重建六条候选，再判断每张故障卡的首错维度、边界与后果。</p>
              <dl><div><dt>P</dt><dd>{practice.parameters.P}</dd></div><div><dt>N</dt><dd>{practice.parameters.N}</dd></div><div><dt>G₀</dt><dd>{practice.parameters.G0}</dd></div><div><dt>I₀</dt><dd>{practice.parameters.I0}</dd></div></dl>
            </div>
            <picture>
              <source media="(max-width: 700px)" srcSet="/art/grouping-investigation-desks-portrait.webp" />
              <img alt="窗边教室的课桌与一位学生，像等待填写的案件报告。" decoding="async" height={900} loading="lazy" src="/art/grouping-investigation-desks-wide.webp" width={1600} />
            </picture>
          </div>

          {passed ? (
            <section className="grouping-completed-case-file" aria-labelledby="grouping-completed-case-file-title">
              <header>
                <p>CASE CLOSED / STICKY PASS</p>
                <h3 id="grouping-completed-case-file-title">通过后的只读证据摘要</h3>
                <span>完整作答已保存在本地进度中；这里保留足以复核关系、身份、别名与时序的最小案卷。</span>
              </header>
              <div className="grouping-completed-matrix">
                {expected.matrix.map((entry) => (
                  <div key={entry.candidateId}><strong>{entry.candidateId}</strong><span>g={entry.groupIndex}</span><span>i={entry.sampleIndex}</span></div>
                ))}
              </div>
              <dl className="grouping-completed-counters">
                <div><dt>调用后 G</dt><dd>{expected.countersAfter.groupIndex}</dd></div>
                <div><dt>调用后 I</dt><dd>{expected.countersAfter.sampleIndex}</dd></div>
                <div><dt>y0 mutation</dt><dd>只影响 y0；y1 与 seed y 不变</dd></div>
              </dl>
              <ol className="grouping-completed-faults">
                {verify.faultCards.map((fault) => {
                  const dimensionId = expected.faultClassifications[fault.id];
                  const report = expected.caseReport[fault.symptom.id];
                  const dimension = model.dimensions.find((item) => item.id === dimensionId);
                  const boundary = fault.boundaryOptions.find((item) => item.id === report?.firstErrorBoundary);
                  const consequence = fault.consequenceOptions.find((item) => item.id === report?.downstreamConsequenceId);
                  return (
                    <li key={fault.id}>
                      <div><b>{dimension?.label}</b><strong>{fault.title}</strong></div>
                      <output>症状“{fault.symptom.label}” → 首错边界“{boundary?.label}” → 下游后果“{consequence?.label}”</output>
                    </li>
                  );
                })}
              </ol>
            </section>
          ) : <>
          <form className="grouping-cold-trace" onSubmit={submitColdTrace}>
            <fieldset disabled={coldTraceLocked}>
              <legend>冷案六行 trace：每个 occurrence 仍各自成组</legend>
              <ol>
                {expected.matrix.map((entry, index) => {
                  const answer = coldTraceAnswers[entry.candidateId] ?? { groupIndex: "", sampleIndex: "" };
                  const invalid = coldTraceSubmitted && (Number(answer.groupIndex) !== entry.groupIndex || Number(answer.sampleIndex) !== entry.sampleIndex);
                  return (
                    <li key={entry.candidateId}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{entry.candidateId}</strong>
                      <label><span>group</span><input aria-invalid={invalid} inputMode="numeric" required type="number" value={answer.groupIndex} onChange={(event) => {
                        setColdTraceAccepted(false);
                        setInvestigationGrade(null);
                        setColdTraceAnswers((current) => ({ ...current, [entry.candidateId]: { ...answer, groupIndex: event.target.value } }));
                      }} /></label>
                      <label><span>index</span><input aria-invalid={invalid} inputMode="numeric" required type="number" value={answer.sampleIndex} onChange={(event) => {
                        setColdTraceAccepted(false);
                        setInvestigationGrade(null);
                        setColdTraceAnswers((current) => ({ ...current, [entry.candidateId]: { ...answer, sampleIndex: event.target.value } }));
                      }} /></label>
                    </li>
                  );
                })}
              </ol>
              <div className="grouping-cold-counters">
                <label>调用后的 G<input inputMode="numeric" required type="number" value={counterAnswers.groupIndex} onChange={(event) => {
                  setColdTraceAccepted(false);
                  setInvestigationGrade(null);
                  setCounterAnswers((current) => ({ ...current, groupIndex: event.target.value }));
                }} /></label>
                <label>调用后的 I<input inputMode="numeric" required type="number" value={counterAnswers.sampleIndex} onChange={(event) => {
                  setColdTraceAccepted(false);
                  setInvestigationGrade(null);
                  setCounterAnswers((current) => ({ ...current, sampleIndex: event.target.value }));
                }} /></label>
              </div>
            </fieldset>
            <button className="grouping-investigation-submit" disabled={coldTraceLocked} type="submit">{coldTraceSubmitted && !coldTraceAccepted ? "修正并重新推演" : "提交冷案 trace"}</button>
            {coldTraceSubmitted ? <p className={coldTraceAccepted ? "is-correct" : "is-correction"} role="status" aria-live="polite">{coldTraceAccepted ? "冷案矩阵与终态计数器均成立。" : "冷案存在偏差；对照重建后可以继续修正并重试。"}</p> : null}
          </form>

          {coldTraceSubmitted ? <div className="grouping-trace-reconstruction" aria-label="提交后的冷案候选重建">{expected.matrix.map((entry) => <div key={entry.candidateId}><strong>{entry.candidateId}</strong><span>group <b>{entry.groupIndex}</b></span><span>index <b>{entry.sampleIndex}</b></span></div>)}</div> : null}

          {coldTraceSubmitted ? (
            <form className="grouping-fault-report" onSubmit={submitInvestigation}>
              <fieldset className="grouping-cold-alias-probe" disabled={finalReportLocked}>
                <legend>独立验证对象别名：先预测，再把结果写入结案证据</legend>
                <p><code>{practice.prompt.aliasProbe.mutation}</code></p>
                <div>
                  {practice.prompt.aliasProbe.fields.map((field) => (
                    <label key={field.id}>
                      <span>{field.label}</span>
                      <select
                        required
                        value={aliasProbeAnswers[field.id]}
                        onChange={(event) => {
                          setAliasProbeSubmitted(false);
                          setInvestigationGrade(null);
                          setAliasProbeAnswers((current) => ({
                            ...current,
                            [field.id]: event.target.value,
                          }));
                        }}
                      >
                        <option value="">执行后会怎样？</option>
                        <option value="local">只出现 local 修改</option>
                        <option value="unchanged">保持 unchanged</option>
                      </select>
                    </label>
                  ))}
                </div>
                {aliasProbeSubmitted ? (
                  <p className={aliasProbeCorrect ? "is-correct" : "is-correction"}>
                    {aliasProbeCorrect
                      ? "y0 的嵌套 mutation 只留在 y0；y1 与 seed y 均保持不变。"
                      : "对象传播半径仍有偏差；这份答案可以继续修改并重新结案。"}
                  </p>
                ) : null}
              </fieldset>
              <fieldset disabled={finalReportLocked}>
                <legend>四张故障卡：分别写出首错维度、首错边界与下游后果</legend>
                {verify.faultCards.map((fault) => {
                  const answer = faultAnswers[fault.id] ?? { dimension: "", boundary: "", consequence: "" };
                  const correctDimension = expected.faultClassifications[fault.id];
                  const correctReport = expected.caseReport[fault.symptom.id];
                  const matched = answer.dimension === correctDimension && answer.boundary === correctReport?.firstErrorBoundary && answer.consequence === correctReport?.downstreamConsequenceId;
                  const correction = model.dimensions.find((dimension) => dimension.id === correctDimension);
                  return (
                    <section key={fault.id}>
                      <h3>{fault.title}</h3>
                      <p>{fault.counterfactualRule}</p>
                      <p className="grouping-fault-symptom">观测到：{fault.symptom.label}</p>
                      <div>
                        <label>
                          <span>先坏的是哪一维？</span>
                          <select required value={answer.dimension} onChange={(event) => {
                            setInvestigationGrade(null);
                            setFaultAnswers((current) => ({
                              ...current,
                              [fault.id]: { ...answer, dimension: event.target.value },
                            }));
                          }}>
                            <option value="">选择维度</option>
                            {model.dimensions.map((dimension) => <option key={dimension.id} value={dimension.id}>{dimension.label}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>首次跨过哪个边界？</span>
                          <select required value={answer.boundary} onChange={(event) => {
                            setInvestigationGrade(null);
                            setFaultAnswers((current) => ({
                              ...current,
                              [fault.id]: { ...answer, boundary: event.target.value },
                            }));
                          }}>
                            <option value="">选择边界</option>
                            {fault.boundaryOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                          </select>
                        </label>
                        <label>
                          <span>下游会留下什么后果？</span>
                          <select required value={answer.consequence} onChange={(event) => {
                            setInvestigationGrade(null);
                            setFaultAnswers((current) => ({
                              ...current,
                              [fault.id]: { ...answer, consequence: event.target.value },
                            }));
                          }}>
                            <option value="">选择后果</option>
                            {fault.consequenceOptions.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                          </select>
                        </label>
                      </div>
                      <output className="grouping-case-sentence">
                        症状“{fault.symptom.label}” → 首错边界“{
                          fault.boundaryOptions.find((option) => option.id === answer.boundary)?.label ?? "待定位"
                        }” → 下游后果“{
                          fault.consequenceOptions.find((option) => option.id === answer.consequence)?.label ?? "待推导"
                        }”
                      </output>
                      {investigationGrade ? <p className={matched ? "is-correct" : "is-correction"}>{matched ? "该案维度、边界和后果一致。" : `先回到${correction?.label}：${correction?.correctPrinciple}`}</p> : null}
                    </section>
                  );
                })}
              </fieldset>
              <button className="grouping-investigation-submit" disabled={finalReportLocked} type="submit">{investigationGrade && !investigationGrade.correct ? "修正并重新结案" : "提交完整调查报告"}</button>
              {investigationGrade ? <p className={investigationGrade.correct ? "is-correct" : "is-correction"} role="status" aria-live="polite">{investigationGrade.correct ? "六项调查证据全部闭合。" : `本次得分 ${investigationGrade.score}/${investigationGrade.total}；按维度反馈回查。`}</p> : null}
            </form>
          ) : null}

          {investigationGrade ? <dl className="grouping-dimension-feedback">{model.dimensions.map((dimension) => <div key={dimension.id}><dt>{dimension.label}</dt><dd>{investigationGrade.dimensionGrades[dimension.id].correct ? "证据链闭合" : dimension.correctPrinciple}</dd></div>)}</dl> : null}
          </>}

          <div className="grouping-case-report-close">
            <picture>
              <source media="(max-width: 700px)" srcSet="/art/grouping-investigation-sunset-portrait.webp" />
              <img alt="日落时分的十字路口，提示在第一个错误边界处停下复查。" decoding="async" height={900} loading="lazy" src="/art/grouping-investigation-sunset-wide.webp" width={1600} />
            </picture>
            <p>不要以“最终数字看起来合理”结案。先记录发生关系、分配身份、隔离状态与推进计数器的最早边界。</p>
          </div>
          {passed ? <p className="mechanism-passed-note">本章调查已通过；本次提交不会撤销已通过状态。</p> : null}
          </> : <>
            <header className="grouping-case-report-locked">
              <p>PHASE 04 / SEALED CASE</p>
              <h2 id="grouping-case-report-title">结案：陌生案例尚未解封</h2>
              <span>先在“源码裁判”提交一次来源映射；参数、候选矩阵与故障卡不会提前出现。</span>
            </header>
            <p className="grouping-gated-note">完成来源预测后，这里会打开一份从未在正文展示过的冷启动案例。</p>
          </>}
        </section>

      <section className="grouping-investigation-correction" aria-labelledby="grouping-investigation-correction-title">
        <h2 id="grouping-investigation-correction-title">校正条</h2>
        <del>{chapter.misconception.belief}</del>
        <p><strong>更准确：</strong>{chapter.misconception.correction}</p>
      </section>

      <nav className="grouping-investigation-next" aria-label="章节翻页">
        <button type="button" onClick={onPrevious}>← 返回字段生命周期</button>
        <div><strong>{chapter.takeaway}</strong><p>{chapter.transition}</p></div>
        <button className="mechanism-action" type="button" onClick={onNext}>下一章：SGLang 请求 →</button>
      </nav>
    </article>
  );
}
