import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, ClipboardList, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Student, Subject, Grade } from "@shared/schema";

export default function Dashboard() {
  const { data: students = [], isLoading: studentsLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: subjects = [], isLoading: subjectsLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: grades = [], isLoading: gradesLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });

  const isLoading = studentsLoading || subjectsLoading || gradesLoading;

  const averageScore = grades.length > 0
    ? Math.round(grades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / grades.length)
    : 0;

  const stats = [
    {
      title: "Total Students",
      value: students.length,
      description: "Enrolled students",
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Subjects",
      value: subjects.length,
      description: "Active subjects",
      icon: BookOpen,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-100 dark:bg-emerald-900/30",
    },
    {
      title: "Total Grades",
      value: grades.length,
      description: "Recorded grades",
      icon: ClipboardList,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/30",
    },
    {
      title: "Average Score",
      value: `${averageScore}%`,
      description: "Overall performance",
      icon: TrendingUp,
      color: "text-purple-600 dark:text-purple-400",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
  ];

  const recentGrades = grades.slice(-5).reverse();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold" data-testid="text-dashboard-title">Dashboard</h1>
        <p className="text-muted-foreground">Overview of your school grades management system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`p-2 rounded-md ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-2xl font-bold" data-testid={`text-stat-${stat.title.toLowerCase().replace(/\s+/g, '-')}`}>
                  {stat.value}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
            <CardDescription>Latest recorded grades</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : recentGrades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-recent-grades">
                <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No grades recorded yet</p>
                <p className="text-sm">Start by adding students, subjects, and grades</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentGrades.map((grade) => {
                  const student = students.find((s) => s.id === grade.studentId);
                  const subject = subjects.find((s) => s.id === grade.subjectId);
                  const percentage = Math.round((grade.score / grade.maxScore) * 100);
                  return (
                    <div
                      key={grade.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`card-recent-grade-${grade.id}`}
                    >
                      <div>
                        <p className="font-medium">{student?.fullName || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{subject?.name || "Unknown"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{grade.score}/{grade.maxScore}</p>
                        <p className={`text-sm ${percentage >= 70 ? "text-emerald-600 dark:text-emerald-400" : percentage >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                          {percentage}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>Performance overview by subject</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : subjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground" data-testid="text-no-subjects">
                <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No subjects added yet</p>
                <p className="text-sm">Add subjects to see performance stats</p>
              </div>
            ) : (
              <div className="space-y-3">
                {subjects.map((subject) => {
                  const subjectGrades = grades.filter((g) => g.subjectId === subject.id);
                  const avg = subjectGrades.length > 0
                    ? Math.round(subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length)
                    : 0;
                  return (
                    <div
                      key={subject.id}
                      className="flex items-center justify-between p-3 rounded-md bg-muted/50"
                      data-testid={`card-subject-stat-${subject.id}`}
                    >
                      <div>
                        <p className="font-medium">{subject.name}</p>
                        <p className="text-sm text-muted-foreground">{subjectGrades.length} grades</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${avg >= 70 ? "bg-emerald-500" : avg >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${avg}%` }}
                          />
                        </div>
                        <span className="font-bold text-sm w-12 text-right">{avg}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
