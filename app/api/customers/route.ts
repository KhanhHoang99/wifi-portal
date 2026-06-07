import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

import * as dgram from "dgram";

import * as crypto from "crypto";

// [RADIUS] Tự encode packet Access-Request không dùng thư viện ngoài
function radiusAuth(phone: string): Promise<boolean> {
  return new Promise((resolve) => {
    const secret = process.env.RADIUS_SECRET || "my_wifi_secret_2026";
    const host = process.env.RADIUS_HOST || "127.0.0.1";
    const port = parseInt(process.env.RADIUS_PORT || "1812");

    // Tạo authenticator ngẫu nhiên 16 bytes
    const authenticator = crypto.randomBytes(16);

    // Encode User-Password
    const passBuffer = Buffer.from(phone);
    const md5 = crypto.createHash("md5").update(secret).update(authenticator).digest();
    const encPass = Buffer.alloc(16);
    for (let i = 0; i < 16; i++) {
      encPass[i] = (passBuffer[i] || 0) ^ md5[i];
    }

    // Encode User-Name attribute (type=1)
    const userNameVal = Buffer.from(phone);
    const userNameAttr = Buffer.alloc(2 + userNameVal.length);
    userNameAttr[0] = 1; // User-Name
    userNameAttr[1] = 2 + userNameVal.length;
    userNameVal.copy(userNameAttr, 2);

    // Encode User-Password attribute (type=2)
    const userPassAttr = Buffer.alloc(2 + encPass.length);
    userPassAttr[0] = 2; // User-Password
    userPassAttr[1] = 2 + encPass.length;
    encPass.copy(userPassAttr, 2);

    // Ghép attributes
    const attrs = Buffer.concat([userNameAttr, userPassAttr]);

    // Tạo RADIUS packet
    const length = 20 + attrs.length;
    const packet = Buffer.alloc(length);
    packet[0] = 1; // Code: Access-Request
    packet[1] = Math.floor(Math.random() * 256); // Identifier
    packet.writeUInt16BE(length, 2); // Length
    authenticator.copy(packet, 4); // Authenticator
    attrs.copy(packet, 20); // Attributes

    const socket = dgram.createSocket("udp4");

    const timeout = setTimeout(() => {
      socket.close();
      console.error("[RADIUS] Timeout");
      resolve(false);
    }, 3000);

    socket.on("message", (msg) => {
      clearTimeout(timeout);
      socket.close();
      // Code 2 = Access-Accept
      resolve(msg[0] === 2);
    });

    socket.on("error", (err) => {
      clearTimeout(timeout);
      socket.close();
      console.error("[RADIUS] Socket error:", err);
      resolve(false);
    });

    socket.send(packet, port, host);
  });
}


export async function POST(req: NextRequest) {
  try {
    const { name, phone } = await req.json();

    // Validate
    if (!name || !phone) {
      return NextResponse.json(
        { message: "Vui lòng điền đầy đủ thông tin" },
        { status: 400 }
      );
    }

    // Kiểm tra khách đã tồn tại chưa
    const existing = await prisma.customer.findUnique({
      where: { phone },
    });

    if (existing) {
      // Khách cũ → cập nhật lượt ghé thăm
      await prisma.customer.update({
        where: { phone },
        data: { visitCount: { increment: 1 } },
      });
    } else {
      // Khách mới → tạo mới
      await prisma.customer.create({
        data: { name, phone },
      });
    }

    // [RADIUS] Gọi RADIUS sau khi lưu DB xong
    const radiusOk = await radiusAuth(phone);
    if (!radiusOk) {
      console.error("[RADIUS] Không nhận được Access-Accept");
    }

    return NextResponse.json({
      message: existing ? "Chào mừng trở lại!" : "Đăng ký thành công!",
      returning: !!existing,
      radiusAccepted: radiusOk,
    });

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Lỗi server, vui lòng thử lại" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Lỗi server" },
      { status: 500 }
    );
  }
}