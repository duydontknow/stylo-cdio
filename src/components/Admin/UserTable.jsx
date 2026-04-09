import { Users, ShieldAlert, ShieldCheck } from "lucide-react";
import { UserEmptyState } from "../common/EmptyStates";

export function UserTable({ usersList, adminEmails, handleToggleUserStatus }) {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                <Users size={18} className="text-gray-500" />
                <h2 className="font-bold">Danh sách Tài khoản ({usersList.length})</h2>
            </div>
            
            {usersList.length === 0 ? (
                <div className="p-6">
                    <UserEmptyState />
                </div>
            ) : (
                <div className="max-h-64 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-white shadow-sm z-10">
                            <tr className="text-gray-500">
                                <th className="p-4 font-medium">Email</th>
                                <th className="p-4 font-medium">Ngày tham gia</th>
                                <th className="p-4 font-medium text-right">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usersList.map((u) => {
                                const isAdmin = adminEmails.includes(u.email);
                                const isBanned = u.status === "banned";
                                return (
                                    <tr
                                        key={u.id}
                                        className={`border-b border-gray-50 hover:bg-gray-50/50 transition-colors ${
                                            isBanned ? "bg-red-50 hover:bg-red-100" : ""
                                        }`}
                                    >
                                        <td className="p-4 font-medium flex items-center gap-2">
                                            {u.email}
                                            {isAdmin && (
                                                <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                    ADMIN
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-gray-500">
                                            {new Date(u.created_at).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="p-4 text-right">
                                            {!isAdmin ? (
                                                <button
                                                    onClick={() => handleToggleUserStatus(u.id, u.email, u.status)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ml-auto ${
                                                        isBanned
                                                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                                                            : "bg-green-50 text-green-600 hover:bg-green-100"
                                                    }`}
                                                >
                                                    {isBanned ? (
                                                        <><ShieldAlert size={14} /> Đã khóa</>
                                                    ) : (
                                                        <><ShieldCheck size={14} /> Hoạt động</>
                                                    )}
                                                </button>
                                            ) : (
                                                <span className="inline-block px-3 py-1.5 text-xs font-medium text-gray-400 bg-gray-100 rounded-lg cursor-not-allowed">
                                                    Bảo vệ
                                                </span>
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
