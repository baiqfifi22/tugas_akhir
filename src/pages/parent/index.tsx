import { GetServerSideProps } from "next";
import { requireRole } from "@/lib/withAuth";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const auth = requireRole(context, ["ORANG_TUA"]);
  if ("redirect" in auth) return auth;

  return {
    redirect: {
      destination: "/parent/attendance",
      permanent: false,
    },
  };
};

export default function ParentIndex() {
  return null;
}
