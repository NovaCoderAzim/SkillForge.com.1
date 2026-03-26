import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { PlusCircle, BookOpen, Trash2, Users, Star, Settings, Play } from "lucide-react";
import { motion } from "framer-motion";

const CourseList = () => {
    const [courses, setCourses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCourses = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                setLoading(false);
                return;
            }
            try {
                const res = await axios.get("http://127.0.0.1:8000/api/v1/courses", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setCourses(res.data);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    localStorage.removeItem("token");
                    window.location.href = "/";
                }
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const handleDeleteCourse = async (e: React.MouseEvent, courseId: number) => {
        e.stopPropagation();
        if (!confirm("Are you sure you want to delete this course? This cannot be undone.")) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/api/v1/courses/${courseId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCourses(courses.filter((c: any) => c.id !== courseId));
        } catch (err) {
            alert("Failed to delete course. Ensure no students are enrolled or backend endpoint is active.");
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="text-slate-400 font-medium animate-pulse text-lg">Loading your curriculum...</div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-slate-50/50 py-12">
            <div className="max-w-[1400px] mx-auto px-6 lg:px-12">

                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-12 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <h1 className="text-4xl font-extrabold text-black tracking-tight mb-2">My Courses</h1>
                        <p className="text-slate-500 text-lg">Manage, build, and publish your curriculum.</p>
                    </motion.div>

                    <motion.button
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => navigate("/dashboard/create-course")}
                        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-semibold shadow-lg shadow-slate-900/20 hover:bg-slate-800 transition-colors"
                    >
                        <PlusCircle size={20} />
                        Create New Course
                    </motion.button>
                </div>

                {/* Empty State vs Grid */}
                {courses.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col items-center justify-center py-32 bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-sm"
                    >
                        <div className="bg-slate-100 p-6 rounded-full mb-6 text-slate-400">
                            <BookOpen size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">No courses yet</h3>
                        <p className="text-slate-500 mb-8 text-center max-w-md">You haven't created any courses. Start building your amazing curriculum today!</p>
                        <button
                            onClick={() => navigate("/dashboard/create-course")}
                            className="text-emerald-600 font-semibold hover:text-emerald-700 underline underline-offset-4 decoration-2"
                        >
                            Create your first course &rarr;
                        </button>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {courses.map((course: any, index: number) => (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4, delay: index * 0.1 }}
                                key={course.id}
                                className="group flex flex-col bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] transition-all duration-300"
                            >
                                {/* Course Thumbnail */}
                                <div className="relative h-48 bg-slate-100 overflow-hidden">
                                    <img
                                        src={course.image_url}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-sm font-bold text-slate-900 shadow-sm">
                                        ${course.price || 0}
                                    </div>
                                </div>

                                {/* Course Details */}
                                <div className="p-6 flex flex-col flex-1">
                                    <h3 className="text-xl font-bold text-slate-900 mb-3 line-clamp-2 min-h-[56px] leading-tight">
                                        {course.title}
                                    </h3>

                                    <div className="flex items-center gap-4 text-slate-500 text-sm font-medium mb-6">
                                        <div className="flex items-center gap-1.5">
                                            <Users size={16} className="text-emerald-500" />
                                            {course.students || 0} students
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Star size={16} className="text-amber-400 fill-amber-400" />
                                            {course.rating || 0}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex flex-col gap-3">
                                        <button
                                            onClick={() => navigate(`/dashboard/course/${course.id}/builder`)}
                                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white px-4 py-3 rounded-2xl font-semibold hover:bg-slate-800 transition-colors"
                                        >
                                            <Settings size={18} />
                                            Edit / Manage
                                        </button>

                                        <div className="flex gap-3">
                                            <button
                                                onClick={() => navigate(`/dashboard/course/${course.id}/preview`)}
                                                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-4 py-3 rounded-2xl font-semibold hover:bg-slate-200 transition-colors"
                                            >
                                                <Play size={18} />
                                                Preview
                                            </button>
                                            <button
                                                onClick={(e) => handleDeleteCourse(e, course.id)}
                                                className="flex items-center justify-center bg-red-50 text-red-500 px-4 py-3 rounded-2xl hover:bg-red-100 hover:text-red-600 transition-colors"
                                                title="Delete Course"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CourseList;
