"use client";

import { useMemo, useState } from "react";

import { calculateBatch } from "../../core/journey";

type BatchCalculatorProps = {
  defaults: {
    promptGroups: number;
    samplesPerPrompt: number;
    globalBatchSize: number;
    numStepsPerRollout: number;
    physicalSamples: number;
    dpSize: number;
  };
};

type SolverMode = "global_batch_size" | "num_steps";

export function BatchCalculator({ defaults }: BatchCalculatorProps) {
  const [promptGroups, setPromptGroups] = useState(defaults.promptGroups);
  const [samplesPerPrompt, setSamplesPerPrompt] = useState(defaults.samplesPerPrompt);
  const [globalBatchSize, setGlobalBatchSize] = useState(defaults.globalBatchSize);
  const [numSteps, setNumSteps] = useState(defaults.numStepsPerRollout);
  const [dpSize, setDpSize] = useState(defaults.dpSize);
  const [mode, setMode] = useState<SolverMode>("global_batch_size");
  const [fanOut, setFanOut] = useState(false);
  const [segmentsPerRollout, setSegmentsPerRollout] = useState(2);

  const logicalRollouts = Math.max(0, promptGroups) * Math.max(0, samplesPerPrompt);
  const physicalSamples = fanOut
    ? logicalRollouts * Math.max(0, segmentsPerRollout)
    : logicalRollouts;

  const result = useMemo(
    () =>
      calculateBatch({
        prompt_groups: promptGroups,
        samples_per_prompt: samplesPerPrompt,
        global_batch_size: globalBatchSize,
        num_steps_per_rollout: numSteps,
        mode,
        physical_samples: physicalSamples,
        dp_size: dpSize,
      }),
    [
      dpSize,
      globalBatchSize,
      mode,
      numSteps,
      physicalSamples,
      promptGroups,
      samplesPerPrompt,
    ],
  );

  const reset = () => {
    setPromptGroups(defaults.promptGroups);
    setSamplesPerPrompt(defaults.samplesPerPrompt);
    setGlobalBatchSize(defaults.globalBatchSize);
    setNumSteps(defaults.numStepsPerRollout);
    setDpSize(defaults.dpSize);
    setMode("global_batch_size");
    setFanOut(false);
    setSegmentsPerRollout(2);
  };

  return (
    <section className="journey-lab-card journey-batch-lab" aria-labelledby="batch-lab-title">
      <div className="journey-lab-heading">
        <div>
          <h3 id="batch-lab-title">Batch 守恒计算器</h3>
          <span className="journey-production-mark">第五幕实验</span>
          <p>数 logical rollout 与完整 training step；它不是显存或吞吐估算器。</p>
        </div>
        <button className="journey-text-button" type="button" onClick={reset}>
          恢复本课配置
        </button>
      </div>

      <div className="journey-batch-equation" aria-label="Batch 计算公式">
        <span><i>P</i> prompt groups</span>
        <b>×</b>
        <span><i>N</i> 每组执行数</span>
        <b>=</b>
        <strong><i>R</i> logical rollouts</strong>
      </div>

      <div className="journey-form-grid">
        <label>
          <span>有效 prompt groups（P）</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={promptGroups}
            onChange={(event) => setPromptGroups(event.currentTarget.valueAsNumber || 0)}
          />
        </label>
        <label>
          <span>每组生成执行数（N）</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={samplesPerPrompt}
            onChange={(event) => setSamplesPerPrompt(event.currentTarget.valueAsNumber || 0)}
          />
        </label>
        <label>
          <span>DP size</span>
          <input
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            value={dpSize}
            onChange={(event) => setDpSize(event.currentTarget.valueAsNumber || 0)}
          />
        </label>
      </div>

      <div className="journey-solver">
        <div className="journey-segmented" aria-label="求解模式">
          <button
            type="button"
            aria-pressed={mode === "global_batch_size"}
            onClick={() => setMode("global_batch_size")}
          >
            已知 global batch
          </button>
          <button
            type="button"
            aria-pressed={mode === "num_steps"}
            onClick={() => setMode("num_steps")}
          >
            已知 step 数
          </button>
        </div>
        {mode === "global_batch_size" ? (
          <label>
            <span>每 step 的 logical rollouts（G）</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={globalBatchSize}
              onChange={(event) => setGlobalBatchSize(event.currentTarget.valueAsNumber || 0)}
            />
          </label>
        ) : (
          <label>
            <span>目标 training steps（K）</span>
            <input
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              value={numSteps}
              onChange={(event) => setNumSteps(event.currentTarget.valueAsNumber || 0)}
            />
          </label>
        )}
      </div>

      <details className="journey-fanout">
        <summary>进阶预览：一个 logical rollout 形成多个训练片段</summary>
        <div>
          <label className="journey-switch-label">
            <input
              type="checkbox"
              checked={fanOut}
              onChange={(event) => setFanOut(event.currentTarget.checked)}
            />
            <span>启用 fan-out 身份预览</span>
          </label>
          {fanOut ? (
            <label>
              <span>每个 rollout 的 sibling 片段数</span>
              <input
                type="number"
                inputMode="numeric"
                min="1"
                step="1"
                value={segmentsPerRollout}
                onChange={(event) => setSegmentsPerRollout(event.currentTarget.valueAsNumber || 0)}
              />
            </label>
          ) : null}
          <p>物理片段共享 rollout ID；scheduler 仍按 distinct logical rollout 计数。</p>
        </div>
      </details>

      {result.errors.length ? (
        <div className="journey-calculation-messages is-error" role="alert">
          <strong>当前配置无法排程</strong>
          {result.errors.map((error) => <p key={error.code}>{error.message}</p>)}
        </div>
      ) : (
        <>
          <div className="journey-result-grid" aria-live="polite">
            <div><span>Prompt groups</span><strong>{result.prompt_groups}</strong></div>
            <div><span>Logical rollouts</span><strong>{result.logical_rollouts}</strong></div>
            <div><span>Physical samples</span><strong>{result.physical_samples}</strong></div>
            <div><span>Global batch</span><strong>{result.global_batch_size}</strong></div>
            <div><span>完整 training steps</span><strong>{result.train_steps}</strong></div>
            <div className={result.trimmed_rollouts ? "is-trimmed" : ""}>
              <span>Trimmed tail</span><strong>{result.trimmed_rollouts}</strong>
            </div>
          </div>
          {result.warnings.length ? (
            <div className="journey-calculation-messages is-warning" role="status">
              <strong>需要注意</strong>
              {result.warnings.map((warning) => <p key={warning.code}>{warning.message}</p>)}
            </div>
          ) : (
            <p className="journey-calculation-ok">✓ 所有 logical rollout 都进入完整 training step。</p>
          )}
        </>
      )}
    </section>
  );
}
