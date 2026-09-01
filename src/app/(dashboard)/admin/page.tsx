"use client";

import * as React from "react";
import {
  Building2,
  MapPin,
  Clock,
  Calendar,
  Tag,
  Shield,
  FileText,
  Loader2,
  Save,
  Plus,
  Trash2,
  Pencil,
  Power,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

interface Company {
  id: string;
  name: string;
  nameAr?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  taxNumber?: string;
  vatNumber?: string;
  vatRate: number;
  currency: string;
  timezone: string;
}

interface WorkSchedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  isDefault: boolean;
  sunday: boolean;
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
}

interface Holiday {
  id: string;
  name: string;
  nameAr?: string;
  date: string;
  isRecurring: boolean;
}

interface LeaveType {
  id: string;
  name: string;
  nameAr?: string;
  defaultDays: number;
  isPaid: boolean;
  isActive: boolean;
}

interface AuditLog {
  id: string;
  user?: { name: string };
  action: string;
  entity: string;
  entityId?: string;
  createdAt: string;
}

interface Branch {
  id: string;
  name: string;
  nameAr?: string;
  address?: string;
  city?: string;
  phone?: string;
  isDefault: boolean;
  isActive: boolean;
}

export default function AdminPage() {
  const [company, setCompany] = React.useState<Company | null>(null);
  const [schedules, setSchedules] = React.useState<WorkSchedule[]>([]);
  const [holidays, setHolidays] = React.useState<Holiday[]>([]);
  const [leaveTypes, setLeaveTypes] = React.useState<LeaveType[]>([]);
  const [auditLogs, setAuditLogs] = React.useState<AuditLog[]>([]);
  const [branches, setBranches] = React.useState<Branch[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  const [showScheduleDialog, setShowScheduleDialog] = React.useState(false);
  const [showHolidayDialog, setShowHolidayDialog] = React.useState(false);
  const [showLeaveTypeDialog, setShowLeaveTypeDialog] = React.useState(false);
  const [showBranchDialog, setShowBranchDialog] = React.useState(false);
  const [editingBranch, setEditingBranch] = React.useState<Branch | null>(null);
  const [branchForm, setBranchForm] = React.useState({
    name: "",
    nameAr: "",
    address: "",
    city: "",
    phone: "",
    isDefault: false,
  });

  const [scheduleForm, setScheduleForm] = React.useState({
    name: "",
    startTime: "10:30",
    endTime: "18:30",
    sunday: true,
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: false,
    saturday: false,
  });

  const [holidayForm, setHolidayForm] = React.useState({
    name: "",
    nameAr: "",
    date: "",
    isRecurring: false,
  });

  const [leaveTypeForm, setLeaveTypeForm] = React.useState({
    name: "",
    nameAr: "",
    defaultDays: 0,
    isPaid: true,
  });

  React.useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    setLoading(true);
    try {
      const [companyRes, schedulesRes, holidaysRes, leaveTypesRes, auditRes, branchesRes] = await Promise.all([
        fetch("/api/admin/settings"),
        fetch("/api/admin/work-schedules"),
        fetch("/api/admin/holidays"),
        fetch("/api/admin/leave-types"),
        fetch("/api/admin/audit-log"),
        fetch("/api/admin/branches"),
      ]);

      if (companyRes.ok) setCompany(await companyRes.json());
      if (schedulesRes.ok) {
        const data = await schedulesRes.json();
        setSchedules(Array.isArray(data) ? data : data.schedules || data.items || []);
      }
      if (holidaysRes.ok) {
        const data = await holidaysRes.json();
        setHolidays(Array.isArray(data) ? data : data.holidays || data.items || []);
      }
      if (leaveTypesRes.ok) {
        const data = await leaveTypesRes.json();
        setLeaveTypes(Array.isArray(data) ? data : data.leaveTypes || data.items || []);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(data.logs || data.items || []);
      }
      if (branchesRes.ok) {
        const data = await branchesRes.json();
        setBranches(Array.isArray(data) ? data : data.branches || data.items || []);
      }
    } catch (error) {
      console.error("Failed to fetch admin data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveCompany() {
    if (!company) return;
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(company),
      });
      if (res.ok) {
        toast({ title: "تم الحفظ بنجاح" });
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  async function handleAddSchedule(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/work-schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(scheduleForm),
      });
      if (res.ok) {
        toast({ title: "تمت الإضافة بنجاح" });
        setShowScheduleDialog(false);
        fetchAdminData();
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  async function handleAddHoliday(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/holidays", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(holidayForm),
      });
      if (res.ok) {
        toast({ title: "تمت الإضافة بنجاح" });
        setShowHolidayDialog(false);
        fetchAdminData();
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  async function handleAddLeaveType(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/leave-types", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(leaveTypeForm),
      });
      if (res.ok) {
        toast({ title: "تمت الإضافة بنجاح" });
        setShowLeaveTypeDialog(false);
        fetchAdminData();
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  async function handleDeleteHoliday(id: string) {
    try {
      const res = await fetch(`/api/admin/holidays/${id}`, { method: "DELETE" });
      if (res.ok) fetchAdminData();
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  async function handleDeleteLeaveType(id: string) {
    try {
      const res = await fetch(`/api/admin/leave-types/${id}`, { method: "DELETE" });
      if (res.ok) fetchAdminData();
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  function openAddBranchDialog() {
    setEditingBranch(null);
    setBranchForm({ name: "", nameAr: "", address: "", city: "", phone: "", isDefault: false });
    setShowBranchDialog(true);
  }

  function openEditBranchDialog(branch: Branch) {
    setEditingBranch(branch);
    setBranchForm({
      name: branch.name,
      nameAr: branch.nameAr || "",
      address: branch.address || "",
      city: branch.city || "",
      phone: branch.phone || "",
      isDefault: branch.isDefault,
    });
    setShowBranchDialog(true);
  }

  async function handleSaveBranch(e: React.FormEvent) {
    e.preventDefault();
    try {
      const res = await fetch(
        editingBranch ? `/api/admin/branches/${editingBranch.id}` : "/api/admin/branches",
        {
          method: editingBranch ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(branchForm),
        }
      );
      if (res.ok) {
        toast({ title: editingBranch ? "تم تعديل الفرع بنجاح" : "تمت إضافة الفرع بنجاح" });
        setShowBranchDialog(false);
        fetchAdminData();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "خطأ", description: data.error || "فشل في حفظ الفرع", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "خطأ", description: "فشل في حفظ الفرع", variant: "destructive" });
    }
  }

  async function handleToggleBranchActive(branch: Branch) {
    try {
      const res = await fetch(`/api/admin/branches/${branch.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !branch.isActive }),
      });
      if (res.ok) {
        toast({ title: branch.isActive ? "تم تعطيل الفرع" : "تم تفعيل الفرع" });
        fetchAdminData();
      }
    } catch (error) {
      toast({ title: "خطأ", variant: "destructive" });
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">الإدارة</h1>
        <p className="text-muted-foreground">إعدادات النظام والإدارة</p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTrigger value="company">
            <Building2 className="mr-2 h-4 w-4" />
            الشركة
          </TabsTrigger>
          <TabsTrigger value="branches">
            <MapPin className="mr-2 h-4 w-4" />
            الفروع
          </TabsTrigger>
          <TabsTrigger value="schedules">
            <Clock className="mr-2 h-4 w-4" />
            جداول العمل
          </TabsTrigger>
          <TabsTrigger value="holidays">
            <Calendar className="mr-2 h-4 w-4" />
            العطل
          </TabsTrigger>
          <TabsTrigger value="leave-types">
            <Tag className="mr-2 h-4 w-4" />
            أنواع الإجازات
          </TabsTrigger>
          <TabsTrigger value="audit">
            <FileText className="mr-2 h-4 w-4" />
            سجل التدقيق
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>بيانات الشركة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-10 w-full" />
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))}
                </div>
              ) : company ? (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>اسم الشركة (إنجليزي)</Label>
                      <Input
                        value={company.name}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, name: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>اسم الشركة (عربي)</Label>
                      <Input
                        value={company.nameAr || ""}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, nameAr: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البريد الإلكتروني</Label>
                      <Input
                        value={company.email || ""}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, email: e.target.value } : null)}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الهاتف</Label>
                      <Input
                        value={company.phone || ""}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, phone: e.target.value } : null)}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>المدينة</Label>
                      <Input
                        value={company.city || ""}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, city: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>البلد</Label>
                      <Input
                        value={company.country || ""}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, country: e.target.value } : null)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>الرقم الضريبي</Label>
                      <Input
                        value={company.taxNumber || ""}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, taxNumber: e.target.value } : null)}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>رقم ضريبة القيمة المضافة</Label>
                      <Input
                        value={company.vatNumber || ""}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, vatNumber: e.target.value } : null)}
                        dir="ltr"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>نسبة الضريبة (%)</Label>
                      <Input
                        type="number"
                        value={company.vatRate}
                        onChange={(e) => setCompany((prev) => prev ? { ...prev, vatRate: parseFloat(e.target.value) || 0 } : null)}
                        dir="ltr"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      value={company.address || ""}
                      onChange={(e) => setCompany((prev) => prev ? { ...prev, address: e.target.value } : null)}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Button onClick={handleSaveCompany} disabled={saving}>
                      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                      حفظ
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>الفروع</CardTitle>
              <Button onClick={openAddBranchDialog}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة فرع
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>المدينة</TableHead>
                    <TableHead>الهاتف</TableHead>
                    <TableHead>افتراضي</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        لا توجد فروع
                      </TableCell>
                    </TableRow>
                  ) : (
                    branches.map((branch) => (
                      <TableRow key={branch.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{branch.nameAr || branch.name}</p>
                            {branch.city && <p className="text-xs text-muted-foreground">{branch.city}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{branch.city || "-"}</TableCell>
                        <TableCell dir="ltr">{branch.phone || "-"}</TableCell>
                        <TableCell>
                          {branch.isDefault && <Badge variant="success">افتراضي</Badge>}
                        </TableCell>
                        <TableCell>
                          <Badge variant={branch.isActive ? "success" : "destructive"}>
                            {branch.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditBranchDialog(branch)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleToggleBranchActive(branch)}>
                              <Power className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>جداول العمل</CardTitle>
              <Button onClick={() => setShowScheduleDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة جدول
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>من</TableHead>
                    <TableHead>إلى</TableHead>
                    <TableHead>الأيام</TableHead>
                    <TableHead>افتراضي</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        لا توجد جداول
                      </TableCell>
                    </TableRow>
                  ) : (
                    schedules.map((schedule) => {
                      const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
                      const dayLabels: Record<string, string> = {
                        sunday: "أحد", monday: "إثنين", tuesday: "ثلاثاء",
                        wednesday: "أربعاء", thursday: "خميس", friday: "جمعة", saturday: "سبت",
                      };
                      const activeDays = days.filter((d) => (schedule as any)[d]).map((d) => dayLabels[d]);
                      return (
                        <TableRow key={schedule.id}>
                          <TableCell className="font-medium">{schedule.name}</TableCell>
                          <TableCell dir="ltr">{schedule.startTime}</TableCell>
                          <TableCell dir="ltr">{schedule.endTime}</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {activeDays.map((day) => (
                                <Badge key={day} variant="secondary" className="text-xs">{day}</Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>
                            {schedule.isDefault && <Badge variant="success">افتراضي</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="holidays" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>العطل الرسمية</CardTitle>
              <Button onClick={() => setShowHolidayDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة عطلة
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>التاريخ</TableHead>
                    <TableHead>متكررة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {holidays.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        لا توجد عطل
                      </TableCell>
                    </TableRow>
                  ) : (
                    holidays.map((holiday) => (
                      <TableRow key={holiday.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{holiday.name}</p>
                            {holiday.nameAr && <p className="text-xs text-muted-foreground">{holiday.nameAr}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(holiday.date)}</TableCell>
                        <TableCell>
                          <Badge variant={holiday.isRecurring ? "default" : "secondary"}>
                            {holiday.isRecurring ? "نعم" : "لا"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteHoliday(holiday.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="leave-types" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>أنواع الإجازات</CardTitle>
              <Button onClick={() => setShowLeaveTypeDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                إضافة نوع
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الاسم</TableHead>
                    <TableHead>الأيام الافتراضية</TableHead>
                    <TableHead>مدفوعة</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead className="text-left">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveTypes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        لا توجد أنواع إجازات
                      </TableCell>
                    </TableRow>
                  ) : (
                    leaveTypes.map((lt) => (
                      <TableRow key={lt.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{lt.name}</p>
                            {lt.nameAr && <p className="text-xs text-muted-foreground">{lt.nameAr}</p>}
                          </div>
                        </TableCell>
                        <TableCell>{lt.defaultDays}</TableCell>
                        <TableCell>
                          <Badge variant={lt.isPaid ? "success" : "secondary"}>
                            {lt.isPaid ? "مدفوعة" : "غير مدفوعة"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={lt.isActive ? "success" : "destructive"}>
                            {lt.isActive ? "نشط" : "غير نشط"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteLeaveType(lt.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>سجل التدقيق</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>المستخدم</TableHead>
                    <TableHead>الإجراء</TableHead>
                    <TableHead>الكيان</TableHead>
                    <TableHead>الوقت</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        لا توجد سجلات
                      </TableCell>
                    </TableRow>
                  ) : (
                    auditLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{log.user?.name || "—"}</TableCell>
                        <TableCell><Badge variant="outline">{log.action}</Badge></TableCell>
                        <TableCell>{log.entity}</TableCell>
                        <TableCell>{formatDate(log.createdAt)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showBranchDialog} onOpenChange={setShowBranchDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBranch ? "تعديل الفرع" : "إضافة فرع جديد"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveBranch} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={branchForm.nameAr}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                  placeholder="المقر الرئيسي - القاهرة"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={branchForm.name}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدينة</Label>
                <Input
                  value={branchForm.city}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>الهاتف</Label>
                <Input
                  value={branchForm.phone}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, phone: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={branchForm.address}
                onChange={(e) => setBranchForm((prev) => ({ ...prev, address: e.target.value }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={branchForm.isDefault}
                onCheckedChange={(checked) => setBranchForm((prev) => ({ ...prev, isDefault: checked }))}
              />
              <Label>فرع افتراضي</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowBranchDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit">{editingBranch ? "حفظ" : "إضافة"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة جدول عمل</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSchedule} className="space-y-4">
            <div className="space-y-2">
              <Label>اسم الجدول</Label>
              <Input
                value={scheduleForm.name}
                onChange={(e) => setScheduleForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>وقت البداية</Label>
                <Input
                  type="time"
                  value={scheduleForm.startTime}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  dir="ltr"
                />
              </div>
              <div className="space-y-2">
                <Label>وقت النهاية</Label>
                <Input
                  type="time"
                  value={scheduleForm.endTime}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>أيام العمل</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "sunday", label: "أحد" },
                  { key: "monday", label: "إثنين" },
                  { key: "tuesday", label: "ثلاثاء" },
                  { key: "wednesday", label: "أربعاء" },
                  { key: "thursday", label: "خميس" },
                  { key: "friday", label: "جمعة" },
                  { key: "saturday", label: "سبت" },
                ].map((day) => (
                  <div key={day.key} className="flex items-center gap-2">
                    <Switch
                      checked={(scheduleForm as any)[day.key]}
                      onCheckedChange={(checked) =>
                        setScheduleForm((prev) => ({ ...prev, [day.key]: checked }))
                      }
                    />
                    <Label className="text-sm">{day.label}</Label>
                  </div>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowScheduleDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showHolidayDialog} onOpenChange={setShowHolidayDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة عطلة رسمية</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddHoliday} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={holidayForm.name}
                  onChange={(e) => setHolidayForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={holidayForm.nameAr}
                  onChange={(e) => setHolidayForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>التاريخ</Label>
              <Input
                type="date"
                value={holidayForm.date}
                onChange={(e) => setHolidayForm((prev) => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={holidayForm.isRecurring}
                onCheckedChange={(checked) => setHolidayForm((prev) => ({ ...prev, isRecurring: checked }))}
              />
              <Label>متكررة سنوياً</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowHolidayDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={showLeaveTypeDialog} onOpenChange={setShowLeaveTypeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>إضافة نوع إجازة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddLeaveType} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={leaveTypeForm.name}
                  onChange={(e) => setLeaveTypeForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={leaveTypeForm.nameAr}
                  onChange={(e) => setLeaveTypeForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>الأيام الافتراضية</Label>
              <Input
                type="number"
                value={leaveTypeForm.defaultDays}
                onChange={(e) => setLeaveTypeForm((prev) => ({ ...prev, defaultDays: parseInt(e.target.value) || 0 }))}
                dir="ltr"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={leaveTypeForm.isPaid}
                onCheckedChange={(checked) => setLeaveTypeForm((prev) => ({ ...prev, isPaid: checked }))}
              />
              <Label>إجازة مدفوعة</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowLeaveTypeDialog(false)}>
                إلغاء
              </Button>
              <Button type="submit">إضافة</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
