import React from "react";

function CallActivationDecisionTool() {
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
      if (daysNum >= 2) {
        return {
          title: "UC shift, 2+ days out",
          body: "Call out as early as possible. Urgent Care needs physician coverage at each site daily, and earlier notice makes it easier to shut off unbooked appointments and adjust staffing.",
          who: [
            "Call or text the Urgent Care managers and leadership team",
            "Check the North Valley Urgent Care TEAMS manager schedule if needed",
          ],
          notes: [
            "ED back-up Call is not used to cover UC shifts.",
            "ROS normally has 2 physicians scheduled daily and FOL normally has 1 when the schedule is released.",
            "Additional volunteer shifts may be added based on PA schedule, support staffing, and day of week.",
          ],
        };
      }
      return {
        title: "UC shift, today or tomorrow",
        body: "Call out as soon as possible and call or text the Urgent Care managers and leadership team directly. Do not use the regular ED Call process.",
        who: [
          "Call or text Stephanie Eden: 530-638-6690",
          "Call or text James Thum: 916-790-4565",
          "Call or text Mary Gannon: 279-234-3212",
          "Call or text Lynh Tran: 279-790-9471",
          "Call or text Lisa Raumann: 279-900-7295",
        ],
        notes: [
          "ED back-up Call is not used to cover UC shifts.",
          "You can use the North Valley Urgent Care TEAMS manager schedule to see who is working.",
          "If the FOL physician calls out sick and is the only physician working, the ROS physician will be moved to FOL. This is the second physician listed on Intrigma.",
        ],
      };
    }

    if (daysNum >= 2) {
      return {
        title: "2+ days out",
        body: "Do not activate Call. Email the scheduler to orphan the shift.",
        who: [
          "Email scheduler (EDMD-NVLY-Scheduler@kp.org)",
        ],
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
        body: `Before 4pm, acute Call activations are activated in orphan order. With ${orphanNum} existing orphan(s), you would activate ${target}.`,
        who: [target, "Use TAS Call Activation"],
        notes: [
          "Double-check Intrigma for current orphans.",
          "If it is close to or after 4pm, confirm whether someone already activated themselves on TAS.",
        ],
      };
    }

    const dayCallsUsed = activatedCalls.filter((c) => c === "C1" || c === "C2").length;
    const eveningCallsUsed = activatedCalls.filter((c) => c === "C3" || c === "C4").length;

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
        body: `After 4pm, unused C1 and C2 become day Call. Based on the currently activated Calls, you would activate ${target}.`,
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
      body: `After 4pm, unused C3 and C4 become evening Call. Based on the currently activated Calls, you would activate ${target}.`,
      who: [target, "Use TAS Call Activation"],
      notes: [
        "Check TAS to confirm which Calls have already activated themselves.",
        "Evening Call covers shifts starting 4pm to 2am.",
      ],
    };
  };

  const result = getRecommendation();

  const renderActionItem = (item) => {
    if (item === "Email scheduler (EDMD-NVLY-Scheduler@kp.org)") {
      return (
        <a href="mailto:EDMD-NVLY-Scheduler@kp.org">
          Email scheduler (EDMD-NVLY-Scheduler@kp.org)
        </a>
      );
    }
    return item;
  };

  return (
    <div style={{ padding: 16, fontFamily: "Arial, sans-serif", backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>ED Call Activate Guide Prototype</h2>
        <p style={{ marginTop: 0, color: "#475569" }}>
          Simple prototype for sick call and orphan decision support using TAS and Intrigma.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 16 }}>
          <div style={{ backgroundColor: "white", border: "1px solid #cbd5e1", borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Current situation</h3>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Is this an ED shift or UC shift?</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <button
                  onClick={() => setIsUC("no")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #94a3b8",
                    backgroundColor: isUC === "no" ? "#0f172a" : "white",
                    color: isUC === "no" ? "white" : "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  ED shift
                </button>
                <button
                  onClick={() => setIsUC("yes")}
                  style={{
                    padding: "12px 16px",
                    borderRadius: 12,
                    border: "1px solid #94a3b8",
                    backgroundColor: isUC === "yes" ? "#0f172a" : "white",
                    color: isUC === "yes" ? "white" : "#0f172a",
                    cursor: "pointer",
                  }}
                >
                  UC shift
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>When is the affected shift?</div>
              <select
                value={daysUntilShift}
                onChange={(e) => setDaysUntilShift(e.target.value)}
                style={{ padding: 10, borderRadius: 10, border: "1px solid #94a3b8", width: "100%", maxWidth: 320 }}
              >
                <option value="">Select...</option>
                <option value="0">Today</option>
                <option value="1">Tomorrow</option>
                <option value="2">2 or more days away</option>
              </select>
            </div>

            {daysUntilShift !== "" && Number(daysUntilShift) < 2 && isUC === "no" && (
              <>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>What time is it right now?</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      onClick={() => setTimeBucket("before4")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #94a3b8",
                        backgroundColor: timeBucket === "before4" ? "#0f172a" : "white",
                        color: timeBucket === "before4" ? "white" : "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      Before 4pm
                    </button>
                    <button
                      onClick={() => setTimeBucket("after4")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #94a3b8",
                        backgroundColor: timeBucket === "after4" ? "#0f172a" : "white",
                        color: timeBucket === "after4" ? "white" : "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      After 4pm
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, marginBottom: 8 }}>Is the affected shift a day or evening shift?</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <button
                      onClick={() => setShiftType("day")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #94a3b8",
                        backgroundColor: shiftType === "day" ? "#0f172a" : "white",
                        color: shiftType === "day" ? "white" : "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      Day shift
                    </button>
                    <button
                      onClick={() => setShiftType("evening")}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #94a3b8",
                        backgroundColor: shiftType === "evening" ? "#0f172a" : "white",
                        color: shiftType === "evening" ? "white" : "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      Evening shift
                    </button>
                  </div>
                </div>
              </>
            )}

            {timeBucket === "before4" && isUC === "no" && Number(daysUntilShift) < 2 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>How many orphans already exist for that day?</div>
                <select
                  value={orphanCount}
                  onChange={(e) => setOrphanCount(e.target.value)}
                  style={{ padding: 10, borderRadius: 10, border: "1px solid #94a3b8", width: "100%", maxWidth: 320 }}
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

            {timeBucket === "after4" && isUC === "no" && Number(daysUntilShift) < 2 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Which Calls are already activated on TAS?</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["C1", "C2", "C3", "C4"].map((call) => (
                    <button
                      key={call}
                      onClick={() => toggleCall(call)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 10,
                        border: "1px solid #94a3b8",
                        backgroundColor: activatedCalls.includes(call) ? "#0f172a" : "white",
                        color: activatedCalls.includes(call) ? "white" : "#0f172a",
                        cursor: "pointer",
                      }}
                    >
                      {call}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ backgroundColor: "white", border: "1px solid #cbd5e1", borderRadius: 16, padding: 16 }}>
            <h3 style={{ marginTop: 0 }}>Recommendation</h3>
            <div style={{ backgroundColor: "#f8fafc", borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{result.title}</div>
              <div>{result.body}</div>
            </div>

            {result.who.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Action</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {result.who.map((item) => (
                    <li key={item} style={{ marginBottom: 6 }}>
                      {renderActionItem(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.notes.length > 0 && (
              <div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>Notes</div>
                <ul style={{ margin: 0, paddingLeft: 20 }}>
                  {result.notes.map((item) => (
                    <li key={item} style={{ marginBottom: 6 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: "white", border: "1px dashed #94a3b8", borderRadius: 16, padding: 16, marginTop: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 8 }}>Possible future upgrades</div>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            <li style={{ marginBottom: 6 }}>Pull orphan shifts automatically from Intrigma</li>
            <li style={{ marginBottom: 6 }}>Show a live list of who is on call (physicians and Admin on Call)</li>
            <li>Quick links to TAS, Intrigma, and scheduling/call guidelines</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default CallActivationDecisionTool;
