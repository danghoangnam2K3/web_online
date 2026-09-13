'use client';

import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  Award,
  Shuffle,
  PlusCircle,
  Circle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  GripVertical
} from 'lucide-react';

const EMPTY_OPTION = () => ({ id: Date.now() + Math.random(), text: '', isCorrect: false });

const EMPTY_QUESTION = () => ({
  id: Date.now() + Math.random(),
  question: '',
  options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
  shuffleAnswers: false,   // trộn đáp án riêng từng câu
  expanded: true
});

export default function CreateChapterQuizModal({ isOpen, onClose, onSaveQuiz, chapterTitle }) {
  const [quizTitle, setQuizTitle] = useState('');
  const [globalShuffle, setGlobalShuffle] = useState(false); // trộn đáp án toàn bộ
  const [questions, setQuestions] = useState([EMPTY_QUESTION()]);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  // ── Câu hỏi ──────────────────────────────────────────────────────────────────
  const addQuestion = () => {
    setQuestions(prev => [...prev, EMPTY_QUESTION()]);
  };

  const removeQuestion = (qId) => {
    if (questions.length === 1) {
      alert('Bài kiểm tra phải có ít nhất 1 câu hỏi!');
      return;
    }
    setQuestions(prev => prev.filter(q => q.id !== qId));
  };

  const updateQuestion = (qId, field, value) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, [field]: value } : q));
  };

  const toggleExpand = (qId) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, expanded: !q.expanded } : q));
  };

  // ── Đáp án ───────────────────────────────────────────────────────────────────
  const addOption = (qId) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      if (q.options.length >= 6) { alert('Tối đa 6 đáp án cho mỗi câu!'); return q; }
      return { ...q, options: [...q.options, EMPTY_OPTION()] };
    }));
  };

  const removeOption = (qId, oId) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      if (q.options.length <= 2) { alert('Mỗi câu phải có ít nhất 2 đáp án!'); return q; }
      return { ...q, options: q.options.filter(o => o.id !== oId) };
    }));
  };

  const updateOption = (qId, oId, text) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return { ...q, options: q.options.map(o => o.id === oId ? { ...o, text } : o) };
    }));
  };

  const setCorrectOption = (qId, oId) => {
    // Chỉ 1 đáp án đúng mỗi câu
    setQuestions(prev => prev.map(q => {
      if (q.id !== qId) return q;
      return { ...q, options: q.options.map(o => ({ ...o, isCorrect: o.id === oId })) };
    }));
  };

  // ── Validate & Submit ─────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question.trim()) {
        alert(`Câu hỏi ${i + 1}: Vui lòng nhập nội dung câu hỏi!`);
        return;
      }
      const filledOptions = q.options.filter(o => o.text.trim());
      if (filledOptions.length < 2) {
        alert(`Câu hỏi ${i + 1}: Phải có ít nhất 2 đáp án!`);
        return;
      }
      const correctOption = q.options.find(o => o.isCorrect);
      if (!correctOption) {
        alert(`Câu hỏi ${i + 1}: Vui lòng chọn đáp án đúng!`);
        return;
      }
    }

    setSaving(true);
    const quizData = {
      title: quizTitle.trim() || `Bài Kiểm Tra — ${chapterTitle}`,
      shuffle_answers: globalShuffle,
      questions: questions.map((q, idx) => ({
        order_index: idx + 1,
        question: q.question.trim(),
        shuffle_answers: q.shuffleAnswers || globalShuffle,
        options: q.options
          .filter(o => o.text.trim())
          .map((o, oIdx) => ({
            order_index: oIdx + 1,
            text: o.text.trim(),
            is_correct: o.isCorrect
          }))
      }))
    };

    try {
      await onSaveQuiz(quizData);
      // Reset
      setQuizTitle('');
      setGlobalShuffle(false);
      setQuestions([EMPTY_QUESTION()]);
      onClose();
    } catch (err) {
      alert('Lỗi lưu bài kiểm tra: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const totalQuestions = questions.length;
  const validQuestions = questions.filter(q =>
    q.question.trim() && q.options.some(o => o.isCorrect)
  ).length;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-100 animate-modal">

        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-violet-600 p-5 rounded-t-2xl flex-shrink-0">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shadow">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">Tạo Bài Kiểm Tra Chương</h2>
              <p className="text-xs text-purple-200 mt-0.5">
                Chương: <span className="font-bold text-white">{chapterTitle}</span>
              </p>
            </div>
          </div>

          {/* Progress */}
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-400 rounded-full transition-all duration-300"
                style={{ width: `${totalQuestions > 0 ? (validQuestions / totalQuestions) * 100 : 0}%` }}
              />
            </div>
            <span className="text-xs text-white/80 font-semibold whitespace-nowrap">
              {validQuestions}/{totalQuestions} câu hoàn chỉnh
            </span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-5 space-y-5">

            {/* Tiêu đề bài kiểm tra + Trộn toàn bộ */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Tiêu Đề Bài Kiểm Tra <span className="text-slate-400 font-normal">(tùy chọn)</span>
                </label>
                <input
                  type="text"
                  placeholder={`Bài Kiểm Tra — ${chapterTitle}`}
                  value={quizTitle}
                  onChange={e => setQuizTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              {/* Tick trộn đáp án toàn bộ */}
              <div
                onClick={() => setGlobalShuffle(!globalShuffle)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border-2 cursor-pointer transition-all select-none flex-shrink-0 ${
                  globalShuffle
                    ? 'border-violet-500 bg-violet-50 text-violet-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                }`}
              >
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                  globalShuffle ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                }`}>
                  {globalShuffle && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                </div>
                <Shuffle className="w-4 h-4" />
                <span className="text-xs font-bold whitespace-nowrap">Trộn tất cả đáp án</span>
              </div>
            </div>

            {/* Danh sách câu hỏi */}
            <div className="space-y-4">
              {questions.map((q, qIdx) => {
                const hasCorrect = q.options.some(o => o.isCorrect);
                const isComplete = q.question.trim() && hasCorrect;

                return (
                  <div
                    key={q.id}
                    className={`border-2 rounded-2xl overflow-hidden transition-all ${
                      isComplete ? 'border-emerald-200' : 'border-slate-200'
                    }`}
                  >
                    {/* Question header */}
                    <div className={`px-4 py-3 flex items-center gap-3 ${
                      isComplete ? 'bg-emerald-50' : 'bg-slate-50'
                    }`}>
                      <div className={`w-7 h-7 rounded-lg font-extrabold text-xs flex items-center justify-center flex-shrink-0 ${
                        isComplete ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-700'
                      }`}>
                        {isComplete ? <CheckCircle2 className="w-4 h-4" /> : qIdx + 1}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpand(q.id)}
                        className="flex-1 text-left"
                      >
                        <p className={`text-xs font-bold truncate ${isComplete ? 'text-emerald-800' : 'text-slate-700'}`}>
                          {q.question.trim() || `Câu hỏi ${qIdx + 1} — Chưa nhập nội dung`}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {q.options.filter(o => o.text.trim()).length} đáp án
                          {hasCorrect ? ' • Đã chọn đáp án đúng ✓' : ' • Chưa chọn đáp án đúng'}
                        </p>
                      </button>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Trộn đáp án riêng câu này */}
                        <button
                          type="button"
                          onClick={() => updateQuestion(q.id, 'shuffleAnswers', !q.shuffleAnswers)}
                          title="Trộn đáp án câu này"
                          className={`p-1.5 rounded-lg transition-colors ${
                            (q.shuffleAnswers || globalShuffle)
                              ? 'bg-violet-100 text-violet-700'
                              : 'text-slate-400 hover:bg-slate-100'
                          }`}
                        >
                          <Shuffle className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleExpand(q.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                        >
                          {q.expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>

                        <button
                          type="button"
                          onClick={() => removeQuestion(q.id)}
                          className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Question body */}
                    {q.expanded && (
                      <div className="p-4 space-y-3 bg-white">
                        {/* Nội dung câu hỏi */}
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1.5 uppercase tracking-wide">
                            Nội Dung Câu Hỏi <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            rows={2}
                            placeholder="VD: Tốc độ tối đa cho phép trong khu đô thị là bao nhiêu km/h?"
                            value={q.question}
                            onChange={e => updateQuestion(q.id, 'question', e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                          />
                        </div>

                        {/* Danh sách đáp án */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wide">
                              Các Đáp Án <span className="text-slate-400 font-normal">(click vòng tròn để chọn đáp án đúng)</span>
                            </label>
                            <span className="text-[10px] text-slate-400">
                              {q.options.filter(o => o.text.trim()).length}/6 đáp án
                            </span>
                          </div>

                          <div className="space-y-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={opt.id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border transition-all ${
                                opt.isCorrect
                                  ? 'border-emerald-400 bg-emerald-50/60'
                                  : 'border-slate-200 bg-slate-50/40 hover:border-slate-300'
                              }`}>
                                {/* Select correct button */}
                                <button
                                  type="button"
                                  onClick={() => setCorrectOption(q.id, opt.id)}
                                  title="Đánh dấu là đáp án đúng"
                                  className="flex-shrink-0"
                                >
                                  {opt.isCorrect ? (
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                  ) : (
                                    <Circle className="w-5 h-5 text-slate-300 hover:text-slate-400 transition-colors" />
                                  )}
                                </button>

                                {/* Option letter badge */}
                                <span className={`w-5 h-5 rounded-md text-[11px] font-extrabold flex items-center justify-center flex-shrink-0 ${
                                  opt.isCorrect ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                                }`}>
                                  {String.fromCharCode(65 + oIdx)}
                                </span>

                                {/* Input đáp án */}
                                <input
                                  type="text"
                                  placeholder={`Đáp án ${String.fromCharCode(65 + oIdx)}...`}
                                  value={opt.text}
                                  onChange={e => updateOption(q.id, opt.id, e.target.value)}
                                  className={`flex-1 text-sm bg-transparent outline-none py-0.5 font-medium ${
                                    opt.isCorrect ? 'text-emerald-800 placeholder-emerald-300' : 'text-slate-700 placeholder-slate-300'
                                  }`}
                                />

                                {/* Remove option */}
                                <button
                                  type="button"
                                  onClick={() => removeOption(q.id, opt.id)}
                                  className="p-1 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>

                          {/* Add option */}
                          {q.options.length < 6 && (
                            <button
                              type="button"
                              onClick={() => addOption(q.id)}
                              className="mt-2 w-full py-2 rounded-xl border border-dashed border-slate-300 text-xs font-bold text-slate-500 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-1.5"
                            >
                              <Plus className="w-3.5 h-3.5" /> Thêm Đáp Án
                            </button>
                          )}
                        </div>

                        {/* Trộn đáp án câu này */}
                        <div
                          onClick={() => updateQuestion(q.id, 'shuffleAnswers', !q.shuffleAnswers)}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer select-none transition-all text-[11px] ${
                            (q.shuffleAnswers || globalShuffle)
                              ? 'border-violet-300 bg-violet-50 text-violet-700'
                              : 'border-slate-200 text-slate-500 hover:border-violet-200'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                            (q.shuffleAnswers || globalShuffle) ? 'bg-violet-600 border-violet-600' : 'border-slate-300'
                          }`}>
                            {(q.shuffleAnswers || globalShuffle) && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                          </div>
                          <Shuffle className="w-3.5 h-3.5" />
                          <span className="font-semibold">
                            Trộn đáp án câu này
                            {globalShuffle && !q.shuffleAnswers && <span className="text-violet-400 ml-1">(bật bởi cài đặt toàn bộ)</span>}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Thêm câu hỏi */}
            <button
              type="button"
              onClick={addQuestion}
              className="w-full py-3 rounded-2xl border-2 border-dashed border-purple-300 text-sm font-bold text-purple-600 hover:border-purple-500 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              Thêm Câu Hỏi Mới
            </button>

            {/* Info note */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
              <div>
                <p className="font-bold mb-0.5">Lưu ý khi tạo câu hỏi:</p>
                <ul className="space-y-0.5 text-amber-700">
                  <li>• Click vòng tròn ○ bên cạnh đáp án để chọn đáp án <strong>đúng</strong></li>
                  <li>• Mỗi câu hỏi bắt buộc phải có ít nhất <strong>2 đáp án</strong> và <strong>1 đáp án đúng</strong></li>
                  <li>• Bật &quot;Trộn đáp án&quot; để xáo trộn thứ tự đáp án khi học viên làm bài</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between gap-3 flex-shrink-0">
            <div className="text-xs text-slate-500">
              <span className="font-bold text-purple-700">{totalQuestions}</span> câu hỏi •{' '}
              <span className="font-bold text-emerald-700">{validQuestions}</span> hoàn chỉnh
              {globalShuffle && (
                <span className="ml-2 px-1.5 py-0.5 bg-violet-100 text-violet-700 font-bold rounded text-[10px]">
                  🔀 Trộn đáp án
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving || validQuestions === 0}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Award className="w-4 h-4" />
                {saving ? 'Đang lưu...' : `Lưu Bài Kiểm Tra (${validQuestions} câu)`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
