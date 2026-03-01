import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { registerUser } from "@/lib/auth";
import { queryClient, getQueryFn } from "@/lib/queryClient";
import { GraduationCap, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Teacher, Student } from "@shared/schema";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("student");
  const [teacherId, setTeacherId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [error, setError] = useState("");

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: role === "teacher",
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    enabled: role === "student",
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      registerUser({
        username,
        password,
        role,
        teacherId: role === "teacher" ? teacherId || null : null,
        studentId: role === "student" ? studentId || null : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate("/");
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (username.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (role === "teacher" && !teacherId) {
      setError("Please select a teacher profile");
      return;
    }
    if (role === "student" && !studentId) {
      setError("Please select a student profile");
      return;
    }

    registerMutation.mutate();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md" data-testid="card-register">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl" data-testid="text-register-title">Create Account</CardTitle>
          <CardDescription>Register for GradeBook</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reg-username">Username</Label>
              <Input
                id="reg-username"
                data-testid="input-reg-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="At least 3 characters"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-password">Password</Label>
              <Input
                id="reg-password"
                data-testid="input-reg-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-confirm">Confirm Password</Label>
              <Input
                id="reg-confirm"
                data-testid="input-reg-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-role">Role</Label>
              <Select value={role} onValueChange={setRole} data-testid="select-reg-role">
                <SelectTrigger id="reg-role" data-testid="select-trigger-role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student" data-testid="option-role-student">Student</SelectItem>
                  <SelectItem value="teacher" data-testid="option-role-teacher">Teacher</SelectItem>
                  <SelectItem value="admin" data-testid="option-role-admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {role === "teacher" && (
              <div className="space-y-2">
                <Label htmlFor="reg-teacher">Teacher Profile</Label>
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger id="reg-teacher" data-testid="select-trigger-teacher">
                    <SelectValue placeholder="Select teacher" />
                  </SelectTrigger>
                  <SelectContent>
                    {teachers?.map((t) => (
                      <SelectItem key={t.id} value={t.id} data-testid={`option-teacher-${t.id}`}>
                        {t.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {role === "student" && (
              <div className="space-y-2">
                <Label htmlFor="reg-student">Student Profile</Label>
                <Select value={studentId} onValueChange={setStudentId}>
                  <SelectTrigger id="reg-student" data-testid="select-trigger-student">
                    <SelectValue placeholder="Select student" />
                  </SelectTrigger>
                  <SelectContent>
                    {students?.map((s) => (
                      <SelectItem key={s.id} value={s.id} data-testid={`option-student-${s.id}`}>
                        {s.fullName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && (
              <p className="text-sm text-destructive" data-testid="text-register-error">{error}</p>
            )}
            <Button
              type="submit"
              className="w-full"
              disabled={registerMutation.isPending}
              data-testid="button-register"
            >
              {registerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="text-primary hover:underline" data-testid="link-login">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
