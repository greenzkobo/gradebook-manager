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
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, BookOpen, Search } from "lucide-react";
import { insertSubjectSchema, type Subject, type InsertSubject, type Grade } from "@shared/schema";

const subjectFormSchema = insertSubjectSchema.extend({
  name: insertSubjectSchema.shape.name.min(2, "Name must be at least 2 characters"),
});

type SubjectFormValues = z.infer<typeof subjectFormSchema>;

export default function Subjects() {
  const [open, setOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Subject | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: subjects = [], isLoading } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: grades = [] } = useQuery<Grade[]>({
    queryKey: ["/api/grades"],
  });

  const form = useForm<SubjectFormValues>({
    resolver: zodResolver(subjectFormSchema),
    defaultValues: { name: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: InsertSubject) => apiRequest("POST", "/api/subjects", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Subject added successfully" });
      setOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add subject", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: InsertSubject }) =>
      apiRequest("PUT", `/api/subjects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      toast({ title: "Subject updated successfully" });
      setOpen(false);
      setEditingSubject(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to update subject", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/subjects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/grades"] });
      toast({ title: "Subject deleted successfully" });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({ title: "Failed to delete subject", variant: "destructive" });
    },
  });

  const onSubmit = (data: SubjectFormValues) => {
    const subjectData: InsertSubject = {
      name: data.name,
      description: data.description || null,
    };
    if (editingSubject) {
      updateMutation.mutate({ id: editingSubject.id, data: subjectData });
    } else {
      createMutation.mutate(subjectData);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject);
    form.reset({
      name: subject.name,
      description: subject.description || "",
    });
    setOpen(true);
  };

  const handleDialogClose = () => {
    setOpen(false);
    setEditingSubject(null);
    form.reset();
  };

  const filteredSubjects = subjects.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSubjectStats = (subjectId: string) => {
    const subjectGrades = grades.filter((g) => g.subjectId === subjectId);
    const count = subjectGrades.length;
    const avg = count > 0
      ? Math.round(subjectGrades.reduce((sum, g) => sum + (g.score / g.maxScore) * 100, 0) / count)
      : 0;
    return { count, avg };
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" data-testid="text-subjects-title">Subjects</h1>
          <p className="text-muted-foreground">Manage course subjects</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => v ? setOpen(v) : handleDialogClose()}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-subject">
              <Plus className="h-4 w-4 mr-2" />
              Add Subject
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSubject ? "Edit Subject" : "Add New Subject"}</DialogTitle>
              <DialogDescription>
                {editingSubject ? "Update subject information" : "Enter the subject details below"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Subject Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Mathematics" {...field} data-testid="input-subject-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Brief description of the subject..."
                          className="resize-none"
                          {...field}
                          data-testid="input-subject-description"
                        />
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
                    data-testid="button-submit-subject"
                  >
                    {createMutation.isPending || updateMutation.isPending ? "Saving..." : editingSubject ? "Update" : "Add Subject"}
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
          placeholder="Search subjects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
          data-testid="input-search-subjects"
        />
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : filteredSubjects.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium" data-testid="text-no-subjects">
              {searchQuery ? "No subjects found" : "No subjects yet"}
            </p>
            <p className="text-sm">{searchQuery ? "Try a different search term" : "Add your first subject to get started"}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSubjects.map((subject) => {
            const stats = getSubjectStats(subject.id);
            return (
              <Card key={subject.id} data-testid={`card-subject-${subject.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-primary/10">
                        <BookOpen className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{subject.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleEdit(subject)}
                        data-testid={`button-edit-subject-${subject.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setDeleteConfirm(subject)}
                        data-testid={`button-delete-subject-${subject.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="line-clamp-2 mb-4">
                    {subject.description || "No description"}
                  </CardDescription>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{stats.count} grades recorded</span>
                    {stats.count > 0 && (
                      <span className={`font-medium ${stats.avg >= 70 ? "text-emerald-600 dark:text-emerald-400" : stats.avg >= 50 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                        Avg: {stats.avg}%
                      </span>
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
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deleteConfirm?.name}? This will also delete all grades for this subject. This action cannot be undone.
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
              data-testid="button-confirm-delete-subject"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
