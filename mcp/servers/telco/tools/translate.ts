import OpenAI from "openai";

import { Tool, TranslateInput } from "./types";
import { toolError, toolResult } from "./meeting_result";

import logger from "../../../logger/logger.js";

const TRANSLATE_LLM_URL =
  process.env.TRANSLATE_LLM_URL || "http://localhost:11434/v1";
const TRANSLATE_LLM_MODEL =
  process.env.TRANSLATE_LLM_MODEL || "translategemma:4b";

const client = new OpenAI({
  apiKey: process.env.TRANSLATE_LLM_API_KEY || "local",
  baseURL: TRANSLATE_LLM_URL,
});

function cleanTranslation(text: string): string {
  return text.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
}

export const translateTool: Tool<TranslateInput> = {
  name: "TELCO:translate",
  description:
    "Translate text from a source language into a target language using a local LLM. Returns the translated text only.",
  inputSchema: {
    type: "object",
    properties: {
      content: {
        type: "string",
        description: "The text to translate.",
      },
      target_lang: {
        type: "string",
        description:
          "The language to translate into, as a name or code (e.g. 'English', 'en', 'tr').",
      },
      source_lang: {
        type: "string",
        description:
          "The language of the content, as a name or code. Omit to auto-detect.",
      },
    },
    required: ["content", "target_lang"],
  },
  handler: async ({ content, target_lang, source_lang }: TranslateInput) => {
    try {
      if (!content) {
        return toolResult({ error: "content is required" });
      }

      if (!target_lang) {
        return toolResult({ error: "target_lang is required" });
      }

      const from = source_lang?.trim() || "the detected source language";

      logger.info(
        {
          tool: "TELCO:translate",
          model: TRANSLATE_LLM_MODEL,
          source_lang: source_lang ?? null,
          target_lang,
        },
        "Translating content",
      );

      const response = await client.chat.completions.create({
        model: TRANSLATE_LLM_MODEL,
        temperature: 0,
        messages: [
          {
            role: "system",
            content: `You are a professional translator. Translate the user's text from ${from} into ${target_lang}. Preserve meaning, tone, formatting, line breaks, names, numbers and URLs. Output ONLY the translated text, with no explanations, notes, quotes or preamble.`,
          },
          { role: "user", content },
        ],
      });

      const translation = cleanTranslation(
        response.choices?.[0]?.message?.content ?? "",
      );

      if (!translation) {
        throw new Error("Local LLM returned an empty translation");
      }

      return toolResult({
        translation,
        source_lang: source_lang ?? null,
        target_lang,
      });
    } catch (error) {
      logger.error(
        {
          tool: "TELCO:translate",
          err: error instanceof Error ? error : new Error(String(error)),
        },
        "Failed to translate content",
      );

      return toolError(error);
    }
  },
};
