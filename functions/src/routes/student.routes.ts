import { Router } from "express";
import { classroomAuthGuard } from "../middlewares/classroom-auth.middleware";
import * as studentController from "../controllers/student.controller";
import { asyncHandler } from "../utils/async-wrapper";
import { validateRequest } from "../middlewares/validation.middleware";
import { syncCourseSchema } from "../validations/schema";

const router = Router();

router.get(
  "/courses",
  classroomAuthGuard,
  asyncHandler(studentController.getCourses)
);

router.get(
  "/courses/:courseId/materials",
  classroomAuthGuard,
  asyncHandler(studentController.getCourseMaterials)
);

router.get(
  "/courses/:courseId/coursework",
  classroomAuthGuard,
  asyncHandler(studentController.getCourseWork)
);

router.post(
  "/sync",
  classroomAuthGuard,
  syncCourseSchema,
  validateRequest,
  asyncHandler(studentController.syncCourse)
);

router.get(
  "/content",
  classroomAuthGuard,
  asyncHandler(studentController.getCachedContent)
);

export default router;
