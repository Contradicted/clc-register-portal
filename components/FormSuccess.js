import { MailCheck } from "lucide-react";

export const FormSuccess = ({ message }) => {
  if (!message) return null;

  return (
    <div className="border-[1.5px] border-emerald-500 p-3 rounded-md flex flex-col gap-x-2 text-sm text-emerald-600">
      <div className="flex items-center gap-x-2">
        <MailCheck className="h-5 w-5" />
        <p>{message}</p>
      </div>
    </div>
  );
};
