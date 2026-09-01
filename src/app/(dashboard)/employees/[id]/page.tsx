"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Wallet,
  FileText,
  User,
  Pencil,
  Power,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  EGYPT_GOVERNORATES,
  DEFAULT_COUNTRY,
  EMPLOYMENT_STATUS_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  SALARY_COMPONENT_TYPE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  LEAVE_STATUS_LABELS,
  PAYROLL_RECORD_STATUS_LABELS,
} from "@/lib/constants";

interface Employee {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  firstNameAr?: string;
  lastNameAr?: string;
  displayName: string;
  email: string;
  phone: string;
  nationalId: string;
  dateOfBirth: string;
  gender: string;
  maritalStatus: string;
  address: string;
  city: string;
  joinDate: string;
  employmentStatus: string;
  jobTitle: string;
  department?: { id: string; name: string } | null;
  branch?: { id: string; name: string } | null;
  salaryProfiles: SalaryProfile[];
  scheduleAssignments: ScheduleAssignment[];
  attendanceDays: AttendanceDay[];
  leaveRequests: LeaveRequest[];
  payrollRecords: PayrollRecord[];
}

interface SalaryProfile {
  id: string;
  baseSalary: number;
  currency: string;
  effectiveFrom: string;
  components: SalaryComponent[];
}

interface SalaryComponent {
  id: string;
  type: string;
  name: string;
  nameAr?: string;
  amount: number;
  isPercentage: boolean;
  isRecurring: boolean;
  isActive: boolean;
}

interface ScheduleAssignment {
  id: string;
  schedule: { name: string; startTime: string; endTime: string };
  effectiveFrom: string;
}

interface AttendanceDay {
  id: string;
  date: string;
  status: string;
  workMinutes: number;
  lateMinutes: number;
}

interface LeaveRequest {
  id: string;
  leaveType: { name: string };
  startDate: string;
  endDate: string;
  totalDays: number;
  status: string;
}

interface PayrollRecord {
  id: string;
  payrollPeriod: { name: string };
  gross: number;
  net: number;
  status: string;
}

export default function EmployeeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const employeeId = params.id as string;
  const initialTab = searchParams.get("tab") || "profile";

  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [profileForm, setProfileForm] = React.useState<Record<string, any>>({});
  const [salaryFormOpen, setSalaryFormOpen] = React.useState(false);
  const [salaryForm, setSalaryForm] = React.useState({ baseSalary: 0, overtimeRate: 0, hourlyRate: 0, currency: "EGP" });
  const [branches, setBranches] = React.useState<{ id: string; name: string; nameAr?: string }[]>([]);
  const [departments, setDepartments] = React.useState<{ id: string; name: string; nameAr?: string }[]>([]);

  const componentTypeLabels = SALARY_COMPONENT_TYPE_LABELS;

  const [componentDialogOpen, setComponentDialogOpen] = React.useState(false);
  const [editingComponent, setEditingComponent] = React.useState<SalaryComponent | null>(null);
  const [componentForm, setComponentForm] = React.useState({
    type: "ALLOWANCE",
    name: "",
    nameAr: "",
    amount: 0,
    isPercentage: false,
    isRecurring: true,
  });

  React.useEffect(() => {
    fetchEmployee();
    fetchLookups();
  }, [employeeId]);

  async function fetchLookups() {
    try {
      const [branchesRes, departmentsRes] = await Promise.all([
        fetch("/api/admin/branches"),
        fetch("/api/departments"),
      ]);
      if (branchesRes.ok) setBranches(await branchesRes.json());
      if (departmentsRes.ok) setDepartments(await departmentsRes.json());
    } catch (error) {
      console.error("Failed to fetch lookups:", error);
    }
  }

  async function fetchEmployee() {
    try {
      const res = await fetch(`/api/employees/${employeeId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
        setProfileForm({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          firstNameAr: data.firstNameAr || "",
          lastNameAr: data.lastNameAr || "",
          email: data.email || "",
          phone: data.phone || "",
          nationalId: data.nationalId || "",
          dateOfBirth: data.dateOfBirth?.split("T")[0] || "",
          gender: data.gender || "",
          maritalStatus: data.maritalStatus || "",
          address: data.address || "",
          city: data.city || "",
          jobTitle: data.jobTitle || "",
          displayName: data.displayName || "",
          country: data.country || DEFAULT_COUNTRY,
          governorate: data.governorate || "",
          branchId: data.branchId || data.branch?.id || "",
          departmentId: data.departmentId || data.department?.id || "",
          employmentStatus: data.employmentStatus || "ACTIVE",
        });
      }
    } catch (error) {
      console.error("Failed to fetch employee:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        toast({ title: "Saved successfully" });
        fetchEmployee();
      } else {
        toast({ title: "Error", description: "Failed to save data", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save data", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveSalary() {
    if (!salaryForm.baseSalary || salaryForm.baseSalary <= 0) {
      toast({ title: "Error", description: "Enter the base salary", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/employees/${employeeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salary: salaryForm }),
      });
      if (res.ok) {
        toast({ title: "Salary saved successfully" });
        setSalaryFormOpen(false);
        fetchEmployee();
      } else {
        toast({ title: "Error", description: "Failed to save salary", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save salary", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function openSalaryForm() {
    const current = employee?.salaryProfiles[0];
    if (current) {
      setSalaryForm({
        baseSalary: Number(current.baseSalary),
        overtimeRate: 0,
        hourlyRate: 0,
        currency: current.currency || "EGP",
      });
    } else {
      setSalaryForm({ baseSalary: 0, overtimeRate: 0, hourlyRate: 0, currency: "EGP" });
    }
    setSalaryFormOpen(true);
  }

  function openAddComponentDialog() {
    setEditingComponent(null);
    setComponentForm({ type: "ALLOWANCE", name: "", nameAr: "", amount: 0, isPercentage: false, isRecurring: true });
    setComponentDialogOpen(true);
  }

  function openEditComponentDialog(comp: SalaryComponent) {
    setEditingComponent(comp);
    setComponentForm({
      type: comp.type,
      name: comp.name,
      nameAr: comp.nameAr || "",
      amount: Number(comp.amount),
      isPercentage: comp.isPercentage,
      isRecurring: comp.isRecurring ?? true,
    });
    setComponentDialogOpen(true);
  }

  async function handleSaveComponent() {
    const profile = employee?.salaryProfiles[0];
    if (!profile) return;

    if (!componentForm.nameAr || componentForm.amount <= 0) {
      toast({ title: "Error", description: "Enter the name and amount", variant: "destructive" });
      return;
    }

    const internalName = componentForm.name || componentForm.nameAr;

    setSaving(true);
    try {
      const res = editingComponent
        ? await fetch(`/api/salary-components/${editingComponent.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: componentForm.type,
              name: internalName,
              nameAr: componentForm.nameAr,
              amount: componentForm.amount,
              isPercentage: componentForm.isPercentage,
              isRecurring: componentForm.isRecurring,
            }),
          })
        : await fetch("/api/salary-components", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              salaryProfileId: profile.id,
              type: componentForm.type,
              name: internalName,
              nameAr: componentForm.nameAr,
              amount: componentForm.amount,
              isPercentage: componentForm.isPercentage,
              isRecurring: componentForm.isRecurring,
            }),
          });
      if (res.ok) {
        toast({ title: editingComponent ? "Component updated" : "Component added" });
        setComponentDialogOpen(false);
        fetchEmployee();
      } else {
        toast({ title: "Error", description: "Failed to save component", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save component", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteComponent(id: string) {
    setSaving(true);
    try {
      const res = await fetch(`/api/salary-components/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Component deleted" });
        fetchEmployee();
      } else {
        toast({ title: "Error", description: "Failed to delete component", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete component", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleComponentActive(comp: SalaryComponent) {
    setSaving(true);
    try {
      const res = await fetch(`/api/salary-components/${comp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !comp.isActive }),
      });
      if (res.ok) {
        toast({ title: comp.isActive ? "Component deactivated" : "Component activated" });
        fetchEmployee();
      } else {
        toast({ title: "Error", description: "Failed to update component", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update component", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-96" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground">Employee not found</p>
        <Button variant="link" onClick={() => router.push("/employees")}>
          Back to list
        </Button>
      </div>
    );
  }

  const statusBadge = (status: string) => {
    const variants: Record<string, "default" | "success" | "warning" | "destructive"> = {
      ACTIVE: "success",
      ON_LEAVE: "warning",
      TERMINATED: "destructive",
      SUSPENDED: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{EMPLOYMENT_STATUS_LABELS[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/employees")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{employee.displayName}</h1>
            {statusBadge(employee.employmentStatus)}
          </div>
          <p className="text-muted-foreground">
            {employee.employeeCode} • {employee.jobTitle || "—"}</p>
        </div>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="profile">
            <User className="mr-2 h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="salary">
            <Wallet className="mr-2 h-4 w-4" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Clock className="mr-2 h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="leave">
            <FileText className="mr-2 h-4 w-4" />
            Leave
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <Wallet className="mr-2 h-4 w-4" />
            Payroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>First Name (English)</Label>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name (English)</Label>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>First Name (Arabic)</Label>
                  <Input
                    value={profileForm.firstNameAr}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstNameAr: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name (Arabic)</Label>
                  <Input
                    value={profileForm.lastNameAr}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastNameAr: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>National ID</Label>
                  <Input
                    value={profileForm.nationalId}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, nationalId: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date of Birth</Label>
                  <Input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <Select
                    value={profileForm.gender}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">Male</SelectItem>
                      <SelectItem value="FEMALE">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Marital Status</Label>
                  <Select
                    value={profileForm.maritalStatus}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, maritalStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">Single</SelectItem>
                      <SelectItem value="MARRIED">Married</SelectItem>
                      <SelectItem value="DIVORCED">Divorced</SelectItem>
                      <SelectItem value="WIDOWED">Widowed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input
                    value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select
                    value={profileForm.branchId || ""}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, branchId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.name || b.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Select
                    value={profileForm.departmentId || ""}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, departmentId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      {departments.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name || d.nameAr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Employment Status</Label>
                  <Select
                    value={profileForm.employmentStatus || "ACTIVE"}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, employmentStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(EMPLOYMENT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={profileForm.city}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input
                    value={profileForm.country}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, country: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Governorate</Label>
                  <Select
                    value={profileForm.governorate || ""}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, governorate: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select governorate" />
                    </SelectTrigger>
                    <SelectContent>
                      {EGYPT_GOVERNORATES.map((g) => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Salary Information</CardTitle>
                <Button variant="outline" size="sm" onClick={openSalaryForm}>
                  {employee.salaryProfiles.length === 0 ? (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Salary
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {employee.salaryProfiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground">No salary has been assigned yet</p>
                </div>
              ) : (
                employee.salaryProfiles.map((profile) => (
                  <div key={profile.id} className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Base Salary</p>
                        <p className="text-lg font-bold">{formatCurrency(Number(profile.baseSalary))}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Effective Date</p>
                        <p className="text-lg font-bold">{formatDate(profile.effectiveFrom)}</p>
                      </div>
                      <div className="rounded-lg border p-4">
                        <p className="text-sm text-muted-foreground">Currency</p>
                        <p className="text-lg font-bold">{profile.currency}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Salary Components</h3>
                      <Button variant="outline" size="sm" onClick={openAddComponentDialog}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Component
                      </Button>
                    </div>
                    {profile.components.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Type</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-28"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {profile.components.map((comp) => (
                            <TableRow key={comp.id} className={comp.isActive ? "" : "opacity-60"}>
                              <TableCell>
                                <Badge variant={comp.type.includes("DEDUCTION") || comp.type === "PENALTY" ? "destructive" : "default"}>
                                  {componentTypeLabels[comp.type] || comp.type}
                                </Badge>
                              </TableCell>
                              <TableCell>{comp.name || comp.nameAr}</TableCell>
                              <TableCell>
                                {formatCurrency(Number(comp.amount))}
                                {comp.isPercentage && " (%)"}
                              </TableCell>
                              <TableCell>
                                <Badge variant={comp.isActive ? "success" : "secondary"}>
                                  {comp.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditComponentDialog(comp)}>
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleComponentActive(comp)}>
                                    <Power className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteComponent(comp.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                    {profile.components.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No salary components found</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {salaryFormOpen && (
            <Card>
              <CardHeader>
                <CardTitle>{employee.salaryProfiles.length === 0 ? "Add Salary" : "Edit Salary"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Base Salary *</Label>
                    <Input
                      type="number"
                      value={salaryForm.baseSalary}
                      onChange={(e) => setSalaryForm((prev) => ({ ...prev, baseSalary: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Overtime Rate</Label>
                    <Input
                      type="number"
                      value={salaryForm.overtimeRate}
                      onChange={(e) => setSalaryForm((prev) => ({ ...prev, overtimeRate: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      dir="ltr"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Hourly Rate</Label>
                    <Input
                      type="number"
                      value={salaryForm.hourlyRate}
                      onChange={(e) => setSalaryForm((prev) => ({ ...prev, hourlyRate: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      dir="ltr"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setSalaryFormOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveSalary} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingComponent ? "Edit Component" : "Add Salary Component"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Type *</Label>
                  <Select
                    value={componentForm.type}
                    onValueChange={(value) => setComponentForm((prev) => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(componentTypeLabels).map(([value, label]) => (
                        <SelectItem key={value} value={value}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Component Name (Arabic) *</Label>
                  <Input
                    value={componentForm.nameAr}
                    onChange={(e) => setComponentForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                    placeholder="e.g. Housing Allowance"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Internal Name (English - optional)</Label>
                  <Input
                    value={componentForm.name}
                    onChange={(e) => setComponentForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Housing Allowance"
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount *</Label>
                  <Input
                    type="number"
                    value={componentForm.amount}
                    onChange={(e) => setComponentForm((prev) => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    min="0"
                    dir="ltr"
                  />
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isPercentage"
                      checked={componentForm.isPercentage}
                      onCheckedChange={(checked) => setComponentForm((prev) => ({ ...prev, isPercentage: !!checked }))}
                    />
                    <Label htmlFor="isPercentage" className="cursor-pointer">Percentage</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="isRecurring"
                      checked={componentForm.isRecurring}
                      onCheckedChange={(checked) => setComponentForm((prev) => ({ ...prev, isRecurring: !!checked }))}
                    />
                    <Label htmlFor="isRecurring" className="cursor-pointer">Recurs monthly</Label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setComponentDialogOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveComponent} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Current Schedule</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.scheduleAssignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No schedule has been assigned yet</p>
              ) : (
                <div className="space-y-4">
                  {employee.scheduleAssignments.map((assignment) => (
                    <div key={assignment.id} className="rounded-lg border p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{assignment.schedule.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {assignment.schedule.startTime} - {assignment.schedule.endTime}
                          </p>
                        </div>
                        <Badge variant="secondary">Since {formatDate(assignment.effectiveFrom)}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary - Current Month</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.attendanceDays.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No attendance records found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Hours Worked</TableHead>
                      <TableHead>Late (min)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.attendanceDays.slice(0, 30).map((day) => (
                      <TableRow key={day.id}>
                        <TableCell>{formatDate(day.date)}</TableCell>
                        <TableCell>
                          <Badge variant={day.status === "PRESENT" ? "success" : day.status === "ABSENT" ? "destructive" : "default"}>
                            {ATTENDANCE_STATUS_LABELS[day.status] || day.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{Math.round(day.workMinutes / 60 * 10) / 10}h</TableCell>
                        <TableCell>{day.lateMinutes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Leave History</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.leaveRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No leave requests found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>From</TableHead>
                      <TableHead>To</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.leaveRequests.map((leave) => (
                      <TableRow key={leave.id}>
                        <TableCell>{leave.leaveType.name}</TableCell>
                        <TableCell>{formatDate(leave.startDate)}</TableCell>
                        <TableCell>{formatDate(leave.endDate)}</TableCell>
                        <TableCell>{leave.totalDays}</TableCell>
                        <TableCell>
                          <Badge variant={leave.status === "APPROVED" ? "success" : leave.status === "REJECTED" ? "destructive" : "default"}>
                            {LEAVE_STATUS_LABELS[leave.status] || leave.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payroll History</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.payrollRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">No payroll records found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead>Gross</TableHead>
                      <TableHead>Net</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.payrollRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.payrollPeriod.name}</TableCell>
                        <TableCell>{formatCurrency(Number(record.gross))}</TableCell>
                        <TableCell>{formatCurrency(Number(record.net))}</TableCell>
                        <TableCell>
                          <Badge variant={record.status === "PAID" ? "success" : "default"}>
                            {PAYROLL_RECORD_STATUS_LABELS[record.status] || record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
