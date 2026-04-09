import { useAppStore } from "../../stores/useAppStore";

export function CsvTableView() {
  const contacts = useAppStore((s) => s.contacts);
  const headers = useAppStore((s) => s.csvHeaders);

  if (contacts.length === 0) {
    return (
      <p className="p-4 text-sm text-gray-500">No contacts loaded.</p>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b bg-gray-50">
            <th className="px-3 py-2 text-xs font-medium text-gray-500">#</th>
            {headers.map((h) => (
              <th
                key={h}
                className={`px-3 py-2 text-xs font-medium whitespace-nowrap ${
                  h === "TEMPLATE"
                    ? "text-blue-600"
                    : "text-gray-500"
                }`}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {contacts.map((contact, i) => (
            <tr
              key={i}
              className="border-b hover:bg-gray-50"
            >
              <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
              {headers.map((h) => (
                <td
                  key={h}
                  className={`px-3 py-2 whitespace-nowrap ${
                    h === "TEMPLATE"
                      ? "font-medium text-blue-600"
                      : ""
                  }`}
                >
                  {contact[h] || ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
