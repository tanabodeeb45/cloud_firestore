import { Router } from "express";
import { classroomAuthGuard } from "../middlewares/classroom-auth.middleware";
import * as teacherController from "../controllers/teacher.controller";
import { asyncHandler } from "../utils/async-wrapper";
import { validateRequest } from "../middlewares/validation.middleware";
import { 
  publishContentSchema, 
  getTopicsSchema, 
  updatePublishSchema 
} from "../validations/schema";

const router = Router();

router.get(
  "/courses",
  classroomAuthGuard,
  asyncHandler(teacherController.getTeacherCourses)
);

router.get(
  "/courses/:courseId/topics",
  classroomAuthGuard,
  getTopicsSchema,
  validateRequest,
  asyncHandler(teacherController.getCourseTopics)
);

router.post(
  "/publish",
  classroomAuthGuard,
  publishContentSchema,
  validateRequest,
  asyncHandler(teacherController.publishContent)
);

router.get(
  "/publish-history",
  classroomAuthGuard,
  asyncHandler(teacherController.getPublishHistory)
);

router.patch(
  "/publish/:recordId",
  classroomAuthGuard,
  updatePublishSchema,
  validateRequest,
  asyncHandler(teacherController.updatePublish)
);

router.delete(
  "/publish/:recordId",
  classroomAuthGuard,
  asyncHandler(teacherController.deletePublish)
);

export default router;
