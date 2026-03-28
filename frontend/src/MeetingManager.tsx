import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import enUS from "date-fns/locale/en-US";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Video, PlusCircle, MoreHorizontal, Calendar as CalendarIcon, 
  Trash2, Copy, CheckCircle, ExternalLink, X, Clock
} from "lucide-react"; 

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

interface Course {
  id: number;
  title: string;
}

interface ScheduledMeeting {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  agenda: string;
  start_time: string;
  duration_minutes: number;
  meeting_link: string;
}

const MeetingManager = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledMeeting | null>(null);

  // Form State
  const [formTitle, setFormTitle] = useState("");
  const [formCourse, setFormCourse] = useState("");
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState("60");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  const [view, setView] = useState<View>("month");
  const [date, setDate] = useState(new Date());

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const [coursesRes, meetingsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/courses`, config),
        axios.get(`${API_BASE_URL}/meetings/instructor`, config)
      ]);
      
      setCourses(coursesRes.data);
      
      // Map meetings to calendar events
      const mappedEvents = meetingsRes.data.map((m: ScheduledMeeting) => {
        const start = new Date(m.start_time);
        const end = new Date(start.getTime() + m.duration_minutes * 60000);
        return {
          id: m.id,
          title: `${m.course_title}: ${m.title}`,
          start,
          end,
          resource: m
        };
      });
      setEvents(mappedEvents);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setFormDate(format(start, "yyyy-MM-dd"));
    setFormTitle("");
    setFormCourse("");
    setFormTime("10:00");
    setFormDuration("60");
    setGeneratedLink("");
    setIsModalOpen(true);
    setSelectedEvent(null);
  };

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
  };

  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Format start time for python isoformat: YYYY-MM-DDTHH:MM:SSZ
      // We will assume local timezone for simplicity and just format it.
      const localDateTimeStr = `${formDate}T${formTime}:00`; 
      const startDateTime = new Date(localDateTimeStr);
      
      const payload = {
        course_id: parseInt(formCourse),
        title: formTitle,
        start_time: startDateTime.toISOString(), // Standard UTC ISO
        duration_minutes: parseInt(formDuration),
        agenda: formTitle
      };
      
      const res = await axios.post(`${API_BASE_URL}/meetings`, payload, config);
      
      if (res.data.meeting.meeting_link) {
          setGeneratedLink(res.data.meeting.meeting_link);
      } else {
          setGeneratedLink("Generated Locally Only - No Zoom Link");
          alert(res.data.message);
      }
      
      fetchData(); // Refresh calendar
    } catch (err) {
      console.error(err);
      alert("Failed to schedule class. Check console for details.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteMeeting = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this scheduled class?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/meetings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setSelectedEvent(null);
      fetchData();
    } catch (err) {
      alert("Failed to delete meeting.");
    }
  };

  const copyToClipboard = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    alert("Meeting link copied to clipboard!");
  };

  // Custom Calendar Styles overrides
  const eventStyleGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
    return {
      style: {
        backgroundColor: isSelected ? "#312e81" : "#4f46e5",
        borderRadius: "8px",
        opacity: 0.9,
        color: "white",
        border: "0px",
        display: "block",
        fontSize: "12px",
        fontWeight: "bold",
        padding: "4px"
      }
    };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 font-sans text-slate-900 bg-[#f8fafc] min-h-screen">
      
      <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-black tracking-tight mb-2">Instructor Calendar</h1>
          <p className="text-slate-500 font-bold text-sm">Schedule online classes and automatic Zoom meetings for your mapped courses.</p>
        </div>
        <div className="flex flex-wrap flex-col md:flex-row items-center gap-3">
            <button onClick={() => { setFormDate(format(new Date(), "yyyy-MM-dd")); setIsModalOpen(true); setSelectedEvent(null); setGeneratedLink(""); }} className="bg-black text-white px-5 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 hover:bg-slate-800 shadow-md text-xs uppercase tracking-widest w-full md:w-auto justify-center md:justify-start">
               <Video size={16} /> Schedule Class
            </button>
            <p className="text-[10px] sm:hidden text-center text-slate-400 font-bold w-full mt-2">Tap a slot to schedule instantly.</p>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-8">
        
        {/* Main Calendar View */}
        <div className="flex-1 bg-white p-4 md:p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] h-[700px]">
           <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: "100%", fontFamily: "inherit" }}
              views={["month", "week", "day"]}
              view={view}
              date={date}
              onNavigate={(d) => setDate(d)}
              onView={(v) => setView(v)}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
            />
        </div>

        {/* Side Panel for Event Details */}
        <div className="w-full xl:w-[400px]">
          {selectedEvent ? (
             <AnimatePresence>
               <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-lg sticky top-24">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Class Details</h3>
                    <button onClick={() => setSelectedEvent(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500"><X size={16}/></button>
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-900 leading-tight mb-2">{selectedEvent.title}</h2>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl w-fit mb-6">
                    <CalendarIcon size={14}/> {format(new Date(selectedEvent.start_time), "MMM d, yyyy 'at' h:mm a")}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Duration</p>
                      <p className="text-sm font-bold text-slate-800 flex items-center gap-2"><Clock size={16} className="text-slate-400"/> {selectedEvent.duration_minutes} Minutes</p>
                    </div>
                    {selectedEvent.meeting_link && (
                      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Zoom Join Link</p>
                        <div className="flex items-center gap-2">
                          <input readOnly value={selectedEvent.meeting_link} className="flex-1 bg-white text-xs font-mono p-2 rounded border border-indigo-200 outline-none text-slate-600" />
                          <button onClick={() => { navigator.clipboard.writeText(selectedEvent.meeting_link); alert("Copied!"); }} className="p-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"><Copy size={14}/></button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    {selectedEvent.meeting_link && (
                      <a href={selectedEvent.meeting_link} target="_blank" rel="noreferrer" className="flex-1 bg-black text-white py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 shadow-lg">
                        <ExternalLink size={16}/> Join
                      </a>
                    )}
                    <button onClick={() => handleDeleteMeeting(selectedEvent.id)} className="flex-1 bg-red-50 text-red-600 border border-red-100 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100">
                      <Trash2 size={16}/> Cancel
                    </button>
                  </div>
               </motion.div>
             </AnimatePresence>
          ) : (
             <div className="bg-slate-100/50 border border-slate-200 border-dashed rounded-[2rem] h-[300px] flex flex-col items-center justify-center text-center p-8">
               <CalendarIcon size={40} className="text-slate-300 mb-4" />
               <p className="text-sm font-bold text-slate-500">Tap any scheduled class on the calendar to view details, or click a blank slot to schedule a new one.</p>
             </div>
          )}
        </div>
      </div>

      {/* --- SCHEDULING MODAL --- */}
      <AnimatePresence>
          {isModalOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                  <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100">
                      <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Video size={20} className="text-blue-600"/> Schedule Online Class</h2>
                          <button onClick={() => setIsModalOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 hover:bg-slate-100"><X size={16}/></button>
                      </div>
                      <div className="p-8">
                          {!generatedLink ? (
                              <form onSubmit={handleCreateMeeting} className="space-y-5">
                                  <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Course</label>
                                      <select required value={formCourse} onChange={(e) => setFormCourse(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black">
                                          <option value="" disabled>Choose a course to notify students...</option>
                                          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                      </select>
                                  </div>

                                  <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Topic / Title</label>
                                      <input type="text" required placeholder="e.g. Intro to Advanced Graphing" value={formTitle} onChange={(e) => setFormTitle(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black" />
                                  </div>

                                  <div className="grid grid-cols-2 gap-4">
                                      <div>
                                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Date</label>
                                          <input type="date" required value={formDate} onChange={(e) => setFormDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black" />
                                      </div>
                                      <div>
                                          <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Time</label>
                                          <input type="time" required value={formTime} onChange={(e) => setFormTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black" />
                                      </div>
                                  </div>

                                  <div>
                                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Duration (Minutes)</label>
                                      <select required value={formDuration} onChange={(e) => setFormDuration(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:ring-2 focus:ring-black">
                                          <option value="30">30 Minutes</option>
                                          <option value="45">45 Minutes</option>
                                          <option value="60">60 Minutes</option>
                                          <option value="90">90 Minutes</option>
                                          <option value="120">2 Hours</option>
                                      </select>
                                  </div>

                                  <button type="submit" disabled={isGenerating} className="w-full py-4 mt-6 bg-black hover:bg-slate-800 text-white rounded-xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl shadow-black/20 disabled:opacity-70">
                                      {isGenerating ? <MoreHorizontal className="animate-pulse"/> : "Schedule & Generate Zoom Link"}
                                  </button>
                                  <p className="text-[10px] font-bold text-slate-400 text-center mt-3">Students in the selected course will automatically see this in their dashboard calendar.</p>
                              </form>
                          ) : (
                              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-6">
                                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-emerald-100">
                                      <CheckCircle size={32} className="text-emerald-500" />
                                  </div>
                                  <h3 className="text-2xl font-black text-slate-900 mb-2">Class Scheduled!</h3>
                                  <p className="text-sm font-bold text-slate-500 mb-8">Invitations and the Zoom link have been saved to the calendar.</p>
                                  {generatedLink && generatedLink !== "Generated Locally Only - No Zoom Link" && (
                                    <div className="flex items-center gap-2 p-2 bg-slate-50 border border-slate-200 rounded-xl mb-8">
                                        <div className="p-3 bg-white rounded-lg border border-slate-100 text-blue-600"><Video size={20}/></div>
                                        <input type="text" readOnly value={generatedLink} className="flex-1 bg-transparent text-sm font-mono font-bold text-slate-700 outline-none px-2" />
                                        <button onClick={copyToClipboard} className="p-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-bold text-xs flex items-center gap-2 uppercase tracking-widest"><Copy size={14}/> Copy</button>
                                    </div>
                                  )}
                                  <button onClick={() => { setIsModalOpen(false); setGeneratedLink(""); }} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-sm">
                                      Close Window
                                  </button>
                              </motion.div>
                          )}
                      </div>
                  </motion.div>
              </div>
          )}
      </AnimatePresence>
    </div>
  );
};

export default MeetingManager;
