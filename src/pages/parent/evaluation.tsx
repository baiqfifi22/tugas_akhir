import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Star, School, User, BookOpen, CheckCircle2 } from "lucide-react";

import { LucideIcon } from "lucide-react";

interface EvaluationSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
  bg: string;
}

export default function ParentEvaluation() {
  const [evaluationSections, setEvaluationSections] = useState<EvaluationSection[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  React.useEffect(() => {
    // TODO: fetch data evaluasi (siapa wali kelasnya, guru agamanya) dari database
  }, []);

  const handleRating = (sectionId: string, value: number) => {
    setRatings((prev) => ({ ...prev, [sectionId]: value }));
  };

  const handleComment = (sectionId: string, value: string) => {
    setComments((prev) => ({ ...prev, [sectionId]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validasi: Pastikan semua section sudah diberi rating
    const allRated = evaluationSections.length > 0 && evaluationSections.every((sec) => ratings[sec.id]);
    if (!allRated) {
      alert("Mohon berikan rating (bintang) untuk semua bagian evaluasi.");
      return;
    }

    setIsSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    setTimeout(() => {
      setIsSubmitted(false);
      setRatings({});
      setComments({});
    }, 5000);
  };

  return (
    <Layout role="parent">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Evaluasi & Masukan</h1>
          <p className="text-zinc-500">Berikan penilaian Anda untuk kemajuan pendidikan anak.</p>
        </div>
      </div>

      {isSubmitted && (
        <div className="mb-8 flex items-center gap-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-5 rounded-2xl shadow-sm animate-in fade-in slide-in-from-top-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="font-bold text-lg">Terima Kasih atas Masukan Anda!</p>
            <p className="text-emerald-700 font-medium">Evaluasi Anda sangat berarti bagi pengembangan sekolah dan para guru kami.</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {evaluationSections.length === 0 ? (
          <div className="text-center py-12 text-zinc-500 bg-white border border-zinc-200 rounded-2xl">
            Belum ada form evaluasi untuk saat ini.
          </div>
        ) : (
          evaluationSections.map((section) => (
            <Card key={section.id} className="overflow-hidden border-t-0 p-0">
            <div className={`h-2 w-full ${section.bg.replace('100', '500')}`} />
            <div className="p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${section.bg} ${section.color}`}>
                  <section.icon size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 mb-1">{section.title}</h2>
                  <p className="text-sm text-zinc-500 leading-relaxed">{section.description}</p>
                </div>
              </div>

              <div className="space-y-6 pl-16">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-3">Tingkat Kepuasan <span className="text-red-500">*</span></label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRating(section.id, star)}
                        className={`p-1.5 transition-all hover:scale-110 focus:outline-none ${
                          (ratings[section.id] || 0) >= star
                            ? "text-yellow-400"
                            : "text-zinc-200 hover:text-yellow-200"
                        }`}
                      >
                        <Star
                          size={32}
                          className={(ratings[section.id] || 0) >= star ? "fill-current" : ""}
                        />
                      </button>
                    ))}
                    <span className="ml-4 text-sm font-medium text-zinc-400">
                      {ratings[section.id] === 5 ? "Sangat Baik" :
                       ratings[section.id] === 4 ? "Baik" :
                       ratings[section.id] === 3 ? "Cukup" :
                       ratings[section.id] === 2 ? "Kurang" :
                       ratings[section.id] === 1 ? "Sangat Kurang" : "Belum dinilai"}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-2">Komentar & Masukan (Opsional)</label>
                  <textarea
                    rows={3}
                    value={comments[section.id] || ""}
                    onChange={(e) => handleComment(section.id, e.target.value)}
                    placeholder="Tuliskan pendapat, saran, atau kritik membangun..."
                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm text-zinc-700 bg-zinc-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                  />
                </div>
              </div>
            </div>
          </Card>
        )))}

        <div className="flex justify-end pt-4 pb-8">
          <Button type="submit" variant="primary" className="px-8 py-3 text-base shadow-lg shadow-blue-500/20">
            Kirim Evaluasi
          </Button>
        </div>
      </form>
    </Layout>
  );
}
