import { Request, Response } from "express";
import * as admin from "firebase-admin";
import {
  InternalStudentContentParamsDTO,
  InternalStudentContentQueryDTO,
} from "../types/dtos";

export const getStudentContent = async (req: Request, res: Response) => {
  const { userId } = req.params as unknown as InternalStudentContentParamsDTO;
  const { courseId } = req.query as unknown as InternalStudentContentQueryDTO;

  const db = admin.firestore();
  let query: admin.firestore.Query = db
    .collection("users")
    .doc(userId)
    .collection("student_cache");

  if (courseId) {
    query = query.where("classroom_course_id", "==", courseId);
  }

  const snapshot = await query.get();
  const items = snapshot.docs.map((doc) => doc.data());

  res.status(200).json({
    blhsUserId: userId,
    totalCount: items.length,
    items: items,
  });
};
