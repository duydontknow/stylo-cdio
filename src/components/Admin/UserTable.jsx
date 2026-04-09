import { Users, ShieldAlert, ShieldCheck } from "lucide-react";
import { UserEmptyState } from "../common/EmptyStates";
import Badge from "../common/Badge";

export function UserTable({ usersList, adminEmails, handleToggleUserStatus }) {
    return (
        <div className="bg-surface rounded-[2rem] shadow-glass border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-white/50 backdrop-blur-md">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600">
                    <Users size={20} />
                </div>
                <h2 className="font-bold text-primary text-xl">Danh sách Tài khoản 
                    <span className="ml-2 text-sm font-medium text-muted">({usersList.length} user)</span>
                </h2>
            </div>
            
            {usersList.length === 0 ? (
                <div className="p-10">
                    <UserEmptyState />
                </div>
            ) : (
                <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-gray-50/90 backdrop-blur-md z-10">
                            <tr className="text-muted font-bold text-xs uppercase tracking-wider">
                                <th className="p-5 font-bold">Email / User</th>
                                <th className="p-5 font-bold">Ngày tham gia</th>
                                <th className="p-5 font-bold text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {usersList.map((u) => {
                                const isAdmin = adminEmails.includes(u.email);
                                const isBanned = u.status === "banned";
                                return (
                                    <tr
                                        key={u.id}
                                        className={`hover:bg-gray-50/50 transition-colors ${
                                            isBanned ? "bg-red-50/30" : ""
                                        }`}
                                    >
                                        <td className="p-5 font-semibold text-primary flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs text-gray-500 uppercase border border-gray-200">
                                                {u.email.charAt(0)}
                                            </div>
                                            {u.email}
                                            {isAdmin && (
                                                <Badge variant="ai" className="text-[10px] py-0.5 px-2">ADMIN</Badge>
                                            )}
                                        </td>
                                        <td className="p-5 text-muted font-medium">
                                            {new Date(u.created_at).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="p-5 text-right">
                                            {!isAdmin ? (
                                                <button
                                                    onClick={() => handleToggleUserStatus(u.id, u.email, u.status)}
                                                    className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 ml-auto font-bold transition-all ${
                                                        isBanned
                                                            ? "bg-red-100 text-red-600 hover:bg-red-200"
                                                            : "bg-green-100 text-green-700 hover:bg-green-200"
                                                    }`}
                                                >
                                                    {isBanned ? (
                                                        <><ShieldAlert size={14} /> Bị Khóa</>
                                                    ) : (
                                                        <><ShieldCheck size={14} /> Hoạt động</>
                                                    )}
                                                </button>
                                            ) : (
                                                <Badge className="bg-gray-100 text-gray-400 border-none float-right py-1.5 px-3">
                                                    Được Bảo Vệ
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
