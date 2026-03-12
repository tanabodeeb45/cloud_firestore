import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/classroom-auth.middleware";
import { google } from "googleapis";
import * as admin from "firebase-admin";
import { 
  createCourseWorkMaterial, 
  listTopics, 
  deleteCourseWorkMaterial, 
  patchCourseWorkMaterial 
} from "../services/classroom-api.service";
import { PublishStatus, ClassroomItemType, ClassroomState, CourseState } from "../types/enums";
import { PublishContentDTO } from "../types/dtos";
import { AppError } from "../utils/errors";

export const getTeacherCourses = async (req: AuthenticatedRequest, res: Response) => {
  const accessToken = req.accessToken!;
  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: accessToken });

  const classroom = google.classroom({ version: "v1", auth });
  const response = await classroom.courses.list({
    courseStates: [CourseState.ACTIVE],
  });

  const courses = response.data.courses || [];
  res.status(200).json({
    message: "Successfully fetched courses",
    count: courses.length,
    courses: courses.map((c) => ({
      id: c.id,
      name: c.name,
      section: c.section,
      link: c.alternateLink,
    })),
  });
};

export const getCourseTopics = async (req: AuthenticatedRequest, res: Response) => {
  const courseId = req.params.courseId as string;
  const topics = await listTopics(req.accessToken!, courseId);
  res.status(200).json({ topics });
};

export const publishContent = async (req: AuthenticatedRequest, res: Response) => {
  const blhsUserId = req.blhsUserId!;
  const accessToken = req.accessToken!;
  const {
    blhsDocumentId,
    courseId,
    topicId,
    itemType,
    title,
    description,
    url,
  } = req.body as PublishContentDTO;

  const db = admin.firestore();
  const docRef = db.collection("publish_records").doc();

  await docRef.set({
    blhs_document_id: blhsDocumentId,
    blhs_user_id: blhsUserId,
    classroom_course_id: courseId,
    classroom_item_type: itemType,
    title: title,
    status: PublishStatus.PENDING,
    created_at: new Date(),
    updated_at: new Date(),
  });

  if (itemType !== ClassroomItemType.COURSE_WORK_MATERIAL) {
    throw new AppError(`Unsupported itemType: ${itemType}`, 400);
  }

  const result = await createCourseWorkMaterial(accessToken, courseId, {
    title,
    description,
    topicId,
    url,
  });

  const classroomItemId = result.id || "";
  await docRef.update({
    status: PublishStatus.PUBLISHED,
    classroom_item_id: classroomItemId,
    classroom_state: ClassroomState.PUBLISHED,
    published_at: new Date(),
    updated_at: new Date(),
  });

  res.status(200).json({
    message: "Successfully published",
    recordId: docRef.id,
    classroomItemId,
  });
};

export const getPublishHistory = async (req: AuthenticatedRequest, res: Response) => {
  const blhsUserId = req.blhsUserId!;
  const db = admin.firestore();
  const snapshot = await db.collection("publish_records")
    .where("blhs_user_id", "==", blhsUserId)
    .orderBy("created_at", "desc")
    .get();

  const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  res.status(200).json({ records });
};

export const updatePublish = async (req: AuthenticatedRequest, res: Response) => {
  const recordId = req.params.recordId as string;
  const { title, description, topicId } = req.body;
  const db = admin.firestore();
  const docRef = db.collection("publish_records").doc(recordId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError("Publish record not found", 404);
  }

  const data = doc.data() as any;
  if (data.status !== PublishStatus.PUBLISHED || !data.classroom_item_id) {
    throw new AppError("Item not published yet or failed", 400);
  }

  const updatedItem = await patchCourseWorkMaterial(req.accessToken!, data.classroom_course_id, data.classroom_item_id, {
    title,
    description,
    topicId,
  });

  await docRef.update({
    title: title || data.title,
    updated_at: new Date(),
  });

  res.status(200).json({ message: "Updated successfully", item: updatedItem });
};

export const deletePublish = async (req: AuthenticatedRequest, res: Response) => {
  const recordId = req.params.recordId as string;
  const db = admin.firestore();
  const docRef = db.collection("publish_records").doc(recordId);
  const doc = await docRef.get();

  if (!doc.exists) {
    throw new AppError("Publish record not found", 404);
  }

  const data = doc.data() as any;
  if (data.classroom_item_id) {
    try {
      await deleteCourseWorkMaterial(req.accessToken!, data.classroom_course_id, data.classroom_item_id);
    } catch (error) {
      console.warn("Failed to delete from Classroom (might already be deleted):", error);
    }
  }

  await docRef.update({
    status: "DELETED",
    updated_at: new Date(),
  });

  res.status(200).json({ message: "Deleted successfully" });
};
