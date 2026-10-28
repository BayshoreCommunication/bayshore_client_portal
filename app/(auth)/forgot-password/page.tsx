import AuthBrandPanel from "@/component/auth/AuthBrandPanel";

// Not built yet. It keeps the brand panel beside it that the sign-in page used to have.
const page = () => {
  return (
    <div className="flex min-h-screen">
      <AuthBrandPanel />
      <div className="flex flex-[1_1_480px] items-center justify-center bg-[#f2f5f3] px-6 py-10">
        <div>page</div>
      </div>
    </div>
  );
};

export default page;
