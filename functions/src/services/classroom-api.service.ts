import {google, classroom_v1} from "googleapis";
import { CourseState, ClassroomState } from "../types/enums";

function getClient(accessToken: string): classroom_v1.Classroom {
  const auth = new google.auth.OAuth2();
  auth.setCredentials({access_token: accessToken});
  return google.classroom({version: "v1", auth});
}

export async function createCourseWorkMaterial(
  accessToken: string,
  courseId: string,
  data: {
    title: string;
    description?: string;
    topicId?: string;
    url?: string;
  },
): Promise<classroom_v1.Schema$CourseWorkMaterial> {
  const classroom = getClient(accessToken);

  const materials: classroom_v1.Schema$Material[] = [];
  if (data.url) {
    materials.push({
      link: {url: data.url, title: "ดูเอกสารประกอบบน BLHS"},
    });
  }

  const response = await classroom.courses.courseWorkMaterials.create({
    courseId: courseId,
    requestBody: {
      title: data.title,
      description: data.description,
      topicId: data.topicId,
      state: ClassroomState.PUBLISHED,
      materials: materials.length > 0 ? materials : undefined,
    },
  });

  return response.data;
}

export async function listStudentCourses(
  accessToken: string,
): Promise<classroom_v1.Schema$Course[]> {
  const classroom = getClient(accessToken);
  const response = await classroom.courses.list({
    courseStates: [CourseState.ACTIVE],
    studentId: "me",
  });
  return response.data.courses || [];
}

export async function listCourseWorkMaterials(
  accessToken: string,
  courseId: string,
): Promise<classroom_v1.Schema$CourseWorkMaterial[]> {
  const classroom = getClient(accessToken);
  const response = await classroom.courses.courseWorkMaterials.list({
    courseId: courseId,
  });
  return response.data.courseWorkMaterial || [];
}

export async function listCourseWork(
  accessToken: string,
  courseId: string,
): Promise<classroom_v1.Schema$CourseWork[]> {
  const classroom = getClient(accessToken);
  const response = await classroom.courses.courseWork.list({
    courseId: courseId,
  });
  return response.data.courseWork || [];
}

export async function listTopics(
  accessToken: string,
  courseId: string,
): Promise<classroom_v1.Schema$Topic[]> {
  const classroom = getClient(accessToken);
  const response = await classroom.courses.topics.list({
    courseId: courseId,
  });
  return response.data.topic || [];
}

export async function deleteCourseWorkMaterial(
  accessToken: string,
  courseId: string,
  id: string,
): Promise<void> {
  const classroom = getClient(accessToken);
  await classroom.courses.courseWorkMaterials.delete({
    courseId: courseId,
    id: id,
  });
}

export async function patchCourseWorkMaterial(
  accessToken: string,
  courseId: string,
  id: string,
  update: classroom_v1.Schema$CourseWorkMaterial,
): Promise<classroom_v1.Schema$CourseWorkMaterial> {
  const classroom = getClient(accessToken);
  const response = await classroom.courses.courseWorkMaterials.patch({
    courseId: courseId,
    id: id,
    updateMask: "title,description,topicId",
    requestBody: update,
  });
  return response.data;
}

export async function getCourse(
  accessToken: string,
  courseId: string,
): Promise<classroom_v1.Schema$Course> {
  const classroom = getClient(accessToken);
  const response = await classroom.courses.get({
    id: courseId,
  });
  return response.data;
}
