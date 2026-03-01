import { useAuth } from "./useAuth";

export function usePermissions() {
  const { role } = useAuth();

  return {
    isAdmin: () => role === "admin",
    isTeacher: () => role === "teacher",
    isStudent: () => role === "student",
    canEditGrades: () => role === "admin" || role === "teacher",
    canDeleteGrades: () => role === "admin",
    canManageStudents: () => role === "admin",
    canManageTeachers: () => role === "admin",
    canManageSubjects: () => role === "admin",
    canViewAllGrades: () => role === "admin" || role === "teacher",
    canManageEnrollments: () => role === "admin",
    canManageAcademicStructure: () => role === "admin",
  };
}
