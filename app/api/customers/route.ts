import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

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
      return NextResponse.json({ message: "Chào mừng trở lại!", returning: true });
    }

    // Khách mới → tạo mới
    await prisma.customer.create({
      data: { name, phone },
    });

    return NextResponse.json({ message: "Đăng ký thành công!", returning: false });
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