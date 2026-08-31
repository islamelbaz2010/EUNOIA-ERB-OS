"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Loader2,
  Save,
  Plus,
  Trash2,
  Calendar,
  Clock,
  Wallet,
  FileText,
  User,
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
import { formatDate, formatCurrency, formatNumber } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

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
  amount: number;
  isPercentage: boolean;
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

  React.useEffect(() => {
    fetchEmployee();
  }, [employeeId]);

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
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        toast({ title: "تم حفظ البيانات بنجاح" });
        fetchEmployee();
      } else {
        toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حفظ البيانات", variant: "destructive" });
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
        <p className="text-muted-foreground">لم يتم العثور على الموظف</p>
        <Button variant="link" onClick={() => router.push("/employees")}>
          العودة للقائمة
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
    const labels: Record<string, string> = {
      ACTIVE: "نشط",
      ON_LEAVE: "في إجازة",
      TERMINATED: "منتهي",
      SUSPENDED: "معلق",
    };
    return <Badge variant={variants[status] || "default"}>{labels[status] || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/employees")}>
          <ArrowRight className="h-5 w-5" />
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
            الملف الشخصي
          </TabsTrigger>
          <TabsTrigger value="salary">
            <Wallet className="mr-2 h-4 w-4" />
            الراتب
          </TabsTrigger>
          <TabsTrigger value="schedule">
            <Calendar className="mr-2 h-4 w-4" />
            الجدول
          </TabsTrigger>
          <TabsTrigger value="attendance">
            <Clock className="mr-2 h-4 w-4" />
            الحضور
          </TabsTrigger>
          <TabsTrigger value="leave">
            <FileText className="mr-2 h-4 w-4" />
            الإجازات
          </TabsTrigger>
          <TabsTrigger value="payroll">
            <Wallet className="mr-2 h-4 w-4" />
            الرواتب
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>البيانات الشخصية</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>الاسم الأول (إنجليزي)</Label>
                  <Input
                    value={profileForm.firstName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم العائلة (إنجليزي)</Label>
                  <Input
                    value={profileForm.lastName}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الاسم الأول (عربي)</Label>
                  <Input
                    value={profileForm.firstNameAr}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, firstNameAr: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>اسم العائلة (عربي)</Label>
                  <Input
                    value={profileForm.lastNameAr}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, lastNameAr: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>البريد الإلكتروني</Label>
                  <Input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, email: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الهاتف</Label>
                  <Input
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الرقم الوطني</Label>
                  <Input
                    value={profileForm.nationalId}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, nationalId: e.target.value }))}
                    dir="ltr"
                  />
                </div>
                <div className="space-y-2">
                  <Label>تاريخ الميلاد</Label>
                  <Input
                    type="date"
                    value={profileForm.dateOfBirth}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, dateOfBirth: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>الجنس</Label>
                  <Select
                    value={profileForm.gender}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, gender: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MALE">ذكر</SelectItem>
                      <SelectItem value="FEMALE">أنثى</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>الحالة الاجتماعية</Label>
                  <Select
                    value={profileForm.maritalStatus}
                    onValueChange={(value) => setProfileForm((prev) => ({ ...prev, maritalStatus: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE">أعزب</SelectItem>
                      <SelectItem value="MARRIED">متزوج</SelectItem>
                      <SelectItem value="DIVORCED">مطلق</SelectItem>
                      <SelectItem value="WIDOWED">أرمل</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>المسمى الوظيفي</Label>
                  <Input
                    value={profileForm.jobTitle}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, jobTitle: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>المدينة</Label>
                  <Input
                    value={profileForm.city}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, city: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>العنوان</Label>
                <Input
                  value={profileForm.address}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  حفظ
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salary" className="space-y-4">
          {employee.salaryProfiles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Wallet className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">لم يتم تعيين راتب بعد</p>
              </CardContent>
            </Card>
          ) : (
            employee.salaryProfiles.map((profile) => (
              <Card key={profile.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>الراتب الأساسي: {formatCurrency(Number(profile.baseSalary))}</CardTitle>
                    <Badge variant="secondary">منذ {formatDate(profile.effectiveFrom)}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {profile.components.length > 0 && (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>النوع</TableHead>
                          <TableHead>الاسم</TableHead>
                          <TableHead>المبلغ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {profile.components.map((comp) => (
                          <TableRow key={comp.id}>
                            <TableCell>
                              <Badge variant={comp.type.includes("DEDUCTION") ? "destructive" : "default"}>
                                {comp.type}
                              </Badge>
                            </TableCell>
                            <TableCell>{comp.name}</TableCell>
                            <TableCell>{formatCurrency(Number(comp.amount))}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>الجدول الحالي</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.scheduleAssignments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">لم يتم تعيين جدول بعد</p>
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
                        <Badge variant="secondary">منذ {formatDate(assignment.effectiveFrom)}</Badge>
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
              <CardTitle>ملخص الحضور - الشهر الحالي</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.attendanceDays.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">لا توجد سجلات حضور</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>التاريخ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>ساعات العمل</TableHead>
                      <TableHead>التأخير (دقيقة)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employee.attendanceDays.slice(0, 30).map((day) => (
                      <TableRow key={day.id}>
                        <TableCell>{formatDate(day.date)}</TableCell>
                        <TableCell>
                          <Badge variant={day.status === "PRESENT" ? "success" : day.status === "ABSENT" ? "destructive" : "default"}>
                            {day.status}
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
              <CardTitle>سجل الإجازات</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.leaveRequests.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">لا توجد طلبات إجازة</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>النوع</TableHead>
                      <TableHead>من</TableHead>
                      <TableHead>إلى</TableHead>
                      <TableHead>الأيام</TableHead>
                      <TableHead>الحالة</TableHead>
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
                            {leave.status}
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
              <CardTitle>سجل الرواتب</CardTitle>
            </CardHeader>
            <CardContent>
              {employee.payrollRecords.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">لا توجد سجلات رواتب</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>الفترة</TableHead>
                      <TableHead>الإجمالي</TableHead>
                      <TableHead>الصافي</TableHead>
                      <TableHead>الحالة</TableHead>
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
                            {record.status}
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
