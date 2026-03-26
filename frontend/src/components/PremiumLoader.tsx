import { motion } from "framer-motion";

export const PremiumLoader = ({ text = "Loading..." }: { text?: string, variant?: any }) => {
    const dots = Array.from({ length: 6 });

    return (
        <div className="flex flex-col items-center justify-center bg-white/20 backdrop-blur-2xl rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-12 shrink-0 aspect-square min-w-[280px]">
            <div className="relative w-24 h-24 mb-10">
                {dots.map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute top-0 left-0 w-full h-full"
                        animate={{ rotate: [0, 360] }}
                        transition={{
                            duration: 2.5,
                            repeat: Infinity,
                            ease: [0.2, 0.8, 0.2, 0.8],
                            delay: i * 0.12,
                        }}
                    >
                        <div
                            className="w-3.5 h-3.5 bg-black rounded-full absolute top-0 left-1/2 -translate-x-1/2"
                            style={{ transform: `scale(${1 - i * 0.12})`, opacity: 1 - i * 0.12 }}
                        />
                    </motion.div>
                ))}
            </div>

            {text && (
                <motion.p
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                    className="text-slate-900 font-black tracking-[0.25em] uppercase text-xs"
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};
