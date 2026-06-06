"use client";

import { useEffect, useState } from "react";

interface Customer {
  id: number;
  name: string;
  phone: string;
  visitCount: number;
  createdAt: string;
  lastVisit: string;
}

export default function AdminPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/customers")
      .then((res) => res.json())
      .then((data) => {
        setCustomers(data);
        setLoading(false);
      });
  }, []);

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString("vi-VN");
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Danh sách khách hàng</h1>
            <p className="text-gray-400 text-sm mt-1">Tổng: {customers.length} khách</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition"
          >
            Làm mới
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-16 text-gray-400">Đang tải...</div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Chưa có khách hàng nào</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">#</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Họ tên</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Số điện thoại</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Lượt ghé</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Lần đầu</th>
                  <th className="text-left px-6 py-4 text-gray-500 font-medium">Lần cuối</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((c, i) => (
                  <tr key={c.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                    <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                    <td className="px-6 py-4 text-gray-600">{c.phone}</td>
                    <td className="px-6 py-4">
                      <span className="bg-indigo-100 text-indigo-600 px-2 py-1 rounded-full text-xs font-semibold">
                        {c.visitCount} lần
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(c.createdAt)}</td>
                    <td className="px-6 py-4 text-gray-400">{formatDate(c.lastVisit)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}