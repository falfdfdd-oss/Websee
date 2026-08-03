import React, { useState } from "react";
import {
  Shield,
  User,
  Building2,
  Lock,
  AlertCircle,
  Info,
  ArrowLeft,
  ChevronRight,
  X,
  KeyRound,
  UserCheck,
  Trophy,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { Student, Staff, RoomManager } from "../types";
import { getAppsScriptUrl } from "../lib/googleSheets";

interface LoginViewProps {
  onLogin: () => void;
  isLoggingIn: boolean;
  needsAuth: boolean;
  spreadsheetId: string | null;
  spreadsheetUrl: string | null;
  students: Student[];
  staff: Staff[];
  roomManagers: RoomManager[];
  onUserLogin: (
    role: "student" | "staff" | "room_manager",
    studentId?: string,
    roomId?: string,
    newStudentData?: { name: string; room: string },
    username?: string
  ) => void;
  isSyncing?: boolean;
  onRefreshData?: () => Promise<any>;
}

export default function LoginView({
  onLogin,
  isLoggingIn,
  needsAuth,
  students,
  staff,
  roomManagers,
  onUserLogin,
  isSyncing = false,
  onRefreshData,
}: LoginViewProps) {
  // Role selection state: null means showing the role selection screen
  const [selectedRole, setSelectedRole] = useState<"student" | "staff" | "room_manager" | null>(null);

  // Active tab state when in login form
  const [activeTab, setActiveTab] = useState<"student" | "staff" | "room_manager">("student");

  // Student Tab state
  const [typedStudentId, setTypedStudentId] = useState("");
  const [typedPassword, setTypedPassword] = useState("");
  const [studentLoginError, setStudentLoginError] = useState("");

  // Staff Tab state
  const [staffUsername, setStaffUsername] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffError, setStaffError] = useState("");

  // Room Manager Tab state
  const [roomUsername, setRoomUsername] = useState("");
  const [roomPassword, setRoomPassword] = useState("");
  const [roomError, setRoomError] = useState("");

  const [localSyncing, setLocalSyncing] = useState(false);

  const isConfigured = Boolean(getAppsScriptUrl());

  const handleSelectRole = (role: "student" | "staff" | "room_manager") => {
    setSelectedRole(role);
    setActiveTab(role);
    setStudentLoginError("");
    setStaffError("");
    setRoomError("");
  };

  const handleResetRole = () => {
    setSelectedRole(null);
    setTypedStudentId("");
    setTypedPassword("");
    setStaffUsername("");
    setStaffPassword("");
    setRoomUsername("");
    setRoomPassword("");
    setStudentLoginError("");
    setStaffError("");
    setRoomError("");
  };

  const handleStudentCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setStudentLoginError("เกิดข้อผิดพลาด ไม่สามารถเข้าสู่ระบบได้");
      return;
    }
    const id = String(typedStudentId || "").trim();
    const pwd = String(typedPassword || "").trim();
    if (!id || !pwd) return;

    let currentStudents = students;
    let found = currentStudents.find((s) => String(s.id || "").trim() === id);

    if (!found && onRefreshData) {
      setLocalSyncing(true);
      setStudentLoginError("ไม่พบบัญชีเดิม... กำลังดึงข้อมูลล่าสุด...");
      try {
        const freshDb = await onRefreshData();
        if (freshDb && freshDb.students) {
          currentStudents = freshDb.students;
          found = freshDb.students.find((s) => String(s.id || "").trim() === id);
        }
      } catch (err) {
        console.error("Auto login refresh error:", err);
      } finally {
        setLocalSyncing(false);
      }
    }

    if (found) {
      const expectedPassword = String(found.password || found.id || "").trim();
      if (pwd === expectedPassword) {
        setStudentLoginError("");
        onUserLogin("student", String(found.id || "").trim());
      } else {
        setStudentLoginError("รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบรหัสผ่านและลองใหม่อีกครั้ง");
      }
    } else {
      setStudentLoginError(`ไม่พบรหัสประจำตัวนักเรียน "${id}" ในคณะสีเขียว (กรุณาติดต่อสตาฟฟ์)`);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setStaffError("เกิดข้อผิดพลาด ไม่สามารถเข้าสู่ระบบได้");
      return;
    }
    const uName = String(staffUsername || "").trim();
    const pwd = String(staffPassword || "").trim();
    if (!uName || !pwd) return;

    let currentStaff = staff;
    let found = currentStaff.find((s) => String(s.username || "").trim().toUpperCase() === uName.toUpperCase());

    if (!found && onRefreshData) {
      setLocalSyncing(true);
      setStaffError("ไม่พบบัญชีเดิม... กำลังดึงข้อมูลล่าสุด");
      try {
        const freshDb = await onRefreshData();
        if (freshDb && freshDb.staff) {
          currentStaff = freshDb.staff;
          found = freshDb.staff.find((s) => String(s.username || "").trim().toUpperCase() === uName.toUpperCase());
        }
      } catch (err) {
        console.error("Auto login refresh error:", err);
      } finally {
        setLocalSyncing(false);
      }
    }

    if (found) {
      const expectedPassword = String(found.password || "123").trim();
      if (pwd === expectedPassword) {
        setStaffError("");
        onUserLogin("staff", undefined, undefined, undefined, String(found.username || "").trim());
      } else {
        setStaffError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      }
    } else {
      setStaffError(`ไม่พบสตาฟฟ์ผู้ใช้งาน "${uName}"`);
    }
  };

  const handleRoomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      setRoomError("เกิดข้อผิดพลาด ไม่สามารถเข้าสู่ระบบได้");
      return;
    }
    const uName = String(roomUsername || "").trim();
    const pwd = String(roomPassword || "").trim();
    if (!uName || !pwd) return;

    let currentRoomManagers = roomManagers;
    let found = currentRoomManagers.find((r) => String(r.username || "").trim().toUpperCase() === uName.toUpperCase());

    if (!found && onRefreshData) {
      setLocalSyncing(true);
      setRoomError("ไม่พบบัญชีเดิม... กำลังดึงข้อมูลล่าสุด");
      try {
        const freshDb = await onRefreshData();
        if (freshDb && freshDb.roomManagers) {
          currentRoomManagers = freshDb.roomManagers;
          found = freshDb.roomManagers.find((r) => String(r.username || "").trim().toUpperCase() === uName.toUpperCase());
        }
      } catch (err) {
        console.error("Auto login refresh error:", err);
      } finally {
        setLocalSyncing(false);
      }
    }

    if (found) {
      const expectedPassword = String(found.password || "123").trim();
      if (pwd === expectedPassword) {
        setRoomError("");
        onUserLogin("room_manager", undefined, String(found.room || "").trim(), undefined, String(found.username || "").trim());
      } else {
        setRoomError("รหัสผ่านไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง");
      }
    } else {
      setRoomError(`ไม่พบผู้ประสานงานประจำห้องเรียนผู้ใช้งาน "${uName}"`);
    }
  };

  return (
    <div className="min-h-[88vh] flex flex-col justify-start items-center px-4 py-8 bg-[#f8faf9] text-slate-900 select-none font-sans">
      
      {!isConfigured && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4 text-amber-900 text-xs flex items-start gap-3 shadow-xs max-w-md w-full">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold text-amber-900 text-xs">ยังไม่ได้เชื่อมต่อระบบฐานข้อมูล</p>
            <p className="text-[11px] leading-relaxed text-amber-800 font-medium">
              ไม่สามารถเข้าสู่ระบบได้เนื่องจากยังไม่ได้เชื่อมต่อระบบข้อมูล กรุณาติดต่อผู้ดูแลระบบ
            </p>
          </div>
        </div>
      )}

      {/* STEP 1: ROLE SELECTION PAGE */}
      {selectedRole === null ? (
        <div className="max-w-md mx-auto w-full flex flex-col items-center">
          
          {/* Header Title */}
          <div className="text-center mt-2 mb-5">
            <div className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 px-3.5 py-1 rounded-full text-[11px] font-extrabold mb-2 border border-emerald-200/80">
              GREEN TEAM SPORTS PORTAL
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              เข้าสู่ระบบคณะสีเขียว
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              เลือกบทบาทของคุณเพื่อดำเนินการต่อ (Select your role to start)
            </p>
          </div>

          {/* Clean Modern Vector Banner */}
          <div className="w-full bg-linear-to-br from-emerald-600 to-teal-800 rounded-3xl p-6 mb-6 text-white shadow-md relative overflow-hidden flex flex-col items-center text-center">
            {/* Background Decorative Rings */}
            <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-emerald-400/20 rounded-full blur-xl pointer-events-none" />

            <div className="bg-white/15 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 mb-3 text-emerald-100 shadow-xs">
              <Trophy size={32} />
            </div>

            <h2 className="text-lg font-black tracking-wide text-white">
              ยินดีต้อนรับสู่ระบบสารสนเทศกีฬา
            </h2>
            <p className="text-emerald-100 text-xs font-medium mt-1 leading-relaxed max-w-xs">
              สมัครคัดเลือกกีฬา ติดตามผลการคัดเลือก และจัดการข้อมูลสมาชิกประจำคณะสีเขียว
            </p>
          </div>

          {/* Role Pill Buttons */}
          <div className="w-full space-y-3">
            
            {/* Student Role Pill */}
            <button
              onClick={() => handleSelectRole("student")}
              className="w-full bg-white hover:bg-emerald-50/70 border-2 border-slate-900 text-slate-900 rounded-2xl py-4 px-5 flex items-center justify-between transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="bg-emerald-600 text-white rounded-xl p-2.5 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <User size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-slate-950 text-xs font-extrabold">
                    นักกีฬาสีเขียว (นักเรียน)
                  </span>
                  <span className="block text-slate-500 text-[11px] font-medium mt-0.5">
                    ตรวจสอบสถานะและสมัครคัดเลือกตัวกีฬา
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all shrink-0" />
            </button>

            {/* Staff Role Pill */}
            <button
              onClick={() => handleSelectRole("staff")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 px-5 flex items-center justify-between transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="bg-slate-800 text-emerald-400 rounded-xl p-2.5 shrink-0 group-hover:scale-105 transition-transform border border-slate-700">
                  <Shield size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-white text-xs font-extrabold">
                    สตาฟฟ์คณะสีเขียว (ผู้ดูแล)
                  </span>
                  <span className="block text-slate-400 text-[11px] font-medium mt-0.5">
                    จัดการชนิดกีฬา สรุปผลคัดเลือก และประกาศหลัก
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 group-hover:text-white transition-all shrink-0" />
            </button>

            {/* Room Manager Role Pill */}
            <button
              onClick={() => handleSelectRole("room_manager")}
              className="w-full bg-white hover:bg-emerald-50/70 border-2 border-emerald-700 text-emerald-950 rounded-2xl py-4 px-5 flex items-center justify-between transition-all cursor-pointer shadow-xs hover:shadow-md active:scale-[0.99] group"
            >
              <div className="flex items-center gap-3.5">
                <div className="bg-emerald-800 text-white rounded-xl p-2.5 shrink-0 group-hover:scale-105 transition-transform shadow-xs">
                  <Building2 size={20} />
                </div>
                <div className="text-left">
                  <span className="block text-emerald-950 text-xs font-extrabold">
                    ผู้ประสานงานห้องเรียน (ผจก.ห้อง)
                  </span>
                  <span className="block text-slate-500 text-[11px] font-medium mt-0.5">
                    สรุปผลและติดตามรายชื่อนักกีฬาประจำห้องเรียน
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-slate-400 group-hover:translate-x-1 group-hover:text-emerald-700 transition-all shrink-0" />
            </button>

          </div>

          <div className="mt-8 text-center">
            <p className="text-[11px] text-slate-400 font-semibold">
              คณะสีเขียว • ระบบจัดการข้อมูลกีฬา
            </p>
          </div>

        </div>
      ) : (
        /* STEP 2: LOGIN FORM PAGE FOR SELECTED ROLE */
        <div className="max-w-md mx-auto w-full flex flex-col relative">
          
          {/* Top Bar with Back and Close Buttons */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleResetRole}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-600 hover:text-slate-950 transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-full border border-slate-200/90 shadow-2xs"
            >
              <ArrowLeft size={15} />
              <span>ย้อนกลับ</span>
            </button>

            <button
              onClick={handleResetRole}
              className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300 flex items-center justify-center text-slate-700 transition cursor-pointer"
              title="ย้อนกลับ"
            >
              <X size={16} />
            </button>
          </div>

          {/* Heading */}
          <div className="mt-1 mb-4 text-left">
            <h1 className="text-2xl font-black text-slate-950">
              เข้าสู่ระบบ
            </h1>
            <p className="text-slate-500 text-xs font-semibold mt-1">
              {activeTab === "student" && "สำหรับนักกีฬาสีเขียว ตรวจสอบสถานะและสมัครกีฬา"}
              {activeTab === "staff" && "สำหรับสตาฟฟ์กลางคณะสีเขียว จัดการระบบและประเมินผล"}
              {activeTab === "room_manager" && "สำหรับผู้ประสานงานประจำห้องเรียน สรุปข้อมูลสมาชิก"}
            </p>
          </div>

          {/* Form Container */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-xs text-left mb-4">
            
            {/* STUDENT FORM */}
            {activeTab === "student" && (
              <form onSubmit={handleStudentCheck} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-extrabold px-3 py-1 rounded-full border border-emerald-200">
                    บัญชีนักกีฬาสีเขียว
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    รหัสประจำตัวนักเรียน
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={typedStudentId}
                    onChange={(e) => setTypedStudentId(e.target.value.replace(/\D/g, ""))}
                    placeholder="กรอกเลขประจำตัว เช่น 10001"
                    className="w-full border-2 border-slate-300 focus:border-slate-900 rounded-2xl px-4 py-3.5 text-xs font-mono focus:outline-none bg-white text-slate-900 placeholder-slate-400 font-bold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      value={typedPassword}
                      onChange={(e) => setTypedPassword(e.target.value)}
                      placeholder="พิมพ์รหัสผ่าน (เริ่มต้นคือ เลขประจำตัว)"
                      className="w-full border-2 border-slate-300 focus:border-slate-900 rounded-2xl pl-11 pr-4 py-3.5 text-xs focus:outline-none bg-white text-slate-900 font-bold transition-all"
                      required
                    />
                  </div>
                </div>

                {studentLoginError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-relaxed">
                      {studentLoginError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-sm mt-3 flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบแดชบอร์ดนักกีฬา</span>
                  <ChevronRight size={16} />
                </button>
              </form>
            )}

            {/* STAFF FORM */}
            {activeTab === "staff" && (
              <form onSubmit={handleStaffLogin} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-slate-900 text-white text-[11px] font-extrabold px-3 py-1 rounded-full border border-slate-700">
                    บัญชีสตาฟฟ์กลางคณะสีเขียว
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    ชื่อผู้ใช้งานสตาฟฟ์ (Username)
                  </label>
                  <input
                    type="text"
                    value={staffUsername}
                    onChange={(e) => setStaffUsername(e.target.value)}
                    placeholder="ระบุชื่อผู้ใช้งาน เช่น GREENSTAFF"
                    className="w-full border-2 border-slate-300 focus:border-slate-900 rounded-2xl px-4 py-3.5 text-xs focus:outline-none bg-white text-slate-900 font-bold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    รหัสผ่านสตาฟฟ์ (Password)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      value={staffPassword}
                      onChange={(e) => setStaffPassword(e.target.value)}
                      placeholder="พิมพ์รหัสผ่านสตาฟฟ์..."
                      className="w-full border-2 border-slate-300 focus:border-slate-900 rounded-2xl pl-11 pr-4 py-3.5 text-xs focus:outline-none bg-white text-slate-900 font-bold transition-all"
                      required
                    />
                  </div>
                </div>

                {staffError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-relaxed">
                      {staffError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-sm mt-3 flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบควบคุมสตาฟฟ์สีเขียว</span>
                  <ChevronRight size={16} />
                </button>
              </form>
            )}

            {/* ROOM MANAGER FORM */}
            {activeTab === "room_manager" && (
              <form onSubmit={handleRoomLogin} className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-100 text-emerald-900 text-[11px] font-extrabold px-3 py-1 rounded-full border border-emerald-300">
                    บัญชีผู้ประสานงานประจำห้องเรียน
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    ชื่อผู้ใช้งานห้องเรียน (Username)
                  </label>
                  <input
                    type="text"
                    value={roomUsername}
                    onChange={(e) => setRoomUsername(e.target.value)}
                    placeholder="ระบุชื่อผู้ใช้งาน เช่น ROOM601"
                    className="w-full border-2 border-slate-300 focus:border-slate-900 rounded-2xl px-4 py-3.5 text-xs focus:outline-none bg-white text-slate-900 font-bold transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-extrabold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    รหัสผ่านห้องเรียน (Password)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-slate-400">
                      <Lock size={16} />
                    </span>
                    <input
                      type="password"
                      value={roomPassword}
                      onChange={(e) => setRoomPassword(e.target.value)}
                      placeholder="พิมพ์รหัสผ่าน..."
                      className="w-full border-2 border-slate-300 focus:border-slate-900 rounded-2xl pl-11 pr-4 py-3.5 text-xs focus:outline-none bg-white text-slate-900 font-bold transition-all"
                      required
                    />
                  </div>
                </div>

                {roomError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-2xl p-3.5 flex items-start gap-2.5">
                    <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] font-bold leading-relaxed">
                      {roomError}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full bg-emerald-800 hover:bg-emerald-900 active:scale-[0.99] text-white font-extrabold py-3.5 rounded-2xl text-xs transition cursor-pointer shadow-sm mt-3 flex items-center justify-center gap-2"
                >
                  <span>เข้าสู่ระบบสรุปผลรายห้องเรียน</span>
                  <ChevronRight size={16} />
                </button>
              </form>
            )}

          </div>

          <div className="mt-4 text-center">
            <p className="text-[11px] text-slate-400 font-semibold">
              คณะสีเขียว • ระบบจัดการข้อมูลกีฬา
            </p>
          </div>

        </div>
      )}

    </div>
  );
}


