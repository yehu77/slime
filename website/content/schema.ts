import { z } from "zod";

const ContentIdSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:[._-][a-z0-9]+)*$/, "Use a stable, lowercase content ID");

export const LocaleMessagesSchema = z.record(z.string().min(1), z.string().min(1));

export const LessonMetadataSchema = z
  .object({
    schema_version: z.literal(1),
    id: ContentIdSchema,
    kind: z.literal("lesson"),
    locale: z.string().min(2),
    route: z.string().startsWith("/"),
    title: z.string().min(1),
    summary: z.string().min(1),
    audiences: z
      .array(z.enum(["researcher", "engineer"]))
      .min(1),
    level: ContentIdSchema,
    duration: z
      .object({
        min_minutes: z.number().int().positive(),
        max_minutes: z.number().int().positive(),
        includes_assessment: z.boolean(),
      })
      .refine((duration) => duration.max_minutes >= duration.min_minutes, {
        message: "max_minutes must be greater than or equal to min_minutes",
      }),
    workflow_status: z.enum([
      "researched",
      "drafted",
      "content-reviewed",
      "technically-reviewed",
      "ready",
      "verified",
      "published",
    ]),
    freshness_status: z.enum(["current", "needs-review", "stale"]),
    visibility: z.enum(["private-preview", "public"]),
    lesson_revision: z.number().int().positive(),
    prerequisites: z.array(ContentIdSchema),
    learning_objectives: z.array(ContentIdSchema).min(1),
    completion: z.object({
      assessment_id: ContentIdSchema,
      assessment_version: z.number().int().positive(),
      min_correct: z.number().int().nonnegative(),
      required_question_ids: z.array(ContentIdSchema),
      required_acts: z.array(z.number().int().min(1).max(7)),
    }),
    baseline: z.object({
      repository: z.string().min(1),
      nearest_tag: z.string().min(1),
      describe: z.string().min(1),
      commit: z.string().regex(/^[0-9a-f]{40}$/, "Expected a full Git commit SHA"),
    }),
    fixture_ids: z.array(ContentIdSchema).min(1),
    glossary_term_ids: z.array(ContentIdSchema),
    source_ref_ids: z.array(ContentIdSchema),
    test_ref_ids: z.array(ContentIdSchema),
    owners: z.object({
      content: z.string().min(1),
      technical_review: z.string().min(1),
    }),
  })
  .strict();

export type LocaleMessages = z.infer<typeof LocaleMessagesSchema>;
export type LessonMetadata = z.infer<typeof LessonMetadataSchema>;
