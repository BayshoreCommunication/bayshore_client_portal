import Trend from "@/component/shared/Trend";
import { leadSources, leadStats, leads } from "./data";

const Leads = () => {
  return (
    <>
      <div className="breadcrumb-row">
        <div className="breadcrumbs">
          <b>Leads</b>
        </div>
      </div>

      <div>
        <div className="page-title">Your Leads</div>
        <div className="page-desc">Every new inquiry BayShore has captured for you this month.</div>
      </div>

      <div className="dash-metrics-grid">
        {leadStats.map((stat) => (
          <div className="dash-metric-card" key={stat.label}>
            <div className="dash-metric-lbl">{stat.label}</div>
            <div className="dash-metric-val">
              {stat.value}
              {stat.suffix ? (
                <span style={{ fontSize: 13, color: "#8496a3", fontWeight: 600 }}> {stat.suffix}</span>
              ) : null}
            </div>
            <Trend direction="up" value={stat.delta} note={stat.note} />
          </div>
        ))}
      </div>

      <div className="dash-main-grid" style={{ gridTemplateColumns: "2.2fr 1fr", alignItems: "stretch" }}>
        <div className="section-card" style={{ padding: 0 }}>
          <table className="leads-table">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Case Type</th>
                <th>Source</th>
                <th>Received</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.name}>
                  <td>
                    <div className="lead-cell">
                      <div className="lead-avatar" style={{ background: lead.avatarColor }}>
                        {lead.initials}
                      </div>
                      <div className="lead-name">{lead.name}</div>
                    </div>
                  </td>
                  <td>{lead.caseType}</td>
                  <td>
                    <span className="source-dot" style={{ background: lead.sourceColor }} /> {lead.source}
                  </td>
                  <td>{lead.received}</td>
                  <td>
                    <span className="lead-status" style={{ background: lead.statusBg, color: lead.statusColor }}>
                      {lead.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="leads-table-footer">
            <span>Showing {leads.length} of 84 leads</span>
            <span>September 2026</span>
          </div>
        </div>

        <div className="dash-side-col">
          <div className="side-card">
            <div className="side-header">
              <div className="side-title">Where Leads Come From</div>
              <div className="side-sub">September, month to date</div>
            </div>
            <div className="lead-source-list">
              {leadSources.map((source) => (
                <div className="lead-source-row" key={source.label}>
                  <span className="source-dot" style={{ background: source.color }} />
                  <span className="ls-label">{source.label}</span>
                  <div className="ls-bar-track">
                    <div className="ls-bar-fill" style={{ width: `${source.width}%`, background: source.color }} />
                  </div>
                  <span className="ls-count">{source.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="side-card">
            <div className="side-title" style={{ marginBottom: 8 }}>
              Have a question?
            </div>
            <div className="dash-pending-sub">
              If any of these look unfamiliar or you&apos;d like more detail on a specific lead, message{" "}
              <b style={{ color: "#17242f" }}>Jordan Reyes</b>, your account manager.
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Leads;
