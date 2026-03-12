import { UserRole, ClassroomItemType } from "./enums";

export interface AuthQueryDTO {
  role: UserRole;
  blhs_user_id: string;
}

export interface AuthCallbackQueryDTO {
  code: string;
  state: string;
}

export interface SyncCourseDTO {
  courseId: string;
}

export interface PublishContentDTO {
  blhsDocumentId: string;
  courseId: string;
  topicId?: string;
  itemType: ClassroomItemType;
  title: string;
  description?: string;
  url?: string;
}

export interface InternalStudentContentParamsDTO {
  userId: string;
}

export interface InternalStudentContentQueryDTO {
  courseId?: string;
}
