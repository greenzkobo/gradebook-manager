import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, ClipboardList, Search, BookOpen } from "lucide-react";
import { insertGradeSchema, type Grade, type InsertGrade, type Student, type Subject } from "@shared/schema";

const gradeFormSchema = insertGradeSchema.extend({
  studentId: z.string().min(1, "Please select a student"),
  subjectId: z.string().min(1, "Please select a subject"),
  score: z.coerce.number().min(0, "Score must be at least 0").max(1000, "Score too high"),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1").max(1000, "Max score too high"),
  term: z.string().optional().nullable(),
  date: z.string().optional().nullable(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

const terms = ["Term 1", "Term 2", "Term 3", "Term 4", "Midterm", "Final", "Quiz", "Assignment"];

export default function Grades() {
  const [open, setOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Grade | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStudent, setFilterStudent] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const { toast } = useToast();

  const { data: grades = [], isLoading } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: { studentId: "", subjectId: "", score: 0, maxScore: 100, term: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertGrade) => apiRequest("POST", "/api/grades", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Grade recorded successfully" });
      setOpen(false);
      form.reset({ studentId: "", subjectId: "", score: 0, maxScore: 100, term: "" });
    },
    onError: () => {
      toast({ title: "Failed to record grade", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertGrade }) =>
      apiRequest("PUT", `/api/grades/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Grade updated successfully" });
      setOpen(false);
      setEditingGrade(null);
      form.reset({ studentId: "", subjectId: "", score: 0, maxScore: 100, term: "" });
    },
    onError: () => {
      toast({ title: "Failed to update grade", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/grades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Grade deleted successfully" });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({ title: "Failed to delete grade", variant: "destructive" });
    },
  });

  const onSubmit = (data: GradeFormValues) => {
    const gradeData: InsertGrade = {
      studentId: data.studentId,
      subjectId: data.subjectId,
      score: data.score,
      maxScore: data.maxScore,
      term: data.term || null,
      date: new Date().toISOString().split("T")[0],
    };
    if (editingGrade) {
      updateMutation.mutate({ id: editingGrade.id, data: gradeData });
    } else {
      createMutation.mutate(gradeData);
    }
  };

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    form.reset({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      score: grade.score,
      maxScore: grade.maxScore,
      term: grade.term || "",
    });
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditingGrade(null);
    form.reset({ studentId: "", subjectId: "", score: 0, maxScore: 100, term: "" });
  };

  const getStudentName = (id: string) => students.find((s) => s.id === id)?.fullName || "Unknown";
  const getSubjectName = (id: string) => subjects.find((s) => s.id === id)?.name || "Unknown";

  const filteredGrades = grades.filter((g) => {
    const studentName = getStudentName(g.studentId).toLowerCase();
    const subjectName = getSubjectName(g.subjectId).toLowerCase();
    const matchesSearch = studentName.includes(searchQuery.toLowerCase()) || subjectName.includes(searchQuery.toLowerCase());
    const matchesStudent = !filterStudent || filterStudent === "all" || g.studentId === filterStudent;
    const matchesSubject = !filterSubject || filterSubject === "all" || g.subjectId === filterSubject;
    return matchesSearch && matchesStudent && matchesSubject;
  });

  const getGradeColor = (score: number, maxScore: number) => {
    const pct = (score / maxScore) * 100;
    if (pct >= 90) return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300";
    if (pct >= 70) return "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300";
    if (pct >= 50) return "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300";
    return "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300";
  };

  const canAddGrades = students.length > 0 && subjects.length > 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-grades-title">Gradebook</h1>
          <p className="text-muted-foreground">Record and manage student grades by subject</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => v ? setOpen(v) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button disabled={!canAddGrades} data-testid="button-add-grade">
              <Plus className="h-4 w-4 mr-2" />
              Add Grade
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingGrade ? "Edit Grade" : "Record New Grade"}</DialogTitle>
              <DialogDescription>
                {editingGrade ? "Update grade information" : "Enter the grade details below"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-grade-student">
                            <SelectValue placeholder="Select student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id} data-testid={`option-student-${student.id}`}>
                              {student.fullName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="subjectId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-grade-subject">
                            <SelectValue placeholder="Select subject" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id} data-testid={`option-subject-${subject.id}`}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="score"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-grade-score" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Score</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-grade-max-score" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="term"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Term/Type (optional)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                        <FormControl>
                          <SelectTrigger data-testid="select-grade-term">
                            <SelectValue placeholder="Select term or type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {terms.map((term) => (
                            <SelectItem key={term} value={term} data-testid={`option-term-${term.replace(/\s+/g, '-').toLowerCase()}`}>
                              {term}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleDialogClose}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-submit-grade"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingGrade ? "Update" : "Record Grade"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {!canAddGrades && (
        <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
          <CardContent className="py-4">
            <p className="text-sm text-amber-800 dark:text-amber-200" data-testid="text-grades-prereq">
              You need to add at least one student and one subject before you can record grades.
            </p>
          </CardContent>
        </Card>
      )}

      {subjects.length > 0 && (
        <div className="flex flex-wrap gap-2" data-testid="subject-filter-tabs">
          <Button
            variant={filterSubject === "" ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterSubject("")}
            data-testid="filter-subject-all"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            All Subjects
          </Button>
          {subjects.map((subject) => (
            <Button
              key={subject.id}
              variant={filterSubject === subject.id ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterSubject(filterSubject === subject.id ? "" : subject.id)}
              data-testid={`filter-subject-${subject.id}`}
            >
              {subject.name}
              {filterSubject === subject.id && (
                <Badge variant="secondary" className="ml-2">
                  {grades.filter((g) => g.subjectId === subject.id).length}
                </Badge>
              )}
            </Button>
          ))}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4">
            <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle>
                  {filterSubject && subjects.find(s => s.id === filterSubject)
                    ? subjects.find(s => s.id === filterSubject)!.name + " Grades"
                    : "All Grades"}
                </CardTitle>
                <CardDescription>
                  {filteredGrades.length} {filteredGrades.length === 1 ? "grade" : "grades"} recorded
                  {filterSubject && subjects.find(s => s.id === filterSubject)
                    ? ` in ${subjects.find(s => s.id === filterSubject)!.name}`
                    : ""}
                </CardDescription>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search-grades"
                />
              </div>
              <Select value={filterStudent} onValueChange={setFilterStudent}>
                <SelectTrigger className="w-40" data-testid="select-filter-student">
                  <SelectValue placeholder="All Students" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Students</SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : filteredGrades.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-grades">
              <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">
                {searchQuery || (filterStudent && filterStudent !== "all") || (filterSubject && filterSubject !== "all")
                  ? "No matching grades found"
                  : "No grades yet"}
              </p>
              <p className="text-sm">
                {searchQuery || (filterStudent && filterStudent !== "all") || (filterSubject && filterSubject !== "all")
                  ? "Try adjusting your filters"
                  : canAddGrades
                  ? "Record your first grade to get started"
                  : "Add students and subjects first"}
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => {
                    const pct = Math.round((grade.score / grade.maxScore) * 100);
                    return (
                      <TableRow key={grade.id} data-testid={`row-grade-${grade.id}`}>
                        <TableCell className="font-medium">{getStudentName(grade.studentId)}</TableCell>
                        <TableCell>{getSubjectName(grade.subjectId)}</TableCell>
                        <TableCell>{grade.score}/{grade.maxScore}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(grade.score, grade.maxScore)} variant="secondary">
                            {pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{grade.term || "—"}</TableCell>
                        <TableCell className="text-muted-foreground">{grade.date || "—"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(grade)}
                              data-testid={`button-edit-grade-${grade.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteConfirm(grade)}
                              data-testid={`button-delete-grade-${grade.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Grade</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this grade record? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm.id)}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete-grade"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
