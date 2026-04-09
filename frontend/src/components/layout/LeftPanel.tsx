import { SenderNameInput } from "../general/SenderNameInput";
import { GoogleAuthButton } from "../general/GoogleAuthButton";
import { AttachmentManager } from "../general/AttachmentManager";

export function LeftPanel() {
  return (
    <div className="flex flex-col gap-6 border-r bg-gray-50/50 p-4 overflow-auto">
      <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
        General Info
      </h2>
      <SenderNameInput />
      <GoogleAuthButton />
      <AttachmentManager />
    </div>
  );
}
