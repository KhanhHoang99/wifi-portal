"use client";

import { useState, useEffect } from "react";

export default function CaptivePortal() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // [ARUBA] Lưu các tham số Aruba gửi kèm khi redirect vào portal
  const [arubaParams, setArubaParams] = useState({
    mac: "",
    ip: "",
    essid: "",
    apname: "",
    switchip: "",
    url: "",
  });

  // [ARUBA] Đọc tham số từ URL khi page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setArubaParams({
      mac: params.get("mac") || "",
      ip: params.get("ip") || "",
      essid: params.get("essid") || "",
      apname: params.get("apname") || "",
      switchip: params.get("switchip") || "",
      url: params.get("url") || "",
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          macAddress: arubaParams.mac, // [ARUBA] Gửi MAC lên DB
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra");

      setSuccess(true);

      // [ARUBA] Redirect về Aruba để mở internet cho client
      // switchip là địa chỉ Aruba, url là trang gốc muốn vào
      if (arubaParams.switchip) {
        const redirectUrl = `https://${arubaParams.switchip}/auth/index.html/u?url=${encodeURIComponent(arubaParams.url || "http://google.com")}`;
        setTimeout(() => {
          window.location.href = redirectUrl;
        }, 2000); // Chờ 2 giây cho user thấy màn hình thành công
      }

    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Kết nối thành công!</h2>
          <p className="text-gray-500">
            Chào mừng <span className="font-semibold text-indigo-600">{name}</span>, bạn đã có thể sử dụng WiFi miễn phí.
          </p>
          {/* [ARUBA] Thông báo đang chuyển hướng */}
          {arubaParams.switchip && (
            <p className="text-gray-400 text-sm mt-4">Đang kết nối internet...</p>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.14 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 mb-1">Kết nối WiFi miễn phí</h1>
        <p className="text-center text-gray-400 text-sm mb-8">Vui lòng điền thông tin để tiếp tục</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nhập tên của bạn"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-xl transition"
          >
            {loading ? "Đang kết nối..." : "Kết nối WiFi"}
          </button>
        </form>

        <p className="text-center text-gray-400 text-xs mt-6">
          Thông tin của bạn được bảo mật và không chia sẻ cho bên thứ ba.
        </p>
      </div>
    </main>
  );
}