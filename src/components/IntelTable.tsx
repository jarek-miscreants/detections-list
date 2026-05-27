import { avatarVariant, initials, relativeTime } from "@/lib/format";
import type { IntelItem } from "@/lib/types";

export function IntelTable({ items }: { items: IntelItem[] }) {
  if (items.length === 0) {
    return (
      <div className="iex-table-wrap">
        <p className="iex-empty">No intel matches your filters.</p>
      </div>
    );
  }

  return (
    <div className="iex-table-wrap">
      <table>
        <thead>
          <tr>
            <th style={{ width: "14%" }}>Source</th>
            <th style={{ width: "125px" }}>Contributor</th>
            <th>Title</th>
            <th style={{ width: "130px" }}>Updated</th>
            <th style={{ width: "120px" }}>Type</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <div className="source-cell">
                  <span className="source-logo">
                    {item.source.charAt(0).toUpperCase()}
                  </span>
                  {item.source}
                </div>
              </td>
              <td>
                <div className="contributor-cell">
                  <span className={`avatar ${avatarVariant(item.contributor)}`}>
                    {initials(item.contributor)}
                  </span>
                  <span className="contributor-name">{item.contributor}</span>
                </div>
              </td>
              <td className="title-cell">
                <div className="title-main">
                  {item.aiEnriched && <span className="ai-spark">✨</span>}
                  {item.title}
                </div>
                <div className="title-desc">{item.description}</div>
              </td>
              <td className="updated-cell">{relativeTime(item.updatedAt)}</td>
              <td>
                <span className="type-chip intel">{item.type}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
