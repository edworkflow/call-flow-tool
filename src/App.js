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
      <a href={`mailto:${item.value}`} className="underline">
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

function getEdRecommendation({ daysNum, timeBucket, shiftType, orphanNum, activatedCalls }) {
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
    if (timeBucket === "before4" && Number.isNaN(Number(orphanCount))) return false;
    return true;
  })();

  return (
    <div className="min-h-screen bg-slate-50 p-3 sm:p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">{COPY.pageTitle}</h1>
          <p className="mt-2 text-sm text-slate-600">{COPY.pageSubtitle}</p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-4 sm:p-5 sm:space-y-5">
            <h2 className="text-lg font-medium sm:text-xl">Current situation</h2>

            <div>
              <label className="mb-3 block text-sm font-medium">Is this an ED shift or UC shift?</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  ["no", "ED shift"],
                  ["yes", "UC shift"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setIsUC(value)}
                    className={`min-h-[72px] rounded-2xl border p-4 text-left transition ${isUC === value ? "bg-slate-900 text-white" : "bg-white text-slate-700 hover:bg-slate-50"}`}
                  >
                    <div className="text-base font-medium sm:text-lg">{label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">When is the affected shift?</label>
              <select
                className="w-full rounded-xl border p-3 text-base"
                value={daysUntilShift}
                onChange={(e) => setDaysUntilShift(e.target.value)}
              >
                <option value="">Select...</option>
                <option value="0">Today</option>
                <option value="1">Tomorrow</option>
                <option value="2">2 or more days away</option>
              </select>
            </div>

            {daysUntilShift !== "" && Number(daysUntilShift) < 2 && isUC === "no" && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium">What time is it right now?</label>
                  <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                    {[
                      ["before4", "Before 4pm"],
                      ["after4", "After 4pm"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setTimeBucket(value)}
                        className={`min-h-[52px] rounded-xl border px-4 py-3 text-sm sm:text-base ${timeBucket === value ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Is the affected shift a day or evening shift?</label>
                  <div className="grid grid-cols-1 gap-2 sm:flex">
                    {[
                      ["day", "Day shift"],
                      ["evening", "Evening shift"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        onClick={() => setShiftType(value)}
                        className={`min-h-[52px] rounded-xl border px-4 py-3 text-sm sm:text-base ${shiftType === value ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {timeBucket === "before4" && isUC === "no" && Number(daysUntilShift) < 2 && (
              <div>
                <label className="mb-2 block text-sm font-medium">How many orphans already exist for that day?</label>
                <select
                  className="w-full rounded-xl border p-3 text-base"
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

            {timeBucket === "after4" && isUC === "no" && Number(daysUntilShift) < 2 && (
              <div>
                <label className="mb-2 block text-sm font-medium">Which Calls are already activated on TAS?</label>
                <div className="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap">
                  {["C1", "C2", "C3", "C4"].map((call) => (
                    <button
                      key={call}
                      onClick={() => toggleCall(call)}
                      className={`min-h-[52px] rounded-xl border px-4 py-3 text-sm sm:text-base ${activatedCalls.includes(call) ? "bg-slate-900 text-white" : "bg-white text-slate-700"}`}
                    >
                      {call}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 space-y-4 sm:p-5">
            <h2 className="text-lg font-medium sm:text-xl">Recommendation</h2>
            <div className={`rounded-2xl p-4 transition ${isComplete ? "bg-green-50 ring-2 ring-green-300" : "bg-slate-50"}`}>
              <div className="text-base font-semibold sm:text-lg">{result.title}</div>
              <p className="mt-2 text-sm leading-6 text-slate-700">{result.body}</p>
            </div>

            {result.who.length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-900">Action</div>
                <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-slate-700 space-y-1">
                  {result.who.map((item, index) => (
                    <li key={typeof item === "string" ? item : `${item.label}-${index}`}>
                      {renderActionItem(item)}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.notes.length > 0 && (
              <div>
                <div className="text-sm font-medium text-slate-900">Notes</div>
                <ul className="mt-2 list-disc pl-5 text-sm leading-6 text-slate-700 space-y-1">
                  {result.notes.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-dashed bg-white p-4 text-sm leading-6 text-slate-600 shadow-sm ring-1 ring-slate-200 sm:p-5">
          <div className="font-medium text-slate-900">Possible future upgrades</div>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {COPY.futureUpgrades.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
            {COPY.byline}
          </div>
        </div>
      </div>
    </div>
  );
}
