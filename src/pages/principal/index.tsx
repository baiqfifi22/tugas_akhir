import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
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
