import type { NcpError } from "@go-usb-ai/ncp";

export function ErrorBox({ error }: { error: NcpError | null }) {
  if (!error) {
    return null;
  }

  return (
    <div className="error-box">
      {error.code}: {error.message}
    </div>
  );
}
