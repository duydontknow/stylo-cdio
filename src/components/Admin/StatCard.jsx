import { motion } from "framer-motion";

export function StatCard({ icon: Icon, title, value, colorClass }) {
    return (
        <motion.div 
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            className="bg-surface p-6 rounded-[2rem] shadow-glass border border-gray-100 flex items-center gap-5 relative overflow-hidden group"
        >
            {/* Ambient background glow on hover */}
            <div className={`absolute inset-0 ${colorClass} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            
            <div className={`p-4 rounded-[1.25rem] ${colorClass} shadow-sm backdrop-blur-md`}>
                <Icon size={28} />
            </div>
            <div>
                <p className="text-muted text-sm font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-bold text-primary">{value}</h3>
            </div>
        </motion.div>
    );
}
