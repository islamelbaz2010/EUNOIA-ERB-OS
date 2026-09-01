"use client";

import * as React from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { User, Mail, Shield, ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrator",
  HR: "HR",
  FINANCE: "Finance",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
  VIEWER: "Viewer",
};

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const user = session?.user as any;
  const [employee, setEmployee] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (status !== "authenticated") return;
    if (!user?.employeeId) {
      setLoading(false);
      return;
    }
    fetch(`/api/employees/${user.employeeId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setEmployee(data))
      .catch(() => setEmployee(null))
      .finally(() => setLoading(false));
  }, [status, user?.employeeId]);

  if (status === "loading" || loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
                {user?.name?.charAt(0) ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h2 className="text-xl font-bold">{user?.name ?? "—"}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span dir="ltr">{user?.email ?? "—"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{ROLE_LABELS[user?.role] || user?.role}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {employee ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Linked Employee Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{employee.displayName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employee Code</p>
                <p className="font-medium">{employee.employeeCode || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Job Title</p>
                <p className="font-medium">{employee.jobTitle || "—"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Branch</p>
                <p className="font-medium">{employee.branch?.name || employee.branch?.nameAr || "—"}</p>
              </div>
            </div>
            <Button asChild variant="outline">
              <Link href={`/employees/${employee.id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                View Full Employee Record
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            No employee record is linked to this account. This account is for administrative use only.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
