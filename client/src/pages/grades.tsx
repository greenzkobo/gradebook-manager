import { useState, useRef } from "react";
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
import { Plus, Pencil, Trash2, ClipboardList, Search, BookOpen, Upload, FileText, Download, Settings2, X } from "lucide-react";
import { GRADE_CATEGORIES, type Grade, type Student, type Subject, type CategoryWeight } from "@shared/schema";

const gradeFormSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  subjectId: z.string().min(1, "Please select a subject"),
  score: z.coerce.number().min(0, "Score must be at least 0").max(1000, "Score too high"),
  maxScore: z.coerce.number().min(1, "Max score must be at least 1").max(1000, "Max score too high"),
  category: z.string().optional().nullable(),
  term: z.string().optional().nullable(),
});

type GradeFormValues = z.infer<typeof gradeFormSchema>;

const terms = ["Term 1", "Term 2", "Term 3", "Term 4"];

export default function Grades() {
  const [open, setOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Grade | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Grade | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStudent, setFilterStudent] = useState<string>("");
  const [filterSubject, setFilterSubject] = useState<string>("");
  const [weightsDialogOpen, setWeightsDialogOpen] = useState(false);
  const [weightsSubjectId, setWeightsSubjectId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const { data: categoryWeights = [] } = useQuery<CategoryWeight[]>({
    queryKey: ["/api/category-weights"],
  });

  const form = useForm<GradeFormValues>({
    resolver: zodResolver(gradeFormSchema),
    defaultValues: { studentId: "", subjectId: "", score: 0, maxScore: 100, category: "", term: "" },
  });

  const createMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/grades", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Grade recorded successfully" });
      setOpen(false);
      setSelectedFile(null);
      form.reset({ studentId: "", subjectId: "", score: 0, maxScore: 100, category: "", term: "" });
    },
    onError: () => {
      toast({ title: "Failed to record grade", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: string; formData: FormData }) => {
      const res = await fetch(`/api/grades/${id}`, { method: "PUT", body: formData });
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Grade updated successfully" });
      setOpen(false);
      setEditingGrade(null);
      setSelectedFile(null);
      form.reset({ studentId: "", subjectId: "", score: 0, maxScore: 100, category: "", term: "" });
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

  const setWeightMutation = useMutation({
    mutationFn: (data: { subjectId: string; category: string; weight: number }) =>
      apiRequest("POST", "/api/category-weights", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/category-weights"] });
      toast({ title: "Weight saved" });
    },
    onError: () => {
      toast({ title: "Failed to save weight", variant: "destructive" });
    },
  });

  const deleteWeightMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/category-weights/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/category-weights"] });
      toast({ title: "Weight removed" });
    },
  });

  const onSubmit = (data: GradeFormValues) => {
    const formData = new FormData();
    formData.append("studentId", data.studentId);
    formData.append("subjectId", data.subjectId);
    formData.append("score", String(data.score));
    formData.append("maxScore", String(data.maxScore));
    if (data.category) formData.append("category", data.category);
    if (data.term) formData.append("term", data.term);
    formData.append("date", new Date().toISOString().split("T")[0]);
    if (selectedFile) formData.append("file", selectedFile);

    if (editingGrade) {
      updateMutation.mutate({ id: editingGrade.id, formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (grade: Grade) => {
    setEditingGrade(grade);
    form.reset({
      studentId: grade.studentId,
      subjectId: grade.subjectId,
      score: grade.score,
      maxScore: grade.maxScore,
      category: grade.category || "",
      term: grade.term || "",
    });
    setSelectedFile(null);
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditingGrade(null);
    setSelectedFile(null);
    form.reset({ studentId: "", subjectId: "", score: 0, maxScore: 100, category: "", term: "" });
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

  const getSubjectWeights = (subjectId: string) => {
    return categoryWeights.filter((cw) => cw.subjectId === subjectId);
  };

  const computeWeightedAverage = (subjectId: string, studentId?: string) => {
    const subjectGrades = grades.filter(
      (g) => g.subjectId === subjectId && (!studentId || g.studentId === studentId)
    );
    const weights = getSubjectWeights(subjectId);

    if (weights.length === 0) {
      if (subjectGrades.length === 0) return null;
      const avg = subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / subjectGrades.length;
      return Math.round(avg);
    }

    let totalWeightedScore = 0;
    let totalWeight = 0;

    for (const w of weights) {
      const catGrades = subjectGrades.filter((g) => g.category === w.category);
      if (catGrades.length === 0) continue;
      const catAvg = catGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / catGrades.length;
      totalWeightedScore += catAvg * (w.weight / 100);
      totalWeight += w.weight;
    }

    const uncategorizedGrades = subjectGrades.filter(
      (g) => !g.category || !weights.some((w) => w.category === g.category)
    );
    if (uncategorizedGrades.length > 0) {
      const remainingWeight = Math.max(0, 100 - weights.reduce((s, w) => s + w.weight, 0));
      if (remainingWeight > 0) {
        const avg = uncategorizedGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / uncategorizedGrades.length;
        totalWeightedScore += avg * (remainingWeight / 100);
        totalWeight += remainingWeight;
      }
    }

    if (totalWeight === 0) return null;
    return Math.round((totalWeightedScore / totalWeight) * 100);
  };

  const totalWeightForSubject = (subjectId: string) => {
    return getSubjectWeights(subjectId).reduce((sum, w) => sum + w.weight, 0);
  };

  const openWeightsDialog = (subjectId: string) => {
    setWeightsSubjectId(subjectId);
    setWeightsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-grades-title">Gradebook</h1>
          <p className="text-muted-foreground">Record and manage student grades by subject</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {filterSubject && filterSubject !== "all" && (
            <Button
              variant="outline"
              onClick={() => openWeightsDialog(filterSubject)}
              data-testid="button-manage-weights"
            >
              <Settings2 className="h-4 w-4 mr-2" />
              Manage Weights
            </Button>
          )}
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
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-grade-category">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GRADE_CATEGORIES.map((cat) => (
                              <SelectItem key={cat} value={cat} data-testid={`option-category-${cat.toLowerCase()}`}>
                                {cat}
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
                        <FormLabel>Term (optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value ?? undefined}>
                          <FormControl>
                            <SelectTrigger data-testid="select-grade-term">
                              <SelectValue placeholder="Select term" />
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
                  <div>
                    <label className="text-sm font-medium">Assignment File (optional)</label>
                    <div className="mt-1.5 flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        data-testid="input-grade-file"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        data-testid="button-upload-file"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {selectedFile ? "Change File" : "Upload File"}
                      </Button>
                      {selectedFile && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <FileText className="h-4 w-4" />
                          <span data-testid="text-selected-file">{selectedFile.name}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => { setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                            data-testid="button-remove-file"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                      {!selectedFile && editingGrade?.fileName && (
                        <span className="text-sm text-muted-foreground" data-testid="text-existing-file">
                          Current: {editingGrade.fileName}
                        </span>
                      )}
                    </div>
                  </div>
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

      {filterSubject && filterSubject !== "all" && (
        <WeightedAverageCard
          subjectId={filterSubject}
          subjectName={getSubjectName(filterSubject)}
          weights={getSubjectWeights(filterSubject)}
          grades={grades}
          students={students}
          computeWeightedAverage={computeWeightedAverage}
          totalWeight={totalWeightForSubject(filterSubject)}
          onManageWeights={() => openWeightsDialog(filterSubject)}
          getGradeColor={getGradeColor}
        />
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
                    {(!filterSubject || filterSubject === "all") && <TableHead>Subject</TableHead>}
                    <TableHead>Category</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead>Term</TableHead>
                    <TableHead>File</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGrades.map((grade) => {
                    const pct = Math.round((grade.score / grade.maxScore) * 100);
                    return (
                      <TableRow key={grade.id} data-testid={`row-grade-${grade.id}`}>
                        <TableCell className="font-medium">{getStudentName(grade.studentId)}</TableCell>
                        {(!filterSubject || filterSubject === "all") && (
                          <TableCell>{getSubjectName(grade.subjectId)}</TableCell>
                        )}
                        <TableCell>
                          {grade.category ? (
                            <Badge variant="outline" data-testid={`badge-category-${grade.id}`}>{grade.category}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>{grade.score}/{grade.maxScore}</TableCell>
                        <TableCell>
                          <Badge className={getGradeColor(grade.score, grade.maxScore)} variant="secondary">
                            {pct}%
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{grade.term || "—"}</TableCell>
                        <TableCell>
                          {grade.fileName && grade.fileUrl ? (
                            <a
                              href={grade.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                              data-testid={`link-file-${grade.id}`}
                            >
                              <Download className="h-3.5 w-3.5" />
                              {grade.fileName.length > 15
                                ? grade.fileName.substring(0, 12) + "..."
                                : grade.fileName}
                            </a>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
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

      <WeightsDialog
        open={weightsDialogOpen}
        onOpenChange={setWeightsDialogOpen}
        subjectId={weightsSubjectId}
        subjectName={getSubjectName(weightsSubjectId)}
        weights={getSubjectWeights(weightsSubjectId)}
        onSaveWeight={(category, weight) => setWeightMutation.mutate({ subjectId: weightsSubjectId, category, weight })}
        onDeleteWeight={(id) => deleteWeightMutation.mutate(id)}
        isPending={setWeightMutation.isPending}
      />
    </div>
  );
}

function WeightedAverageCard({
  subjectId,
  subjectName,
  weights,
  grades,
  students,
  computeWeightedAverage,
  totalWeight,
  onManageWeights,
  getGradeColor,
}: {
  subjectId: string;
  subjectName: string;
  weights: CategoryWeight[];
  grades: Grade[];
  students: Student[];
  computeWeightedAverage: (subjectId: string, studentId?: string) => number | null;
  totalWeight: number;
  onManageWeights: () => void;
  getGradeColor: (score: number, maxScore: number) => string;
}) {
  const subjectGrades = grades.filter((g) => g.subjectId === subjectId);
  const uniqueStudents = [...new Set(subjectGrades.map((g) => g.studentId))];

  if (subjectGrades.length === 0 && weights.length === 0) return null;

  return (
    <Card data-testid="card-weighted-averages">
      <CardHeader className="pb-3">
        <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="text-base">{subjectName} - Weighted Summary</CardTitle>
            <CardDescription>
              {weights.length > 0
                ? `${weights.length} categories weighted (${totalWeight}% allocated)`
                : "No weights configured - using simple average"}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onManageWeights} data-testid="button-weights-shortcut">
            <Settings2 className="h-4 w-4 mr-2" />
            Weights
          </Button>
        </div>
      </CardHeader>
      {weights.length > 0 && (
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {weights.map((w) => (
                <Badge key={w.id} variant="outline" data-testid={`badge-weight-${w.category.toLowerCase()}`}>
                  {w.category}: {w.weight}%
                </Badge>
              ))}
              {totalWeight < 100 && (
                <Badge variant="outline" className="border-dashed">
                  Unweighted: {100 - totalWeight}%
                </Badge>
              )}
            </div>
            {uniqueStudents.length > 0 && (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      {weights.map((w) => (
                        <TableHead key={w.id}>{w.category} ({w.weight}%)</TableHead>
                      ))}
                      <TableHead>Weighted Avg</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uniqueStudents.map((studentId) => {
                      const studentName = students.find((s) => s.id === studentId)?.fullName || "Unknown";
                      const weightedAvg = computeWeightedAverage(subjectId, studentId);
                      return (
                        <TableRow key={studentId} data-testid={`row-weighted-${studentId}`}>
                          <TableCell className="font-medium">{studentName}</TableCell>
                          {weights.map((w) => {
                            const catGrades = subjectGrades.filter(
                              (g) => g.studentId === studentId && g.category === w.category
                            );
                            if (catGrades.length === 0) {
                              return <TableCell key={w.id} className="text-muted-foreground">—</TableCell>;
                            }
                            const avg = Math.round(
                              catGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / catGrades.length
                            );
                            return (
                              <TableCell key={w.id}>
                                <Badge className={getGradeColor(avg, 100)} variant="secondary">{avg}%</Badge>
                              </TableCell>
                            );
                          })}
                          <TableCell>
                            {weightedAvg !== null ? (
                              <Badge className={getGradeColor(weightedAvg, 100)} variant="secondary">
                                {weightedAvg}%
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

function WeightsDialog({
  open,
  onOpenChange,
  subjectId,
  subjectName,
  weights,
  onSaveWeight,
  onDeleteWeight,
  isPending,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subjectId: string;
  subjectName: string;
  weights: CategoryWeight[];
  onSaveWeight: (category: string, weight: number) => void;
  onDeleteWeight: (id: string) => void;
  isPending: boolean;
}) {
  const [newCategory, setNewCategory] = useState("");
  const [newWeight, setNewWeight] = useState("");

  const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
  const availableCategories = GRADE_CATEGORIES.filter(
    (cat) => !weights.some((w) => w.category === cat)
  );

  const handleAdd = () => {
    if (!newCategory || !newWeight) return;
    const weightNum = parseInt(newWeight);
    if (isNaN(weightNum) || weightNum < 1 || weightNum > 100) return;
    if (totalWeight + weightNum > 100) return;
    onSaveWeight(newCategory, weightNum);
    setNewCategory("");
    setNewWeight("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage Weights - {subjectName}</DialogTitle>
          <DialogDescription>
            Set how much each assignment category counts toward the overall grade. Weights should total 100%.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {weights.length > 0 ? (
            <div className="space-y-2">
              {weights.map((w) => (
                <div key={w.id} className="flex items-center justify-between gap-2 p-2 rounded-md border" data-testid={`weight-row-${w.category.toLowerCase()}`}>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{w.category}</Badge>
                    <span className="text-sm font-medium">{w.weight}%</span>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => onDeleteWeight(w.id)}
                    data-testid={`button-delete-weight-${w.category.toLowerCase()}`}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-1">
                <span className="text-muted-foreground">Total allocated</span>
                <span className={totalWeight === 100 ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>
                  {totalWeight}%
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4" data-testid="text-no-weights">
              No weights configured. All grades will use a simple average.
            </p>
          )}

          {availableCategories.length > 0 && totalWeight < 100 && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-sm font-medium">Category</label>
                <Select value={newCategory} onValueChange={setNewCategory}>
                  <SelectTrigger data-testid="select-weight-category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((cat) => (
                      <SelectItem key={cat} value={cat} data-testid={`option-weight-${cat.toLowerCase()}`}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <label className="text-sm font-medium">Weight %</label>
                <Input
                  type="number"
                  min={1}
                  max={100 - totalWeight}
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  placeholder="%"
                  data-testid="input-weight-value"
                />
              </div>
              <Button
                size="sm"
                onClick={handleAdd}
                disabled={!newCategory || !newWeight || isPending}
                data-testid="button-add-weight"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
