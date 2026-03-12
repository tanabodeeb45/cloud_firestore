import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/classroom-auth.middleware";
import { listStudentCourses, listCourseWorkMaterials, listCourseWork } from "../services/classroom-api.service";
import * as admin from "firebase-admin";
import { ClassroomItemType } from "../types/enums";
import { SyncCourseDTO } from "../types/dtos";
import { AppError } from "../utils/errors";

export const getCourses = async (req: AuthenticatedRequest, res: Response) => {
  const courses = await listStudentCourses(req.accessToken!);
  res.status(200).json({ courses });
};

export const syncCourse = async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.body as SyncCourseDTO;
  
  if (!courseId) {
    throw new AppError("Missing courseId", 400);
  }

  const blhsUserId = req.blhsUserId!;
  const materials = await listCourseWorkMaterials(req.accessToken!, courseId);
  const coursework = await listCourseWork(req.accessToken!, courseId);

  const db = admin.firestore();
  const batch = db.batch();
  const cacheRef = db
    .collection("users")
    .doc(blhsUserId)
    .collection("student_cache");

  // Sync materials
  materials.forEach((item) => {
    const docRef = cacheRef.doc(item.id!);
    batch.set(
      docRef,
      {
        classroom_course_id: courseId,
        classroom_item_id: item.id,
        item_type: ClassroomItemType.COURSE_WORK_MATERIAL,
        title: item.title,
        description: item.description || "",
        materials_json: item.materials || [],
        synced_at: new Date(),
      },
      { merge: true },
    );
  });

  // Sync coursework
  coursework.forEach((item) => {
    const docRef = cacheRef.doc(item.id!);
    batch.set(
      docRef,
      {
        classroom_course_id: courseId,
        classroom_item_id: item.id,
        item_type: ClassroomItemType.COURSE_WORK,
        title: item.title,
        description: item.description || "",
        materials_json: item.materials || [],
        due_date: item.dueDate ? new Date(Date.UTC(item.dueDate.year!, item.dueDate.month! - 1, item.dueDate.day!)) : null,
        synced_at: new Date(),
      },
      { merge: true },
    );
  });

  await batch.commit();

  res.status(200).json({
    message: "Synced successfully",
    syncedCount: materials.length + coursework.length,
  });
};

export const getCourseMaterials = async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params;
  const blhsUserId = req.blhsUserId!;
  const db = admin.firestore();
  const snapshot = await db.collection("users")
    .doc(blhsUserId)
    .collection("student_cache")
    .where("classroom_course_id", "==", courseId)
    .where("item_type", "==", ClassroomItemType.COURSE_WORK_MATERIAL)
    .get();

  const items = snapshot.docs.map(doc => doc.data());
  res.status(200).json({ items });
};

export const getCourseWork = async (req: AuthenticatedRequest, res: Response) => {
  const { courseId } = req.params;
  const blhsUserId = req.blhsUserId!;
  const db = admin.firestore();
  const snapshot = await db.collection("users")
    .doc(blhsUserId)
    .collection("student_cache")
    .where("classroom_course_id", "==", courseId)
    .where("item_type", "==", ClassroomItemType.COURSE_WORK)
    .get();

  const items = snapshot.docs.map(doc => doc.data());
  res.status(200).json({ items });
};

export const getCachedContent = async (req: AuthenticatedRequest, res: Response) => {
  const blhsUserId = req.blhsUserId!;
  const db = admin.firestore();
  const snapshot = await db.collection("users")
    .doc(blhsUserId)
    .collection("student_cache")
    .orderBy("synced_at", "desc")
    .get();

  const items = snapshot.docs.map(doc => doc.data());
  res.status(200).json({ 
    items,
    totalCount: items.length,
    lastSyncedAt: items.length > 0 ? items[0].synced_at : null
  });
};
