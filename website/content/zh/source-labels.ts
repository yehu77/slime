export type SourceRefLabel = {
  title: string;
  symbol: string;
  evidenceTypeLabel: "生产源码" | "CPU 契约测试";
};

export const sourceActLabels: Readonly<Record<string, string>> = {
  "act-1": "第一幕 / 构造",
  "act-2": "第二幕 / 分组",
  "act-3": "第三幕 / 生成",
  "act-4": "第四幕 / 评价与收集",
  "act-5": "第五幕 / 转换与排程",
  "act-6": "第六幕 / 训练",
  "act-7": "第七幕 / 权重发布",
  "source-map": "契约测试",
};

export const sourceRefLabels: Readonly<Record<string, SourceRefLabel>> = {
  "sample.dataclass": {
    title: "Sample 定义统一协议对象",
    symbol: "Sample",
    evidenceTypeLabel: "生产源码",
  },
  "dataset.read-file": {
    title: "读取 JSONL 与 Parquet",
    symbol: "read_file",
    evidenceTypeLabel: "生产源码",
  },
  "dataset.construct-sample": {
    title: "由 Dataset 构造初始 Sample",
    symbol: "Dataset.__init__",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.datasource-get-samples": {
    title: "复制候选并分配独立身份",
    symbol: "RolloutDataSource.get_samples",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.generate": {
    title: "生成并写回 response 信息",
    symbol: "generate",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.prepare-prompt-ids": {
    title: "准备 checkpoint 对应的 prompt token IDs",
    symbol: "_prepare_prompt_ids",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.generate-state-init": {
    title: "汇总 SGLang sampling parameters",
    symbol: "GenerateState.__init__",
    evidenceTypeLabel: "生产源码",
  },
  "sample.append-response-tokens": {
    title: "保持 response 空间字段对齐",
    symbol: "Sample.append_response_tokens",
    evidenceTypeLabel: "生产源码",
  },
  "sample.append-preflight": {
    title: "在原地写入前拒绝局部长度错误",
    symbol: "Sample.append_response_tokens / preflight",
    evidenceTypeLabel: "生产源码",
  },
  "sample.append-core-coordinates": {
    title: "按固定顺序写入文本与两套 token 坐标",
    symbol: "Sample.append_response_tokens / core",
    evidenceTypeLabel: "生产源码",
  },
  "sample.append-finalize": {
    title: "写入后应用终止信息并执行末尾校验",
    symbol: "Sample.append_response_tokens / finalize",
    evidenceTypeLabel: "生产源码",
  },
  "sample.top-p-extract-contract": {
    title: "验证 top-p replay 的 ragged offsets",
    symbol: "_extract_rollout_top_p_token_data",
    evidenceTypeLabel: "生产源码",
  },
  "sample.apply-meta-info": {
    title: "记录权重版本与终止状态",
    symbol: "Sample._apply_meta_info",
    evidenceTypeLabel: "生产源码",
  },
  "sample.apply-terminal-info": {
    title: "用 terminal gate 记录状态与权重版本",
    symbol: "Sample._apply_meta_info / terminal gate",
    evidenceTypeLabel: "生产源码",
  },
  "sample.validate-response-metadata-lengths": {
    title: "拒绝错位的 response 元数据",
    symbol: "Sample._validate_response_metadata_lengths",
    evidenceTypeLabel: "生产源码",
  },
  "sample.validate-response-metadata-full": {
    title: "在写回末尾校验 response-space 元数据",
    symbol: "Sample._validate_response_metadata_lengths",
    evidenceTypeLabel: "生产源码",
  },
  "sample.validate-top-p-tail": {
    title: "锁定 top-p replay 的末端边界",
    symbol: "Sample._validate_response_metadata_lengths / top-p tail",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.generate-and-rm": {
    title: "串接生成、hook 与 reward",
    symbol: "generate_and_rm",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.generate-async": {
    title: "按完整 group 收集与过滤",
    symbol: "generate_rollout_async",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.manager-generate": {
    title: "串接生成、转换与 DP 分发",
    symbol: "RolloutManager.generate",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.get-data": {
    title: "校验并展开 rollout 数据",
    symbol: "RolloutManager._get_rollout_data",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.post-process-rewards": {
    title: "按 group 后处理 reward",
    symbol: "RolloutManager._post_process_rewards",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.convert-train-data": {
    title: "将 Sample 映射为 train data",
    symbol: "RolloutManager._convert_samples_to_train_data",
    evidenceTypeLabel: "生产源码",
  },
  "rollout.split-train-data": {
    title: "按 DP schedule 分配 train data",
    symbol: "RolloutManager._split_train_data_by_dp",
    evidenceTypeLabel: "生产源码",
  },
  "schedule.build-dp-schedule": {
    title: "构造 training step 与 DP 放置",
    symbol: "build_dp_schedule",
    evidenceTypeLabel: "生产源码",
  },
  "actor.consume-rollout-data": {
    title: "接收 per-DP rollout data",
    symbol: "MegatronTrainRayActor._get_rollout_data",
    evidenceTypeLabel: "生产源码",
  },
  "actor.train": {
    title: "消费 rollout data 并训练 actor",
    symbol: "MegatronTrainRayActor.train_actor",
    evidenceTypeLabel: "生产源码",
  },
  "loop.sync": {
    title: "同步主循环的三段边界",
    symbol: "train",
    evidenceTypeLabel: "生产源码",
  },
  "loop.async": {
    title: "异步主循环的重叠边界",
    symbol: "train",
    evidenceTypeLabel: "生产源码",
  },
  "actor.update-weights": {
    title: "向 rollout engines 发布新权重",
    symbol: "MegatronTrainRayActor.update_weights",
    evidenceTypeLabel: "生产源码",
  },
  "test.sample-contract": {
    title: "验证 Sample round trip",
    symbol: "test_round_trip_preserves_every_field",
    evidenceTypeLabel: "CPU 契约测试",
  },
  "test.sample-status": {
    title: "验证 finish reason 到 status 的映射",
    symbol: "test_status_mapping_for_each_finish_reason",
    evidenceTypeLabel: "CPU 契约测试",
  },
  "test.sample-weight-version": {
    title: "验证 weight_version 写回",
    symbol: "test_weight_version_is_appended_when_present",
    evidenceTypeLabel: "CPU 契约测试",
  },
  "test.dp-schedule-contract": {
    title: "验证 logical rollout 不跨 training step",
    symbol: "test_rollout_grouping_keeps_samples_together",
    evidenceTypeLabel: "CPU 契约测试",
  },
};

export const sourceEvidenceBoundaries: Readonly<Record<string, string>> = {
  "production-source": "固定 commit 上的实现证据；不构成性能结论，也不代表所有可选配置路径。",
  "contract-test": "固定 commit 上的 CPU 契约测试；只验证条目所述行为，不替代生产环境验证。",
};
