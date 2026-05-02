import React from "react";

const CONTACTS = {
  schedulerEmail: "EDMD-NVLY-Scheduler@kp.org",
  stephanieEden: "530-638-6690",
};

const COPY = {
  pageTitle: "ED Call Activate Guide Prototype",
  pageSubtitle:
    "Simple prototype for sick call / orphan decision support using TAS and Intrigma.",
  quickLinks: [
    { label: "TAS", url: "https://kaizentas.com/" },
    { label: "Intrigma", url: "https://www.intrigma.com/" },
  ],
  byline: "Experiment by Joshua McKamie",
};

const ACTIONS = {
  emailScheduler: {
    type: "email",
    label: `Email scheduler (${CONTACTS.schedulerEmail})`,
    value: CONTACTS.schedulerEmail,
  },
};

const ADMIN_NOTE =
  "If there is any uncertainty or other concern, please contact Admin on Call. See TAS for the current Admin on Call.";

function renderActionItem(item) {
  if (typeof item === "string") return item;

  if (item?.type === "email") {
    return (
      <a href={`mailto:${item.value}`} className="link">
        {item.label}
      </a>
    );
  }

  return item?.label || "";
}

function getUcRecommendation(daysNum) {
  if (daysNum >= 2) {
    return {
      title: "UC shift, 2+ days out",
      body:
        "Call out as early as possible and contact Dr. Eden for further guidance. Earlier notice allows clinics to shut off unbooked appointments.",
      who: [
        `Contact Dr. Eden for further guidance: ${CONTACTS.stephanieEden}`,
        "Find the on-call manager in ClinConnect → Roseville Urgent Care if directed or needed",
        "Call or text the manager on their mobile number if directed or needed",
      ],
      notes: [
        "The schedule shows 10a–8p but reflects which manager is working that day.",
        "If only one manager is listed, they are covering both sites.",
        "ED back-up Call is not used to cover UC shifts.",
      ],
    };
  }

  return {
    title: "Notify UC Nurse Managers",
    body:
      "Call out as soon as possible and notify the Urgent Care manager on call directly. Do not use the ED Call process.",
    who: [
      "Find the on-call manager in ClinConnect → Roseville Urgent Care",
      "Call or text the manager (mobile is best contact)",
      "If outside hours, send a text",
      `Please also notify Dr. Eden at ${CONTACTS.stephanieEden}`,
    ],
    notes: [
      "Earlier notice makes it easier to shut off appointments rather than cancel booked patients.",
      "If only one manager is listed, they are covering both sites.",
      "ED back-up Call is not used to cover UC shifts.",
    ],
  };
}

function getOrphanRecommendation(orphanNum) {
  const order = ["C1", "C2", "C3", "C4"];
  const target = order[orphanNum] || "No regular Call left";

  if (target === "No regular Call left") {
    return {
      title: "No regular Call left",
      body: "Based on the orphan count, all regular Calls appear burned. Contact Admin on Call.",
      who: ["Admin on Call"],
      notes: [
        "Before 4pm the day before, Calls are consumed in orphan order.",
        "If one of the orphans is itself a Call position, that position stays blank and is not covered.",
        ADMIN_NOTE,
      ],
    };
  }

  return {
    title: `Activate ${target}`,
    body: `Before 4pm the day before, acute Call activations are activated in orphan order. With ${orphanNum} existing orphan(s), activate ${target}.`,
    who: [`Contact the ${target} call physician`, "Activate the call on TAS"],
    notes: ["Double-check Intrigma for current orphans.", ADMIN_NOTE],
  };
}

function getDayEveningRecommendation({ shiftStartBucket, activatedCalls }) {
  const isDayShift = shiftStartBucket === "before4";
  const callOrder = isDayShift ? ["C1", "C2"] : ["C3", "C4"];
  const alreadyUsed = activatedCalls.filter((call) => callOrder.includes(call));
  const target = callOrder[alreadyUsed.length];

  if (!target) {
    return {
      title: isDayShift ? "No day Call left" : "No evening Call left",
      body: isDayShift
        ? "C1 and C2 already appear activated. Contact Admin on Call."
        : "C3 and C4 already appear activated. Contact Admin on Call.",
      who: ["Admin on Call"],
      notes: [
        isDayShift
          ? "Day Call uses C1/C2 for shifts starting before 4pm."
          : "Evening Call uses C3/C4 for shifts starting 4pm or later.",
        ADMIN_NOTE,
      ],
    };
  }

  return {
    title: `Activate ${target}`,
    body: isDayShift
      ? `Use day Call for shifts starting before 4pm. Based on the currently activated Calls, activate ${target}.`
      : `Use evening Call for shifts starting 4pm or later. Based on the currently activated Calls, activate ${target}.`,
    who: [`Contact the ${target} call physician`, "Activate the call on TAS"],
    notes: [
      "Check TAS to confirm which Calls have already activated themselves.",
      isDayShift
        ? "Day Call uses C1/C2 for shifts starting before 4pm."
        : "Evening Call uses C3/C4 for shifts starting 4pm or later.",
      ADMIN_NOTE,
    ],
  };
}

function getEdRecommendation({
  daysNum,
  tomorrowTiming,
  orphanNum,
  shiftStartBucket,
  activatedCalls,
}) {
  if (daysNum >= 2) {
    return {
      title: "2+ days out",
      body:
        "Do not activate Call. Email the scheduler for further guidance. Depending on the situation, the shift may be orphaned.",
      who: [ACTIONS.emailScheduler],
      notes: [
        "For multi-day illness, only tomorrow uses Call logic. Later shifts are handled by the scheduler.",
        ADMIN_NOTE,
      ],
    };
  }

  if (daysNum === 1) {
    if (tomorrowTiming === "before4") {
      return getOrphanRecommendation(orphanNum);
    }

    if (tomorrowTiming === "after4") {
      return getDayEveningRecommendation({ shiftStartBucket, activatedCalls });
    }
  }

  return getDayEveningRecommendation({ shiftStartBucket, activatedCalls });
}

function EmptyRecommendation() {
  return (
    <div className="emptyState">
      <div className="emptyTitle">Recommendation pending</div>
      <p className="emptyBody">
        Answer the questions on the left. Once the needed details are complete, the recommendation will appear here.
      </p>
    </div>
  );
}

export default function CallActivationDecisionTool() {
  const [isUC, setIsUC] = React.useState("");
  const [daysUntilShift, setDaysUntilShift] = React.useState("");
  const [tomorrowTiming, setTomorrowTiming] = React.useState("");
  const [shiftStartBucket, setShiftStartBucket] = React.useState("");
  const [orphanCount, setOrphanCount] = React.useState("");
  const [activatedCalls, setActivatedCalls] = React.useState([]);
  const [noCallsActivated, setNoCallsActivated] = React.useState(false);

  const daysNum = Number(daysUntilShift);
  const orphanNum = Number(orphanCount);

  const resetEdDetails = () => {
    setTomorrowTiming("");
    setShiftStartBucket("");
    setOrphanCount("");
    setActivatedCalls([]);
    setNoCallsActivated(false);
  };

  const handleShiftTypeChange = (value) => {
    setIsUC(value);
    resetEdDetails();
  };

  const handleDaysUntilShiftChange = (value) => {
    setDaysUntilShift(value);
    resetEdDetails();
  };

  const handleTomorrowTimingChange = (value) => {
    setTomorrowTiming(value);
    setShiftStartBucket("");
    setOrphanCount("");
    setActivatedCalls([]);
    setNoCallsActivated(false);
  };

  const handleShiftStartBucketChange = (value) => {
    setShiftStartBucket(value);
    setActivatedCalls([]);
    setNoCallsActivated(false);
  };

  const toggleCall = (call) => {
    setNoCallsActivated(false);
    setActivatedCalls((prev) =>
      prev.includes(call) ? prev.filter((c) => c !== call) : [...prev, call]
    );
  };

  const handleNoCallsActivated = () => {
    setActivatedCalls([]);
    setNoCallsActivated(true);
  };

  const needsTomorrowTiming = isUC === "no" && daysNum === 1;
  const usesOrphanOrder = isUC === "no" && daysNum === 1 && tomorrowTiming === "before4";
  const usesDayEvening =
    isUC === "no" &&
    (daysNum === 0 || (daysNum === 1 && tomorrowTiming === "after4"));

  const isComplete = (() => {
    if (!isUC || !daysUntilShift) return false;
    if (isUC === "yes") return true;
    if (daysNum >= 2) return true;
    if (daysNum === 1 && !tomorrowTiming) return false;
    if (usesOrphanOrder) return !Number.isNaN(orphanNum);
    if (usesDayEvening) return Boolean(shiftStartBucket) && (noCallsActivated || activatedCalls.length > 0);
    return false;
  })();

  const result = isComplete
    ? isUC === "yes"
      ? getUcRecommendation(daysNum)
      : getEdRecommendation({
          daysNum,
          tomorrowTiming,
          orphanNum,
          shiftStartBucket,
          activatedCalls,
        })
    : null;

  return (
    <div className="page">
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; }
        .page {
          min-height: 100vh;
          background: #f8fafc;
          padding: 16px;
          font-family: Arial, sans-serif;
          color: #0f172a;
        }
        .container {
          max-width: 1100px;
          margin: 0 auto;
        }
        .title {
          font-size: 30px;
          font-weight: 700;
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }
        .subtitle {
          margin: 0 0 20px 0;
          color: #475569;
          line-height: 1.5;
        }
        .mainGrid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
        }
        .card {
          background: white;
          border: 1px solid #cbd5e1;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
        }
        .sectionTitle {
          margin: 0 0 16px 0;
          font-size: 22px;
          font-weight: 700;
        }
        .field {
          margin-bottom: 18px;
        }
        .label {
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 8px;
          display: block;
        }
        .helperText {
          margin: 4px 0 10px 0;
          color: #64748b;
          font-size: 13px;
          line-height: 1.4;
        }
        .buttonRow {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .bigButton, .pillButton {
          border: 1px solid #94a3b8;
          background: white;
          color: #0f172a;
          cursor: pointer;
          transition: 0.15s ease;
        }
        .bigButton {
          min-height: 74px;
          padding: 16px 18px;
          border-radius: 16px;
          font-size: 16px;
          font-weight: 700;
          text-align: left;
          flex: 1 1 220px;
        }
        .pillButton {
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
        }
        .selected {
          background: #0f172a;
          color: white;
          border-color: #0f172a;
        }
        .select {
          width: 100%;
          max-width: 360px;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #94a3b8;
          font-size: 15px;
          background: white;
        }
        .recommendationBox {
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 18px;
          border: 1px solid #e2e8f0;
          background: #f0fdf4;
          border-color: #86efac;
          box-shadow: 0 0 0 2px #86efac;
          transition: 0.2s ease;
        }
        .recTitle {
          font-size: 20px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .recBody {
          line-height: 1.6;
          color: #334155;
          margin: 0;
        }
        .emptyState {
          border-radius: 16px;
          padding: 16px;
          margin-bottom: 18px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .emptyTitle {
          font-size: 18px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #334155;
        }
        .emptyBody {
          line-height: 1.6;
          color: #64748b;
          margin: 0;
        }
        .subheading {
          font-size: 14px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        .list {
          margin: 0;
          padding-left: 20px;
          color: #334155;
          line-height: 1.6;
        }
        .list li {
          margin-bottom: 6px;
        }
        .footerCard {
          margin-top: 16px;
          background: white;
          border: 1px dashed #94a3b8;
          border-radius: 20px;
          padding: 20px;
        }
        .quickLinks {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .quickLink {
          display: inline-block;
          border: 1px solid #94a3b8;
          border-radius: 12px;
          padding: 10px 14px;
          color: #0f172a;
          font-weight: 700;
          text-decoration: none;
          background: white;
        }
        .quickLink:hover {
          background: #f8fafc;
          text-decoration: underline;
        }
        .byline {
          margin-top: 18px;
          padding-top: 14px;
          border-top: 1px solid #e2e8f0;
          font-size: 12px;
          color: #64748b;
        }
        .link {
          color: #0f172a;
        }
        .link:hover {
          text-decoration: underline;
        }
        @media (min-width: 900px) {
          .page {
            padding: 24px;
          }
          .mainGrid {
            grid-template-columns: 1.1fr 0.9fr;
          }
        }
      `}</style>

      <div className="container">
        <h1 className="title">{COPY.pageTitle}</h1>
        <p className="subtitle">{COPY.pageSubtitle}</p>

        <div className="mainGrid">
          <div className="card">
            <h2 className="sectionTitle">Current situation</h2>

            <div className="field">
              <label className="label">Is this an ED shift or UC shift?</label>
              <div className="buttonRow">
                <button
                  className={`bigButton ${isUC === "no" ? "selected" : ""}`}
                  onClick={() => handleShiftTypeChange("no")}
                >
                  ED shift
                </button>
                <button
                  className={`bigButton ${isUC === "yes" ? "selected" : ""}`}
                  onClick={() => handleShiftTypeChange("yes")}
                >
                  UC shift
                </button>
              </div>
            </div>

            <div className="field">
              <label className="label">When is the affected shift?</label>
              <select
                className="select"
                value={daysUntilShift}
                onChange={(e) => handleDaysUntilShiftChange(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Today</option>
                <option value="1">Tomorrow</option>
                <option value="2">2 or more days away</option>
              </select>
            </div>

            {needsTomorrowTiming && (
              <div className="field">
                <label className="label">Is it currently before 4pm?</label>
                <p className="helperText">
                  Before 4pm the day before uses orphan order. After 4pm, use the affected shift start time.
                </p>
                <div className="buttonRow">
                  <button
                    className={`pillButton ${tomorrowTiming === "before4" ? "selected" : ""}`}
                    onClick={() => handleTomorrowTimingChange("before4")}
                  >
                    Before 4pm
                  </button>
                  <button
                    className={`pillButton ${tomorrowTiming === "after4" ? "selected" : ""}`}
                    onClick={() => handleTomorrowTimingChange("after4")}
                  >
                    After 4pm
                  </button>
                </div>
              </div>
            )}

            {usesOrphanOrder && (
              <div className="field">
                <label className="label">How many orphans already exist for that day?</label>
                <select
                  className="select"
                  value={orphanCount}
                  onChange={(e) => setOrphanCount(e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4+</option>
                </select>
              </div>
            )}

            {usesDayEvening && (
              <>
                <div className="field">
                  <label className="label">What time does the affected shift start?</label>
                  <div className="buttonRow">
                    <button
                      className={`pillButton ${shiftStartBucket === "before4" ? "selected" : ""}`}
                      onClick={() => handleShiftStartBucketChange("before4")}
                    >
                      Before 4pm
                    </button>
                    <button
                      className={`pillButton ${shiftStartBucket === "after4" ? "selected" : ""}`}
                      onClick={() => handleShiftStartBucketChange("after4")}
                    >
                      4pm or later
                    </button>
                  </div>
                </div>

                {shiftStartBucket && (
                  <div className="field">
                    <label className="label">Which Calls are already activated on TAS?</label>
                    <p className="helperText">
                      Select any calls already activated, or choose “No calls yet activated.”
                    </p>
                    <div className="buttonRow">
                      {["C1", "C2", "C3", "C4"].map((call) => (
                        <button
                          key={call}
                          className={`pillButton ${activatedCalls.includes(call) ? "selected" : ""}`}
                          onClick={() => toggleCall(call)}
                        >
                          {call}
                        </button>
                      ))}
                    </div>
                    <div className="buttonRow" style={{ marginTop: 10 }}>
                      <button
                        className={`pillButton ${noCallsActivated ? "selected" : ""}`}
                        onClick={handleNoCallsActivated}
                      >
                        No calls yet activated
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="card">
            <h2 className="sectionTitle">Recommendation</h2>

            {!result && <EmptyRecommendation />}

            {result && (
              <>
                <div className="recommendationBox">
                  <div className="recTitle">{result.title}</div>
                  <p className="recBody">{result.body}</p>
                </div>

                {result.who.length > 0 && (
                  <div style={{ marginBottom: 18 }}>
                    <div className="subheading">Action</div>
                    <ul className="list">
                      {result.who.map((item, index) => (
                        <li
                          key={
                            typeof item === "string" ? item : `${item.label}-${index}`
                          }
                        >
                          {renderActionItem(item)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {result.notes.length > 0 && (
                  <div>
                    <div className="subheading">Notes</div>
                    <ul className="list">
                      {result.notes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="footerCard">
          <div className="subheading" style={{ fontSize: 16, marginBottom: 10 }}>
            Quick links
          </div>
          <div className="quickLinks">
            {COPY.quickLinks.map((link) => (
              <a
                key={link.label}
                className="quickLink"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {link.label}
              </a>
            ))}
          </div>
          <div className="byline">{COPY.byline}</div>
        </div>
      </div>
    </div>
  );
}
