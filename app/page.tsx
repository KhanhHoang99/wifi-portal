"use client";

import { useState, useEffect } from "react";

export default function CaptivePortal() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Lưu các tham số Aruba gửi kèm khi redirect vào portal
  const [arubaParams, setArubaParams] = useState({
    mac: "",
    ip: "",
    essid: "",
    apname: "",
    switchUrl: "",
    url: "",
  });

  // Đọc tham số từ URL khi page load một cách an toàn
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setArubaParams({
        mac: params.get("mac") || "",
        ip: params.get("ip") || "",
        essid: params.get("essid") || "",
        apname: params.get("apname") || "",
        switchUrl: params.get("switch_url") || "", 
        url: params.get("url") || "",
      });
    }
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    loading: true && setLoading(true);
    setError("");

    try {
      // 1. Lưu thông tin vào Database PostgreSQL qua API của bạn
      const res = await fetch("/api/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          macAddress: arubaParams.mac, 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Có lỗi xảy ra");

      setSuccess(true);

      // 2. Tự động tạo Form và POST dữ liệu kích hoạt mạng về cho Aruba
      setTimeout(() => {
        // Đường dẫn cgi-bin mặc định của dòng Aruba Instant AP
        const arubaLoginUrl = "https://securelogin.arubanetworks.com/cgi-bin/login";

        const form = document.createElement("form");
        form.method = "POST";
        form.action = arubaLoginUrl; 


        const cmdInput = document.createElement("input");
        cmdInput.type = "hidden";
        cmdInput.name = "cmd";
        cmdInput.value = "authenticate";
        form.appendChild(cmdInput);

        // Gửi tài khoản là Số điện thoại của khách sang RADIUS
        const userInput = document.createElement("input");
        userInput.type = "hidden";
        userInput.name = "user";
        userInput.value = phone;
        form.appendChild(userInput);

        // Gửi mật khẩu trùng với cấu hình trong FreeRADIUS của bạn
        const passInput = document.createElement("input");
        passInput.type = "hidden";
        passInput.name = "password";
        passInput.value = "123456"; // <<-- Nhớ đổi lại đúng pass trong FreeRADIUS của bạn (nếu có)
        form.appendChild(passInput);

        // Giữ lại trang gốc khách muốn truy cập sau khi có mạng
        const params = new URLSearchParams(window.location.search);
        const origUrl = params.get("url") || "http://google.com";
        const urlInput = document.createElement("input");
        urlInput.type = "hidden";
        urlInput.name = "url";
        urlInput.value = origUrl;
        form.appendChild(urlInput);

        document.body.appendChild(form);
        form.submit(); // Ép điện thoại gửi lệnh xác thực để Aruba mở mạng
      }, 2000); // Chờ 2 giây hiện màn hình thành công rồi kích hoạt

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
          <p className="text-gray-400 text-sm mt-4">Đang kích hoạt Internet...</p> 
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