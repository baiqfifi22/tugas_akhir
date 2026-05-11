import React from "react";
import Link from "next/link";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { GraduationCap, Users } from "lucide-react";

import { useState, useEffect } from "react";

interface MyClass {
  id: string | number;
  name: string;
  students: number;
  label: string;
}

export default function TeacherLanding() {
  const [myClasses, setMyClasses] = useState<MyClass[]>([]);

  const [teacherName, setTeacherName] = useState<string>("Bapak/Ibu Guru");

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const res = await fetch("/api/teacher/me");
        if (res.ok) {
          const data = await res.json();

          console.log(data);


          if (data.success) {
            setTeacherName(data.teacher.name);
            setMyClasses(data.classes);
          }
        }
      } catch (error) {
        console.error("Failed to fetch teacher data", error);
      }
    };
    fetchClasses();
  }, []);

  return (
    <Layout role="teacher" hasSidebar={false}>
      {/* Hero Section */}
      <div className="mb-8 ">
        <Card className="bg-blue-600 text-white overflow-hidden p-0 border-none relative min-h-[200px] flex flex-col justify-center bg-gradient-to-r from-[#f4d35e] via-[#ee964b] to-[#f95738]">
          {/* Decorative background visual */}
          <div className="flex justify-between">
            <div className="absolute top-0 right-0 w-1/2 h-full opacity-20 pointer-events-none overflow-hidden ">
              <div className="w-64 h-64 bg-white rounded-full absolute -top-10 -right-10 blur-3xl"></div>
              <div className="w-48 h-48 bg-blue-300 rounded-full absolute bottom-0 right-32 blur-2xl"></div>
            </div>

            <div className="relative z-10 px-8 py-10 md:px-12 max-w-2xl ">
              <h1 className="text-3xl md:text-4xl font-bold mb-4 text-black">
                Selamat Datang, {teacherName}!
              </h1>
              <p className="text-white text-lg">
                Kelola dan pantau absensi kelas Anda dengan efisien. Semangat
                mengajar hari ini untuk mencerdaskan kehidupan bangsa.
              </p>
            </div>

            <div>
              <img src="/photo.png" alt="" className="w-90 h-60 mt-5 mr-25" />
            </div>
          </div>
        </Card>
      </div>

      {/* My Class Section */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 mb-6 flex items-center gap-2">
          <GraduationCap size={24} className="text-blue-600" />
          My Class
        </h2>
        {myClasses.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            Belum ada data kelas yang terhubung.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClasses.map((cls) => (
              <Link key={cls.id} href={`/teacher/class/${cls.id}/attendance`}>
                <Card
                  interactive
                  className="group cursor-pointer hover:border-blue-200 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                      <Users size={24} />
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600">
                      {cls.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900 mb-1">
                    {cls.name}
                  </h3>
                  <p className="text-sm text-zinc-500">{cls.students} Siswa</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
