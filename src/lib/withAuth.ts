import type { GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import type { NextApiRequest, NextApiResponse } from "next";

/**
 * Digunakan di dalam `getServerSideProps` pada halaman frontend.
 * Jika user belum login atau rolenya tidak sesuai → redirect ke halaman login (`/`).
 *
 * @example
 * export const getServerSideProps: GetServerSideProps = async (ctx) => {
 *   const auth = requireRole(ctx, ["KEPALA_SEKOLAH"]);
 *   if (auth.redirect) return auth;
 *   return { props: {} };
 * };
 */
export function requireRole(
  context: GetServerSidePropsContext,
  allowedRoles: string[]
): GetServerSidePropsResult<Record<string, never>> {
  const { userRole, userId } = context.req.cookies;

  const roles = [...allowedRoles];
  if (roles.includes("GURU")) {
    roles.push("WALI_KELAS", "GURU_MAPEL");
  }

  if (!userId || !userRole || !roles.includes(userRole)) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  return { props: {} };
}

/**
 * Digunakan di awal setiap API handler.
 * Jika user belum login atau rolenya tidak sesuai → kirim 401 dan return `null`.
 * Pastikan periksa nilai kembaliannya: jika `null`, langsung `return` dari handler.
 *
 * @example
 * const auth = requireApiRole(req, res, ["KEPALA_SEKOLAH"]);
 * if (!auth) return;
 * const { userId, userRole } = auth;
 */
export function requireApiRole(
  req: NextApiRequest,
  res: NextApiResponse,
  allowedRoles: string[]
): { userId: string; userRole: string } | null {
  const { userRole, userId } = req.cookies;

  const roles = [...allowedRoles];
  if (roles.includes("GURU")) {
    roles.push("WALI_KELAS", "GURU_MAPEL");
  }

  if (!userId || !userRole || !roles.includes(userRole)) {
    res.status(401).json({ message: "Unauthorized: akses ditolak" });
    return null;
  }

  return { userId, userRole };
}
