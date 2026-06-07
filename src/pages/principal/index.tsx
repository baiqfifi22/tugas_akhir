import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["KEPALA_SEKOLAH"]);
  if ("redirect" in auth) return auth;

  return {
    redirect: {
      destination: "/principal/attendance",
      permanent: false,
    },
  };
};

export default function PrincipalIndex() {
  return null;
}
