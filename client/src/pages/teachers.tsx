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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, UserCheck, Search, X, BookOpen } from "lucide-react";
import { insertTeacherSchema, type Teacher, type InsertTeacher, type Subject, type TeacherSubject } from "@shared/schema";

const teacherFormSchema = insertTeacherSchema.extend({
  fullName: insertTeacherSchema.shape.fullName.min(2, "Name must be at least 2 characters"),
});

type TeacherFormValues = z.infer<typeof teacherFormSchema>;

export default function Teachers() {
  const [open, setOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Teacher | null>(null);
  const [assignOpen, setAssignOpen] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: teacherSubjects = [] } = useQuery<TeacherSubject[]>({
    queryKey: ["/api/teacher-subjects"],
  });

  const form = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: { fullName: "", email: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertTeacher) => apiRequest("POST", "/api/teachers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Teacher added successfully" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add teacher", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertTeacher }) =>
      apiRequest("PUT", `/api/teachers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      toast({ title: "Teacher updated successfully" });
      setOpen(false);
      setEditingTeacher(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update teacher", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teachers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-subjects"] });
      toast({ title: "Teacher deleted successfully" });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({ title: "Failed to delete teacher", variant: "destructive" });
    },
  });

  const assignMutation = useMutation({
    mutationFn: (data: { teacherId: string; subjectId: string }) =>
      apiRequest("POST", "/api/teacher-subjects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-subjects"] });
      toast({ title: "Subject assigned successfully" });
    },
    onError: () => {
      toast({ title: "Failed to assign subject", variant: "destructive" });
    },
  });

  const unassignMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/teacher-subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-subjects"] });
      toast({ title: "Subject removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove subject", variant: "destructive" });
    },
  });

  const onSubmit = (data: TeacherFormValues) => {
    const teacherData: InsertTeacher = {
      fullName: data.fullName,
      email: data.email || null,
    };
    if (editingTeacher) {
      updateMutation.mutate({ id: editingTeacher.id, data: teacherData });
    } else {
      createMutation.mutate(teacherData);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    form.reset({
      fullName: teacher.fullName,
      email: teacher.email || "",
    });
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditingTeacher(null);
    form.reset();
  };

  const filteredTeachers = teachers.filter((t) =>
    t.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTeacherAssignments = (teacherId: string) => {
    return teacherSubjects.filter((ts) => ts.teacherId === teacherId);
  };

  const getSubjectName = (subjectId: string) => {
    return subjects.find((s) => s.id === subjectId)?.name || "Unknown Subject";
  };

  const getUnassignedSubjects = (teacherId: string) => {
    const assigned = teacherSubjects
      .filter((ts) => ts.teacherId === teacherId)
      .map((ts) => ts.subjectId);
    return subjects.filter((s) => !assigned.includes(s.id));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-teachers-title">Teachers</h1>
          <p className="text-muted-foreground">Manage teachers and their subject assignments</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => v ? setOpen(v) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-teacher">
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
              <DialogDescription>
                {editingTeacher ? "Update teacher information" : "Enter the teacher details below"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Doe" {...field} data-testid="input-teacher-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="teacher@school.edu" {...field} value={field.value ?? ""} data-testid="input-teacher-email" />
                      </FormControl>
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
                    data-testid="button-submit-teacher"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingTeacher ? "Update" : "Add Teacher"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search teachers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-teachers"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium" data-testid="text-no-teachers">
              {searchQuery ? "No teachers found" : "No teachers yet"}
            </p>
            <p className="text-sm">{searchQuery ? "Try a different search term" : "Add your first teacher to get started"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTeachers.map((teacher) => {
            const assignments = getTeacherAssignments(teacher.id);
            return (
              <Card key={teacher.id} data-testid={`card-teacher-${teacher.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <UserCheck className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{teacher.fullName}</CardTitle>
                        {teacher.email && (
                          <CardDescription className="text-xs">{teacher.email}</CardDescription>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(teacher)}
                        data-testid={`button-edit-teacher-${teacher.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(teacher)}
                        data-testid={`button-delete-teacher-${teacher.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        {assignments.length} {assignments.length === 1 ? "subject" : "subjects"} assigned
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setAssignOpen(teacher)}
                        data-testid={`button-manage-subjects-${teacher.id}`}
                      >
                        <BookOpen className="h-3 w-3 mr-1" />
                        Manage
                      </Button>
                    </div>
                    {assignments.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {assignments.map((a) => (
                          <Badge key={a.id} variant="secondary" className="text-xs" data-testid={`badge-subject-${a.id}`}>
                            {getSubjectName(a.subjectId)}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Teacher</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteConfirm?.fullName}? All subject assignments will also be removed. This action cannot be undone.
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
              data-testid="button-confirm-delete-teacher"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!assignOpen} onOpenChange={() => setAssignOpen(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Subjects for {assignOpen?.fullName}</DialogTitle>
            <DialogDescription>
              Assign or remove subjects for this teacher
            </DialogDescription>
          </DialogHeader>
          {assignOpen && (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Assigned Subjects</p>
                {getTeacherAssignments(assignOpen.id).length === 0 ? (
                  <p className="text-sm text-muted-foreground" data-testid="text-no-assigned-subjects">No subjects assigned yet</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {getTeacherAssignments(assignOpen.id).map((a) => (
                      <Badge key={a.id} variant="secondary" className="gap-1 pr-1" data-testid={`badge-assigned-${a.id}`}>
                        {getSubjectName(a.subjectId)}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-4 w-4 ml-1 no-default-hover-elevate"
                          onClick={() => unassignMutation.mutate(a.id)}
                          disabled={unassignMutation.isPending}
                          data-testid={`button-remove-subject-${a.id}`}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              {getUnassignedSubjects(assignOpen.id).length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Add Subject</p>
                  <Select
                    onValueChange={(subjectId) => {
                      assignMutation.mutate({
                        teacherId: assignOpen.id,
                        subjectId,
                      });
                    }}
                    value=""
                  >
                    <SelectTrigger data-testid="select-assign-subject">
                      <SelectValue placeholder="Select a subject to assign" />
                    </SelectTrigger>
                    <SelectContent>
                      {getUnassignedSubjects(assignOpen.id).map((subject) => (
                        <SelectItem key={subject.id} value={subject.id} data-testid={`option-subject-${subject.id}`}>
                          {subject.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {subjects.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No subjects available. Add subjects first before assigning them to teachers.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
