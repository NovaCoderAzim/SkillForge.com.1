import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import type { View } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { motion, AnimatePresence } from "framer-motion";
import { Video, Calendar as CalendarIcon, ExternalLink, X, Clock } from "lucide-react"; 

const locales = { "en-US": enUS };
const localizer = dateFnsLocalizer({ format, parse, startOfWeek, getDay, locales });
const API_BASE_URL = "http://127.0.0.1:8000/api/v1";

interface ScheduledMeeting {
  id: number;
  course_id: number;
  course_title: string;
  title: string;
  agenda: string;
  start_time: string;
  duration_minutes: number;
  meeting_link: string;
  instructor: string;
}

const StudentMeetings = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<ScheduledMeeting | null>(null);
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
      const res = await axios.get(`${API_BASE_URL}/meetings/student`, config);
      
      const mappedEvents = res.data.map((m: ScheduledMeeting) => {
        const start = new Date(m.start_time);
        const end = new Date(start.getTime() + m.duration_minutes * 60000);
        return {
          id: m.id,
          title: `[${m.course_title}] ${m.title}`,
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

  const handleSelectEvent = (event: any) => {
    setSelectedEvent(event.resource);
  };

  const eventStyleGetter = (event: any, start: Date, end: Date, isSelected: boolean) => {
    return {
      style: {
        backgroundColor: isSelected ? "#0f172a" : "#1e293b",
        borderRadius: "8px",
        opacity: 0.95,
        color: "white",
        border: "1px solid #334155",
        display: "block",
        fontSize: "12px",
        fontWeight: "bold",
        padding: "4px 8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
      }
    };
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="flex flex-col gap-6 h-[calc(100vh-140px)]">
      
      <div className="mb-2">
        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-black flex items-center gap-3"><Video className="text-blue-600"/> Live Classes Calendar</h1>
        <p className="text-gray-500 font-medium mt-2">Join your scheduled online sessions for enrolled courses directly from here.</p>
      </div>

      <div className="flex flex-col xl:flex-row gap-8 h-full">
        {/* Main Calendar View */}
        <div className="flex-1 bg-white p-4 md:p-6 rounded-[2rem] border border-gray-200/60 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-hidden">
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
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              popup
            />
        </div>

        {/* Side Panel for Event Details */}
        <div className="w-full xl:w-[400px] shrink-0">
          {selectedEvent ? (
             <AnimatePresence mode="wait">
               <motion.div key="event" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white p-8 rounded-[2rem] border border-gray-200/60 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-black border-none"></div>
                  
                  <div className="flex items-center justify-between mb-8 mt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100 flex items-center gap-1.5">
                        <Video size={12}/> {selectedEvent.course_title}
                    </span>
                    <button onClick={() => setSelectedEvent(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"><X size={16}/></button>
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4">{selectedEvent.title}</h2>
                  <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">Instructor: <span className="font-bold text-slate-900">{selectedEvent.instructor}</span></p>

                  <div className="space-y-4 mb-10">
                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm"><CalendarIcon size={18}/></div>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-0.5">Start Time</p>
                          <p className="text-sm font-bold text-slate-900">{format(new Date(selectedEvent.start_time), "MMM d, yyyy 'at' h:mm a")}</p>
                      </div>
                    </div>
                    
                    <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm"><Clock size={18}/></div>
                      <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-0.5">Duration</p>
                          <p className="text-sm font-bold text-slate-900">{selectedEvent.duration_minutes} Minutes</p>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.meeting_link ? (
                    <a href={selectedEvent.meeting_link} target="_blank" rel="noreferrer" className="w-full bg-black text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-black/10 active:scale-95">
                      <ExternalLink size={16}/> Join Live Class
                    </a>
                  ) : (
                    <div className="w-full bg-slate-100 text-slate-400 py-4 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-200">
                      Link Not Available
                    </div>
                  )}
               </motion.div>
             </AnimatePresence>
          ) : (
             <div className="bg-white/50 border border-gray-200 border-dashed rounded-[2rem] h-full flex flex-col items-center justify-center text-center p-8">
               <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-200">
                  <CalendarIcon size={32} className="text-gray-400" />
               </div>
               <h3 className="text-lg font-black text-slate-900 mb-2">No Selection</h3>
               <p className="text-sm font-bold text-gray-500 max-w-[250px]">Select any scheduled class on the calendar to view details and join.</p>
             </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default StudentMeetings;
