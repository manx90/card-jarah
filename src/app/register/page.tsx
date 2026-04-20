import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-1 flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-center text-2xl font-bold">إنشاء حساب</h1>
      <RegisterForm />
    </div>
  );
}
