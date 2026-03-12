import { query, body, param } from "express-validator";
import { UserRole, ClassroomItemType } from "../types/enums";

export const authGoogleSchema = [
  query("role").isIn(Object.values(UserRole)).withMessage("Invalid role"),
  query("blhs_user_id").notEmpty().withMessage("blhs_user_id is required"),
];

export const authCallbackSchema = [
  query("code").notEmpty().withMessage("code is required"),
  query("state").notEmpty().withMessage("state is required"),
];

export const syncCourseSchema = [
  body("courseId").notEmpty().withMessage("courseId is required"),
];

export const publishContentSchema = [
  body("blhsDocumentId").notEmpty().withMessage("blhsDocumentId is required"),
  body("courseId").notEmpty().withMessage("courseId is required"),
  body("itemType").isIn(Object.values(ClassroomItemType)).withMessage("Invalid itemType"),
  body("title").notEmpty().withMessage("title is required"),
];

export const updatePublishSchema = [
  param("recordId").notEmpty().withMessage("recordId is required"),
  body("title").optional().notEmpty().withMessage("title cannot be empty"),
];

export const getTopicsSchema = [
  param("courseId").notEmpty().withMessage("courseId is required"),
];

export const internalStudentContentSchema = [
  param("userId").notEmpty().withMessage("userId is required"),
  query("courseId").optional().notEmpty().withMessage("courseId cannot be empty"),
];
