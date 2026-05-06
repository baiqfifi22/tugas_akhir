import { GetServerSideProps } from "next";

export const getServerSideProps: GetServerSideProps = async () => {
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
