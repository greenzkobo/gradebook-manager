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
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { insertStudentSchema, type Student, type InsertStudent } from "@shared/schema";
import { usePermissions } from "@/hooks/usePermissions";

const studentFormSchema = insertStudentSchema.extend({
  fullName: insertStudentSchema.shape.fullName.min(2, "Name must be at least 2 characters"),
  gradeLevel: insertStudentSchema.shape.gradeLevel.min(1, "Please select a grade level"),
  email: insertStudentSchema.shape.email.nullable(),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

const gradeLevels = [
  "1st Grade", "2nd Grade", "3rd Grade", "4th Grade", "5th Grade",
  "6th Grade", "7th Grade", "8th Grade", "9th Grade", "10th Grade",
  "11th Grade", "12th Grade",
];

export default function Students() {
  const [open, setOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();
  const { canManageStudents } = usePermissions();

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { fullName: "", gradeLevel: "", email: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertStudent) => apiRequest("POST", "/api/students", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student added successfully" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add student", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertStudent }) =>
      apiRequest("PUT", `/api/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Student updated successfully" });
      setOpen(false);
      setEditingStudent(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update student", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/students/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Student deleted successfully" });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({ title: "Failed to delete student", variant: "destructive" });
    },
  });

  const onSubmit = (data: StudentFormValues) => {
    const studentData: InsertStudent = {
      fullName: data.fullName,
      gradeLevel: data.gradeLevel,
      email: data.email || null,
    };
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data: studentData });
    } else {
      createMutation.mutate(studentData);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      fullName: student.fullName,
      gradeLevel: student.gradeLevel,
      email: student.email || "",
    });
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditingStudent(null);
    form.reset();
  };

  const filteredStudents = students.filter((s) =>
    s.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.gradeLevel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-students-title">Students</h1>
          <p className="text-muted-foreground">Manage student records</p>
        </div>
        {canManageStudents() && (
          <Dialog open={open} onOpenChange={(v) => v ? setOpen(v) : handleDialogClose()}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-student">
                <Plus className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
                <DialogDescription>
                  {editingStudent ? "Update student information" : "Enter the student details below"}
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
                          <Input placeholder="John Doe" {...field} data-testid="input-student-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="gradeLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Grade Level</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-grade-level">
                              <SelectValue placeholder="Select grade level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {gradeLevels.map((level) => (
                              <SelectItem key={level} value={level} data-testid={`option-grade-${level.replace(/\s+/g, '-').toLowerCase()}`}>
                                {level}
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (optional)</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="student@school.edu" {...field} value={field.value ?? ""} data-testid="input-student-email" />
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
                      data-testid="button-submit-student"
                    >
                      {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingStudent ? "Update" : "Add Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Student List</CardTitle>
              <CardDescription>{students.length} students enrolled</CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-students"
              />
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
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-students">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">{searchQuery ? "No students found" : "No students yet"}</p>
              <p className="text-sm">{searchQuery ? "Try a different search term" : "Add your first student to get started"}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Grade Level</TableHead>
                    <TableHead>Email</TableHead>
                    {canManageStudents() && (
                      <TableHead className="w-24">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id} data-testid={`row-student-${student.id}`}>
                      <TableCell className="font-medium">{student.fullName}</TableCell>
                      <TableCell>{student.gradeLevel}</TableCell>
                      <TableCell className="text-muted-foreground">{student.email || "—"}</TableCell>
                      {canManageStudents() && (
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(student)}
                              data-testid={`button-edit-student-${student.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setDeleteConfirm(student)}
                              data-testid={`button-delete-student-${student.id}`}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteConfirm?.fullName}? This will also delete all their grades. This action cannot be undone.
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
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
