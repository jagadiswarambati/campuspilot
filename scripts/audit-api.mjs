const BASE_URL = "http://localhost:3000";

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, ok: res.ok, data };
}

async function runAudit() {
  const results = [];

  function record(endpoint, method, caller, description, passed, details) {
    results.push({
      endpoint,
      method,
      caller,
      description,
      status: passed ? "PASS" : "FAIL",
      details,
    });
    console.log(`[${passed ? "PASS" : "FAIL"}] ${method} ${endpoint} — ${description}`);
  }

  console.log("==================================================================");
  console.log("     CAMPUSPILOT AI — FULL API INTEGRATION AUDIT SUITE");
  console.log("==================================================================\n");

  // 1. Health
  try {
    const res = await request("/api/health");
    record("/api/health", "GET", "System Monitor / Shell", "Basic server health and readiness", res.ok && res.data.status === "ok", `Status: ${res.status}`);
  } catch (e) {
    record("/api/health", "GET", "System Monitor", "Basic server health", false, e.message);
  }

  // 2. AI Status
  try {
    const res = await request("/api/assistant/status");
    const passed = res.ok && res.data.provider !== undefined && !JSON.stringify(res.data).includes("AIzaSy");
    record("/api/assistant/status", "GET", "AiStatusBadge / Profile", "Gemma 4 connectivity status & demo mode flag", passed, `Provider: ${res.data?.provider}, Demo: ${res.data?.demoMode}`);
  } catch (e) {
    record("/api/assistant/status", "GET", "AiStatusBadge", "Gemma 4 status", false, e.message);
  }

  // 3. Central Orchestrator (Valid Lunch & Print)
  let generatedPlanId = null;
  try {
    const res = await request("/api/assistant", {
      method: "POST",
      body: JSON.stringify({
        prompt: "I have 35 minutes before my next class. I need a vegetarian lunch and 25 pages printed. Find the fastest plan that fits my budget and won't make me late.",
      }),
    });
    generatedPlanId = res.data?.plan?.id;
    const isFeasible = res.data?.plan?.isFeasible === true;
    const hasSpecialists = res.data?.plan?.printProposal && res.data?.plan?.foodProposal;
    record("/api/assistant", "POST", "Today / Assistant Page", "Valid 35m break request coordination", res.ok && isFeasible && hasSpecialists, `Plan ID: ${generatedPlanId}, Feasible: ${isFeasible}, Cost: ₹${res.data?.plan?.totalCost}`);
  } catch (e) {
    record("/api/assistant", "POST", "Today / Assistant", "Request coordination", false, e.message);
  }

  // 4. Central Orchestrator (Input Validation: Invalid payload)
  try {
    const res = await request("/api/assistant", {
      method: "POST",
      body: JSON.stringify({ prompt: "a" }), // Too short (<2 chars)
    });
    record("/api/assistant", "POST", "Today / Assistant", "Zod rejection for invalid short prompt", res.status === 400, `Expected 400, received ${res.status}`);
  } catch (e) {
    record("/api/assistant", "POST", "Assistant", "Input validation", false, e.message);
  }

  // 5. Central Orchestrator (Infeasible Schedule Conflict Check)
  try {
    const res = await request("/api/assistant", {
      method: "POST",
      body: JSON.stringify({ prompt: "I have 10 minutes before class. Need 60 pages printed and lunch." }),
    });
    const isConflictReported = res.data?.plan?.isFeasible === false && res.data?.plan?.conflicts?.length > 0;
    record("/api/assistant", "POST", "Today / Assistant", "Infeasible schedule conflict detection", res.ok && isConflictReported, `Conflicts: ${res.data?.plan?.conflicts?.[0]}`);
  } catch (e) {
    record("/api/assistant", "POST", "Assistant", "Infeasible schedule check", false, e.message);
  }

  // 6. Plan Confirmation
  try {
    if (generatedPlanId) {
      const res = await request("/api/assistant/confirm", {
        method: "POST",
        body: JSON.stringify({ planId: generatedPlanId }),
      });
      const passed = res.ok && res.data.plan?.status === "CONFIRMED" && res.data.printOrder && res.data.foodOrder;
      record("/api/assistant/confirm", "POST", "PlanCard", "Explicit student confirmation & simulated order creation", passed, `Confirmed. PrintOrder: ${res.data?.printOrder?.id}, FoodOrder: ${res.data?.foodOrder?.id}`);
    } else {
      record("/api/assistant/confirm", "POST", "PlanCard", "Confirmation check", false, "No plan ID generated");
    }
  } catch (e) {
    record("/api/assistant/confirm", "POST", "PlanCard", "Plan confirmation", false, e.message);
  }

  // 7. Duplicate Order Confirmation Prevention
  try {
    if (generatedPlanId) {
      const res = await request("/api/assistant/confirm", {
        method: "POST",
        body: JSON.stringify({ planId: generatedPlanId }),
      });
      record("/api/assistant/confirm", "POST", "PlanCard", "Duplicate confirmation prevention", res.status === 400, `Expected 400 rejection, received ${res.status}`);
    }
  } catch (e) {
    record("/api/assistant/confirm", "POST", "PlanCard", "Duplicate prevention", false, e.message);
  }

  // 8. Timetable GET
  try {
    const res = await request("/api/timetable");
    record("/api/timetable", "GET", "Today / Timetable Page", "Fetch weekly timetable and upcoming class", res.ok && Array.isArray(res.data?.classes), `Loaded ${res.data?.classes?.length} classes`);
  } catch (e) {
    record("/api/timetable", "GET", "Timetable", "Fetch timetable", false, e.message);
  }

  // 9. Timetable POST (Add Class with no overlap)
  let createdClassId = null;
  try {
    const res = await request("/api/timetable", {
      method: "POST",
      body: JSON.stringify({
        subjectCode: "CS399",
        subjectName: "Cloud Computing Seminar",
        instructor: "Dr. Dave K.",
        room: "Room B-302",
        building: "Block B",
        dayOfWeek: "Friday",
        startTime: "16:00",
        endTime: "17:15",
        color: "#10b981",
      }),
    });
    createdClassId = res.data?.class?.id;
    record("/api/timetable", "POST", "Timetable Page (Modal)", "Create valid new class entry", res.status === 201, `Created class ID: ${createdClassId}`);
  } catch (e) {
    record("/api/timetable", "POST", "Timetable", "Create class", false, e.message);
  }

  // 10. Timetable POST Overlap Rejection
  try {
    const res = await request("/api/timetable", {
      method: "POST",
      body: JSON.stringify({
        subjectCode: "CS_CONFLICT",
        subjectName: "Overlapping Seminar",
        instructor: "Dr. Conflict",
        room: "Room B-302",
        building: "Block B",
        dayOfWeek: "Friday",
        startTime: "16:30", // Overlaps with 16:00-17:15
        endTime: "18:00",
      }),
    });
    record("/api/timetable", "POST", "Timetable Page (Modal)", "Overlap conflict detection and rejection", res.status === 409, `Expected 409 Conflict, received ${res.status}: ${res.data?.error}`);
  } catch (e) {
    record("/api/timetable", "POST", "Timetable", "Overlap detection", false, e.message);
  }

  // 11. Timetable DELETE
  try {
    if (createdClassId) {
      const res = await request(`/api/timetable/${createdClassId}`, { method: "DELETE" });
      record(`/api/timetable/[id]`, "DELETE", "Timetable Page", "Delete timetable class by ID", res.ok, `Deleted class ${createdClassId}`);
    }
  } catch (e) {
    record(`/api/timetable/[id]`, "DELETE", "Timetable Page", "Delete class", false, e.message);
  }

  // 12. Print Shops GET
  try {
    const res = await request("/api/print/shops");
    record("/api/print/shops", "GET", "Print Hub / Today", "Fetch campus print shops and speeds", res.ok && res.data.shops.length > 0, `Loaded ${res.data?.shops?.length} shops`);
  } catch (e) {
    record("/api/print/shops", "GET", "Print Hub", "Fetch print shops", false, e.message);
  }

  // 13. Print Estimate POST
  try {
    const res = await request("/api/print/estimate", {
      method: "POST",
      body: JSON.stringify({
        shopId: "shop-library",
        pageCount: 25,
        copies: 1,
        isColor: false,
        isDoubleSided: true,
      }),
    });
    const passed = res.ok && res.data.estimate?.totalCost === 37.5;
    record("/api/print/estimate", "POST", "Print Hub", "Deterministic print price and queue calculation", passed, `Cost: ₹${res.data?.estimate?.totalCost}, Time: ${res.data?.estimate?.totalDurationMinutes}m`);
  } catch (e) {
    record("/api/print/estimate", "POST", "Print Hub", "Print estimate", false, e.message);
  }

  // 14. Print Orders GET & POST
  try {
    const createRes = await request("/api/print/orders", {
      method: "POST",
      body: JSON.stringify({
        shopId: "shop-library",
        documentName: "Test_Lab_Manual.pdf",
        pageCount: 15,
        copies: 1,
        isColor: false,
        isDoubleSided: true,
      }),
    });
    const getRes = await request("/api/print/orders");
    const passed = createRes.status === 201 && getRes.ok && getRes.data.orders.length > 0;
    record("/api/print/orders", "GET & POST", "Print Hub / Today", "Create and list simulated print orders", passed, `Created: ${createRes.data?.order?.id}, Total Orders: ${getRes.data?.orders?.length}`);
  } catch (e) {
    record("/api/print/orders", "GET & POST", "Print Hub", "Print orders", false, e.message);
  }

  // 15. Canteen Menu GET
  try {
    const res = await request("/api/canteen/menu");
    record("/api/canteen/menu", "GET", "Canteen / Today", "Fetch canteen counters and menu items", res.ok && res.data.menuItems.length > 0, `Loaded ${res.data?.menuItems?.length} menu items`);
  } catch (e) {
    record("/api/canteen/menu", "GET", "Canteen", "Fetch menu", false, e.message);
  }

  // 16. Canteen Estimate POST
  try {
    const res = await request("/api/canteen/estimate", {
      method: "POST",
      body: JSON.stringify({
        canteenId: "canteen-main",
        items: [{ itemId: "item-veg-thali", quantity: 2 }],
      }),
    });
    const passed = res.ok && res.data.estimate?.totalCost === 220;
    record("/api/canteen/estimate", "POST", "Canteen Cart", "Deterministic food cost & prep time calculation", passed, `Total: ₹${res.data?.estimate?.totalCost}, Prep: ${res.data?.estimate?.preparationMinutes}m`);
  } catch (e) {
    record("/api/canteen/estimate", "POST", "Canteen", "Food estimate", false, e.message);
  }

  // 17. Canteen Orders GET & POST
  try {
    const createRes = await request("/api/canteen/orders", {
      method: "POST",
      body: JSON.stringify({
        canteenId: "canteen-main",
        items: [{ itemId: "item-cold-coffee", quantity: 1 }],
      }),
    });
    const getRes = await request("/api/canteen/orders");
    const passed = createRes.status === 201 && getRes.ok && getRes.data.orders.length > 0;
    record("/api/canteen/orders", "GET & POST", "Canteen / Today", "Create and list simulated food orders", passed, `Created: ${createRes.data?.order?.id}`);
  } catch (e) {
    record("/api/canteen/orders", "GET & POST", "Canteen", "Food orders", false, e.message);
  }

  // 18. Attendance GET & POST
  try {
    const getRes = await request("/api/attendance");
    const firstRec = getRes.data?.records?.[0];
    const updateRes = await request("/api/attendance", {
      method: "POST",
      body: JSON.stringify({
        id: firstRec.id,
        attendedClasses: firstRec.attendedClasses + 1,
        totalClasses: firstRec.totalClasses + 1,
        targetPercentage: 75,
      }),
    });
    const passed = getRes.ok && updateRes.ok && updateRes.data.record?.currentPercentage !== undefined;
    record("/api/attendance", "GET & POST", "Attendance Page", "Fetch attendance with deficit calculations and log class", passed, `Subject: ${firstRec?.subjectCode}, New %: ${updateRes.data?.record?.currentPercentage}%`);
  } catch (e) {
    record("/api/attendance", "GET & POST", "Attendance", "Attendance tracking", false, e.message);
  }

  // 19. Notes GET, POST, PUT, DELETE
  let noteId = null;
  try {
    const createRes = await request("/api/notes", {
      method: "POST",
      body: JSON.stringify({
        title: "Audit Test Note",
        content: "Testing full lifecycle",
        category: "tasks",
        isPinned: true,
      }),
    });
    noteId = createRes.data?.note?.id;

    const putRes = await request(`/api/notes/${noteId}`, {
      method: "PUT",
      body: JSON.stringify({
        title: "Audit Test Note (Updated)",
        content: "Updated content",
        category: "academic",
        isPinned: false,
      }),
    });

    const delRes = await request(`/api/notes/${noteId}`, { method: "DELETE" });
    const passed = createRes.status === 201 && putRes.ok && delRes.ok;
    record("/api/notes", "CRUD (GET/POST/PUT/DELETE)", "Notes & Tasks", "Full student notes lifecycle", passed, `Created, updated, and deleted note ${noteId}`);
  } catch (e) {
    record("/api/notes", "CRUD", "Notes Page", "Notes CRUD", false, e.message);
  }

  // 20. Profile GET & PUT (Role Persistence)
  try {
    const getRes = await request("/api/profile");
    const putRes = await request("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        role: "Faculty",
        onboardingCompleted: true,
      }),
    });
    const putBackRes = await request("/api/profile", {
      method: "PUT",
      body: JSON.stringify({
        role: "Student",
        onboardingCompleted: true,
      }),
    });
    const passed = getRes.ok && putRes.ok && putRes.data.profile?.role === "Faculty" && putBackRes.ok && putBackRes.data.profile?.role === "Student";
    record("/api/profile", "GET & PUT", "Profile / Onboarding / Shell", "Profile reading and role personalization persistence", passed, `Successfully tested role mutation & persistence`);
  } catch (e) {
    record("/api/profile", "GET & PUT", "Profile", "Profile management", false, e.message);
  }

  // 21. Demo Data Reset POST
  try {
    const res = await request("/api/reset", { method: "POST" });
    record("/api/reset", "POST", "Sidebar / Profile", "Reset demo sandbox to factory defaults", res.ok && res.data.success === true, `Database reset response: ${res.data?.message}`);
  } catch (e) {
    record("/api/reset", "POST", "Sidebar", "Reset database", false, e.message);
  }

  console.log("\n==================================================================");
  console.log(`AUDIT COMPLETE: ${results.filter(r => r.status === "PASS").length} / ${results.length} ENDPOINTS PASSED.`);
  console.log("==================================================================");
}

runAudit().catch(console.error);
