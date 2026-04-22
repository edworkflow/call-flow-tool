import React from "react";

const CONTACTS = {
  schedulerEmail: "EDMD-NVLY-Scheduler@kp.org",
  stephanieEden: "530-638-6690",
};

const COPY = {
  pageTitle: "ED Call Activate Guide Prototype",
  pageSubtitle:
    "Simple prototype for sick call / orphan decision support using TAS and Intrigma.",
  futureUpgrades: [
    "Pull orphan shifts automatically from Intrigma",
    "Show a live list of who is on call (physicians and Admin on Call)",
    "Quick links to TAS, Intrigma, and scheduling/call guidelines",
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
      body: "Call out as early as possible and notify the Urgent Care manager on call. Earlier notice allows clinics to shut off unbooked appointments.",
      who: [
        "Find the on-call manager in ClinConnect → Roseville Urgent Care",
        "Call or text the manager on their mobile number",
        `Please also notify Dr. Eden at ${CONTACTS.stephanieEden}`,
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
    body: "Call out as soon as possible and notify the Urgent Care manager on call directly. Do not use the ED Call process.",
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

function getEdRecommendation({
  daysNum,
  timeBucket,
  shiftType,
  orphanNum,
  activatedCalls,
}) {
  if (daysNum >= 2) {
    return {
      title: "2+ days out",
      body: "Do not activate Call. Email the scheduler to orphan the shift.",
      who: [ACTIONS.emailScheduler],
      notes: [
        "For multi-day illness, only tomorrow uses Call logic. Later shifts are handled by the scheduler.",
      ],
    };
  }

  if (!timeBucket || !shiftType || Number.isNaN(orphanNum)) {
    return {
      title: "Complete the inputs",
      body: "Choose the current time, shift type, and current number of orphans.",
      who: [],
      notes: [],
    };
  }

  if (timeBucket === "before4") {
    const order = ["C1", "C2", "C3", "C4"];
    const target = order[orphanNum] || "No regular Call left";

    if (target === "No regular Call left") {
      return {
        title: "No regular Call left",
        body: "Based on the orphan count, all regular Calls appear burned. Contact Admin on Call.",
        who: ["Admin on Call"],
        notes: [
          "Before 4pm, Calls are consumed in orphan order.",
          "If one of the orphans is itself a Call position, that position stays blank and is not covered.",
        ],
      };
    }

    return {
      title: `Activate ${target}`,
      body: `Before 4pm, acute Call activations are activated in orphan order. With ${orphanNum} existing orphan(s), activate ${target}.`,
      who: [target, "Use TAS Call Activation"],
      notes: [
        "Double-check Intrigma for current orphans.",
        "If it is close to or after 4pm, confirm whether someone already activated themselves on TAS.",
      ],
    };
  }

  const dayCallsUsed = activatedCalls.filter(
    (c) => c === "C1" || c === "C2"
  ).length;
  const eveningCallsUsed = activatedCalls.filter(
    (c) => c === "C3" || c === "C4"
  ).length;

  if (shiftType === "day") {
    const target = ["C1", "C2"][dayCallsUsed];
    if (!target) {
      return {
        title: "No day Call left",
        body: "C1 and C2 already appear activated for tomorrow. Contact Admin on Call.",
        who: ["Admin on Call"],
        notes: ["After 4pm, unused C1/C2 become day Call for 4am to 3:59pm."],
      };
    }

    return {
      title: `Activate ${target}`,
      body: `After 4pm, unused C1 and C2 become day Call. Based on the currently activated Calls, activate ${target}.`,
      who: [target, "Use TAS Call Activation"],
      notes: [
        "Check TAS to confirm which Calls have already activated themselves.",
        "Day Call covers shifts starting 4am to 3:59pm.",
      ],
    };
  }

  const target = ["C3", "C4"][eveningCallsUsed];
  if (!target) {
    return {
      title: "No evening Call left",
      body: "C3 and C4 already appear activated for tomorrow. Contact Admin on Call.",
      who: ["Admin on Call"],
      notes: ["After 4pm, unused C3/C4 become evening Call for 4pm to 2am."],
    };
  }

  return {
    title: `Activate ${target}`,
    body: `After 4pm, unused C3 and C4 become evening Call. Based on the currently activated Calls, activate ${target}.`,
    who: [target, "Use TAS Call Activation"],
    notes: [
      "Check TAS to confirm which Calls have already activated themselves.",
      "Evening Call covers shifts starting 4pm to 2am.",
    ],
  };
}

export default function CallActivationDecisionTool() {
  const [timeBucket, setTimeBucket] = React.useState("");
  const [daysUntilShift, setDaysUntilShift] = React.useState("");
  const [shiftType, setShiftType] = React.useState("");
  const [isUC, setIsUC] = React.useState("");
  const [orphanCount, setOrphanCount] = React.useState("");
  const [activatedCalls, setActivatedCalls] = React.useState([]);

  const toggleCall = (call) => {
    setActivatedCalls((prev) =>
      prev.includes(call) ? prev.filter((c) => c !== call) : [...prev, call]
    );
  };

  const getRecommendation = () => {
    const daysNum = Number(daysUntilShift);
    const orphanNum = Number(orphanCount);

    if (!daysUntilShift || !isUC) {
      return {
        title: "Complete the inputs",
        body: "Choose when the shift is, whether this is UC, and the current situation to see the recommendation.",
        who: [],
        notes: [],
      };
    }

    if (isUC === "yes") {
      return getUcRecommendation(daysNum);
    }

    return getEdRecommendation({
      daysNum,
      timeBucket,
      shiftType,
      orphanNum,
      activatedCalls,
    });
  };

  const result = getRecommendation();

  const isComplete = (() => {
    const daysNum = Number(daysUntilShift);
    if (!daysUntilShift || !isUC) return false;
    if (isUC === "yes") return true;
    if (daysNum >= 2) return true;
    if (!timeBucket || !shiftType) return false;
    if (timeBucket === "before4" && Number.isNaN(Number(orphanCount))) {
      return false;
    }
    return true;
  })();

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
          background: #f8fafc;
          transition: 0.2s ease;
        }
        .recommendationBox.complete {
          background: #f0fdf4;
          border-color: #86efac;
          box-shadow: 0 0 0 2px #86efac;
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
                  onClick={() => setIsUC("no")}
                >
                  ED shift
                </button>
                <button
                  className={`bigButton ${isUC === "yes" ? "selected" : ""}`}
                  onClick={() => setIsUC("yes")}
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
                onChange={(e) => setDaysUntilShift(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Today</option>
                <option value="1">Tomorrow</option>
                <option value="2">2 or more days away</option>
              </select>
            </div>

            {daysUntilShift !== "" &&
              Number(daysUntilShift) < 2 &&
              isUC === "no" && (
                <>
                  <div className="field">
                    <label className="label">What time is it right now?</label>
                    <div className="buttonRow">
                      <button
                        className={`pillButton ${timeBucket === "before4" ? "selected" : ""}`}
                        onClick={() => setTimeBucket("before4")}
                      >
                        Before 4pm
                      </button>
                      <button
                        className={`pillButton ${timeBucket === "after4" ? "selected" : ""}`}
                        onClick={() => setTimeBucket("after4")}
                      >
                        After 4pm
                      </button>
                    </div>
                  </div>

                  <div className="field">
                    <label className="label">
                      Is the affected shift a day or evening shift?
                    </label>
                    <div className="buttonRow">
                      <button
                        className={`pillButton ${shiftType === "day" ? "selected" : ""}`}
                        onClick={() => setShiftType("day")}
                      >
                        Day shift
                      </button>
                      <button
                        className={`pillButton ${shiftType === "evening" ? "selected" : ""}`}
                        onClick={() => setShiftType("evening")}
                      >
                        Evening shift
                      </button>
                    </div>
                  </div>
                </>
              )}

            {timeBucket === "before4" &&
              isUC === "no" &&
              Number(daysUntilShift) < 2 && (
                <div className="field">
                  <label className="label">
                    How many orphans already exist for that day?
                  </label>
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

            {timeBucket === "after4" &&
              isUC === "no" &&
              Number(daysUntilShift) < 2 && (
                <div className="field">
                  <label className="label">
                    Which Calls are already activated on TAS?
                  </label>
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
                </div>
              )}
          </div>

          <div className="card">
            <h2 className="sectionTitle">Recommendation</h2>

            <div
              className={`recommendationBox ${isComplete ? "complete" : ""}`}
            >
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
          </div>
        </div>

        <div className="footerCard">
          <div className="subheading" style={{ fontSize: 16, marginBottom: 10 }}>
            Possible future upgrades
          </div>
          <ul className="list">
            {COPY.futureUpgrades.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="byline">{COPY.byline}</div>
        </div>
      </div>
    </div>
  );
}
