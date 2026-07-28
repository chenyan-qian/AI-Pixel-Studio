"use client";

import type { LucideIcon } from "lucide-react";
import axios from "axios";
import {
  BellRing,
  Check,
  CircleHelp,
  Clock3,
  Eye,
  EyeOff,
  FileText,
  Grid3X3,
  Laptop,
  LayoutPanelTop,
  LockKeyhole,
  Monitor,
  Palette,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import request from "@/lib/request";
import {
  type ProfileVisibility,
  type ThemePreference,
  type UserSettings,
  createDefaultSettings,
  readUserSettings,
  saveUserSettings,
} from "@/lib/user-settings";
import type { AuthUser } from "@/lib/auth";

type CategoryId = "account" | "creation" | "interface" | "community" | "notifications" | "privacy" | "about";

interface Category {
  id: CategoryId;
  label: string;
  description: string;
  icon: LucideIcon;
}

const categories: Category[] = [
  { id: "account", label: "账户设置", description: "个人资料、密码与设备", icon: UserRound },
  { id: "creation", label: "创作设置", description: "画布与自动保存", icon: Palette },
  { id: "interface", label: "界面设置", description: "主题与编辑器显示", icon: LayoutPanelTop },
  { id: "community", label: "社区设置", description: "作品默认权限", icon: UsersRound },
  { id: "notifications", label: "通知设置", description: "互动消息提醒", icon: BellRing },
  { id: "privacy", label: "隐私设置", description: "公开范围与在线状态", icon: ShieldCheck },
  { id: "about", label: "关于 PixelVerse", description: "版本、协议与反馈", icon: CircleHelp },
];

const themeOptions: Array<{ value: ThemePreference; label: string; description: string; icon: LucideIcon }> = [
  { value: "dark", label: "深色模式", description: "适合专注创作的深色界面", icon: Monitor },
  { value: "light", label: "浅色模式", description: "明亮、清晰的阅读体验", icon: Sparkles },
  { value: "system", label: "跟随系统", description: "自动匹配设备外观设置", icon: Laptop },
];

function Switch({ checked, onChange, label }: { checked: boolean; onChange: (next: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`settings-switch ${checked ? "settings-switch-on" : "settings-switch-off"}`}
    >
      <span className="settings-switch-thumb" />
    </button>
  );
}

function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <div className="flex items-center justify-between gap-5 border-t border-[var(--border-color)] py-4 first:border-t-0 first:pt-0 last:pb-0"><div className="min-w-0"><h4 className="theme-text-primary text-sm font-medium">{title}</h4><p className="theme-text-tertiary mt-1 text-xs leading-5">{description}</p></div><div className="shrink-0">{children}</div></div>;
}

function SettingCard({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="theme-card rounded-lg border p-5 shadow-xl shadow-black/10 sm:p-6">
      <div className="mb-5 flex gap-3"><span className="theme-avatar grid size-9 shrink-0 place-items-center rounded-md border"><Icon className="size-4" /></span><div><h3 className="theme-text-primary text-base font-semibold">{title}</h3><p className="theme-text-secondary mt-1 text-sm leading-5">{description}</p></div></div>
      {children}
    </section>
  );
}

function SelectControl<T extends string | number>({ value, onChange, options, label }: { value: T; onChange: (value: T) => void; options: Array<{ value: T; label: string }>; label: string }) {
  return <select aria-label={label} value={value} onChange={(event) => onChange((typeof value === "number" ? Number(event.target.value) : event.target.value) as T)} className="theme-panel h-9 min-w-32 rounded-md border px-2.5 text-sm outline-none transition focus:border-cyan-400"><>{options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>)}</></select>;
}

function VisibilitySelect({ value, onChange, label }: { value: ProfileVisibility; onChange: (value: ProfileVisibility) => void; label: string }) {
  return <SelectControl label={label} value={value} onChange={onChange} options={[{ value: "public", label: "所有人可见" }, { value: "followers", label: "仅关注者" }, { value: "private", label: "仅自己可见" }]} />;
}

export function SettingsCenter({ user }: { user: AuthUser }) {
  const { preference, setThemePreference } = useTheme();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("account");
  const [settings, setSettings] = useState<UserSettings>(() => createDefaultSettings(user.username));
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [visiblePasswords, setVisiblePasswords] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const [passwordStatus, setPasswordStatus] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  useEffect(() => {
    const loaded = readUserSettings(user.username);
    setSettings(loaded);
    setThemePreference(loaded.theme);
  }, [setThemePreference, user.username]);

  function updateSettings(updater: (current: UserSettings) => UserSettings) {
    setSettings((current) => {
      const next = updater(current);
      saveUserSettings(next);
      setSavedAt(new Date());
      return next;
    });
  }

  function updateTheme(theme: ThemePreference) {
    setThemePreference(theme);
    updateSettings((current) => ({ ...current, theme }));
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordStatus(null);
    if (passwordForm.newPassword.length < 6) {
      setPasswordStatus({ type: "error", message: "新密码至少需要 6 位。" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus({ type: "error", message: "两次输入的新密码不一致。" });
      return;
    }

    setChangingPassword(true);
    try {
      await request.put("/api/user/password", { currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordStatus({ type: "success", message: "密码已更新，请在下次登录时使用新密码。" });
    } catch (error) {
      const response = axios.isAxiosError(error) ? error.response?.data as { msg?: string } | undefined : undefined;
      setPasswordStatus({ type: "error", message: response?.msg || "修改失败，请稍后重试。" });
    } finally {
      setChangingPassword(false);
    }
  }

  const active = categories.find((category) => category.id === activeCategory) || categories[0];
  const displayName = user.nickname || user.username;

  const content = {
    account: <>
      <SettingCard icon={UserRound} title="个人资料" description="这些账户信息由登录账户提供，资料编辑接口将在服务端启用后接入。">
        <div className="grid gap-3 sm:grid-cols-2"><div className="theme-panel rounded-md border p-3"><p className="theme-text-tertiary text-xs">显示名称</p><p className="theme-text-primary mt-1 text-sm font-medium">{displayName}</p></div><div className="theme-panel rounded-md border p-3"><p className="theme-text-tertiary text-xs">用户名</p><p className="theme-text-primary mt-1 text-sm font-medium">@{user.username}</p></div></div>
      </SettingCard>
      <SettingCard icon={LockKeyhole} title="修改密码" description="验证当前密码后，立即为你的账号更新新的加密密码。">
        <form className="space-y-4" onSubmit={changePassword}>
          <label className="block"><span className="theme-text-secondary mb-1.5 block text-xs">当前密码</span><span className="relative block"><input required type={visiblePasswords.currentPassword ? "text" : "password"} autoComplete="current-password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))} className="theme-panel h-10 w-full rounded-md border px-3 pr-11 text-sm outline-none transition focus:border-cyan-400" /><button type="button" aria-label={visiblePasswords.currentPassword ? "隐藏当前密码" : "显示当前密码"} title={visiblePasswords.currentPassword ? "隐藏密码" : "显示密码"} onClick={() => setVisiblePasswords((current) => ({ ...current, currentPassword: !current.currentPassword }))} className="theme-nav-link absolute inset-y-0 right-0 grid w-10 place-items-center"><>{visiblePasswords.currentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</></button></span></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className="block"><span className="theme-text-secondary mb-1.5 block text-xs">新密码</span><span className="relative block"><input required minLength={6} maxLength={64} type={visiblePasswords.newPassword ? "text" : "password"} autoComplete="new-password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))} className="theme-panel h-10 w-full rounded-md border px-3 pr-11 text-sm outline-none transition focus:border-cyan-400" /><button type="button" aria-label={visiblePasswords.newPassword ? "隐藏新密码" : "显示新密码"} title={visiblePasswords.newPassword ? "隐藏密码" : "显示密码"} onClick={() => setVisiblePasswords((current) => ({ ...current, newPassword: !current.newPassword }))} className="theme-nav-link absolute inset-y-0 right-0 grid w-10 place-items-center"><>{visiblePasswords.newPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</></button></span></label><label className="block"><span className="theme-text-secondary mb-1.5 block text-xs">确认新密码</span><span className="relative block"><input required minLength={6} maxLength={64} type={visiblePasswords.confirmPassword ? "text" : "password"} autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))} className="theme-panel h-10 w-full rounded-md border px-3 pr-11 text-sm outline-none transition focus:border-cyan-400" /><button type="button" aria-label={visiblePasswords.confirmPassword ? "隐藏确认密码" : "显示确认密码"} title={visiblePasswords.confirmPassword ? "隐藏密码" : "显示密码"} onClick={() => setVisiblePasswords((current) => ({ ...current, confirmPassword: !current.confirmPassword }))} className="theme-nav-link absolute inset-y-0 right-0 grid w-10 place-items-center"><>{visiblePasswords.confirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</></button></span></label></div>
          {passwordStatus && <p className={`rounded-md border px-3 py-2 text-xs ${passwordStatus.type === "success" ? "border-emerald-400/35 bg-emerald-400/10 text-emerald-400" : "theme-error"}`}>{passwordStatus.message}</p>}
          <div className="flex justify-end"><button type="submit" disabled={changingPassword} className="glow-button h-9 rounded-md px-4 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-55">{changingPassword ? "正在修改..." : "更新密码"}</button></div>
        </form>
      </SettingCard>
      <SettingCard icon={Monitor} title="登录设备管理" description="查看当前登录设备，远程退出其他设备将在服务端会话管理启用后提供。">
        <SettingRow title="当前设备" description="此浏览器的本地登录状态有效。"><span className="inline-flex items-center gap-1.5 text-xs text-emerald-400"><Check className="size-3.5" />当前设备</span></SettingRow>
        <SettingRow title="其他设备" description="可在此处管理其他活跃登录会话。"><button type="button" disabled className="theme-panel h-9 rounded-md border px-3 text-xs opacity-55">管理设备</button></SettingRow>
      </SettingCard>
    </>,
    creation: <>
      <SettingCard icon={Palette} title="默认创作参数" description="新建作品时自动使用以下画布偏好。">
        <SettingRow title="默认像素块大小" description="决定新画布中单个像素块的默认尺寸。"><SelectControl label="默认像素块大小" value={settings.defaultPixelSize} onChange={(defaultPixelSize) => updateSettings((current) => ({ ...current, defaultPixelSize }))} options={[8, 12, 16, 24, 32].map((value) => ({ value, label: `${value} px` }))} /></SettingRow>
        <SettingRow title="默认背景模式" description="用于预览透明区域与画布底色。"><SelectControl label="默认背景模式" value={settings.defaultBackgroundMode} onChange={(defaultBackgroundMode) => updateSettings((current) => ({ ...current, defaultBackgroundMode }))} options={[{ value: "checkerboard", label: "棋盘格" }, { value: "transparent", label: "透明" }, { value: "solid", label: "纯色" }]} /></SettingRow>
      </SettingCard>
      <SettingCard icon={Grid3X3} title="编辑器显示" description="控制创作时的辅助信息显示。">
        <SettingRow title="显示像素网格" description="在画布上显示对齐用的网格线。"><Switch label="显示像素网格" checked={settings.showGrid} onChange={(showGrid) => updateSettings((current) => ({ ...current, showGrid }))} /></SettingRow>
        <SettingRow title="显示坐标" description="移动到画布时显示当前位置坐标。"><Switch label="显示坐标" checked={settings.showCoordinates} onChange={(showCoordinates) => updateSettings((current) => ({ ...current, showCoordinates }))} /></SettingRow>
        <SettingRow title="显示颜色信息" description="在取色和绘制时显示颜色值。"><Switch label="显示颜色信息" checked={settings.showColorInfo} onChange={(showColorInfo) => updateSettings((current) => ({ ...current, showColorInfo }))} /></SettingRow>
      </SettingCard>
      <SettingCard icon={Clock3} title="自动保存" description="本地自动保存会在编辑期间持续保护你的作品。">
        <SettingRow title="启用自动保存" description="在工作区自动保存当前编辑状态。"><Switch label="启用自动保存" checked={settings.autoSave} onChange={(autoSave) => updateSettings((current) => ({ ...current, autoSave }))} /></SettingRow>
        <SettingRow title="保存间隔" description="选择自动保存的间隔时间。"><SelectControl label="自动保存间隔" value={settings.autoSaveInterval} onChange={(autoSaveInterval) => updateSettings((current) => ({ ...current, autoSaveInterval }))} options={[15, 30, 60, 120].map((value) => ({ value, label: `${value} 秒` }))} /></SettingRow>
      </SettingCard>
    </>,
    interface: <>
      <SettingCard icon={LayoutPanelTop} title="主题模式" description="主题会立即应用到整个 PixelVerse 网站，并保留你的选择。">
        <div className="grid gap-3 lg:grid-cols-3">{themeOptions.map((option) => { const Icon = option.icon; const selected = preference === option.value; return <button type="button" key={option.value} onClick={() => updateTheme(option.value)} className={`relative rounded-md border p-4 text-left transition ${selected ? "border-cyan-400 bg-cyan-400/10" : "theme-panel hover:border-cyan-400/60"}`}><Icon className="theme-accent size-4" /><p className="theme-text-primary mt-3 text-sm font-medium">{option.label}</p><p className="theme-text-tertiary mt-1 text-xs leading-5">{option.description}</p>{selected && <Check className="absolute right-3 top-3 size-4 text-cyan-400" />}</button>; })}</div>
      </SettingCard>
      <SettingCard icon={SlidersHorizontal} title="编辑器显示" description="你也可以在创作设置中调整这些画布辅助项。">
        <SettingRow title="显示像素网格" description="保持像素边界清晰可见。"><Switch label="界面设置中的显示像素网格" checked={settings.showGrid} onChange={(showGrid) => updateSettings((current) => ({ ...current, showGrid }))} /></SettingRow>
        <SettingRow title="显示坐标" description="展示当前像素位置。"><Switch label="界面设置中的显示坐标" checked={settings.showCoordinates} onChange={(showCoordinates) => updateSettings((current) => ({ ...current, showCoordinates }))} /></SettingRow>
        <SettingRow title="显示颜色信息" description="展示当前绘制颜色详情。"><Switch label="界面设置中的显示颜色信息" checked={settings.showColorInfo} onChange={(showColorInfo) => updateSettings((current) => ({ ...current, showColorInfo }))} /></SettingRow>
      </SettingCard>
    </>,
    community: <>
      <SettingCard icon={UsersRound} title="默认作品状态" description="新作品保存时会默认应用以下公开状态。">
        <div className="grid gap-3 md:grid-cols-3">{([{ value: "private", label: "私人", description: "仅自己可见" }, { value: "public", label: "公开", description: "立即展示在社区" }, { value: "review", label: "审核后公开", description: "通过审核后发布" }] as const).map((option) => <button type="button" key={option.value} onClick={() => updateSettings((current) => ({ ...current, defaultWorkVisibility: option.value }))} className={`rounded-md border p-4 text-left transition ${settings.defaultWorkVisibility === option.value ? "border-cyan-400 bg-cyan-400/10" : "theme-panel hover:border-cyan-400/60"}`}><p className="theme-text-primary text-sm font-medium">{option.label}</p><p className="theme-text-tertiary mt-1 text-xs">{option.description}</p></button>)}</div>
      </SettingCard>
      <SettingCard icon={ShieldCheck} title="作品权限" description="决定其他用户可以对你的公开作品执行哪些操作。">
        <SettingRow title="允许其他用户编辑我的公开作品" description="开放后，其他创作者可在你的公开作品基础上继续创作。"><Switch label="允许其他用户编辑我的公开作品" checked={settings.allowEdit} onChange={(allowEdit) => updateSettings((current) => ({ ...current, allowEdit }))} /></SettingRow>
        <SettingRow title="允许评论" description="允许社区成员在作品下留下评论。"><Switch label="允许评论" checked={settings.allowComment} onChange={(allowComment) => updateSettings((current) => ({ ...current, allowComment }))} /></SettingRow>
        <SettingRow title="允许点赞" description="允许社区成员点赞你的公开作品。"><Switch label="允许点赞" checked={settings.allowLike} onChange={(allowLike) => updateSettings((current) => ({ ...current, allowLike }))} /></SettingRow>
      </SettingCard>
    </>,
    notifications: <>
      <SettingCard icon={BellRing} title="消息通知" description="控制 PixelVerse 在站内向你推送的互动提醒。">
        <SettingRow title="评论通知" description="有人评论你的作品时提醒你。"><Switch label="评论通知" checked={settings.notificationSetting.comment} onChange={(comment) => updateSettings((current) => ({ ...current, notificationSetting: { ...current.notificationSetting, comment } }))} /></SettingRow>
        <SettingRow title="点赞通知" description="有人点赞你的作品时提醒你。"><Switch label="点赞通知" checked={settings.notificationSetting.like} onChange={(like) => updateSettings((current) => ({ ...current, notificationSetting: { ...current.notificationSetting, like } }))} /></SettingRow>
        <SettingRow title="作品审核通知" description="作品审核结果更新时提醒你。"><Switch label="作品审核通知" checked={settings.notificationSetting.review} onChange={(review) => updateSettings((current) => ({ ...current, notificationSetting: { ...current.notificationSetting, review } }))} /></SettingRow>
        <SettingRow title="他人修改作品通知" description="有人修改你的开放作品时提醒你。"><Switch label="他人修改作品通知" checked={settings.notificationSetting.workEdit} onChange={(workEdit) => updateSettings((current) => ({ ...current, notificationSetting: { ...current.notificationSetting, workEdit } }))} /></SettingRow>
      </SettingCard>
    </>,
    privacy: <>
      <SettingCard icon={ShieldCheck} title="可见范围" description="决定哪些人可以在 PixelVerse 中看到你的个人信息和作品。">
        <SettingRow title="个人主页可见范围" description="控制其他用户访问你的个人主页。"><VisibilitySelect label="个人主页可见范围" value={settings.profileVisibility} onChange={(profileVisibility) => updateSettings((current) => ({ ...current, profileVisibility }))} /></SettingRow>
        <SettingRow title="作品列表可见范围" description="控制其他用户查看你的作品集合。"><VisibilitySelect label="作品列表可见范围" value={settings.worksVisibility} onChange={(worksVisibility) => updateSettings((current) => ({ ...current, worksVisibility }))} /></SettingRow>
        <SettingRow title="在线状态显示" description="允许其他用户看到你当前是否在线。"><Switch label="在线状态显示" checked={settings.showOnlineStatus} onChange={(showOnlineStatus) => updateSettings((current) => ({ ...current, showOnlineStatus }))} /></SettingRow>
      </SettingCard>
    </>,
    about: <>
      <SettingCard icon={Sparkles} title="PixelVerse" description="构建属于每位创作者的像素世界。">
        <SettingRow title="当前版本" description="PixelVerse 前端版本。"><span className="theme-text-secondary text-sm">v0.1.0</span></SettingRow>
        <SettingRow title="用户协议" description="协议页面尚未发布。"><span className="theme-text-tertiary text-xs">即将开放</span></SettingRow>
        <SettingRow title="隐私政策" description="政策页面尚未发布。"><span className="theme-text-tertiary text-xs">即将开放</span></SettingRow>
        <SettingRow title="意见反馈" description="反馈通道尚未接入。"><span className="theme-text-tertiary text-xs">即将开放</span></SettingRow>
      </SettingCard>
      <div className="theme-panel rounded-lg border border-dashed p-5 text-sm"><FileText className="theme-accent size-5" /><p className="theme-text-primary mt-3 font-medium">后端配置接口已预留</p><p className="theme-text-secondary mt-1 leading-6">设置当前会自动保存到本地浏览器；启用 <code className="theme-accent">/api/user/settings</code> 后可将同一份 UserSettings 记录同步到用户配置表。</p></div>
    </>,
  } satisfies Record<CategoryId, React.ReactNode>;

  return (
    <section className="mx-auto max-w-6xl py-7 sm:py-10" aria-labelledby="settings-title">
      <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="theme-accent text-xs font-semibold tracking-[0.18em]">PREFERENCES</p><h1 id="settings-title" className="theme-text-primary mt-2 text-3xl font-bold sm:text-4xl">设置中心</h1><p className="theme-text-secondary mt-2 text-sm">管理你的 PixelVerse 创作体验与账户偏好。</p></div><p className="theme-text-tertiary text-xs">{savedAt ? `已自动保存 ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "偏好会自动保存"}</p></div>
      <div className="grid gap-5 lg:grid-cols-[232px_minmax(0,1fr)]">
        <aside className="theme-card h-fit rounded-lg border p-2 shadow-xl shadow-black/10 lg:sticky lg:top-24">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible" aria-label="设置分类">{categories.map((category) => { const Icon = category.icon; const isActive = activeCategory === category.id; return <button type="button" key={category.id} onClick={() => setActiveCategory(category.id)} className={`flex min-w-36 items-center gap-3 rounded-md px-3 py-2.5 text-left transition lg:min-w-0 ${isActive ? "bg-cyan-400/10 text-cyan-300" : "theme-nav-link hover:bg-[var(--hover-bg)]"}`}><Icon className="size-4 shrink-0" /><span className="min-w-0"><span className="block text-sm font-medium">{category.label}</span><span className="theme-text-tertiary mt-0.5 hidden truncate text-[11px] lg:block">{category.description}</span></span></button>; })}</nav>
        </aside>
        <div className="min-w-0"><div className="mb-4 flex items-center gap-3"><span className="theme-avatar grid size-9 place-items-center rounded-md border"><active.icon className="size-4" /></span><div><h2 className="theme-text-primary text-lg font-semibold">{active.label}</h2><p className="theme-text-tertiary text-xs">{active.description}</p></div></div><div className="space-y-4">{content[activeCategory]}</div></div>
      </div>
    </section>
  );
}
