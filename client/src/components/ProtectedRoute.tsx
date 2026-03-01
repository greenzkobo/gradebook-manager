import { type ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, ShieldAlert } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full" data-testid="loading-spinner">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-full p-8" data-testid="text-access-denied">
        <Card className="max-w-md w-full">
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <ShieldAlert className="h-12 w-12 text-destructive" />
            <h2 className="text-2xl font-bold">403 — Access Denied</h2>
            <p className="text-muted-foreground text-center">
              You do not have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
