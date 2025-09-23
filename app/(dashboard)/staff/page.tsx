'use client'
import React, { useState, useEffect } from 'react';
import { GlobalHeader } from '@/components/layout/GlobalHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { TimePicker } from '@/components/ui/time-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { useForm, SubmitHandler } from 'react-hook-form';
import { UserPlus, Check, X, Calendar, Loader2, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { staffApi } from '@/lib/api';
import type { Staff, Schedule, CreateStaffDto } from '@/lib/api';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApp } from '@/context/GlobalContext';

const timezones = ['EST', 'CST', 'MST', 'PST'] as const;

// Timezone mapping between abbreviations (UI) and full names (API)
const timezoneMapping = {
  'EST': 'America/New_York',
  'CST': 'America/Chicago',
  'MST': 'America/Denver',
  'PST': 'America/Los_Angeles'
} as const;

// Reverse mapping for displaying data from API
const reverseTimezoneMapping = {
  'America/New_York': 'EST',
  'America/Chicago': 'CST',
  'America/Denver': 'MST',
  'America/Los_Angeles': 'PST'
} as const;

const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
type Day = typeof weekdays[number];

// Format US phone number for display
const formatUSPhoneNumber = (phoneNumber: string) => {
  if (!phoneNumber) return '';

  // Remove all non-digits
  const digits = phoneNumber.replace(/\D/g, '');

  // If it starts with 1 (US country code), remove it for formatting
  const localNumber = digits.startsWith('1') && digits.length === 11 ? digits.slice(1) : digits;

  // Format as (XXX) XXX-XXXX
  if (localNumber.length === 10) {
    return `(${localNumber.slice(0, 3)}) ${localNumber.slice(3, 6)}-${localNumber.slice(6)}`;
  }

  return phoneNumber;
};

// Ensure phone number has +1 prefix
const ensureUSPhoneFormat = (phoneNumber: string) => {
  if (!phoneNumber) return '';
  const digits = phoneNumber.replace(/\D/g, '');

  if (digits.length === 10) {
    return `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }

  return phoneNumber.startsWith('+1') ? phoneNumber : `+1${digits}`;
};

const formSchema = z.object({
  name: z.string(),
  title: z.string(),
  departmentId: z.number(),
  ext: z.string(),
  number: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(14, 'Phone number is too long')
    .regex(/^[\d\s\-\(\)\.]+$/, 'Phone number contains invalid characters')
    .refine((val) => {
      // Remove all non-digit characters to count digits
      const digitsOnly = val.replace(/\D/g, '');
      return digitsOnly.length === 10;
    }, 'Phone number must be exactly 10 digits (US format)'),
  timezone: z.string(),
  available: z.boolean(),
  schedule: z.array(z.object({
    day: z.enum(weekdays),
    startTime: z.string(),
    endTime: z.string()
  }))
});

type FormData = z.infer<typeof formSchema>;

const Staff = () => {
  const [staffMembers, setStaffMembers] = useState<Staff[]>([]);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Staff | null>(null);
  const [departmentFilter, setDepartmentFilter] = useState<number | 'all'>('all');
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [isSavingSchedule, setIsSavingSchedule] = useState(false);
  const [loadingScheduleId, setLoadingScheduleId] = useState<number | null>(null);

  const scheduleForm = useForm({
    defaultValues: {
      schedule: weekdays.map(day => ({
        day,
        startTime: "09:00",
        endTime: "17:00"
      }))
    }
  });

  const { departments } = useApp();

  // Filter staff members based on search query
  const filteredStaffMembers = staffMembers.filter(member => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(query) ||
      member.title.toLowerCase().includes(query)
    );
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      title: '',
      departmentId: departments?.[0]?.id ?? 0,
      ext: '',
      number: '',
      timezone: 'EST',
      available: true,
      schedule: []
    }
  });

  // Fetch staff members
  const fetchStaffMembers = async () => {
    try {
      const departmentId = departmentFilter === 'all' ? undefined : departmentFilter;
      const data = await staffApi.getAllStaff(departmentId);
      setStaffMembers(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff members",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchStaffMembers();
  }, [departmentFilter, searchQuery]);

  const handleEdit = (member: Staff) => {
    setCurrentMember(member);
    form.reset({
      name: member.name,
      title: member.title,
      departmentId: member.departmentId,
      ext: member.ext,
      number: formatUSPhoneNumber(member.number),
      timezone: reverseTimezoneMapping[member.timezone as keyof typeof reverseTimezoneMapping] || member.timezone,
      available: member.available,
      schedule: member.schedule
    });
    setEditModalOpen(true);
  };

  const handleViewSchedule = async (member: Staff) => {
    if (!member.id) return;

    setLoadingScheduleId(member.id);
    setIsLoadingSchedule(true);

    try {
      const schedule = await staffApi.getStaffSchedule(member.id);
      setCurrentMember({ ...member, schedule });
      setEditingSchedule(false);
      setScheduleModalOpen(true);

      // Initialize schedule form with current schedule or default values
      const scheduleByDay = schedule.reduce((acc: Record<Day, Schedule>, s) => {
        acc[s.day as Day] = s;
        return acc;
      }, {} as Record<Day, Schedule>);

      scheduleForm.reset({
        schedule: weekdays.map(day => ({
          day,
          startTime: scheduleByDay[day]?.startTime || "09:00",
          endTime: scheduleByDay[day]?.endTime || "17:00"
        }))
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch staff schedule",
        variant: "destructive"
      });
    } finally {
      setIsLoadingSchedule(false);
      setLoadingScheduleId(null);
    }
  };

  const handleAdd = () => {
    setCurrentMember(null); // Clear current member state
    form.reset({
      name: '',
      title: '',
      departmentId: departments?.[0]?.id ?? 0,
      ext: '101', // Default extension value
      number: '',
      timezone: 'EST',
      available: true,
      schedule: []
    });
    setAddModalOpen(true);
  };

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    setIsSubmitting(true);

    try {
      // Format phone number with +1 prefix for US numbers
      const formattedPhoneNumber = ensureUSPhoneFormat(data.number);

      // Convert timezone abbreviation to full name for API
      const apiData = {
        ...data,
        number: formattedPhoneNumber,
        timezone: timezoneMapping[data.timezone as keyof typeof timezoneMapping] || data.timezone
      };

      if (currentMember?.id) {
        await staffApi.updateStaff(currentMember.id, apiData);
        toast({
          title: "Success",
          description: `${data.name} has been updated successfully.`
        });
        setEditModalOpen(false);
      } else {
        await staffApi.createStaff(apiData);
        toast({
          title: "Success",
          description: `${data.name} has been added to the staff list.`
        });
        setAddModalOpen(false);
      }
      fetchStaffMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save staff member",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (data: { schedule: Schedule[] }) => {
    if (!currentMember?.id) return;

    setIsSavingSchedule(true);

    try {
      const formattedSchedule = data.schedule.map(s => ({
        day: s.day,
        startTime: s.startTime,
        endTime: s.endTime
      }));

      await staffApi.updateStaffSchedule(currentMember.id, formattedSchedule);
      toast({
        title: "Success",
        description: "Schedule updated successfully"
      });
      setEditingSchedule(false);
      setScheduleModalOpen(false);
      fetchStaffMembers();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update schedule",
        variant: "destructive"
      });
    } finally {
      setIsSavingSchedule(false);
    }
  };

  return (
    <div>
      <GlobalHeader title="Staff" />
      <div className="content-area">
        {/* Status Text and Filters in same line */}
        <div className=" px-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Status Text on the left */}
            <div className="text-2xl font-semibold text-gray-900 dark:text-white">
              Staff Members - {filteredStaffMembers.length}
            </div>

            {/* Search and Selects on the right */}
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search by Name or Title"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-48"
                />
              </div>

              <Select
                value={String(departmentFilter)}
                onValueChange={(value) => setDepartmentFilter(value === 'all' ? 'all' : Number(value))}
              >
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments?.map(dept => (
                    <SelectItem key={dept.id} value={String(dept.id)}>{dept.departmentName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="bg-[#9653DB] text-white hover:bg-[#9653DB]/90"
                onClick={handleAdd}
              >
                <UserPlus size={16} className="mr-2" />
                Add Member
              </Button>
            </div>
          </div>
        </div>

        <Card className="p-5 shadow-md rounded-lg bg-white dark:bg-[#0000004D] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50 dark:bg-transparent">
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Ext</TableHead>
                  <TableHead>Phone No.</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Time Zone</TableHead>
                  <TableHead>Availability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStaffMembers.map((member) => (
                  <TableRow key={member.id} className="hover:bg-gray-50 dark:hover:bg-[#00000066]">
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>{member.title}</TableCell>
                    <TableCell>{member.department?.departmentName ?? 'N/A'}</TableCell>
                    <TableCell>{member.ext}</TableCell>
                    <TableCell>
                      {ensureUSPhoneFormat(member.number)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewSchedule(member)}
                        disabled={isLoadingSchedule && loadingScheduleId === member.id}
                        className="h-8 bg-transparent border-0 text-[#3B82F6]"
                      >
                        {isLoadingSchedule && loadingScheduleId === member.id ? (
                          <Loader2 size={12} className="animate-spin" />
                        ) : (
                          'View'
                        )}
                      </Button>
                    </TableCell>
                    <TableCell>
                      {reverseTimezoneMapping[member.timezone as keyof typeof reverseTimezoneMapping] || member.timezone}
                    </TableCell>
                    <TableCell>
                      <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ${member.available
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${member.available ? 'bg-emerald-500' : 'bg-red-500'
                          }`} />
                        {member.available ? 'Available' : 'Unavailable'}
                      </div>
                    </TableCell>
                    <TableCell className="space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(member)}
                        className="h-8 w-8"
                      >
                        <img src="/icons/edit-pencile.svg" alt="Edit" className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>

        <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#2a2a2a] border-gray-700">
            <DialogHeader className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setAddModalOpen(false)}
                className="absolute right-0 top-0 text-gray-400 hover:text-white hover:bg-[#404040] h-6 w-6"
              >
                <X size={16} />
              </Button>
              <DialogTitle className="text-white text-xl font-semibold">Add Staff Member</DialogTitle>
              <p className="text-gray-400 text-sm mt-2">Please Enter the details to add new member.</p>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
                <FormField
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">
                        Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="John Doe" 
                          {...field} 
                          disabled={isSubmitting}
                          className="bg-[#404040] border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">
                        Title <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Sales Representative" 
                          {...field} 
                          disabled={isSubmitting}
                          className="bg-[#404040] border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-500"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">
                        Department <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value)}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#404040] border-gray-600 text-white focus:border-gray-500">
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#404040] border-gray-600">
                          {departments?.map(dept => (
                            <SelectItem key={dept.id} value={String(dept.id)} className="text-white hover:bg-[#505050]">
                              {dept.departmentName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">
                        Extension <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="bg-[#505050] border border-gray-600 border-r-0 px-3 py-2 text-white text-sm rounded-l-md flex items-center">
                            +91
                          </div>
                          <Input 
                            placeholder="Phone No." 
                            {...field} 
                            disabled={isSubmitting}
                            className="bg-[#404040] border-gray-600 text-white placeholder:text-gray-400 focus:border-gray-500 rounded-l-none"
                            onChange={(e) => {
                              // Format the input as user types
                              const formatted = formatUSPhoneNumber(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="ext"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">
                        Time Zone <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger className="bg-[#404040] border-gray-600 text-white focus:border-gray-500">
                            <SelectValue placeholder="Select timezone" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#404040] border-gray-600">
                          {timezones.map(tz => (
                            <SelectItem key={tz} value={tz} className="text-white hover:bg-[#505050]">{tz}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white text-sm">
                        Availability Status <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'true')}
                        defaultValue={String(field.value)}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger className="bg-[#404040] border-gray-600 text-white focus:border-gray-500">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-[#404040] border-gray-600">
                          <SelectItem value="true" className="text-white hover:bg-[#505050]">Available</SelectItem>
                          <SelectItem value="false" className="text-white hover:bg-[#505050]">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-8 pt-4 flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddModalOpen(false)}
                    disabled={isSubmitting}
                    className="bg-transparent border-gray-600 text-white hover:bg-[#404040] hover:border-gray-500"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-[#9653DB] hover:bg-[#8344c4] text-white"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Add Staff Member'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle>Edit Staff Member</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input {...field} disabled={isSubmitting} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={String(field.value)}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments?.map(dept => (
                            <SelectItem key={dept.id} value={String(dept.id)}>
                              {dept.departmentName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    name="number"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number (US)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled={isSubmitting}
                            onChange={(e) => {
                              // Format the input as user types
                              const formatted = formatUSPhoneNumber(e.target.value);
                              field.onChange(formatted);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    name="ext"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Extension</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isSubmitting} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  name="timezone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Timezone</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {timezones.map(tz => (
                            <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  name="available"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Availability Status</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === 'true')}
                        defaultValue={String(field.value)}
                        disabled={isSubmitting}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="true">Available</SelectItem>
                          <SelectItem value="false">Unavailable</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <DialogFooter className="mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setEditModalOpen(false)}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        <Dialog open={scheduleModalOpen} onOpenChange={setScheduleModalOpen}>
          <DialogContent className="sm:max-w-lg bg-[#2a2a2a] border-gray-700">
            <DialogHeader className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setScheduleModalOpen(false)}
                className="absolute right-0 top-0 text-gray-400 hover:text-white hover:bg-[#404040] h-6 w-6"
              >
                <X size={16} />
              </Button>
              <DialogTitle className="text-white text-xl font-semibold pr-8">
                {currentMember?.name}'s Schedule
              </DialogTitle>
              {!editingSchedule && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingSchedule(true)}
                  disabled={isSavingSchedule}
                  className="absolute right-8 top-0 bg-[#9653DB] hover:bg-[#8344c4] text-white px-4 py-2 rounded-md text-sm"
                >
                  Edit
                </Button>
              )}
            </DialogHeader>
            {editingSchedule ? (
              <Form {...scheduleForm}>
                <form onSubmit={scheduleForm.handleSubmit(handleScheduleSubmit)} className="space-y-6 mt-6">
                  {weekdays.map((day, index) => (
                    <div key={day} className="space-y-4">
                      <h3 className="text-white text-lg font-medium">{day}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">Start</label>
                          <FormField
                            name={`schedule.${index}.startTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    disabled={isSavingSchedule}
                                    className="bg-[#404040] border-gray-600 text-white focus:border-gray-500"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">End</label>
                          <FormField
                            name={`schedule.${index}.endTime`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input
                                    type="time"
                                    {...field}
                                    disabled={isSavingSchedule}
                                    className="bg-[#404040] border-gray-600 text-white focus:border-gray-500"
                                  />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <DialogFooter className="mt-8 pt-4 flex gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditingSchedule(false)}
                      disabled={isSavingSchedule}
                      className="bg-transparent border-gray-600 text-white hover:bg-[#404040] hover:border-gray-500"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isSavingSchedule}
                      className="bg-[#9653DB] hover:bg-[#8344c4] text-white"
                    >
                      {isSavingSchedule ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        'Save Schedule'
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            ) : (
              <div className="space-y-6 mt-6">
                {weekdays.map((day) => {
                  const daySchedule = currentMember?.schedule?.find(s => s.day === day);
                  if (!daySchedule) return null;

                  return (
                    <div key={day} className="space-y-4">
                      <h3 className="text-white text-lg font-medium">{day}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">Start</label>
                          <div className="bg-[#404040] border border-gray-600 text-white px-3 py-2 rounded-md">
                            {daySchedule.startTime}
                          </div>
                        </div>
                        <div>
                          <label className="text-gray-300 text-sm mb-2 block">End</label>
                          <div className="bg-[#404040] border border-gray-600 text-white px-3 py-2 rounded-md">
                            {daySchedule.endTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!editingSchedule && (
              <DialogFooter className="mt-8 pt-4">
                <Button 
                  onClick={() => setScheduleModalOpen(false)}
                  className="bg-[#9653DB] hover:bg-[#8344c4] text-white"
                >
                  Close
                </Button>
              </DialogFooter>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Staff;