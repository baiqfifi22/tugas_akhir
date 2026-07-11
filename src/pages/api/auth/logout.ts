import type { NextApiRequest, NextApiResponse } from "next";
import { serialize } from "cookie";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  // Hapus semua cookie auth dengan cara set maxAge = 0
  // Browser akan langsung membuang cookie tersebut
  res.setHeader("Set-Cookie", [
    serialize("userId", "", { httpOnly: true, path: "/", maxAge: 0 }),
    serialize("userRole", "", { httpOnly: true, path: "/", maxAge: 0 }),
    serialize("userName", "", { httpOnly: false, path: "/", maxAge: 0 }),
  ]);

  return res.status(200).json({ success: true });
}
