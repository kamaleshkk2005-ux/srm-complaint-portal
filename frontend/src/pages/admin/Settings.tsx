import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Settings,
  Save,
  Shield,
  Mail,
  Globe,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import api from '@/lib/axios';
import { cn } from '@/lib/utils';

interface Setting {
  key: string;
  value: string;
  description?: string;
}

const AdminSettings = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, string>>({});

  const SETTING_GROUPS = [
    {
      title: 'General',
      icon: <Globe className="h-5 w-5" />,
      color: 'text-blue-500',
      settings: [
        { key: 'system_name', label: 'System Name', description: 'Display name of the complaint portal', type: 'text', placeholder: 'UniResolve CMS' },
        { key: 'college_name', label: 'College / Institution Name', description: 'Used in email templates and reports', type: 'text', placeholder: 'Your College Name' },
        { key: 'contact_email', label: 'Support Email', description: 'Shown to students when they need help', type: 'email', placeholder: 'support@college.edu' },
      ],
    },
    {
      title: 'Complaint Rules',
      icon: <Shield className="h-5 w-5" />,
      color: 'text-purple-500',
      settings: [
        { key: 'max_attachments', label: 'Max Attachments per Complaint', description: 'Maximum files a student can attach', type: 'number', placeholder: '5' },
        { key: 'auto_close_days', label: 'Auto-Close After (Days)', description: 'Resolved complaints auto-close after this many days', type: 'number', placeholder: '30' },
        { key: 'escalation_days', label: 'Escalation After (Days)', description: 'Complaints auto-escalate if no update within these days', type: 'number', placeholder: '7' },
      ],
    },
    {
      title: 'Email Notifications',
      icon: <Mail className="h-5 w-5" />,
      color: 'text-emerald-500',
      settings: [
        { key: 'email_on_submit', label: 'Email on Submission', description: 'Send email to student when complaint is submitted', type: 'text', placeholder: 'true' },
        { key: 'email_on_assign', label: 'Email on Assignment', description: 'Notify staff when a complaint is assigned to them', type: 'text', placeholder: 'true' },
        { key: 'email_on_resolve', label: 'Email on Resolution', description: 'Notify student when complaint is resolved', type: 'text', placeholder: 'true' },
      ],
    },
  ];

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        const data = res.data.data as Setting[];
        const map: Record<string, string> = {};
        data.forEach((s) => { map[s.key] = s.value; });
        setSettings(map);
        setLocalValues(map);
      } catch (err) {
        console.error('Failed to fetch settings', err);
        // Use defaults if API fails
        const defaults: Record<string, string> = {
          system_name: 'UniResolve CMS',
          college_name: 'ABC College of Engineering',
          contact_email: 'support@college.edu',
          max_attachments: '5',
          auto_close_days: '30',
          escalation_days: '7',
          email_on_submit: 'true',
          email_on_assign: 'true',
          email_on_resolve: 'true',
        };
        setSettings(defaults);
        setLocalValues(defaults);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    try {
      await api.put(`/admin/settings/${key}`, { value: localValues[key] });
      setSettings((prev) => ({ ...prev, [key]: localValues[key] }));
      setSaved(key);
      setTimeout(() => setSaved(null), 3000);
    } catch (err) {
      console.error('Failed to save setting', err);
    } finally {
      setSaving(null);
    }
  };

  const hasChanged = (key: string) => localValues[key] !== settings[key];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="p-2 rounded-xl bg-primary/10">
          <Settings className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            System Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Configure platform-wide settings for the complaint management system
          </p>
        </div>
      </motion.div>

      {SETTING_GROUPS.map((group, groupIndex) => (
        <motion.div
          key={group.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: groupIndex * 0.1 }}
        >
          <Card className="border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg bg-slate-100 dark:bg-slate-800", group.color)}>
                  {group.icon}
                </div>
                <div>
                  <CardTitle className="text-base">{group.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <Separator className="mb-6" />
            <CardContent className="space-y-6">
              {group.settings.map((setting, index) => (
                <div key={setting.key}>
                  {index > 0 && <Separator className="my-6" />}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor={setting.key} className="text-sm font-medium">
                        {setting.label}
                      </Label>
                      {setting.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {setting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 sm:min-w-[260px]">
                      <Input
                        id={setting.key}
                        type={setting.type || 'text'}
                        placeholder={setting.placeholder}
                        value={localValues[setting.key] || ''}
                        onChange={(e) =>
                          setLocalValues((prev) => ({ ...prev, [setting.key]: e.target.value }))
                        }
                        className={cn(
                          "flex-1",
                          hasChanged(setting.key) && "border-amber-400 focus-visible:ring-amber-400"
                        )}
                      />
                      <Button
                        size="sm"
                        disabled={!hasChanged(setting.key) || saving === setting.key}
                        onClick={() => handleSave(setting.key)}
                        className="shrink-0 gap-1.5 w-20"
                        variant={saved === setting.key ? 'outline' : 'default'}
                      >
                        {saving === setting.key ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : saved === setting.key ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
                          </>
                        ) : (
                          <>
                            <Save className="h-3.5 w-3.5" />
                            Save
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>
      ))}

      {/* Danger Zone */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-red-200 dark:border-red-900/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-50 dark:bg-red-950/50">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-base text-red-600 dark:text-red-400">
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible actions — proceed with caution
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50">
              <div>
                <p className="text-sm font-medium text-red-800 dark:text-red-200">
                  Purge Resolved Complaints
                </p>
                <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                  Permanently delete all complaints with RESOLVED or CLOSED status older than 1 year
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                onClick={() => {
                  if (confirm('Are you sure? This action cannot be undone!')) {
                    alert('Feature coming soon — contact DB admin to perform purge.');
                  }
                }}
              >
                Purge Old Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminSettings;
