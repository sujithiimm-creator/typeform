import type { Question, QuestionType } from "@/lib/types";
import type { QuestionModule } from "./types";

import { yesNoModule } from "./modules/yes_no";
import { singleChoiceModule } from "./modules/single_choice";
import { multipleChoiceModule } from "./modules/multiple_choice";
import { ratingModule } from "./modules/rating";
import { scaleModule } from "./modules/scale";
import { shortTextModule } from "./modules/short_text";
import { longTextModule } from "./modules/long_text";
import { numberModule } from "./modules/number";
import { emailModule } from "./modules/email";
import { dateModule } from "./modules/date";
import { rankingModule } from "./modules/ranking";
import { informationModule } from "./modules/information";

/**
 * Central question type registry. To add a new question type: create one
 * module under lib/questions/modules/<type>.tsx exporting a QuestionModule,
 * then add one line here. Nothing else in the app needs to change.
 */
// Each module is internally type-safe for its own question type (see
// lib/questions/modules/*). The registry itself is necessarily
// heterogeneous — TS has no sound way to express "a map of covariant
// component modules keyed by discriminant" — so we widen at this single
// boundary and rely on getQuestionModule's generic to recover the specific
// type at every call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const questionRegistry: Record<QuestionType, QuestionModule<any>> = {
  yes_no: yesNoModule,
  single_choice: singleChoiceModule,
  multiple_choice: multipleChoiceModule,
  rating: ratingModule,
  scale: scaleModule,
  short_text: shortTextModule,
  long_text: longTextModule,
  number: numberModule,
  email: emailModule,
  date: dateModule,
  ranking: rankingModule,
  information: informationModule,
};

export function getQuestionModule<T extends Question = Question>(type: T["type"]): QuestionModule<T> {
  return questionRegistry[type] as QuestionModule<T>;
}

export const questionTypeList = Object.values(questionRegistry);
