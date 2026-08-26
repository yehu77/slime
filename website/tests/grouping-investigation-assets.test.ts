import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createElement, createRef } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ChapterThreeGroupingInvestigation } from "@/components/mechanism/ChapterThreeGroupingInvestigation";
import { hasChapterThreeGroupingData } from "@/components/mechanism/chapter-reader-contracts";
import { sampleToGenerationChapters } from "@/content/zh/lessons/sample-to-generation";

const artDirectory = fileURLToPath(new URL("../public/art/", import.meta.url));
const readerPath = fileURLToPath(
  new URL(
    "../components/mechanism/ChapterThreeGroupingInvestigation.tsx",
    import.meta.url,
  ),
);

const scenes = ["rain", "mirror", "mask", "desks", "sunset"] as const;
const variants = [
  { name: "wide", width: 1600, height: 900 },
  { name: "portrait", width: 800, height: 1000 },
] as const;

function webpDimensions(bytes: Buffer) {
  expect(bytes.subarray(0, 4).toString("ascii")).toBe("RIFF");
  expect(bytes.subarray(8, 12).toString("ascii")).toBe("WEBP");
  const chunk = bytes.subarray(12, 16).toString("ascii");
  if (chunk === "VP8 ") {
    const data = 20;
    expect(bytes.subarray(data + 3, data + 6).toString("hex")).toBe("9d012a");
    return {
      width: bytes.readUInt16LE(data + 6) & 0x3fff,
      height: bytes.readUInt16LE(data + 8) & 0x3fff,
    };
  }
  if (chunk === "VP8L") {
    const bits = bytes.readUInt32LE(21);
    return {
      width: (bits & 0x3fff) + 1,
      height: ((bits >>> 14) & 0x3fff) + 1,
    };
  }
  if (chunk === "VP8X") {
    return {
      width: bytes.readUIntLE(24, 3) + 1,
      height: bytes.readUIntLE(27, 3) + 1,
    };
  }
  throw new Error(`Unsupported WebP chunk ${chunk}`);
}

describe("grouping investigation art provenance", () => {
  it("keeps every derivative at the declared dimensions with a public-safe sidecar", () => {
    for (const scene of scenes) {
      for (const variant of variants) {
        const basename = `grouping-investigation-${scene}-${variant.name}.webp`;
        const bytes = readFileSync(`${artDirectory}/${basename}`);
        const sidecar = JSON.parse(
          readFileSync(`${artDirectory}/${basename}.json`, "utf8"),
        ) as Record<string, unknown> & {
          output: { width: number; height: number; format: string };
          sourceLibraryPath: string;
          rightsConfirmation: string;
          processing: string;
        };

        expect(webpDimensions(bytes)).toEqual({
          width: variant.width,
          height: variant.height,
        });
        expect(sidecar.output).toEqual({
          width: variant.width,
          height: variant.height,
          format: "webp",
        });
        expect(sidecar.sourceLibraryPath).toMatch(/^anime7000\/.+\.jpg$/i);
        expect(sidecar.rightsConfirmation).toContain("public website");
        expect(sidecar.processing).toContain("metadata stripped");
        expect(JSON.stringify(sidecar)).not.toMatch(
          /\/Users\/|huangyue4|file:\/\/|sourceAbsolutePath/,
        );
      }
    }
  });

  it("loads only the rain opening eagerly and defers every later scene", () => {
    const source = readFileSync(readerPath, "utf8");
    expect(source).toMatch(
      /loading="eager"[\s\S]{0,180}src="\/art\/grouping-investigation-rain-wide\.webp"/,
    );
    expect(source).toMatch(/fetchPriority="high"/);
    for (const scene of scenes.slice(1)) {
      expect(source).toMatch(
        new RegExp(
          `loading="lazy"[^>]*src="/art/grouping-investigation-${scene}-wide\\.webp"`,
        ),
      );
    }
    expect((source.match(/loading="eager"/g) ?? [])).toHaveLength(1);
    expect((source.match(/loading="lazy"/g) ?? [])).toHaveLength(4);
  });
});

describe("grouping investigation initial disclosure", () => {
  it("does not render the cold-case answer matrix or source excerpt before prediction", () => {
    const chapter = sampleToGenerationChapters[2];
    expect(hasChapterThreeGroupingData(chapter)).toBe(true);
    if (!hasChapterThreeGroupingData(chapter)) {
      throw new Error("Chapter three investigation data is required for this test");
    }
    const html = renderToStaticMarkup(
      createElement(ChapterThreeGroupingInvestigation, {
        chapter,
        headingRef: createRef<HTMLHeadingElement>(),
        triggerRef: createRef<HTMLButtonElement>(),
        passed: false,
        onOpenDrawer: () => undefined,
        onPrevious: () => undefined,
        onNext: () => undefined,
        onRecordInitialJudgement: () => undefined,
        onSubmitInvestigation: () => undefined,
      }),
    );

    expect(html).toContain("教学假想故障");
    expect(html).toContain("提交初判");
    expect(html).not.toContain("提交后的冷案候选重建");
    expect(html).not.toContain("实际 trace 回放");
    expect(html).not.toContain("copy.deepcopy(sample)");
    expect(html).not.toContain("group <b>4</b>");
    expect(html).not.toContain("index <b>30</b>");
  });
});
