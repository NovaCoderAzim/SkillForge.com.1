import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  ArrowLeft, Video, HelpCircle, FileText, Star,
  Trash2, Edit3, Layout, ChevronDown, Plus, Code, Radio, Zap,
  X, Clock, Lock, BarChart, GripVertical, Save, Users, Award, TrendingUp, Image as ImageIcon
} from "lucide-react";
import { GlassToast } from "./components/GlassToast";

interface CodeProblem {
  title: string;
  description: string;
  difficulty: string;
  testCases: { input: string; output: string }[];
}

const getLessonIcon = (type: string) => {
  switch (type) {
    case 'video': return <Video size={18} className="text-blue-500" />;
    case 'note': return <FileText size={18} className="text-amber-500" />;
    case 'quiz': return <HelpCircle size={18} className="text-emerald-500" />;
    case 'code': return <Code size={18} className="text-purple-500" />;
    case 'assignment': return <FileText size={18} className="text-indigo-500" />;
    case 'live': return <Radio size={18} className="text-red-500" />;
    case 'test': return <Zap size={18} className="text-yellow-500" />;
    default: return <FileText size={18} className="text-slate-500" />;
  }
};

const CourseBuilder = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();

  // Course State
  const [courseTitle, setCourseTitle] = useState("Loading...");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseImageUrl, setCourseImageUrl] = useState("");
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [finalizeConfirmation, setFinalizeConfirmation] = useState("");

  // UI State
  const [expandedModules, setExpandedModules] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState("Curriculum");
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);

  // Settings & Pricing State
  const [priceType, setPriceType] = useState("Free");
  const [priceAmount, setPriceAmount] = useState("0");
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Add Module State
  const [showAddModule, setShowAddModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState("");

  // Content Selection Modal
  const [showContentPicker, setShowContentPicker] = useState<number | null>(null);

  // Add/Edit Item Modal State
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [itemTitle, setItemTitle] = useState("");
  const [itemUrl, setItemUrl] = useState("");
  const [itemInstructions, setItemInstructions] = useState("");
  const [duration, setDuration] = useState("");
  const [isMandatory, setIsMandatory] = useState(false);

  const [problems, setProblems] = useState<CodeProblem[]>([
    { title: "", description: "", difficulty: "Easy", testCases: [{ input: "", output: "" }] }
  ]);
  const [activeProblemIndex, setActiveProblemIndex] = useState(0);

  const triggerToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ show: true, message, type });
    // 2.5s display time
    setTimeout(() => setToast({ show: false, message: "", type }), 2500);
  };

  useEffect(() => {
    fetchCourseData();
    fetchPublishedState();
  }, [courseId]);

  const fetchPublishedState = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", { headers: { Authorization: `Bearer ${token}` } });
      const currentCourse = res.data.find((c: any) => c.id === Number(courseId));
      if (currentCourse) {
        setIsPublished(currentCourse.is_published);
      }
    } catch (e) { console.error(e); }
  };

  const fetchCourseData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(`http://127.0.0.1:8000/api/v1/courses/${courseId}/player`, { headers: { Authorization: `Bearer ${token}` } });
      setCourseTitle(res.data.title);
      setCourseDescription(res.data.description || "A comprehensive course designed to help students master the fundamentals.");
      setPriceAmount(res.data.price ? res.data.price.toString() : "0");
      setPriceType(res.data.price > 0 ? "Paid" : "Free");
      setCourseImageUrl(res.data.image_url || "");

      setModules(res.data.modules);
      setIsFinalized(res.data.is_finalized || false);
      if (res.data.modules.length > 0) {
        setExpandedModules(res.data.modules.map((m: any) => m.id));
      }
      
      try {
        const feedbackRes = await axios.get(`http://127.0.0.1:8000/api/v1/instructor/reviews`, { headers: { Authorization: `Bearer ${token}` } });
        setFeedbacks(feedbackRes.data.filter((f: any) => f.course_id === Number(courseId)));
      } catch (err) {
        console.error("Failed to load reviews:", err);
      }
      
    } catch (err) {
      console.error("Failed to load curriculum", err);
      triggerToast("Failed to load course details", "error");
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop ordering handler
  const onDragEnd = async (result: any) => {
    if (!result.destination) return;
    if (isFinalized) return;

    const { source, destination, type } = result;
    if (destination.index === source.index && destination.droppableId === source.droppableId) return;

    if (type === "module") {
      // Reorder Modules
      const newModules = Array.from(modules);
      const [reorderedItem] = newModules.splice(source.index, 1);
      newModules.splice(destination.index, 0, reorderedItem);
      setModules(newModules);

      setIsSavingOrder(true);
      try {
        const token = localStorage.getItem("token");
        await axios.patch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/modules/reorder`, {
          module_ids: newModules.map(m => m.id)
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        triggerToast("Failed to save reorder.", "error");
        fetchCourseData();
      } finally { setIsSavingOrder(false); }

    } else if (type === "lesson") {
      // Reorder Lessons (Cross-Module support)
      const newModules = Array.from(modules);
      const sourceModuleIndex = newModules.findIndex(m => `module-${m.id}` === source.droppableId);
      const destModuleIndex = newModules.findIndex(m => `module-${m.id}` === destination.droppableId);

      if (sourceModuleIndex === -1 || destModuleIndex === -1) return;

      const sourceLessons = Array.from(newModules[sourceModuleIndex].lessons || []);
      const destLessons = source.droppableId === destination.droppableId ? sourceLessons : Array.from(newModules[destModuleIndex].lessons || []);

      const [reorderedLesson] = sourceLessons.splice(source.index, 1);
      destLessons.splice(destination.index, 0, reorderedLesson);

      newModules[sourceModuleIndex].lessons = sourceLessons;
      if (source.droppableId !== destination.droppableId) {
        newModules[destModuleIndex].lessons = destLessons;
      }
      setModules(newModules);

      // Collect required API data
      const affectedLessons: any[] = [];
      newModules[sourceModuleIndex].lessons.forEach((l: any, idx: number) => {
        affectedLessons.push({ lesson_id: l.id, module_id: newModules[sourceModuleIndex].id, order: idx });
      });
      if (source.droppableId !== destination.droppableId) {
        newModules[destModuleIndex].lessons.forEach((l: any, idx: number) => {
          affectedLessons.push({ lesson_id: l.id, module_id: newModules[destModuleIndex].id, order: idx });
        });
      }

      setIsSavingOrder(true);
      try {
        const token = localStorage.getItem("token");
        await axios.patch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/lessons/reorder`, {
          items: affectedLessons
        }, { headers: { Authorization: `Bearer ${token}` } });
      } catch (err) {
        triggerToast("Failed to save lesson order", "error");
        fetchCourseData();
      } finally { setIsSavingOrder(false); }
    }
  };

  const handleAddModule = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      const token = localStorage.getItem("token");
      await axios.post(`http://127.0.0.1:8000/api/v1/courses/${courseId}/modules`, {
        title: newModuleTitle, order: modules.length + 1
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewModuleTitle(""); setShowAddModule(false);
      fetchCourseData();
      triggerToast("Module added successfully!", "success");
    } catch (err) { triggerToast("Error adding module", "error"); }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/publish`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsPublished(true);
      if (isPublished) triggerToast("Course Changes Republished Successfully!", "success");
      else triggerToast("Course Published! It is now live.", "success");
    } catch (err) { triggerToast("Error publishing course.", "error"); } finally { setIsPublishing(false); }
  };

  const handleFinalize = async () => {
    if (finalizeConfirmation !== "FINALIZE") {
      triggerToast("Please type exactly FINALIZE to confirm", "error");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/finalize`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setIsFinalized(true);
      setShowFinalizeModal(false);
      triggerToast("Course Permanently Finalized!", "success");
    } catch (err) { triggerToast("Error finalizing course.", "error"); }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (isFinalized) return;
    if (!confirm("Are you sure you want to delete this item? This cannot be undone.")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://127.0.0.1:8000/api/v1/content/${itemId}`, { headers: { Authorization: `Bearer ${token}` } });
      fetchCourseData();
      triggerToast("Item deleted successfully", "success");
    } catch (err) { triggerToast("Failed to delete item.", "error"); }
  };

  const handleEditStart = (item: any) => {
    if (isFinalized) return;
    setEditingItem(item);
    setActiveModal("EditItem");
    setItemTitle(item.title || "");
    setItemUrl(item.url || "");
  };

  const handleEditSave = async () => {
    if (!editingItem) return;
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/content/${editingItem.id}`, {
        title: itemTitle, url: itemUrl
      }, { headers: { Authorization: `Bearer ${token}` } });
      setEditingItem(null); setActiveModal(null); fetchCourseData();
      triggerToast("Item updated successfully", "success");
    } catch (err) { triggerToast("Failed to update item.", "error"); }
  };

  const saveContentItem = async () => {
    if (!selectedModuleId) return triggerToast("Select a module to add this item to.", "error");
    if (!itemTitle.trim()) return triggerToast("Please enter a title for this item.", "error");

    const token = localStorage.getItem("token");
    const typeKey = activeModal?.toLowerCase().replace(" ", "_") || "video";

    const payload: any = {
      title: itemTitle, type: typeKey, data_url: itemUrl, duration: duration ? parseInt(duration) : null,
      is_mandatory: isMandatory, instructions: itemInstructions, module_id: selectedModuleId
    };

    if (activeModal === "Code Test") {
      for (let i = 0; i < problems.length; i++) {
        if (!problems[i].title.trim()) return triggerToast(`Problem ${i + 1} is missing a title!`, "error");
        if (!problems[i].description.trim()) return triggerToast(`Problem ${i + 1} is missing a description!`, "error");
      }
      payload.test_config = JSON.stringify({ problems });
    }

    try {
      await axios.post(`http://127.0.0.1:8000/api/v1/content`, payload, { headers: { Authorization: `Bearer ${token}` } });
      triggerToast(`${activeModal} added successfully!`, "success");
      setActiveModal(null); resetForm(); fetchCourseData();
      if (!expandedModules.includes(selectedModuleId)) toggleModule(selectedModuleId);
    } catch (err) { triggerToast("Failed to save.", "error"); }
  };

  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/settings`, {
        title: courseTitle,
        description: courseDescription,
        price: priceType === "Paid" ? parseInt(priceAmount) || 0 : 0,
        image_url: courseImageUrl
      }, { headers: { Authorization: `Bearer ${token}` } });

      triggerToast("Current setup updated successfully!", "success");
    } catch (err) {
      triggerToast("Failed to save configurations.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleRemoveThumbnail = async () => {
    setIsSavingSettings(true);
    try {
      const token = localStorage.getItem("token");
      await axios.patch(`http://127.0.0.1:8000/api/v1/courses/${courseId}/settings`, {
        image_url: ""
      }, { headers: { Authorization: `Bearer ${token}` } });
      setCourseImageUrl("");
      triggerToast("Thumbnail Removed!", "success");
    } catch (err) {
      triggerToast("Failed to remove thumbnail.", "error");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const resetForm = () => {
    setItemTitle(""); setItemUrl(""); setItemInstructions(""); setDuration(""); setIsMandatory(false);
    setProblems([{ title: "", description: "", difficulty: "Easy", testCases: [{ input: "", output: "" }] }]);
    setActiveProblemIndex(0); setEditingItem(null);
  };

  const toggleModule = (id: number) => {
    setExpandedModules(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const tabs = [
    { name: "Curriculum", icon: <Layout size={18} /> },
    { name: "Analytics", icon: <BarChart size={18} /> },
    { name: "Pricing", icon: <Zap size={18} /> },
    { name: "Communications", icon: <Users size={18} /> },
    { name: "Settings", icon: <Edit3 size={18} /> },
  ];

  const contentTypes = [
    { type: "Note", icon: <Edit3 size={24} className="text-blue-600" />, desc: "Drive PDF Links" },
    { type: "Video", icon: <Video size={24} className="text-blue-600" />, desc: "YouTube lessons" },
    { type: "Quiz", icon: <HelpCircle size={24} className="text-emerald-600" />, desc: "Google Form Links" },
    { type: "Code Test", icon: <Code size={24} className="text-purple-600" />, desc: "Compiler Challenges" },
    { type: "Assignment", icon: <FileText size={24} className="text-indigo-600" />, desc: "PDF projects (Drive)" },
    { type: "Live Class", icon: <Radio size={24} className="text-red-500" />, desc: "YouTube Live Link" },
    { type: "Live Test", icon: <Zap size={24} className="text-yellow-500" />, desc: "Timed assessment" },
  ];

  // Dynamic UI values
  const totalEnrollments = 1248; // Mocked realistic data point (frontend doesn't have live API tracking logic yet)
  const numericPrice = parseInt(priceAmount) || 0;
  const rawRevenue = priceType === "Paid" ? numericPrice * totalEnrollments : 0;

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">

      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm w-full">
        <div className="max-w-[1400px] mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/dashboard/courses")}
              className="p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight">{courseTitle}</h1>
                {isFinalized && <span className="bg-slate-800 text-white text-xs px-2 py-0.5 rounded flex items-center gap-1 font-bold tracking-wider"><Lock size={12} /> FINALIZED</span>}
              </div>
              <p className="text-sm text-slate-500 font-medium tracking-wide">
                {isPublished ? "Live - Published" : "Draft - Not Published"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePublish} disabled={isPublishing}
              className={`px-6 py-2.5 rounded-xl text-white font-bold transition-all focus:outline-none focus:ring-4 ${isPublished
                ? "bg-emerald-500/90 backdrop-blur-md border border-emerald-400 shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:bg-emerald-600 focus:ring-emerald-500/30"
                : "bg-emerald-600 shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-emerald-700/30 focus:ring-emerald-600/30"
                }`}
            >
              {isPublishing ? "Processing..." : isPublished ? "Republish Changes" : "Publish Course"}
            </button>

            {!isFinalized && (
              <button
                onClick={() => setShowFinalizeModal(true)}
                className="px-6 py-2.5 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 backdrop-blur text-red-600 font-bold hover:bg-red-100 hover:border-red-300 transition-all shadow-sm focus:ring-4 focus:ring-red-100"
              >
                <Lock size={18} /> Finalize Course
              </button>
            )}
          </div>
        </div>
      </header>

      {/* TWO-COLUMN WORKSPACE */}
      <div className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-10 flex flex-col md:flex-row gap-10 items-start">

        {/* LEFT NAV BAR */}
        <aside className="w-full md:w-64 shrink-0 md:sticky top-32 flex flex-col gap-2">
          {tabs.map(tab => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl w-full text-left font-bold transition-all ${activeTab === tab.name
                ? "bg-slate-900 text-white shadow-xl shadow-slate-900/10 scale-100"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 hover:scale-[1.02]"
                }`}
            >
              {tab.icon}
              {tab.name}
            </button>
          ))}
        </aside>

        {/* MAIN EDITOR */}
        <main className="flex-1 w-full max-w-[800px]">
          {loading ? (
            <div className="py-20 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
            </div>
          ) : activeTab === "Curriculum" ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h2 className="text-5xl font-black bg-gradient-to-br from-slate-900 via-slate-600 to-slate-900 bg-clip-text text-transparent tracking-tight mb-2 inline-block pb-1">Curriculum Builder</h2>
                  <p className="text-slate-500 text-lg">Build your architecture. Drag and drop modules or lessons to reorder.</p>
                </div>
                {isSavingOrder && <span className="text-blue-500 font-bold flex items-center gap-2 animate-pulse bg-blue-50 px-4 py-2 rounded-full"><Zap size={16} /> Syncing Order...</span>}
              </div>

              {/* MODULES LIST WITH DRAG & DROP */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="modules-list" type="module">
                  {(provided) => (
                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex flex-col gap-6">
                      {modules.map((module, index) => {
                        const isExpanded = expandedModules.includes(module.id);

                        return (
                          <Draggable key={`module-${module.id}`} draggableId={`module-${module.id}`} index={index} isDragDisabled={isFinalized}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden transition-all duration-200 ${snapshot.isDragging ? 'shadow-2xl scale-[1.02] border-blue-400 z-[100]' : ''}`}
                                style={provided.draggableProps.style}
                              >
                                {/* MODULE HEADER */}
                                <div className="w-full flex items-center justify-between p-2 pl-4 bg-slate-50/50 hover:bg-slate-100/50 transition-colors border-b border-transparent">
                                  <div className="flex items-center gap-4 flex-1">
                                    <div
                                      {...provided.dragHandleProps}
                                      className={`p-2 rounded-lg cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-600 hover:bg-slate-200 ${isFinalized ? "opacity-30 cursor-not-allowed pointer-events-none" : ""}`}
                                    >
                                      <GripVertical size={20} />
                                    </div>
                                    <h3
                                      onClick={() => toggleModule(module.id)}
                                      className="text-lg font-extrabold text-slate-800 cursor-pointer flex-1 py-4"
                                    >
                                      {module.title}
                                    </h3>
                                  </div>
                                  <button onClick={() => toggleModule(module.id)} className="flex items-center gap-4 text-slate-400 p-4 shrink-0 hover:text-slate-600 transition-colors">
                                    <span className="text-sm font-bold bg-slate-100 px-3 py-1 rounded-full">{module.lessons?.length || 0} lessons</span>
                                    <motion.div animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.3 }}>
                                      <ChevronDown size={24} />
                                    </motion.div>
                                  </button>
                                </div>

                                {/* LESSONS LIST */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: "auto", opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="overflow-hidden border-t border-slate-100"
                                    >
                                      <div className="p-6 flex flex-col gap-3">
                                        <Droppable droppableId={`module-${module.id}`} type="lesson">
                                          {(providedLesson, snapshotLesson) => (
                                            <div
                                              {...providedLesson.droppableProps}
                                              ref={providedLesson.innerRef}
                                              className={`flex flex-col gap-3 min-h-[50px] rounded-2xl transition-all ${snapshotLesson.isDraggingOver ? 'bg-blue-50/50 ring-2 ring-blue-200 ring-inset p-2' : ''}`}
                                            >
                                              {!module.lessons || module.lessons.length === 0 ? (
                                                <div className="text-center py-6 text-slate-400 font-bold italic">Drop lessons here...</div>
                                              ) : (
                                                module.lessons.map((lesson: any, lessonIndex: number) => (
                                                  <Draggable key={`lesson-${lesson.id}`} draggableId={`lesson-${lesson.id}`} index={lessonIndex} isDragDisabled={isFinalized}>
                                                    {(providedDragLesson, snapshotDragLesson) => (
                                                      <div
                                                        ref={providedDragLesson.innerRef}
                                                        {...providedDragLesson.draggableProps}
                                                        className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-white border shadow-sm transition-all gap-4 sm:gap-0 ${snapshotDragLesson.isDragging ? "shadow-2xl border-blue-400 scale-[1.03] z-[120] ring-4 ring-blue-500/20" : "border-slate-100 hover:border-slate-300"
                                                          }`}
                                                        style={providedDragLesson.draggableProps.style}
                                                      >
                                                        <div className="flex items-center gap-4 overflow-hidden flex-1">
                                                          <div
                                                            {...providedDragLesson.dragHandleProps}
                                                            className={`text-slate-200 hover:text-slate-400 cursor-grab active:cursor-grabbing ${isFinalized ? "hidden" : ""}`}
                                                          >
                                                            <GripVertical size={18} />
                                                          </div>
                                                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex-shrink-0">
                                                            {getLessonIcon(lesson.type)}
                                                          </div>
                                                          <div className="overflow-hidden flex-1">
                                                            <span className="font-bold text-slate-800 block truncate">{lesson.title}</span>
                                                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest mt-0.5 truncate block">{lesson.type} {lesson.url ? `• Link Attached` : ""}</span>
                                                          </div>
                                                        </div>

                                                        {!isFinalized && (
                                                          <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity justify-end shrink-0">
                                                            <button onClick={() => handleEditStart(lesson)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"><Edit3 size={18} /></button>
                                                            <button onClick={() => handleDeleteItem(lesson.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                                                          </div>
                                                        )}
                                                      </div>
                                                    )}
                                                  </Draggable>
                                                ))
                                              )}
                                              {providedLesson.placeholder}
                                            </div>
                                          )}
                                        </Droppable>

                                        {!isFinalized && (
                                          showContentPicker === module.id ? (
                                            <div className="mt-4 p-6 bg-slate-50 border border-slate-200 rounded-2xl">
                                              <div className="flex items-center justify-between mb-4">
                                                <h4 className="font-bold text-slate-800">Assign Content Type</h4>
                                                <button onClick={() => setShowContentPicker(null)} className="p-1 hover:bg-slate-200 rounded-full text-slate-500"><X size={16} /></button>
                                              </div>
                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {contentTypes.map(typeObj => (
                                                  <button key={typeObj.type} onClick={() => { setSelectedModuleId(module.id); setActiveModal(typeObj.type); setShowContentPicker(null); }} className="flex items-center gap-3 p-4 bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg rounded-xl text-left transition-all">
                                                    <div className="shrink-0">{typeObj.icon}</div>
                                                    <div>
                                                      <div className="font-bold text-sm text-slate-800">{typeObj.type}</div>
                                                      <div className="text-xs font-medium text-slate-500 mt-0.5">{typeObj.desc}</div>
                                                    </div>
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          ) : (
                                            <button onClick={() => setShowContentPicker(module.id)} className="flex items-center justify-center gap-2 mt-4 py-4 px-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-500 font-bold hover:bg-slate-50 hover:border-slate-400 hover:text-slate-800 transition-all uppercase tracking-widest text-sm">
                                              <Plus size={18} /> Add Content
                                            </button>
                                          )
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </Draggable>
                        )
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>

              {/* NEW MODULE BUTTON */}
              {!isFinalized && (
                showAddModule ? (
                  <div className="mt-8 p-6 bg-white border border-slate-200 rounded-3xl shadow-lg">
                    <h4 className="font-extrabold text-slate-900 mb-3 text-lg">New Module Title</h4>
                    <input autoFocus placeholder="e.g. Setting up the architecture..." value={newModuleTitle} onChange={(e) => setNewModuleTitle(e.target.value)} className="w-full p-4 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none mb-6 font-medium text-lg" />
                    <div className="flex gap-4">
                      <button onClick={handleAddModule} className="flex-1 py-4 bg-slate-900 text-white font-extrabold rounded-xl hover:bg-slate-800 transition-colors">Create Module</button>
                      <button onClick={() => setShowAddModule(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-extrabold rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => setShowAddModule(true)} className="mt-10 flex items-center justify-center gap-2 w-full py-8 bg-slate-50 border-2 border-dashed border-slate-300 rounded-[2rem] text-slate-600 font-extrabold hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 transition-all text-xl tracking-wide shadow-sm">
                    <Plus size={28} /> Build New Module
                  </button>
                )
              )}

            </div>
          ) : activeTab === "Analytics" ? (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-black tracking-tight mb-2">Platform Analytics</h2>
                  <p className="text-slate-500 text-lg">Track engagement, completions, and real-time revenue pipeline.</p>
                </div>
                <div className="px-4 py-2 bg-emerald-50 rounded-xl text-emerald-600 font-bold border border-emerald-100 flex items-center gap-2">
                  <TrendingUp size={18} /> +14% This Month
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-xl flex items-center justify-center mb-4"><Users size={24} /></div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">{totalEnrollments.toLocaleString()}</div>
                    <div className="text-slate-500 font-bold text-sm tracking-wide mt-1 uppercase">Total Enrollments</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden group">
                  <div className="absolute -right-6 -top-6 bg-emerald-500/10 w-32 h-32 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center mb-4 relative z-10"><Zap size={24} /></div>
                  <div className="relative z-10">
                    <div className="text-3xl font-black text-slate-900">₹ {rawRevenue.toLocaleString()}</div>
                    <div className="text-slate-500 font-bold text-sm tracking-wide mt-1 uppercase">Gross Revenue</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4"><Award size={24} /></div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">482</div>
                    <div className="text-slate-500 font-bold text-sm tracking-wide mt-1 uppercase">Certificates Issued</div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col justify-between">
                  <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-4"><Clock size={24} /></div>
                  <div>
                    <div className="text-3xl font-black text-slate-900">4.2 hrs</div>
                    <div className="text-slate-500 font-bold text-sm tracking-wide mt-1 uppercase">Avg. Completion Time</div>
                  </div>
                </div>
              </div>

              {/* REVENUE PIPELINE GRAPH (MOCK) */}
              {priceType === "Paid" && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
                  <h4 className="font-extrabold text-slate-900 text-xl mb-6">Revenue Pipeline</h4>
                  <div className="h-48 flex items-end gap-3 w-full border-b border-slate-100 pb-2">
                    {[30, 45, 25, 60, 80, 50, 95].map((h, i) => (
                      <div key={i} className="flex-1 bg-emerald-100 hover:bg-emerald-400 transition-colors rounded-t-lg relative group" style={{ height: `${h}%` }}>
                        <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity">
                          ₹ {(h * rawRevenue / 400).toFixed(0)}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-400 uppercase tracking-widest mt-4">
                    <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                  </div>
                </div>
              )}

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h4 className="font-extrabold text-slate-900 text-xl mb-6">Student Enrollment Funnel</h4>
                <div className="space-y-6">
                  {[
                    { label: "Completed Final Exam (100%)", pct: 38, count: 474, color: "bg-emerald-500" },
                    { label: "Active & Engaging (50-99%)", pct: 45, count: 561, color: "bg-blue-500" },
                    { label: "Started First Module (1-49%)", pct: 15, count: 187, color: "bg-amber-400" },
                    { label: "Bounced / Inactive (0%)", pct: 2, count: 26, color: "bg-slate-300" },
                  ].map((stat, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm font-bold text-slate-700 mb-2">
                        <span>{stat.label}</span>
                        <span className="text-slate-400">{stat.pct}% · {stat.count} users</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${stat.pct}%` }} transition={{ duration: 1, delay: i * 0.1 }} className={`h-full ${stat.color} rounded-full`}></motion.div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : activeTab === "Pricing" ? (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-2xl">
              <h2 className="text-4xl font-black tracking-tight mb-2">Monetization</h2>
              <p className="text-slate-500 text-lg mb-8">Control access tiers and exact pricing models.</p>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8">
                <div className="flex gap-4 p-1.5 bg-slate-100 rounded-[1.25rem]">
                  <button
                    onClick={() => { setPriceType("Free"); setPriceAmount("0"); }}
                    className={`flex-1 py-4 rounded-xl font-extrabold transition-all text-lg ${priceType === "Free" ? "bg-white text-emerald-600 shadow-md scale-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"}`}
                  >
                    Free Tier
                  </button>
                  <button
                    onClick={() => { setPriceType("Paid"); setPriceAmount("99"); }}
                    className={`flex-1 py-4 rounded-xl font-extrabold transition-all text-lg ${priceType === "Paid" ? "bg-white text-blue-600 shadow-md scale-100" : "text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"}`}
                  >
                    Premium
                  </button>
                </div>

                {priceType === "Paid" && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-col gap-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Base Enrollment Price (USD)</label>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 transform -translate-y-1/2 text-slate-400 font-black text-xl">₹</span>
                      <input
                        type="number" value={priceAmount} onChange={e => setPriceAmount(e.target.value)}
                        className="w-full text-2xl p-6 pl-14 rounded-2xl border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-black text-slate-900 transition-all"
                      />
                    </div>
                  </motion.div>
                )}

                <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full mt-2 py-5 bg-slate-900 text-white font-extrabold text-lg rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10">
                  {isSavingSettings ? "Syncing..." : <><Save size={20} /> Publish Pricing Model</>}
                </button>
              </div>
            </div>
          ) : activeTab === "Communications" ? (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-2xl px-2">
              <h2 className="text-4xl font-black tracking-tight mb-2">Communications</h2>
              <p className="text-slate-500 text-lg mb-8">Manage student relationships, announcements, and direct feedback.</p>

              <div className="bg-white p-8 mb-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h4 className="font-extrabold text-slate-900 text-lg mb-2">Broadcast Announcement</h4>
                <p className="text-slate-500 text-sm mb-6">Send an urgent alert strictly to enrolled students in this course.</p>
                <textarea placeholder="Compose your message here..." rows={4} className="w-full p-4 bg-slate-50/50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 mb-4 font-medium text-slate-800 transition-all resize-y" />
                <button className="px-6 py-3.5 bg-blue-600 text-white font-extrabold rounded-xl hover:bg-blue-700 shadow-md transition-all flex items-center justify-center gap-2 w-full">
                  Broadcast Update
                </button>
              </div>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <h4 className="font-extrabold text-slate-900 text-lg mb-6">Course Feedback Logs</h4>
                
                {feedbacks.length === 0 ? (
                  <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm mb-4"><Users size={28} className="text-slate-400" /></div>
                    <p className="font-bold text-slate-800">No Feedback Submitted Yet</p>
                    <p className="text-sm text-slate-500 mt-1">Once students rate or review this course, data will aggregate here.</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {feedbacks.map((fb: any, i: number) => (
                      <div key={i} className="p-5 border border-slate-200 rounded-2xl flex flex-col gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black">
                              {fb.student.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 leading-tight">{fb.student}</p>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{fb.time}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={14} className={s <= fb.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"} />
                            ))}
                          </div>
                        </div>
                        {fb.text && <p className="text-sm text-slate-600 leading-relaxed max-w-[90%] font-medium">"{fb.text}"</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 max-w-2xl pb-20">
              <h2 className="text-4xl font-black tracking-tight mb-2">Global Settings</h2>
              <p className="text-slate-500 text-lg mb-8">Update your course metadata and presentation layers.</p>

              <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8">

                {/* THUMBNAIL MANAGER */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Course Thumbnail Engine</label>

                  {courseImageUrl ? (
                    <div className="relative group rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                      <img src={courseImageUrl} alt="Course Cover" className="w-full h-64 object-cover" />
                      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                        <button onClick={handleRemoveThumbnail} className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg flex items-center gap-2">
                          <Trash2 size={18} /> Remove Thumbnail Graphic
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-blue-400 border-dashed rounded-2xl p-8 bg-blue-50/50 text-center flex flex-col items-center justify-center gap-3">
                      <div className="w-16 h-16 bg-blue-100 flex items-center justify-center rounded-full text-blue-500"><ImageIcon size={32} /></div>
                      <div className="text-blue-900 font-bold">Inject Thumbnail via Image URL</div>
                      <input
                        placeholder="https://images.unsplash..."
                        value={courseImageUrl} onChange={e => setCourseImageUrl(e.target.value)}
                        className="mt-2 w-full max-w-md p-3 rounded-xl border border-blue-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 text-sm font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* BASIC INFO */}
                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">SEO Title</label>
                  <input
                    value={courseTitle} onChange={e => setCourseTitle(e.target.value)}
                    className="w-full text-xl p-5 rounded-2xl border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-bold text-slate-900 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Marketing Description</label>
                  <textarea
                    rows={5} value={courseDescription} onChange={e => setCourseDescription(e.target.value)}
                    className="w-full text-lg p-5 rounded-2xl border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-slate-700 transition-all resize-y font-medium"
                  />
                </div>

                <button onClick={handleSaveSettings} disabled={isSavingSettings} className="w-full mt-2 py-5 bg-slate-900 text-white font-extrabold text-lg rounded-2xl hover:bg-slate-800 transition-colors flex items-center justify-center gap-3 shadow-xl shadow-slate-900/10">
                  {isSavingSettings ? "Injecting Data..." : <><Save size={20} /> Save Global Settings</>}
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* FINALIZE COURSE CONFIRMATION STRICT MODAL */}
      <AnimatePresence>
        {showFinalizeModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-center justify-center z-[150] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="bg-white max-w-lg w-full rounded-[2rem] p-8 shadow-2xl relative border border-slate-100">
              <button onClick={() => setShowFinalizeModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><X size={24} /></button>
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center text-red-500 mb-6 border border-red-100 shadow-inner">
                <Lock size={32} />
              </div>
              <h3 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Finalize Permanently?</h3>
              <p className="text-slate-500 mb-8 text-lg leading-relaxed">
                You cannot add, edit, or delete modules. This officially unlocks certificates for enrolled students. <strong className="text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">Irreversible action.</strong>
              </p>

              <div className="bg-slate-50 p-5 rounded-2xl border-2 border-slate-200 mb-8">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-3">Type "FINALIZE" below</label>
                <input
                  type="text" value={finalizeConfirmation} onChange={(e) => setFinalizeConfirmation(e.target.value)}
                  placeholder="FINALIZE"
                  className="w-full px-5 py-4 rounded-xl border-2 border-slate-200 outline-none focus:border-red-500 focus:ring-4 focus:ring-red-500/20 font-black tracking-widest text-red-600 bg-white text-lg placeholder:text-red-200 transition-all"
                />
              </div>

              <div className="flex gap-4">
                <button onClick={() => setShowFinalizeModal(false)} className="flex-1 py-5 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all text-lg">Cancel</button>
                <button
                  onClick={handleFinalize}
                  disabled={finalizeConfirmation !== "FINALIZE"}
                  className="flex-1 py-5 font-extrabold text-white bg-red-600 hover:bg-red-700 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_30px_rgb(220,38,38,0.3)] text-lg"
                >
                  Confirm Lock
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OVERLAY MODAL FOR ADDING ITEM */}
      <AnimatePresence>
        {activeModal && showContentPicker === null && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-[2rem] p-8 max-w-2xl w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <button
                onClick={() => { setActiveModal(null); resetForm(); }}
                className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  {getLessonIcon(activeModal.toLowerCase().replace(" ", "_"))}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">{editingItem ? "Edit" : "Add"} {activeModal}</h3>
                  <p className="text-slate-500 font-medium">Configure the details below</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Title <span className="text-red-500">*</span></label>
                  <input
                    value={itemTitle} onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="e.g. Introduction to React"
                    className="w-full text-lg p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                  />
                </div>

                {activeModal !== "Code Test" && (
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">External Link / URL</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        {/* <LinkIcon size={18} /> */} {/* LinkIcon was removed from imports, so commenting out or replacing */}
                      </div>
                      <input
                        value={itemUrl} onChange={(e) => setItemUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full text-lg p-4 pl-12 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-bold text-slate-700 mb-2">Duration (mins)</label>
                    <input
                      type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
                      placeholder="e.g. 45"
                      className="w-full text-lg p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all"
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-end">
                    <label className="flex items-center gap-3 p-4 border-2 border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                      <input
                        type="checkbox" checked={isMandatory} onChange={(e) => setIsMandatory(e.target.checked)}
                        className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-bold text-slate-700 block">Mandatory Lesson</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Instructions / Notes</label>
                  <textarea
                    value={itemInstructions} onChange={(e) => setItemInstructions(e.target.value)} rows={3}
                    placeholder="Optional instructions for students..."
                    className="w-full text-lg p-4 rounded-xl border-2 border-slate-200 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 font-medium transition-all resize-y"
                  />
                </div>
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => { setActiveModal(null); resetForm(); }}
                  className="flex-1 py-4 font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingItem ? handleEditSave : saveContentItem}
                  className="flex-1 py-4 font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                >
                  {editingItem ? "Save Changes" : `Add ${activeModal}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* GLASSMORPHIC TOAST */}
      <GlassToast toast={{ show: toast.show, msg: toast.message, type: toast.type as "success" | "error", id: 0 }} />

    </div>
  );
};

export default CourseBuilder;